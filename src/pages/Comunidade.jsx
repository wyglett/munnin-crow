import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hash, Send, X, Reply, MessageSquare, ChevronDown, SmilePlus, AtSign } from "lucide-react";
import moment from "moment";
import "moment/locale/pt-br";
moment.locale("pt-br");

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

function DateDivider({ date }) {
  const label = moment(date).calendar(null, {
    sameDay: "[Hoje]",
    lastDay: "[Ontem]",
    lastWeek: "dddd, DD [de] MMMM",
    sameElse: "DD [de] MMMM [de] YYYY",
  });
  return (
    <div className="flex items-center gap-3 my-4 px-4">
      <div className="flex-1 h-px bg-[#3f3f5a]" />
      <span className="text-xs text-[#8e8ea8] font-semibold whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-[#3f3f5a]" />
    </div>
  );
}

function MessageGroup({ msgs, currentEmail, onReply }) {
  const first = msgs[0];
  const isOwn = first.autor_email === currentEmail;

  return (
    <div className="group flex gap-3 px-4 py-1 hover:bg-[#2e2e47]/40 rounded-lg mx-2 transition-colors">
      <div className="mt-0.5 flex-shrink-0">
        <Avatar nome={first.autor_nome} email={first.autor_email} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-sm font-semibold ${isOwn ? "text-indigo-300" : "text-[#e2e2f5]"}`}>
            {first.autor_nome || first.autor_email?.split("@")[0]}
          </span>
          <span className="text-[10px] text-[#5c5c7a]">{moment(first.created_date).format("HH:mm")}</span>
        </div>
        {msgs.map((msg) => (
          <div key={msg.id} className="group/msg relative">
            {msg.reply_to_id && msg.reply_preview && (
              <div className="flex items-start gap-2 mb-1 border-l-2 border-[#5865f2] pl-2 py-0.5 bg-[#5865f2]/10 rounded-r-md">
                <span className="text-xs text-[#5865f2] font-semibold">{msg.reply_autor_nome}</span>
                <span className="text-xs text-[#8e8ea8] line-clamp-1">{msg.reply_preview}</span>
              </div>
            )}
            <p className="text-sm text-[#c9c9e3] leading-relaxed">{msg.conteudo}</p>
            {/* Actions on hover */}
            <div className="absolute right-0 top-0 hidden group-hover/msg:flex items-center gap-0.5 bg-[#1e1e35] border border-[#3f3f5a] rounded-lg px-1.5 py-0.5 shadow-lg">
              <button
                onClick={() => onReply(msg)}
                className="p-1 rounded hover:bg-[#3f3f5a] text-[#8e8ea8] hover:text-white transition-colors"
                title="Responder"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Comunidade() {
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
    queryFn: () => base44.entities.Edital.list("-created_date", 50),
  });

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["chat", selectedChannel],
    queryFn: () => base44.entities.MensagemChat.filter(
      { edital_id: selectedChannel }, "created_date", 100
    ),
  });

  useEffect(() => {
    const unsub = base44.entities.MensagemChat.subscribe(() => refetch());
    return unsub;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.MensagemChat.create(data),
    onSuccess: () => { refetch(); setMessage(""); setReplyTo(null); },
  });

  const handleSend = () => {
    if (!message.trim() || !user) return;
    sendMutation.mutate({
      edital_id: selectedChannel,
      edital_titulo: selectedChannel === "geral" ? "Geral" : editais.find(e => e.id === selectedChannel)?.titulo || "",
      conteudo: message,
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
  const currentChannel = channels.find(c => c.id === selectedChannel);

  // Group consecutive messages by same author
  const groupedByDate = groupMessagesByDate(messages);

  // Group consecutive messages from same author within a day
  function groupConsecutive(msgs) {
    const groups = [];
    msgs.forEach(msg => {
      const last = groups[groups.length - 1];
      if (last && last[0].autor_email === msg.autor_email &&
          moment(msg.created_date).diff(moment(last[last.length - 1].created_date), "minutes") < 5) {
        last.push(msg);
      } else {
        groups.push([msg]);
      }
    });
    return groups;
  }

  return (
    <div className="flex h-full bg-[#13132b] text-[#c9c9e3] overflow-hidden">

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-60" : "w-0"} flex-shrink-0 transition-all duration-200 overflow-hidden bg-[#1a1a32] border-r border-[#2e2e47] flex flex-col`}>
        {/* Server name */}
        <div className="px-4 py-3.5 border-b border-[#2e2e47] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-[#e2e2f5] text-sm">Comunidade</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#5c5c7a]" />
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto py-3">
          <p className="text-[10px] font-bold text-[#5c5c7a] uppercase tracking-wider px-4 mb-1">Canais de Texto</p>
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => handleSelectChannel(ch.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md text-sm transition-all group ${
                selectedChannel === ch.id
                  ? "bg-[#3f3f5a] text-white"
                  : "text-[#8e8ea8] hover:bg-[#2e2e47] hover:text-[#c9c9e3]"
              }`}
              style={{ maxWidth: "calc(100% - 8px)" }}
            >
              <Hash className="w-4 h-4 flex-shrink-0 opacity-70" />
              <span className="truncate text-left">
                {ch.id === "geral" ? "geral" : ch.titulo?.toLowerCase().slice(0, 30)}
              </span>
            </button>
          ))}
        </div>

        {/* User bar at bottom */}
        {authLoaded && (
          <div className="border-t border-[#2e2e47] px-3 py-2 bg-[#13132b]">
            {user ? (
              <div className="flex items-center gap-2">
                <Avatar nome={user.full_name} email={user.email} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#e2e2f5] truncate">{user.full_name || user.email?.split("@")[0]}</p>
                  <p className="text-[10px] text-[#5c5c7a]">online</p>
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

        {/* Channel header */}
        <div className="px-4 py-3 border-b border-[#2e2e47] flex items-center gap-3 bg-[#1a1a32] flex-shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="text-[#5c5c7a] hover:text-[#c9c9e3] md:hidden">
            <Hash className="w-5 h-5" />
          </button>
          <Hash className="w-5 h-5 text-[#5c5c7a] hidden md:block" />
          <div>
            <span className="font-bold text-[#e2e2f5] text-sm">
              {currentChannel?.id === "geral" ? "geral" : currentChannel?.titulo?.toLowerCase()}
            </span>
            {currentChannel?.id !== "geral" && (
              <p className="text-[10px] text-[#5c5c7a]">Discussões sobre este edital</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 rounded-full bg-[#2e2e47] flex items-center justify-center mb-4">
                <Hash className="w-8 h-8 text-[#5c5c7a]" />
              </div>
              <h3 className="font-bold text-[#e2e2f5] mb-1">Bem-vindo ao #{currentChannel?.id === "geral" ? "geral" : currentChannel?.titulo?.toLowerCase()}</h3>
              <p className="text-sm text-[#5c5c7a]">Este é o início do canal. Seja o primeiro a mandar uma mensagem!</p>
            </div>
          ) : (
            groupedByDate.map(([date, dayMsgs]) => (
              <div key={date}>
                <DateDivider date={date} />
                {groupConsecutive(dayMsgs).map((group, i) => (
                  <MessageGroup
                    key={group[0].id}
                    msgs={group}
                    currentEmail={user?.email}
                    onReply={setReplyTo}
                  />
                ))}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div className="mx-4 mb-1 px-3 py-2 bg-[#2e2e47] rounded-t-lg border border-[#3f3f5a] flex items-center gap-3">
            <Reply className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-indigo-400 font-semibold">Respondendo a {replyTo.autor_nome} </span>
              <span className="text-xs text-[#8e8ea8] truncate">{replyTo.conteudo}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-[#5c5c7a] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="px-4 pb-4 flex-shrink-0">
          {!user && authLoaded ? (
            <div className="flex items-center justify-between bg-[#2e2e47] rounded-xl px-4 py-3 border border-[#3f3f5a]">
              <span className="text-sm text-[#8e8ea8]">Faça login para participar da conversa</span>
              <Button size="sm" onClick={() => base44.auth.redirectToLogin()} className="bg-indigo-600 hover:bg-indigo-700 text-xs">
                Entrar
              </Button>
            </div>
          ) : (
            <div className={`flex items-center gap-2 bg-[#2e2e47] rounded-xl px-3 border border-[#3f3f5a] ${replyTo ? "rounded-tl-none" : ""}`}>
              <AtSign className="w-4 h-4 text-[#5c5c7a] flex-shrink-0" />
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={`Mensagem em #${currentChannel?.id === "geral" ? "geral" : currentChannel?.titulo?.toLowerCase()}`}
                className="flex-1 bg-transparent py-3 text-sm text-[#c9c9e3] placeholder-[#5c5c7a] outline-none"
                disabled={!user}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending || !user}
                className="p-1.5 rounded-md disabled:opacity-30 text-[#5c5c7a] hover:text-indigo-400 hover:bg-[#3f3f5a] transition-colors"
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