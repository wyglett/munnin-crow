import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Send, Loader2, CheckCircle2, X, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

/**
 * AIChatField
 *
 * Renders a small "✨ Gerar com IA" button below any field.
 * Clicking opens a dialog with a chat conversation.
 * When the AI proposes a text, the user can approve it → onApprove(text) is called.
 *
 * Props:
 *   pergunta      – label of the field (used as conversation context)
 *   contexto      – extra context string (edital, proposta, etc.)
 *   instrucao_ia  – optional hint to steer the AI
 *   respostaAtual – current field value (so the AI can improve it)
 *   onApprove     – (text: string) => void  called when user approves
 *   disabled      – if true, hides the button (e.g. field is locked)
 */
export default function AIChatField({ pergunta, contexto, instrucao_ia, respostaAtual, onApprove, disabled }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposta, setProposta] = useState(null); // last suggested text
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const openChat = () => {
    setHistory([{
      role: "assistant",
      content: respostaAtual?.trim()
        ? `Vou te ajudar a melhorar a resposta para **"${pergunta}"**.\n\nAtualmente você tem:\n> ${respostaAtual.slice(0, 200)}${respostaAtual.length > 200 ? "..." : ""}\n\nO que gostaria de mudar ou melhorar?`
        : `Vou te ajudar a redigir a resposta para **"${pergunta}"**.\n\nMe conte o que você tem sobre isso — pode ser em linguagem simples, eu adapto.`
    }]);
    setProposta(null);
    setInput("");
    setOpen(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newHistory = [...history, { role: "user", content: userMsg }];
    setHistory(newHistory);
    setLoading(true);

    const historyText = newHistory.map(m => `${m.role === "user" ? "Usuário" : "IA"}: ${m.content}`).join("\n");

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em elaboração de propostas e relatórios para editais de fomento científico e tecnológico.

CAMPO: ${pergunta}
${contexto ? `CONTEXTO: ${contexto}` : ""}
${instrucao_ia ? `INSTRUÇÃO ESPECIAL: ${instrucao_ia}` : ""}
${respostaAtual ? `TEXTO ATUAL DO CAMPO: ${respostaAtual}` : ""}

HISTÓRICO DA CONVERSA:
${historyText}

Responda de forma objetiva. Quando tiver um texto pronto para sugerir, inclua-o ao final precedido exatamente por "PROPOSTA_TEXTO:" em uma nova linha (sem aspas, sem markdown no texto proposto — apenas texto limpo e formal). Se ainda precisar de mais informações do usuário, faça perguntas pontuais sem gerar o texto final ainda.`
    });

    const text = typeof r === "string" ? r : JSON.stringify(r);
    const hasProposta = text.includes("PROPOSTA_TEXTO:");
    let displayText = text;
    let propostaExtraida = null;

    if (hasProposta) {
      const parts = text.split("PROPOSTA_TEXTO:");
      displayText = parts[0].trim();
      propostaExtraida = parts[1]?.trim().replace(/^["'`]+|["'`]+$/g, "") || null;
      if (propostaExtraida) setProposta(propostaExtraida);
    }

    setHistory([...newHistory, { role: "assistant", content: displayText, proposta: propostaExtraida }]);
    setLoading(false);
  };

  const aprovar = () => {
    if (!proposta) return;
    onApprove(proposta);
    setOpen(false);
  };

  const regenerar = async () => {
    if (loading) return;
    setLoading(true);
    const historyText = history.map(m => `${m.role === "user" ? "Usuário" : "IA"}: ${m.content}`).join("\n");
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em elaboração de propostas para editais de fomento. Gere uma versão alternativa (diferente da anterior) para o campo "${pergunta}". ${contexto ? `Contexto: ${contexto}` : ""} ${instrucao_ia ? instrucao_ia : ""}

Histórico: ${historyText}

Retorne apenas o texto alternativo após "PROPOSTA_TEXTO:" sem aspas nem markdown.`
    });
    const text = typeof r === "string" ? r : "";
    if (text.includes("PROPOSTA_TEXTO:")) {
      const nova = text.split("PROPOSTA_TEXTO:")[1]?.trim().replace(/^["'`]+|["'`]+$/g, "");
      if (nova) {
        setProposta(nova);
        setHistory(h => [...h, { role: "assistant", content: "Aqui está uma versão alternativa:", proposta: nova }]);
      }
    }
    setLoading(false);
  };

  if (disabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={openChat}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors border border-indigo-200 hover:border-indigo-400"
      >
        <Sparkles className="w-3 h-3" />
        Gerar com IA
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-3 border-b flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Assistente IA
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pergunta}</p>
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
                  {msg.proposta && (
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1.5">Texto proposto</p>
                      {msg.proposta}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pensando...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Approve bar */}
          {proposta && !loading && (
            <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-indigo-800">Texto pronto para uso</p>
                <p className="text-xs text-indigo-600 truncate">{proposta.slice(0, 80)}...</p>
              </div>
              <Button size="sm" variant="outline" onClick={regenerar} disabled={loading} className="border-indigo-300 text-indigo-700 flex-shrink-0 h-8">
                <RotateCcw className="w-3 h-3 mr-1" /> Outra versão
              </Button>
              <Button size="sm" onClick={aprovar} className="bg-green-600 hover:bg-green-700 flex-shrink-0 h-8">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Usar este texto
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t bg-white flex-shrink-0 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Descreva o que você tem ou peça ajuda..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
              disabled={loading}
            />
            <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 h-9 w-9 flex-shrink-0">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}