import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Brain, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

/**
 * ConversaAdminIA
 * Permite que o admin converse com a IA sobre lacunas do edital.
 * Quando a IA identifica que aprendeu algo novo, salva automaticamente na base de conhecimento.
 */
export default function ConversaAdminIA({ edital, treinamento, onLearn }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Olá! Sou a IA de aprendizado do edital **"${edital?.titulo}"**. Me fale sobre regras, interpretações, experiências anteriores ou qualquer gap de informação que você queira que eu aprenda para melhor atender os empreendedores. Vou confirmar o que aprendi e salvar automaticamente na base.` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ultimoAprendizado, setUltimoAprendizado] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const baseConhecimento = treinamento?.length
      ? `BASE JÁ CONHECIDA:\n${treinamento.map(t => `[${t.categoria || "Geral"}] ${t.pergunta} → ${t.resposta}`).join("\n")}`
      : "Base de conhecimento ainda vazia.";

    const historico = messages.slice(-8).map(m => `${m.role === "user" ? "Admin" : "IA"}: ${m.content}`).join("\n");

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é a IA de aprendizado da plataforma Munnin Crow, responsável por absorver conhecimentos sobre editais de fomento que o admin compartilha em conversa.

EDITAL: "${edital?.titulo || ""}" | Órgão: ${edital?.orgao || ""} | Estado: ${edital?.estado || ""}

${baseConhecimento}

HISTÓRICO DA CONVERSA:
${historico}

Admin diz: "${userMsg}"

TAREFA:
1. Responda naturalmente ao admin, confirmando o que entendeu, fazendo perguntas para aprofundar se necessário.
2. Se o admin ensinou algo novo (uma regra, interpretação, experiência, gap), extraia isso como conhecimento salvo.
3. Seja conversacional — não robótico. Confirme que entendeu e mostre como vai usar o aprendizado.

Retorne JSON com:
- resposta: sua resposta conversacional ao admin (Markdown)
- aprendizado: null se não houve nada novo, ou { pergunta: "resumo do que foi ensinado", resposta: "o que foi aprendido", categoria: "categoria temática" }`,
      response_json_schema: {
        type: "object",
        properties: {
          resposta: { type: "string" },
          aprendizado: {
            type: "object",
            properties: {
              pergunta: { type: "string" },
              resposta: { type: "string" },
              categoria: { type: "string" }
            }
          }
        }
      }
    });

    setMessages(prev => [...prev, { role: "assistant", content: r.resposta || "Entendido!" }]);

    if (r.aprendizado?.pergunta && r.aprendizado?.resposta) {
      const novo = {
        id: `conv-${Date.now()}`,
        pergunta: r.aprendizado.pergunta,
        resposta: r.aprendizado.resposta,
        categoria: r.aprendizado.categoria || "Geral",
        origem: "conversa_admin",
        created_at: new Date().toISOString()
      };
      onLearn(novo);
      setUltimoAprendizado(novo);
    }

    setLoading(false);
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="bg-teal-50 border-b border-teal-100 px-4 py-2 flex items-center gap-2">
        <Brain className="w-4 h-4 text-teal-600" />
        <span className="text-sm font-semibold text-teal-800">Modo Ensino — Admin</span>
        <span className="text-xs text-teal-600 ml-auto">Os aprendizados são salvos automaticamente</span>
      </div>

      <div className="h-72 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role !== "user" && (
              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Brain className="w-3.5 h-3.5 text-teal-600" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"}`}>
              {msg.role === "user"
                ? <p>{msg.content}</p>
                : <div className="prose prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              }
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            </div>
            <div className="bg-gray-100 rounded-xl px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {ultimoAprendizado && (
        <div className="mx-3 mb-2 bg-teal-50 border border-teal-200 rounded-lg p-2 flex items-start gap-2 text-xs text-teal-700">
          <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold">Aprendido e salvo: </span>
            <Badge className="bg-teal-100 text-teal-700 text-[10px] mr-1">{ultimoAprendizado.categoria}</Badge>
            {ultimoAprendizado.pergunta}
          </div>
        </div>
      )}

      <div className="px-3 pb-3 flex gap-2 border-t pt-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ensine algo para a IA... (Enter para enviar)"
          className="flex-1 text-sm"
        />
        <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()} className="bg-teal-600 hover:bg-teal-700">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}