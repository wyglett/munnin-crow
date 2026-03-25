import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Hash, Send, X, Reply, MessageSquare, ChevronDown, AtSign } from "lucide-react";
import moment from "moment";
import "moment/locale/pt-br";
import { getAppearance } from "@/hooks/useAppearance";
moment.locale("pt-br");

// ── Censura de palavrões ──────────────────────────────────────────────────────
const PALAVROES = [
  /\bp+u+t+[ao]+\b/gi, /\bp+o+r+r+[ao]+\b/gi, /\bc+a+r+a+l+h+o+\b/gi, /\bf+o+d+[ae]+\b/gi,
  /\bmer+d+[ao]+\b/gi, /\bv+[ia]+d+[io]+\b/gi, /\bb+u+c+e+t+[ao]+\b/gi, /\bc+u+\b/gi,
  /\bi+d+i+o+t+[ao]+\b/gi, /\bb+a+b+a+c+[ao]+\b/gi, /\bb+o+s+t+[ao]+\b/gi,
  /\bf+i+l+h+o\s+d[ae]\s+p+u+t+[ao]+\b/gi, /\ba+r+r+o+m+b+[ao]+\b/gi,
];
function censurar(texto) {
  if (!texto) return texto;
  let t = texto;
  PALAVROES.forEach(re => { t = t.replace(re, (m) => "****".padEnd(m.length, "*")); });
  return t;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nome, email, size = "md" }) {
  const colors = ["bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-cyan-500"];
  const idx = (email || nome || "").charCodeAt(0) % colors.length;
  const s = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${s} ${colors[idx]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {(nome || email || "?")[0].toUpperCase()}
    </div>
  );
}

function groupMessagesByDate(messages) {
  const groups = {};
  messages.forEach(m => {
    const day = moment(m.created_date).format("YYYY-MM-DD");
    if (!groups[day]) groups[day] = [];
    groups[day].push(m);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function DateDivider({ date, isLight }) {
  const label = moment(date).calendar(null, {
    sameDay: "[Hoje]", lastDay: "[Ontem]",
    lastWeek: "dddd, DD [de] MMMM", sameElse: "DD [de] MMMM [de] YYYY",
  });
  return (
    <div className="flex items-center gap-3 my-4 px-4">
      <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-[#3f3f5a]"}`} />
      <span className={`text-xs font-semibold whitespace-nowrap ${isLight ? "text-slate-400" : "text-[#8e8ea8]"}`}>{label}</span>
      <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-[#3f3f5a]"}`} />
    </div>
  );
}

// ── MessageGroup: mensagens direita (eu) / esquerda (outros) ─────────────────
function MessageGroup({ msgs, currentEmail, onReply, isLight }) {
  const first = msgs[0];
  const isOwn = first.autor_email === currentEmail;

  if (isOwn) {
    // Minha mensagem — direita
    return (
      <div className="flex flex-col items-end gap-0.5 px-4 py-1">
        <span className={`text-[10px] mr-1 ${isLight ? "text-slate-400" : "text-[#5c5c7a]"}`}>{moment(first.created_date).format("HH:mm")}</span>
        {msgs.map((msg) => (
          <div key={msg.id} className="group/msg relative max-w-[75%]">
            {msg.reply_to_id && msg.reply_preview && (
              <div className="mb-1 border-l-2 border-indigo-400 pl-2 py-0.5 bg-indigo-50/40 rounded text-right">
                <span className="text-xs text-indigo-500 font-semibold block">{msg.reply_autor_nome}</span>
                <span className={`text-xs line-clamp-1 ${isLight ? "text-slate-500" : "text-[#8e8ea8]"}`}>{msg.reply_preview}</span>
              </div>
            )}
            <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 text-sm leading-relaxed">
              {censurar(msg.conteudo)}
            </div>
            <button
              onClick={() => onReply(msg)}
              className="absolute -left-7 top-1 hidden group-hover/msg:flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-slate-400 hover:text-indigo-400 border border-slate-200/20"
              title="Responder"
            >
              <Reply className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Mensagem de outra pessoa — esquerda
  return (
    <div className="flex gap-3 px-4 py-1 group">
      <div className="mt-0.5 flex-shrink-0 self-end">
        <Avatar nome={first.autor_nome} email={first.autor_email} />
      </div>
      <div className="flex flex-col gap-0.5 max-w-[75%]">
        <div className={`flex items-baseline gap-2 mb-0.5`}>
          <span className={`text-xs font-semibold ${isLight ? "text-slate-700" : "text-[#e2e2f5]"}`}>
            {first.autor_nome || first.autor_email?.split("@")[0]}
          </span>
          <span className={`text-[10px] ${isLight ? "text-slate-400" : "text-[#5c5c7a]"}`}>{moment(first.created_date).format("HH:mm")}</span>
        </div>
        {msgs.map((msg) => (
          <div key={msg.id} className="group/msg relative">
            {msg.reply_to_id && msg.reply_preview && (
              <div className={`mb-1 border-l-2 border-indigo-400 pl-2 py-0.5 rounded-r ${isLight ? "bg-indigo-50" : "bg-[#5865f2]/10"}`}>
                <span className={`text-xs font-semibold ${isLight ? "text-indigo-600" : "text-[#5865f2]"}`}>{msg.reply_autor_nome}</span>
                <span className={`text-xs line-clamp-1 ml-1 ${isLight ? "text-slate-500" : "text-[#8e8ea8]"}`}>{msg.reply_preview}</span>
              </div>
            )}
            <div className={`rounded-2xl rounded-tl-sm px-4 py-2 text-sm leading-relaxed ${isLight ? "bg-slate-100 text-slate-800" : "bg-[#2e2e47] text-[#c9c9e3]"}`}>
              {censurar(msg.conteudo)}
            </div>
            <button
              onClick={() => onReply(msg)}
              className="absolute -right-7 top-1 hidden group-hover/msg:flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-slate-400 hover:text-indigo-400 border border-slate-200/20"
              title="Responder"
            >
              <Reply className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Comunidade() {
  const [isLight, setIsLight] = useState(() => getAppearance().tema === "light");
  useEffect(() => {
    const iv = setInterval(() => setIsLight(getAppearance().tema === "light"), 300);
    return () => clearInterval(iv);
  }, []);

  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("geral");
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthLoaded(true); }).catch(() => setAuthLoaded(true));
  }, []);

  const { data: editais = [] } = useQuery({
    queryKey: ["editais-chat"],
    queryFn: () => base44.entities.Edital.filter({ status: "aberto" }, "-created_date", 100),
  });

  const [expandedStates, setExpandedStates] = useState({});
  const toggleState = (uf) => setExpandedStates(prev => ({ ...prev, [uf]: !prev[uf] }));

  const editaisPorEstado = editais.reduce((acc, e) => {
    const uf = e.estado || "Outros";
    if (!acc[uf]) acc[uf] = [];
    acc[uf].push(e);
    return acc;
  }, {});

  const ESTADO_NOMES = { ES: "🟢 FAPES — ES", RJ: "🟢 FAPERJ — RJ", SP: "🟢 FAPESP — SP", MG: "🟢 FAPEMIG — MG" };

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["chat", selectedChannel],
    queryFn: () => base44.entities.MensagemChat.filter({ edital_id: selectedChannel }, "created_date", 100),
  });

  useEffect(() => {
    const unsub = base44.entities.MensagemChat.subscribe(() => refetch());
    return unsub;
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.MensagemChat.create(data),
    onSuccess: () => { refetch(); setMessage(""); setReplyTo(null); },
  });

  const handleSend = () => {
    if (!message.trim() || !user) return;
    sendMutation.mutate({
      edital_id: selectedChannel,
      edital_titulo: selectedChannel === "geral" ? "Geral" : editais.find(e => e.id === selectedChannel)?.titulo || "",
      conteudo: censurar(message),
      autor_nome: user.full_name,
      autor_email: user.email,
      reply_to_id: replyTo?.id || null,
      reply_preview: replyTo?.conteudo?.substring(0, 120) || null,
      reply_autor_nome: replyTo?.autor_nome || null,
    });
  };

  const handleSelectChannel = (id) => {
    setSelectedChannel(id);
    setReplyTo(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const channels = [{ id: "geral", titulo: "Geral" }, ...editais.map(e => ({ id: e.id, titulo: e.titulo }))];
  const currentChannel = channels.find(c => c.id === selectedChannel) || { id: selectedChannel, titulo: "Canal" };

  const groupedByDate = groupMessagesByDate(messages);

  function groupConsecutive(msgs) {
    const groups = [];
    msgs.forEach(msg => {
      const last = groups[groups.length - 1];
      if (last && last[0].autor_email === msg.autor_email &&
          moment(msg.created_date).diff(moment(last[last.length - 1].created_date), "minutes") < 5) {
        last.push(msg);
      } else { groups.push([msg]); }
    });
    return groups;
  }

  // ── Tema ──
  const rootBg    = isLight ? "bg-slate-50 text-slate-800" : "bg-[#13132b] text-[#c9c9e3]";
  const sidebarBg = isLight ? "bg-white border-r border-slate-200" : "bg-[#1a1a32] border-r border-[#2e2e47]";
  const headerBg  = isLight ? "bg-white border-b border-slate-200" : "bg-[#1a1a32] border-b border-[#2e2e47]";
  const chanActive = isLight ? "bg-indigo-100 text-indigo-700 font-semibold" : "bg-[#3f3f5a] text-white";
  const chanInact  = isLight ? "text-slate-500 hover:bg-slate-100 hover:text-slate-700" : "text-[#8e8ea8] hover:bg-[#2e2e47] hover:text-[#c9c9e3]";
  const inputBg    = isLight ? "bg-slate-100 border-slate-200" : "bg-[#2e2e47] border-[#3f3f5a]";
  const inputText  = isLight ? "text-slate-800 placeholder-slate-400" : "text-[#c9c9e3] placeholder-[#5c5c7a]";
  const userBarBg  = isLight ? "bg-slate-50 border-t border-slate-200" : "bg-[#13132b] border-t border-[#2e2e47]";

  return (
    <div className={`flex h-full overflow-hidden ${rootBg}`}>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-60" : "w-0"} flex-shrink-0 transition-all duration-200 overflow-hidden ${sidebarBg} flex flex-col`}>
        <div className={`px-4 py-3.5 border-b ${isLight ? "border-slate-200" : "border-[#2e2e47]"} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span className={`font-bold text-sm ${isLight ? "text-slate-800" : "text-[#e2e2f5]"}`}>Comunidade</span>
          </div>
          <ChevronDown className={`w-4 h-4 ${isLight ? "text-slate-400" : "text-[#5c5c7a]"}`} />
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider px-4 mb-1 ${isLight ? "text-slate-400" : "text-[#5c5c7a]"}`}>Geral</p>
          <button
            onClick={() => handleSelectChannel("geral")}
            className={`w-full flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md text-sm transition-all ${selectedChannel === "geral" ? chanActive : chanInact}`}
            style={{ maxWidth: "calc(100% - 8px)" }}
          >
            <Hash className="w-4 h-4 flex-shrink-0 opacity-70" />
            <span className="truncate text-left">geral</span>
          </button>

          {Object.entries(editaisPorEstado).map(([uf, lista]) => {
            const aberto = expandedStates[uf] !== false;
            return (
              <div key={uf}>
                <button
                  onClick={() => toggleState(uf)}
                  className={`w-full flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${isLight ? "text-slate-400 hover:text-slate-600" : "text-[#5c5c7a] hover:text-[#8e8ea8]"}`}
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${aberto ? "" : "-rotate-90"}`} />
                  {ESTADO_NOMES[uf] || uf}
                </button>
                {aberto && lista.map(e => (
                  <button
                    key={e.id}
                    onClick={() => handleSelectChannel(e.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md text-xs transition-all ${selectedChannel === e.id ? chanActive : chanInact}`}
                    style={{ maxWidth: "calc(100% - 8px)" }}
                  >
                    <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                    <span className="truncate text-left">{e.titulo?.toLowerCase().slice(0, 28)}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {authLoaded && (
          <div className={`px-3 py-2 ${userBarBg}`}>
            {user ? (
              <div className="flex items-center gap-2">
                <Avatar nome={user.full_name} email={user.email} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isLight ? "text-slate-700" : "text-[#e2e2f5]"}`}>{user.full_name || user.email?.split("@")[0]}</p>
                  <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-[#5c5c7a]"}`}>online</p>
                </div>
              </div>
            ) : (
              <button onClick={() => base44.auth.redirectToLogin()} className="w-full text-xs text-indigo-400 hover:text-indigo-300 text-left py-1">
                Entrar para participar →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className={`px-4 py-3 flex items-center gap-3 ${headerBg} flex-shrink-0`}>
          <button onClick={() => setSidebarOpen(v => !v)} className={`${isLight ? "text-slate-400 hover:text-slate-700" : "text-[#5c5c7a] hover:text-[#c9c9e3]"} md:hidden`}>
            <Hash className="w-5 h-5" />
          </button>
          <Hash className={`w-5 h-5 hidden md:block ${isLight ? "text-slate-400" : "text-[#5c5c7a]"}`} />
          <div>
            <span className={`font-bold text-sm ${isLight ? "text-slate-800" : "text-[#e2e2f5]"}`}>
              {currentChannel?.id === "geral" ? "geral" : currentChannel?.titulo?.toLowerCase()}
            </span>
            {currentChannel?.id !== "geral" && (
              <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-[#5c5c7a]"}`}>Discussões sobre este edital</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isLight ? "bg-slate-100" : "bg-[#2e2e47]"}`}>
                <Hash className={`w-8 h-8 ${isLight ? "text-slate-300" : "text-[#5c5c7a]"}`} />
              </div>
              <h3 className={`font-bold mb-1 ${isLight ? "text-slate-700" : "text-[#e2e2f5]"}`}>Bem-vindo ao #{currentChannel?.id === "geral" ? "geral" : currentChannel?.titulo?.toLowerCase()}</h3>
              <p className={`text-sm ${isLight ? "text-slate-400" : "text-[#5c5c7a]"}`}>Este é o início do canal. Seja o primeiro a mandar uma mensagem!</p>
            </div>
          ) : (
            groupedByDate.map(([date, dayMsgs]) => (
              <div key={date}>
                <DateDivider date={date} isLight={isLight} />
                {groupConsecutive(dayMsgs).map((group) => (
                  <MessageGroup
                    key={group[0].id}
                    msgs={group}
                    currentEmail={user?.email}
                    onReply={setReplyTo}
                    isLight={isLight}
                  />
                ))}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div className={`mx-4 mb-1 px-3 py-2 rounded-t-lg border flex items-center gap-3 ${isLight ? "bg-indigo-50 border-indigo-200" : "bg-[#2e2e47] border-[#3f3f5a]"}`}>
            <Reply className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-indigo-400 font-semibold">Respondendo a {replyTo.autor_nome} </span>
              <span className={`text-xs truncate ${isLight ? "text-slate-500" : "text-[#8e8ea8]"}`}>{replyTo.conteudo}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className={isLight ? "text-slate-400 hover:text-slate-700" : "text-[#5c5c7a] hover:text-white"}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="px-4 pb-4 flex-shrink-0">
          {!user && authLoaded ? (
            <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${inputBg}`}>
              <span className={`text-sm ${isLight ? "text-slate-500" : "text-[#8e8ea8]"}`}>Faça login para participar da conversa</span>
              <Button size="sm" onClick={() => base44.auth.redirectToLogin()} className="bg-indigo-600 hover:bg-indigo-700 text-xs">Entrar</Button>
            </div>
          ) : (
            <div className={`flex items-center gap-2 rounded-xl px-3 border ${inputBg} ${replyTo ? "rounded-tl-none" : ""}`}>
              <AtSign className={`w-4 h-4 flex-shrink-0 ${isLight ? "text-slate-400" : "text-[#5c5c7a]"}`} />
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Mensagem em #${currentChannel?.id === "geral" ? "geral" : currentChannel?.titulo?.toLowerCase()}`}
                className={`flex-1 bg-transparent py-3 text-sm outline-none ${inputText}`}
                disabled={!user}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending || !user}
                className={`p-1.5 rounded-md disabled:opacity-30 transition-colors ${isLight ? "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" : "text-[#5c5c7a] hover:text-indigo-400 hover:bg-[#3f3f5a]"}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}