import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, X, Minimize2, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getAppearance } from "@/hooks/useAppearance";

/**
 * IAChatBalloon — balão suspenso de IA contextual.
 * Props:
 *   contextTitle: string — ex: "Proposta: Meu Projeto FAPES"
 *   contextText: string — texto de contexto passado ao LLM
 *   editalFileUrls?: string[] — arquivos do edital para o LLM
 */
export default function IAChatBalloon({ contextTitle, contextText, editalFileUrls = [] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLight, setIsLight] = useState(() => getAppearance().tema === "light");
  const bottomRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => setIsLight(getAppearance().tema === "light"), 300);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Olá! Sou o assistente de IA da Munnin Crow. Estou aqui para tirar dúvidas sobre **${contextTitle}**.\n\nO que você quer saber?`
      }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é o assistente especialista da plataforma Munnin Crow em editais de fomento à inovação e pesquisa no Brasil.

CONTEXTO DO USUÁRIO:
${contextText || "Nenhum contexto específico disponível."}

Histórico:
${messages.slice(-6).map(m => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`).join("\n")}

Pergunta: ${userMsg}

INSTRUÇÕES:
- Responda com foco no contexto fornecido (proposta/projeto/edital).
- Seja direto, objetivo e útil.
- Use Markdown simples (listas, negrito) quando necessário.
- Se não souber, indique que o usuário consulte o órgão fomentador.`,
      file_urls: editalFileUrls.length > 0 ? editalFileUrls : undefined,
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const windowW = expanded ? "w-[480px]" : "w-80";
  const windowH = expanded ? "h-[560px]" : "h-96";

  const panelBg = isLight
    ? "bg-white border-slate-200 shadow-2xl"
    : "bg-[#0f172a] border-indigo-500/30 shadow-2xl shadow-indigo-900/40";
  const headerBg = isLight
    ? "bg-indigo-600"
    : "bg-indigo-700";
  const msgBotBg = isLight
    ? "bg-slate-100 text-slate-800"
    : "bg-white/10 text-slate-100";
  const inputBg = isLight
    ? "bg-slate-50 border-t border-slate-200"
    : "bg-white/5 border-t border-white/10";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div className={`${windowW} ${windowH} rounded-2xl border flex flex-col overflow-hidden transition-all duration-300 ${panelBg}`}>
          {/* Header */}
          <div className={`${headerBg} px-4 py-2.5 flex items-center justify-between flex-shrink-0`}>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-white" />
              <div>
                <p className="text-white text-xs font-semibold leading-tight">Assistente IA</p>
                <p className="text-indigo-200 text-[10px] truncate max-w-[180px]">{contextTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-indigo-200 hover:text-white p-1 rounded transition-colors"
              >
                {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-indigo-200 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.role !== "user" && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : msgBotBg
                }`}>
                  {msg.role === "user"
                    ? <p>{msg.content}</p>
                    : <div className="prose prose-xs max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  }
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white animate-pulse" />
                </div>
                <div className={`rounded-xl px-3 py-2 ${msgBotBg}`}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={`px-3 py-2.5 flex gap-2 flex-shrink-0 ${inputBg}`}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Tire sua dúvida..."
              className={`flex-1 text-xs rounded-lg px-3 py-1.5 outline-none border ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800 placeholder-slate-400"
                  : "bg-white/10 border-white/20 text-white placeholder-slate-400"
              }`}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 group relative ${
          open
            ? "bg-indigo-700 ring-2 ring-indigo-400 ring-offset-2"
            : "bg-indigo-600 hover:bg-indigo-700 hover:scale-110"
        }`}
        style={{ width: 52, height: 52 }}
        title="Assistente IA"
      >
        {/* Norse rune subtle decoration */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="24" stroke="white" strokeWidth="0.8" fill="none"/>
          <circle cx="26" cy="26" r="3" stroke="white" strokeWidth="1" fill="none"/>
        </svg>
        {open
          ? <X className="w-5 h-5 text-white relative z-10" />
          : <Bot className="w-5 h-5 text-white relative z-10" />
        }
        {/* Pulse indicator */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
}