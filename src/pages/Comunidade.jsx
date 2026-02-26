import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X, Reply } from "lucide-react";
import moment from "moment";

export default function Comunidade() {
  const [user, setUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState("geral");
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

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
      conteudo: message,
      autor_nome: user.full_name,
      autor_email: user.email,
      reply_to_id: replyTo?.id || null,
      reply_preview: replyTo?.conteudo?.substring(0, 120) || null,
      reply_autor_nome: replyTo?.autor_nome || null,
    });
  };

  const channels = [{ id: "geral", titulo: "Geral" }, ...editais.map(e => ({ id: e.id, titulo: e.titulo }))];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">Chat da Comunidade</h1>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Troca de experiências entre empreendedores — selecione o edital do seu interesse</p>
      </div>

      {/* Channels */}
      <div className="flex gap-2 px-6 py-3 border-b overflow-x-auto">
        {channels.map(ch => (
          <button
            key={ch.id}
            onClick={() => setSelectedChannel(ch.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedChannel === ch.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {ch.id === "geral" ? "💬 Geral" : `# ${ch.titulo?.substring(0, 35)}${ch.titulo?.length > 35 ? "..." : ""}`}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Nenhuma mensagem neste canal ainda</p>
            <p className="text-sm">Seja o primeiro a iniciar a conversa!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.autor_email === user?.email;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                  {!isOwn && <span className="text-[10px] text-gray-400 mb-1 ml-1">{msg.autor_nome}</span>}
                  <div className={`rounded-2xl px-4 py-2.5 ${isOwn ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                    {msg.reply_to_id && msg.reply_preview && (
                      <div className={`border-l-2 rounded px-2 py-1 mb-2 text-xs ${
                        isOwn ? "border-white/40 bg-white/10 text-white/70" : "border-indigo-400 bg-indigo-50 text-gray-600"
                      }`}>
                        <p className="font-semibold text-[10px]">{msg.reply_autor_nome}</p>
                        <p className="line-clamp-2">{msg.reply_preview}</p>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.conteudo}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 mx-1">
                    <span className="text-[10px] text-gray-400">{moment(msg.created_date).format("HH:mm")}</span>
                    <button onClick={() => setReplyTo(msg)} className="text-[10px] text-gray-400 hover:text-indigo-600 flex items-center gap-0.5">
                      <Reply className="w-2.5 h-2.5" /> Responder
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-6 py-2 bg-indigo-50 border-t flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-indigo-600 font-semibold">Respondendo a {replyTo.autor_nome}</p>
            <p className="text-xs text-gray-500 truncate">{replyTo.conteudo}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t flex gap-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!message.trim() || sendMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 px-4">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}