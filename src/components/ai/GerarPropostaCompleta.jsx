import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Send, Loader2, CheckCircle2, X, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

/**
 * GerarPropostaCompleta
 *
 * Guided conversational flow where the AI builds a full project proposal
 * through a few questions. At the end the user approves and the campos
 * array is updated (except the team field, which is left blank).
 *
 * Props:
 *   edital    – edital object
 *   proposta  – proposta object
 *   campos    – current campos_formulario array
 *   onApply   – (newCampos: array) => void  called with approved campos
 */

const PERGUNTAS_GUIA = [
  "Qual é o nome do seu projeto ou produto/serviço?",
  "Qual problema ele resolve? Para quem?",
  "Como ele funciona? Descreva a solução de forma simples.",
  "Qual o diferencial em relação ao que já existe no mercado?",
  "Qual é o seu modelo de receita ou como ele gera valor?",
  "Já tem alguma validação, cliente ou protótipo? Conte o que tem até agora.",
  "Quais são os principais objetivos que você quer alcançar com esse projeto?",
];

export default function GerarPropostaCompleta({ edital, campos, onApply, disabled }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState(0); // which guiding question we're on
  const [respostasUsuario, setRespostasUsuario] = useState([]);
  const [propostaGerada, setPropostaGerada] = useState(null); // array of campos
  const [gerando, setGerando] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading, gerando]);

  const openDialog = () => {
    setHistory([{
      role: "assistant",
      content: `Olá! Vou te ajudar a montar uma proposta completa para o edital **${edital?.titulo || ""}**.\n\nVou te fazer algumas perguntas simples. Responda como quiser — pode ser em linguagem do dia a dia que eu adapto tudo para linguagem técnica de edital.\n\n**Pergunta 1 de ${PERGUNTAS_GUIA.length}:**\n${PERGUNTAS_GUIA[0]}`
    }]);
    setEtapa(0);
    setRespostasUsuario([]);
    setPropostaGerada(null);
    setInput("");
    setOpen(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || gerando) return;
    const userMsg = input.trim();
    setInput("");
    const novasRespostas = [...respostasUsuario, { pergunta: PERGUNTAS_GUIA[etapa] || "Info adicional", resposta: userMsg }];
    setRespostasUsuario(novasRespostas);

    const proximaEtapa = etapa + 1;
    let assistantContent = "";

    if (proximaEtapa < PERGUNTAS_GUIA.length) {
      // More questions
      assistantContent = `Ótimo! **Pergunta ${proximaEtapa + 1} de ${PERGUNTAS_GUIA.length}:**\n${PERGUNTAS_GUIA[proximaEtapa]}`;
      setEtapa(proximaEtapa);
      setHistory(h => [
        ...h,
        { role: "user", content: userMsg },
        { role: "assistant", content: assistantContent }
      ]);
    } else {
      // All questions answered → generate
      setEtapa(proximaEtapa);
      setHistory(h => [
        ...h,
        { role: "user", content: userMsg },
        { role: "assistant", content: "Perfeito! Já tenho informações suficientes. Estou montando sua proposta completa agora... ✨" }
      ]);
      setGerando(true);

      const resumoRespostas = novasRespostas.map(r => `**${r.pergunta}**\n${r.resposta}`).join("\n\n");
      const camposParaPreencher = campos?.length
        ? campos.filter(c => c.tipo_resposta !== "membros_equipe").map(c => `- ${c.secao ? `[${c.secao}] ` : ""}${c.pergunta} (tipo: ${c.tipo_resposta})`).join("\n")
        : "Não há campos específicos mapeados — gere uma proposta estruturada padrão com seções: Identificação, Resumo Executivo, Problema, Solução, Diferencial, Objetivos (Geral e Específicos), Metodologia, Resultados Esperados, Impacto.";

      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em elaboração de propostas para editais de fomento tecnológico e científico.

EDITAL: ${edital?.titulo || ""}
ÓRGÃO: ${edital?.orgao || ""}
ÁREA: ${edital?.area || ""}

INFORMAÇÕES DO USUÁRIO:
${resumoRespostas}

CAMPOS QUE PRECISAM SER PREENCHIDOS:
${camposParaPreencher}

Com base nas informações acima, gere o conteúdo completo de cada campo da proposta, em linguagem técnica e formal adequada para submissão ao órgão de fomento. NÃO preencha campos de equipe/membros (deixe vazio). Para campos de tipo "tabela_itens", "cronograma" ou "objetivos", gere o conteúdo como texto descritivo mesmo.

Retorne um JSON com o array "campos_preenchidos", onde cada item tem: pergunta (exatamente igual ao campo), resposta (o texto gerado).`,
        response_json_schema: {
          type: "object",
          properties: {
            campos_preenchidos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pergunta: { type: "string" },
                  resposta: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (r?.campos_preenchidos?.length) {
        // Merge generated answers back into the campos array
        const camposMapeados = campos?.map(c => {
          if (c.tipo_resposta === "membros_equipe") return c; // keep team blank
          const gerado = r.campos_preenchidos.find(g =>
            g.pergunta?.toLowerCase().trim() === c.pergunta?.toLowerCase().trim() ||
            c.pergunta?.toLowerCase().includes(g.pergunta?.toLowerCase().substring(0, 20))
          );
          return gerado ? { ...c, resposta: gerado.resposta } : c;
        }) || r.campos_preenchidos.map((g, i) => ({
          id: `gerado-${Date.now()}-${i}`,
          secao: "",
          pergunta: g.pergunta,
          resposta: g.resposta,
          tipo_resposta: "texto_longo",
          concluido: false
        }));

        setPropostaGerada(camposMapeados);
        setHistory(h => [
          ...h,
          {
            role: "assistant",
            content: `Proposta montada com sucesso! 🎉\n\nPreenchi **${r.campos_preenchidos.length} campo(s)** com base nas suas respostas.\n\n> Os campos de **equipe** foram deixados em branco — você preenche manualmente.\n\nRevise abaixo e clique em **"Aplicar Proposta"** para inserir tudo nos campos.`
          }
        ]);
      } else {
        setHistory(h => [
          ...h,
          { role: "assistant", content: "Houve um problema ao gerar. Tente novamente ou adicione mais detalhes sobre o projeto." }
        ]);
      }
      setGerando(false);
    }
  };

  const aplicar = () => {
    if (!propostaGerada) return;
    onApply(propostaGerada);
    setOpen(false);
  };

  const etapaAtual = Math.min(etapa, PERGUNTAS_GUIA.length);
  const progresso = Math.round((etapaAtual / PERGUNTAS_GUIA.length) * 100);
  const todasRespondidas = etapa >= PERGUNTAS_GUIA.length;

  if (disabled) return null;

  return (
    <>
      <Button
        type="button"
        onClick={openDialog}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        Gerar Proposta Completa com IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-3 border-b flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-sm flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-500" />
                  Gerar Proposta Completa com IA
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{edital?.titulo}</p>
                {/* Progress */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {todasRespondidas ? "Concluído" : `${etapaAtual}/${PERGUNTAS_GUIA.length}`}
                  </span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                  <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {(loading || gerando) && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {gerando ? "Montando sua proposta..." : "Pensando..."}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Apply bar */}
          {propostaGerada && !gerando && (
            <div className="px-4 py-3 bg-green-50 border-t border-green-100 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-800">Proposta pronta!</p>
                <p className="text-xs text-green-600">{propostaGerada.filter(c => c.resposta).length} campos preenchidos · equipe em branco para você completar</p>
              </div>
              <Button size="sm" onClick={aplicar} className="bg-green-600 hover:bg-green-700 flex-shrink-0 h-8">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aplicar Proposta
              </Button>
            </div>
          )}

          {/* Input */}
          {!todasRespondidas && (
            <div className="p-3 border-t bg-white flex-shrink-0 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Sua resposta..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                disabled={loading || gerando}
              />
              <Button size="icon" onClick={sendMessage} disabled={loading || gerando || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 h-9 w-9 flex-shrink-0">
                {loading || gerando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}