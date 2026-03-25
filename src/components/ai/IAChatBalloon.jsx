import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Send, Loader2, X, Maximize2, Minimize2, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getAppearance } from "@/hooks/useAppearance";

/**
 * IAChatBalloon — balão flutuante de IA contextual com painel lateral expansível.
 * Props:
 *   contextTitle: string
 *   contextText: string — contexto passado ao LLM
 *   editalFileUrls?: string[]
 *   editalId?: string — para associar tutoria
 *   editalTitulo?: string
 *   editalOrgao?: string
 */
export default function IAChatBalloon({ contextTitle, contextText, editalFileUrls = [], editalId, editalTitulo, editalOrgao }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false); // lateral expandido
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLight, setIsLight] = useState(() => getAppearance().tema === "light");
  const [showTutoria, setShowTutoria] = useState(false);
  const [tutoriaForm, setTutoriaForm] = useState({ titulo: "", descricao: "", area: "", prioridade: "media" });
  const [tutoriaLoading, setTutoriaLoading] = useState(false);
  const [tutoriaOk, setTutoriaOk] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => setIsLight(getAppearance().tema === "light"), 300);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Olá! Sou o assistente especialista da Munnin Crow.\n\nEstou contextualizado com **${contextTitle}**${editalTitulo ? ` do edital **${editalTitulo}**` : ""}.\n\nO que você quer saber?`
      }]);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é o assistente especialista da plataforma Munnin Crow em editais de fomento à inovação e pesquisa no Brasil.

CONTEXTO:
${contextText || "Nenhum contexto específico disponível."}
${editalTitulo ? `\nEdital vinculado: "${editalTitulo}" (${editalOrgao || ""})` : ""}

Histórico:
${messages.slice(-6).map(m => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`).join("\n")}

Pergunta: ${userMsg}

INSTRUÇÕES:
- Responda com foco no contexto da proposta/projeto e edital fornecidos.
- Seja direto, objetivo e útil. Use Markdown simples.
- Se não souber, indique que o usuário consulte o órgão fomentador ou solicite tutoria.`,
      file_urls: editalFileUrls.length > 0 ? editalFileUrls : undefined,
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const handleTutoria = async (e) => {
    e.preventDefault();
    setTutoriaLoading(true);
    await base44.entities.SolicitacaoTutoria.create({
      ...tutoriaForm,
      tipo: "direta",
      edital_id: editalId,
      edital_titulo: editalTitulo,
    });
    setTutoriaLoading(false);
    setTutoriaOk(true);
    setTimeout(() => { setTutoriaOk(false); setShowTutoria(false); setTutoriaForm({ titulo: "", descricao: "", area: "", prioridade: "media" }); }, 2000);
  };

  // ─── Estilos por tema ───────────────────────────────────────────
  const panelBg = isLight
    ? "bg-white/95 border-slate-200 shadow-2xl"
    : "bg-[#0b0e1a]/95 border-indigo-500/25 shadow-2xl shadow-indigo-900/30";
  const headerBg = isLight ? "bg-indigo-600" : "bg-indigo-800/90";
  const msgBotBg = isLight ? "bg-slate-100 text-slate-800" : "bg-white/10 text-slate-100";
  const inputBorder = isLight ? "bg-white border-slate-300 text-slate-800 placeholder-slate-400" : "bg-white/10 border-white/20 text-white placeholder-slate-400";
  const dividerCls = isLight ? "border-slate-200" : "border-white/10";
  const labelCls = isLight ? "text-slate-700" : "text-slate-300";
  const formInputCls = isLight
    ? "bg-white border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1.5 w-full border outline-none focus:border-indigo-400"
    : "bg-white/10 border-white/20 text-white text-xs rounded-lg px-2 py-1.5 w-full border outline-none focus:border-indigo-400";

  // Norse decoration inside panel
  const norseColor = isLight ? "#6366f1" : "#a5b4fc";

  // ─── Balão pequeno (canto inferior direito) ─────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 hover:scale-110 shadow-lg transition-all duration-300 group"
        style={{ width: 52, height: 52 }}
        title="Assistente IA — Tira-dúvidas"
      >
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="24" stroke="white" strokeWidth="0.8" fill="none"/>
          <circle cx="26" cy="26" r="3" stroke="white" strokeWidth="1" fill="none"/>
        </svg>
        <Bot className="w-5 h-5 text-white relative z-10" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  // ─── Painel lateral expandido (20% da tela) ─────────────────────
  if (expanded) {
    return (
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col border-l backdrop-blur-xl transition-all duration-300 ${panelBg}`}
        style={{ width: "22%" }}
      >
        {/* Norse decorative top strip */}
        <svg className="absolute top-0 left-0 w-full pointer-events-none opacity-20" height="40" viewBox="0 0 400 40" preserveAspectRatio="none">
          <pattern id="nb-side" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 20 Q10 8 20 20 Q30 32 40 20 Q50 8 60 20 Q70 32 80 20" stroke={norseColor} strokeWidth="1" fill="none"/>
            <circle cx="20" cy="20" r="1.5" fill={norseColor}/>
            <circle cx="60" cy="20" r="1.5" fill={norseColor}/>
          </pattern>
          <rect width="100%" height="40" fill="url(#nb-side)"/>
        </svg>

        {/* Header */}
        <div className={`${headerBg} px-3 py-2.5 flex items-center justify-between flex-shrink-0 relative z-10 mt-0`}>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-white" />
            <div>
              <p className="text-white text-xs font-semibold">Assistente IA</p>
              <p className="text-indigo-200 text-[10px] truncate max-w-[140px]">{contextTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded(false)} className="text-indigo-200 hover:text-white p-1 rounded">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setOpen(false)} className="text-indigo-200 hover:text-white p-1 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tutoria toggle */}
        <div className={`flex border-b ${dividerCls} flex-shrink-0`}>
          <button
            onClick={() => setShowTutoria(false)}
            className={`flex-1 py-1.5 text-[10px] font-semibold transition-colors ${!showTutoria ? "text-indigo-500 border-b-2 border-indigo-500" : labelCls}`}
          >IA Chat</button>
          <button
            onClick={() => setShowTutoria(true)}
            className={`flex-1 py-1.5 text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 ${showTutoria ? "text-indigo-500 border-b-2 border-indigo-500" : labelCls}`}
          ><GraduationCap className="w-3 h-3" /> Tutoria</button>
        </div>

        {!showTutoria ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2.5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-1.5`}>
                  {msg.role !== "user" && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[88%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed ${msg.role === "user" ? "bg-indigo-600 text-white" : msgBotBg}`}>
                    {msg.role === "user"
                      ? <p>{msg.content}</p>
                      : <div className="prose prose-xs max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    }
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white animate-pulse" />
                  </div>
                  <div className={`rounded-xl px-2.5 py-1.5 ${msgBotBg}`}><Loader2 className="w-3 h-3 animate-spin opacity-60" /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            {/* Input */}
            <div className={`px-2.5 py-2 flex gap-1.5 flex-shrink-0 border-t ${dividerCls}`}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Tire sua dúvida..."
                className={`flex-1 text-[11px] rounded-lg px-2 py-1.5 outline-none border ${inputBorder}`}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center"
              ><Send className="w-3 h-3 text-white" /></button>
            </div>
          </>
        ) : (
          /* Tutoria form */
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {tutoriaOk ? (
              <div className="text-center py-8">
                <GraduationCap className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className={`text-xs font-semibold ${isLight ? "text-green-700" : "text-green-400"}`}>Solicitação enviada!</p>
              </div>
            ) : (
              <form onSubmit={handleTutoria} className="space-y-2.5">
                <p className={`text-[10px] leading-relaxed mb-3 ${labelCls}`}>
                  Solicite tutoria especializada já vinculada ao edital <strong>{editalTitulo || contextTitle}</strong>.
                </p>
                <div>
                  <p className={`text-[10px] font-semibold mb-0.5 ${labelCls}`}>Título *</p>
                  <input required value={tutoriaForm.titulo} onChange={e => setTutoriaForm(f => ({...f, titulo: e.target.value}))}
                    placeholder="Ex: Dúvida sobre orçamento" className={formInputCls} />
                </div>
                <div>
                  <p className={`text-[10px] font-semibold mb-0.5 ${labelCls}`}>Descreva a necessidade *</p>
                  <textarea required rows={3} value={tutoriaForm.descricao} onChange={e => setTutoriaForm(f => ({...f, descricao: e.target.value}))}
                    placeholder="O que precisa de apoio..." className={`${formInputCls} resize-none`} />
                </div>
                <div>
                  <p className={`text-[10px] font-semibold mb-0.5 ${labelCls}`}>Área</p>
                  <input value={tutoriaForm.area} onChange={e => setTutoriaForm(f => ({...f, area: e.target.value}))}
                    placeholder="Ex: Inovação, Finanças..." className={formInputCls} />
                </div>
                <div>
                  <p className={`text-[10px] font-semibold mb-0.5 ${labelCls}`}>Prioridade</p>
                  <select value={tutoriaForm.prioridade} onChange={e => setTutoriaForm(f => ({...f, prioridade: e.target.value}))}
                    className={formInputCls}>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <button type="submit" disabled={tutoriaLoading}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-1">
                  {tutoriaLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <GraduationCap className="w-3 h-3" />}
                  Solicitar Tutoria
                </button>
              </form>
            )}
          </div>
        )}

        {/* Norse decoration bottom strip */}
        <svg className="absolute bottom-0 left-0 w-full pointer-events-none opacity-15" height="30" viewBox="0 0 400 30" preserveAspectRatio="none">
          <pattern id="nb-side-bot" x="0" y="0" width="80" height="30" patternUnits="userSpaceOnUse">
            <path d="M0 15 Q10 5 20 15 Q30 25 40 15 Q50 5 60 15 Q70 25 80 15" stroke={norseColor} strokeWidth="1" fill="none"/>
          </pattern>
          <rect width="100%" height="30" fill="url(#nb-side-bot)"/>
        </svg>
      </div>
    );
  }

  // ─── Painel flutuante pequeno (canto inferior direito) ──────────
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div className={`w-80 h-96 rounded-2xl border flex flex-col overflow-hidden ${panelBg}`}>
        {/* Norse top strip */}
        <svg className="absolute top-0 left-0 w-full pointer-events-none opacity-20" height="30" viewBox="0 0 320 30" preserveAspectRatio="none" style={{position:"relative",flexShrink:0}}>
          <pattern id="nb-float" x="0" y="0" width="80" height="30" patternUnits="userSpaceOnUse">
            <path d="M0 15 Q10 5 20 15 Q30 25 40 15 Q50 5 60 15 Q70 25 80 15" stroke={norseColor} strokeWidth="1" fill="none"/>
            <circle cx="20" cy="15" r="1.2" fill={norseColor}/>
            <circle cx="60" cy="15" r="1.2" fill={norseColor}/>
          </pattern>
          <rect width="100%" height="30" fill="url(#nb-float)"/>
        </svg>

        {/* Header */}
        <div className={`${headerBg} px-3.5 py-2 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-white" />
            <div>
              <p className="text-white text-xs font-semibold">Assistente IA</p>
              <p className="text-indigo-200 text-[10px] truncate max-w-[160px]">{contextTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded(true)} className="text-indigo-200 hover:text-white p-1 rounded" title="Expandir painel lateral">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setShowTutoria(v => !v)} className={`p-1 rounded transition-colors ${showTutoria ? "text-yellow-300" : "text-indigo-200 hover:text-white"}`} title="Pedir Tutoria">
              <GraduationCap className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setOpen(false)} className="text-indigo-200 hover:text-white p-1 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!showTutoria ? (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-1.5`}>
                  {msg.role !== "user" && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-xs leading-relaxed ${msg.role === "user" ? "bg-indigo-600 text-white" : msgBotBg}`}>
                    {msg.role === "user"
                      ? <p>{msg.content}</p>
                      : <div className="prose prose-xs max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    }
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white animate-pulse" />
                  </div>
                  <div className={`rounded-xl px-2.5 py-1.5 ${msgBotBg}`}><Loader2 className="w-3 h-3 animate-spin opacity-60" /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className={`px-3 py-2 flex gap-1.5 flex-shrink-0 border-t ${dividerCls}`}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Tire sua dúvida..."
                className={`flex-1 text-xs rounded-lg px-2.5 py-1.5 outline-none border ${inputBorder}`}
              />
              <button onClick={handleSend} disabled={loading || !input.trim()}
                className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center">
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {tutoriaOk ? (
              <div className="text-center py-8">
                <GraduationCap className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className={`text-xs font-semibold ${isLight ? "text-green-700" : "text-green-400"}`}>Solicitação enviada!</p>
              </div>
            ) : (
              <form onSubmit={handleTutoria} className="space-y-2">
                <p className={`text-[10px] leading-relaxed mb-2 ${labelCls}`}>
                  Tutoria vinculada a: <strong>{editalTitulo || contextTitle}</strong>
                </p>
                <div>
                  <p className={`text-[10px] font-semibold mb-0.5 ${labelCls}`}>Título *</p>
                  <input required value={tutoriaForm.titulo} onChange={e => setTutoriaForm(f => ({...f, titulo: e.target.value}))}
                    placeholder="Ex: Dúvida sobre orçamento" className={formInputCls} />
                </div>
                <div>
                  <p className={`text-[10px] font-semibold mb-0.5 ${labelCls}`}>Necessidade *</p>
                  <textarea required rows={3} value={tutoriaForm.descricao} onChange={e => setTutoriaForm(f => ({...f, descricao: e.target.value}))}
                    placeholder="O que precisa de apoio..." className={`${formInputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <p className={`text-[10px] font-semibold mb-0.5 ${labelCls}`}>Área</p>
                    <input value={tutoriaForm.area} onChange={e => setTutoriaForm(f => ({...f, area: e.target.value}))}
                      placeholder="Inovação..." className={formInputCls} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-semibold mb-0.5 ${labelCls}`}>Prioridade</p>
                    <select value={tutoriaForm.prioridade} onChange={e => setTutoriaForm(f => ({...f, prioridade: e.target.value}))} className={formInputCls}>
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={tutoriaLoading}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 mt-1">
                  {tutoriaLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <GraduationCap className="w-3 h-3" />}
                  Solicitar Tutoria
                </button>
                <button type="button" onClick={() => setShowTutoria(false)}
                  className={`w-full py-1 text-[10px] ${labelCls} hover:text-indigo-500`}>
                  ← Voltar ao chat
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Trigger button quando panel está aberto como float */}
      <button
        onClick={() => setOpen(false)}
        className="w-[52px] h-[52px] rounded-full bg-indigo-700 ring-2 ring-indigo-400 ring-offset-2 flex items-center justify-center shadow-lg"
      >
        <X className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}