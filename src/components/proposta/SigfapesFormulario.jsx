import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, Lock, Unlock, Sparkles, Loader2, FileText, X, Send } from "lucide-react";

const limparAspas = (texto) => texto?.replace(/["""''`]/g, "") || "";
const maxChars = (tipo) => tipo === "texto_curto" ? 300 : tipo === "numero" ? 20 : 2000;

export default function SigfapesFormulario({ proposta, edital, onSave }) {
  // sigfapes_campos_formulario: campos do site de submissão
  const [campos, setCampos] = useState(proposta.sigfapes_campos_formulario || []);
  const [gerando, setGerando] = useState(false);
  const [lockDialog, setLockDialog] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCampoId, setChatCampoId] = useState(null);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { onSave({ sigfapes_campos_formulario: campos }); }, 1000);
    return () => clearTimeout(t);
  }, [campos]);

  // Pega perguntas_site_formulario de todas as etapas do edital
  const perguntasSite = () => {
    if (!edital?.etapas?.length) return null;
    const todas = [];
    edital.etapas
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .forEach(etapa => {
        if (etapa.perguntas_site_formulario?.length) {
          etapa.perguntas_site_formulario.forEach(p => {
            todas.push({ ...p, secao: `[${etapa.nome}] ${p.secao || "Geral"}` });
          });
        }
      });
    return todas.length > 0 ? todas : null;
  };

  const gerarCampos = async () => {
    setGerando(true);

    const perguntas = perguntasSite();
    if (perguntas) {
      setCampos(perguntas.map(p => ({
        id: p.id || `${Date.now()}-${Math.random()}`,
        secao: p.secao,
        pergunta: p.pergunta,
        tipo_resposta: p.tipo_resposta || "texto_longo",
        resposta: "",
        concluido: false,
      })));
      setGerando(false);
      return;
    }

    // Fallback: IA gera campos com base no edital
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Edital: "${edital?.titulo}" (${edital?.orgao || ""}), área: ${edital?.area || ""}.
Gere os campos do formulário do site de submissão (ex: Sigfapes) que o empreendedor precisa preencher online.
Foco em dados cadastrais, informações do projeto, equipe, orçamento e cronograma conforme exigido por sistemas de submissão de editais públicos.
Retorne JSON "campos": array de { id, secao, pergunta, tipo_resposta (texto_longo/texto_curto/numero/data) }. Máximo 15 campos em 4-5 seções.`,
      response_json_schema: {
        type: "object",
        properties: {
          campos: {
            type: "array",
            items: { type: "object", properties: { id: { type: "string" }, secao: { type: "string" }, pergunta: { type: "string" }, tipo_resposta: { type: "string" } } }
          }
        }
      }
    });
    if (r.campos) setCampos(r.campos.map(c => ({ ...c, resposta: "", concluido: false })));
    setGerando(false);
  };

  const updateCampo = (id, resposta) => {
    const campo = campos.find(c => c.id === id);
    const max = maxChars(campo?.tipo_resposta);
    setCampos(prev => prev.map(c => c.id === id ? { ...c, resposta: resposta.slice(0, max) } : c));
  };

  const toggleConcluido = (id, current) => {
    if (current) setLockDialog({ id });
    else setCampos(prev => prev.map(c => c.id === id ? { ...c, concluido: true } : c));
  };

  const confirmarDesbloquear = () => {
    setCampos(prev => prev.map(c => c.id === lockDialog.id ? { ...c, concluido: false } : c));
    setLockDialog(null);
  };

  const abrirChat = (campoId) => {
    setChatCampoId(campoId);
    const campo = campos.find(c => c.id === campoId);
    setChatHistory([{ role: "assistant", content: `Vou te ajudar com: **"${campo?.pergunta}"**\n\nO que você já tem sobre isso?` }]);
    setChatOpen(true);
  };

  const enviarChat = async () => {
    if (!chatMsg.trim()) return;
    const campo = campos.find(c => c.id === chatCampoId);
    const userMsg = chatMsg;
    setChatMsg("");
    const newHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Especialista em submissão de propostas em sistemas de editais públicos (Sigfapes e similares).
Edital: ${edital?.titulo} | Órgão: ${edital?.orgao || ""}
Campo: ${campo?.secao} > ${campo?.pergunta}
Resposta atual: ${campo?.resposta || "(vazio)"}
Histórico: ${newHistory.map(m => `${m.role}: ${m.content}`).join("\n")}

Seja objetivo. Se tiver sugestão de texto pronto, inclua ao final: [TEXTO]: <texto sem aspas>`
    });

    setChatHistory([...newHistory, { role: "assistant", content: r }]);
    if (r.includes("[TEXTO]:")) {
      const sugestao = limparAspas(r.split("[TEXTO]:")[1].trim());
      if (sugestao) {
        const max = maxChars(campo?.tipo_resposta);
        setCampos(prev => prev.map(c => c.id === chatCampoId ? { ...c, resposta: sugestao.slice(0, max) } : c));
      }
    }
    setChatLoading(false);
  };

  const temPerguntas = !!perguntasSite();
  const secoes = [...new Set(campos.map(c => c.secao))];
  const concluidos = campos.filter(c => c.concluido).length;
  const chatCampo = campos.find(c => c.id === chatCampoId);

  if (campos.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-700 mb-2">Formulário Sigfapes</h3>
        <p className="text-gray-500 text-sm mb-3 max-w-sm mx-auto">
          {temPerguntas
            ? "Perguntas extraídas do site de submissão cadastrado no edital."
            : "A IA vai gerar os campos do formulário do site de submissão."}
        </p>
        {temPerguntas && (
          <div className="inline-flex items-center gap-2 mb-4 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-1.5 rounded-full">
            <FileText className="w-3.5 h-3.5" /> Baseado nas perguntas do site oficial
          </div>
        )}
        <div>
          <Button onClick={gerarCampos} disabled={gerando} className="bg-indigo-600 hover:bg-indigo-700">
            {gerando
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Carregando...</>
              : <><Sparkles className="w-4 h-4 mr-2" />{temPerguntas ? "Carregar Campos Sigfapes" : "Gerar Campos com IA"}</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className={`flex-1 space-y-6 ${chatOpen ? "max-w-[60%]" : ""}`}>
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm text-gray-500">{concluidos}/{campos.length} campos concluídos</div>
          <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${campos.length ? (concluidos / campos.length) * 100 : 0}%` }} />
          </div>
        </div>

        {secoes.map(secao => (
          <div key={secao}>
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3 pb-2 border-b">{secao}</h3>
            <div className="space-y-3">
              {campos.filter(c => c.secao === secao).map(campo => {
                const isActive = expandedId === campo.id || hoveredId === campo.id;
                const max = maxChars(campo.tipo_resposta);
                const chars = campo.resposta?.length || 0;
                return (
                  <div
                    key={campo.id}
                    onMouseEnter={() => !campo.concluido && setHoveredId(campo.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => !campo.concluido && setExpandedId(expandedId === campo.id ? null : campo.id)}
                    className={`rounded-xl border transition-all duration-200 cursor-pointer ${campo.concluido ? "bg-green-50 border-green-200" : isActive ? "bg-white border-orange-300 shadow-md" : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
                      <label className={`text-sm font-medium transition-colors ${campo.concluido ? "text-green-700" : isActive ? "text-orange-800" : "text-gray-700"}`}>
                        {campo.pergunta}
                      </label>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {!campo.concluido && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-orange-400 hover:text-orange-600" onClick={() => abrirChat(campo.id)} title="Pedir ajuda à IA">
                            <Sparkles className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className={`h-7 w-7 ${campo.concluido ? "text-green-600" : "text-gray-400"}`} onClick={() => toggleConcluido(campo.id, campo.concluido)}>
                          {campo.concluido ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {!isActive && !campo.concluido && campo.resposta && (
                      <p className="px-4 pb-3 text-xs text-gray-500 line-clamp-1 truncate">{campo.resposta}</p>
                    )}

                    {(isActive || campo.concluido) && (
                      <div className="px-4 pb-3" onClick={e => e.stopPropagation()}>
                        <Textarea
                          value={campo.resposta}
                          onChange={(e) => updateCampo(campo.id, e.target.value)}
                          disabled={campo.concluido}
                          placeholder="Sua resposta..."
                          rows={campo.tipo_resposta === "texto_longo" ? 5 : 2}
                          autoFocus={isActive && expandedId === campo.id}
                          className={`resize-none transition-all ${campo.concluido ? "bg-green-50 text-gray-600" : "bg-white"}`}
                        />
                        <div className="flex items-center justify-between mt-1">
                          {campo.concluido
                            ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Concluído</span>
                            : <span className="text-[10px] text-gray-400">{chars}/{max} caracteres</span>}
                        </div>
                      </div>
                    )}

                    {!isActive && !campo.concluido && !campo.resposta && (
                      <p className="px-4 pb-3 text-xs text-gray-400 italic">Clique para responder...</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* AI Chat */}
      {chatOpen && (
        <div className="w-80 flex-shrink-0 bg-slate-900 rounded-xl flex flex-col h-[600px]">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div>
              <p className="text-white text-xs font-semibold flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" /> Assistente Sigfapes</p>
              {chatCampo && <p className="text-white/50 text-[10px] truncate max-w-[200px]">{chatCampo.secao}</p>}
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatHistory.map((m, i) => (
              <div key={i} className={`text-xs p-2.5 rounded-lg ${m.role === "user" ? "bg-orange-600 text-white ml-4" : "bg-white/10 text-white/90 mr-4"}`}>
                {m.content.replace(/\[TEXTO\]:[\s\S]*/g, "").trim()}
                {m.content.includes("[TEXTO]:") && (
                  <div className="mt-2 p-2 bg-green-500/20 rounded border border-green-500/30 text-green-300 text-[10px]">✓ Texto aplicado ao campo</div>
                )}
              </div>
            ))}
            {chatLoading && <div className="bg-white/10 text-white/50 text-xs p-2.5 rounded-lg mr-4"><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Pensando...</div>}
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviarChat()}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-white/10 text-white placeholder-white/30 text-xs rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-orange-500"
            />
            <Button size="icon" onClick={enviarChat} disabled={chatLoading} className="bg-orange-600 hover:bg-orange-700 h-8 w-8">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!lockDialog} onOpenChange={() => setLockDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear campo?</AlertDialogTitle>
            <AlertDialogDescription>Este campo foi marcado como concluído. Deseja realmente alterar o conteúdo?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDesbloquear}>Desbloquear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}