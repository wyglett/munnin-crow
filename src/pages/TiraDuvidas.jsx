import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2, GraduationCap } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function TiraDuvidas() {
  const [user, setUser] = useState(null);
  const [selectedEdital, setSelectedEdital] = useState("geral");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tutoriaOpen, setTutoriaOpen] = useState(false);
  const [tutoriaForm, setTutoriaForm] = useState({ titulo: "", descricao: "", area: "", prioridade: "media" });
  const bottomRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { setMessages([{ role: "assistant", content: "Olá! Selecione um edital acima para que eu possa responder dúvidas específicas com base no conteúdo oficial." }]); }, [selectedEdital]);

  const { data: editais = [] } = useQuery({
    queryKey: ["editais-tiraduvidas"],
    queryFn: () => base44.entities.Edital.list("-created_date", 100),
  });

  const { data: consultores = [] } = useQuery({
    queryKey: ["consultores"],
    queryFn: () => base44.entities.User.filter({ role: "consultor" }),
  });

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const edital = selectedEdital !== "geral" ? editais.find(e => e.id === selectedEdital) : null;

    // Coletar URLs dos documentos do edital (apenas PDF e imagens — formatos suportados pelo InvokeLLM)
    const isSupportedFile = (url) => /\.(pdf|png|jpg|jpeg)(\?|$)/i.test(url);
    const fileUrls = [];
    if (edital) {
      edital.documentos_modelo?.forEach(d => { if (d.url && isSupportedFile(d.url)) fileUrls.push(d.url); });
      edital.etapas?.forEach(etapa => {
        etapa.documentos?.forEach(d => { if (d.url && isSupportedFile(d.url)) fileUrls.push(d.url); });
      });
    }

    // Base de treinamento da IA
    const treinamentoStr = edital?.ia_treinamento?.length
      ? `\n\nCONHECIMENTO COMPLEMENTAR CADASTRADO PELO ADMINISTRADOR:\n${edital.ia_treinamento.map(t => `P: ${t.pergunta}\nR: ${t.resposta}`).join("\n---\n")}`
      : "";

    let contextEdital = "";
    if (edital) {
      contextEdital = `EDITAL SELECIONADO: "${edital.titulo}"
Número: ${edital.numero || "N/I"} | Órgão: ${edital.orgao || ""} | Estado: ${edital.estado || ""}
Área: ${edital.area || ""} | Valor: ${edital.valor_total || ""} | Encerramento: ${edital.data_encerramento || ""}
Descrição: ${edital.descricao || ""}${treinamentoStr}

${fileUrls.length > 0 ? `Os documentos oficiais do edital estão anexados (${fileUrls.length} arquivo(s)). LEIA-OS e use seu conteúdo como fonte primária para responder.` : ""}`;
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é o assistente especialista da plataforma Munnin Crow em editais de fomento à inovação e pesquisa.
${contextEdital ? contextEdital : "Responda sobre editais de fomento em geral."}

Histórico da conversa:
${messages.slice(-8).map(m => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`).join("\n")}

Pergunta atual do usuário: ${userMsg}

INSTRUÇÕES:
- Se há documentos anexados, LEIA-OS e extraia informações concretas (itens financiáveis, não financiáveis, critérios, prazos, etc).
- Responda com base nos documentos oficiais em primeiro lugar, depois no conhecimento complementar cadastrado.
- Seja DIRETO e OBJETIVO. Cite os trechos relevantes do edital quando possível.
- Nunca diga que não tem informações se os documentos foram fornecidos — leia e responda.
- Se genuinamente não encontrar a informação, diga qual documento o usuário deve consultar e em qual seção.
- Formato Markdown, use listas quando listar itens.`,
      add_context_from_internet: false,
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Tira-dúvidas com IA</h1>
            <p className="text-xs text-gray-500">Selecione um edital para respostas precisas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedEdital} onValueChange={setSelectedEdital}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Visão geral</SelectItem>
              {editais.map(e => <SelectItem key={e.id} value={e.id}>{e.titulo?.substring(0, 40)}{e.titulo?.length > 40 ? "..." : ""}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setTutoriaOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <GraduationCap className="w-4 h-4 mr-2" /> Pedir Tutoria
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
            {msg.role !== "user" && (
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"}`}>
              {msg.role === "user" ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <div className="text-sm prose prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3"><div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center"><Bot className="w-4 h-4 text-indigo-600 animate-pulse" /></div><div className="bg-gray-100 rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div></div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t flex gap-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Digite sua dúvida sobre o edital... (Enter para enviar)" className="flex-1" />
        <Button onClick={handleSend} disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700"><Send className="w-4 h-4" /></Button>
      </div>

      {/* Tutoria Dialog */}
      <Dialog open={tutoriaOpen} onOpenChange={setTutoriaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-600" /> Solicitar Tutoria Especializada</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Um consultor especializado entrará em contato para orientação personalizada.</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            await base44.entities.SolicitacaoTutoria.create({ ...tutoriaForm });
            setTutoriaOpen(false);
            setTutoriaForm({ titulo: "", descricao: "", area: "", prioridade: "media" });
          }} className="space-y-3">
            <div><Label>Título da solicitação *</Label><Input value={tutoriaForm.titulo} onChange={(e) => setTutoriaForm({ ...tutoriaForm, titulo: e.target.value })} required placeholder="Ex: Dúvida sobre orçamento do edital" /></div>
            <div><Label>Descreva sua necessidade *</Label><Textarea value={tutoriaForm.descricao} onChange={(e) => setTutoriaForm({ ...tutoriaForm, descricao: e.target.value })} required placeholder="Descreva a dúvida ou o apoio que precisa..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Área</Label><Input value={tutoriaForm.area} onChange={(e) => setTutoriaForm({ ...tutoriaForm, area: e.target.value })} placeholder="Ex: Inovação..." /></div>
              <div><Label>Prioridade</Label><Select value={tutoriaForm.prioridade} onValueChange={(v) => setTutoriaForm({ ...tutoriaForm, prioridade: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="alta">Alta</SelectItem></SelectContent></Select></div>
            </div>
            {consultores.length > 0 && (
              <div><Label>Consultor preferencial</Label><Select value={tutoriaForm.consultor_email || ""} onValueChange={(v) => { const c = consultores.find(x => x.email === v); setTutoriaForm({ ...tutoriaForm, consultor_email: v, consultor_nome: c?.full_name || "" }); }}><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger><SelectContent>{consultores.map(c => <SelectItem key={c.email} value={c.email}>{c.full_name}</SelectItem>)}</SelectContent></Select></div>
            )}
            {consultores.length === 0 && <p className="text-xs text-gray-400">Nenhum consultor cadastrado. A solicitação será direcionada ao administrador.</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setTutoriaOpen(false)}>Cancelar</Button><Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Enviar Solicitação</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}