import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Send, Loader2, CheckCircle2, X, Wand2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

/**
 * GerarPropostaCompleta
 *
 * A IA conduz uma conversa exploratória natural para entender o projeto.
 * A conversa é salva no localStorage por proposta_id, então se o usuário
 * fechar/recarregar a página, a conversa é recuperada.
 * O usuário pode iniciar nova conversa clicando em "Gerar Nova Proposta".
 *
 * Props:
 *   edital      – edital object
 *   propostaId  – string ID da proposta (para chave de autosave)
 *   campos      – current campos_formulario array
 *   onApply     – (newCampos: array) => void
 *   disabled    – boolean
 */

const STORAGE_KEY = (propostaId) => `gerar_proposta_chat_${propostaId}`;

const SYSTEM_PROMPT = (edital, camposStr) => `Você é um consultor especialista em elaboração de propostas para editais de fomento.

Seu objetivo é entender o projeto do usuário através de uma conversa natural e exploratória, e depois gerar a proposta completa.

EDITAL: ${edital?.titulo || ""}
ÓRGÃO: ${edital?.orgao || ""}
ÁREA: ${edital?.area || ""}

CAMPOS QUE PRECISARÃO SER PREENCHIDOS (não mostre isso ao usuário):
${camposStr}

REGRAS DA CONVERSA:
1. Faça perguntas abertas e naturais sobre o CONTEXTO, PROBLEMA e VISÃO do projeto — nunca pergunte algo como "qual o título do projeto" ou "qual o resumo executivo".
2. Explore: qual dor/problema existe no mercado, quem sofre com isso, como o usuário imagina resolver, o que já existe, qual impacto espera gerar.
3. Faça no máximo 4-5 perguntas ao longo da conversa. Pode fazer mais de uma por mensagem se fizer sentido.
4. Quando tiver informações suficientes, diga algo como "Acredito que já tenho o suficiente para montar sua proposta!" e finalize com a palavra-chave exata: [GERAR_PROPOSTA]
5. Seja amigável, encorajador. O usuário pode ter uma ideia vaga — ajude-o a articulá-la.
6. NUNCA peça ao usuário para redigir textos técnicos, justificativas ou qualquer coisa que seria um campo do formulário.`;

const PROMPT_GERAR = (edital, conversa, camposStr) => `Você é um especialista em elaboração de propostas para editais de fomento.

Com base na conversa abaixo entre o consultor e o proponente, gere o conteúdo completo de cada campo da proposta.

EDITAL: ${edital?.titulo || ""}
ÓRGÃO: ${edital?.orgao || ""}
ÁREA: ${edital?.area || ""}

CONVERSA:
${conversa}

CAMPOS A PREENCHER:
${camposStr}

Instruções:
- Use linguagem técnica, formal e adequada para submissão ao órgão de fomento.
- Interprete e expanda o que o usuário disse — não transcreva literalmente.
- NÃO preencha campos de equipe/membros (deixe resposta vazia).
- Para cronograma e objetivos, gere texto descritivo estruturado.
- Retorne JSON com "campos_preenchidos": array de { pergunta, resposta }.`;

export default function GerarPropostaCompleta({ edital, propostaId, campos, onApply, disabled }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [propostaGerada, setPropostaGerada] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [temHistoricoSalvo, setTemHistoricoSalvo] = useState(false);
  const endRef = useRef(null);

  // Check for saved history on mount
  useEffect(() => {
    if (!propostaId) return;
    const saved = localStorage.getItem(STORAGE_KEY(propostaId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.history?.length > 0) setTemHistoricoSalvo(true);
      } catch {}
    }
  }, [propostaId]);

  // Autosave whenever history changes
  useEffect(() => {
    if (!propostaId || history.length === 0) return;
    localStorage.setItem(STORAGE_KEY(propostaId), JSON.stringify({ history, propostaGerada }));
    if (history.length > 0) setTemHistoricoSalvo(true);
  }, [history, propostaGerada, propostaId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading, gerando]);

  const camposStr = campos?.length
    ? campos.filter(c => c.tipo_resposta !== "membros_equipe")
        .map(c => `- ${c.secao ? `[${c.secao}] ` : ""}${c.pergunta} (tipo: ${c.tipo_resposta})`)
        .join("\n")
    : "Gere proposta padrão com: Identificação, Resumo Executivo, Problema, Solução, Diferencial, Objetivos, Metodologia, Resultados Esperados, Impacto.";

  const iniciarNovaConversa = async () => {
    // Clear saved state
    if (propostaId) localStorage.removeItem(STORAGE_KEY(propostaId));
    setHistory([]);
    setPropostaGerada(null);
    setInput("");
    setOpen(true);
    setLoading(true);

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT(edital, camposStr)}\n\nInicie a conversa com uma mensagem de boas-vindas curta e a sua primeira pergunta exploratória sobre o projeto. Não mencione o edital pelo nome completo — apenas diga que vai ajudar a montar a proposta.`
    });

    setHistory([{ role: "assistant", content: r }]);
    setLoading(false);
  };

  const abrirHistoricoSalvo = () => {
    if (!propostaId) return;
    const saved = localStorage.getItem(STORAGE_KEY(propostaId));
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setHistory(parsed.history || []);
      setPropostaGerada(parsed.propostaGerada || null);
      setInput("");
      setOpen(true);
    } catch {
      iniciarNovaConversa();
    }
  };

  const openDialog = () => {
    if (temHistoricoSalvo) {
      abrirHistoricoSalvo();
    } else {
      iniciarNovaConversa();
    }
  };

  const gerarProposta = async (historico) => {
    setGerando(true);
    const conversa = historico.map(m => `${m.role === "user" ? "Proponente" : "Consultor"}: ${m.content}`).join("\n\n");

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: PROMPT_GERAR(edital, conversa, camposStr),
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
      const camposMapeados = campos?.map(c => {
        if (c.tipo_resposta === "membros_equipe") return c;
        const gerado = r.campos_preenchidos.find(g =>
          g.pergunta?.toLowerCase().trim() === c.pergunta?.toLowerCase().trim() ||
          c.pergunta?.toLowerCase().includes(g.pergunta?.toLowerCase().substring(0, 25))
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
      setHistory(h => [...h, {
        role: "assistant",
        content: `Perfeito! Com base em tudo que você me contou, montei a proposta completa. 🎉\n\nPreenchi **${r.campos_preenchidos.length} campo(s)** — os campos de **equipe** ficaram em branco para você preencher manualmente.\n\nRevise e clique em **"Aplicar Proposta"** quando estiver pronto.`
      }]);
    } else {
      setHistory(h => [...h, {
        role: "assistant",
        content: "Tive um problema ao gerar a proposta. Pode me contar um pouco mais sobre o projeto?"
      }]);
    }
    setGerando(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || gerando) return;
    const userMsg = input.trim();
    setInput("");

    const novoHistorico = [...history, { role: "user", content: userMsg }];
    setHistory(novoHistorico);
    setLoading(true);

    const conversaFormatada = novoHistorico
      .map(m => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
      .join("\n\n");

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT(edital, camposStr)}\n\nCONVERSA ATÉ AGORA:\n${conversaFormatada}\n\nResponda ao usuário. Se já tiver informação suficiente para montar a proposta, finalize com [GERAR_PROPOSTA] ao final da mensagem.`
    });

    setLoading(false);

    if (r?.includes("[GERAR_PROPOSTA]")) {
      const cleanMsg = r.replace("[GERAR_PROPOSTA]", "").trim();
      setHistory(h => [...h, { role: "assistant", content: cleanMsg }]);
      await gerarProposta([...novoHistorico, { role: "assistant", content: cleanMsg }]);
    } else {
      setHistory(h => [...h, { role: "assistant", content: r }]);
    }
  };

  const aplicar = () => {
    if (!propostaGerada) return;
    onApply(propostaGerada);
    // Clear saved state after applying
    if (propostaId) localStorage.removeItem(STORAGE_KEY(propostaId));
    setTemHistoricoSalvo(false);
    setOpen(false);
  };

  if (disabled) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={openDialog}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          {temHistoricoSalvo ? "Continuar Proposta com IA" : "Gerar Proposta Completa com IA"}
        </Button>
        {temHistoricoSalvo && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={iniciarNovaConversa}
            className="text-gray-500 border-gray-300 h-9"
            title="Descartar conversa salva e iniciar do zero"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Nova Proposta
          </Button>
        )}
      </div>

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
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {history.length > 0 && !propostaGerada && (
                  <button
                    onClick={iniciarNovaConversa}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    title="Descartar e iniciar nova conversa"
                  >
                    <RefreshCw className="w-3 h-3" /> Reiniciar
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {history.length === 0 && loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Iniciando conversa...
                </div>
              </div>
            )}
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                  <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {(loading && history.length > 0) && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
            {gerando && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                  Montando sua proposta...
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
          {!propostaGerada && (
            <div className="p-3 border-t bg-white flex-shrink-0 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Conta sobre o seu projeto..."
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