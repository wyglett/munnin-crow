import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, X, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function EditalQAPanel({ editais, selectedCategory, selectedEdital, isLight }) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const textBg = isLight ? "bg-white" : "bg-slate-800";
  const textPrimary = isLight ? "text-slate-900" : "text-white";
  const textSecondary = isLight ? "text-slate-500" : "text-slate-400";
  const borderColor = isLight ? "border-slate-200" : "border-slate-700";
  const inputBg = isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700 border-slate-600";
  const userBubble = "bg-indigo-600 text-white";
  const aiBubble = isLight ? "bg-slate-100 text-slate-900" : "bg-slate-700 text-white";

  // Contexto inicial baseado no que foi selecionado
  useEffect(() => {
    let initialMsg = "";
    if (selectedEdital) {
      const edital = editais.find(e => e.id === selectedEdital);
      if (edital) {
        initialMsg = `Olá! Tenho dúvidas sobre o edital "${edital.titulo}". Pode me explicar de forma simples para quem é este edital e quais são seus objetivos principais?`;
      }
    } else if (selectedCategory) {
      const categoryLabels = {
        inovacao_startups: "Inovação & Startups",
        apoio_pesquisa: "Apoio à Pesquisa",
        empreendedorismo: "Empreendedorismo",
        bolsas_editais: "Bolsas & Editais",
        outros_programas: "Outros Programas",
      };
      initialMsg = `Tenho interesse em ${categoryLabels[selectedCategory]}. Pode me explicar de forma simples os tipos de editais nesta categoria e para quem eles são?`;
    }

    setMessages([
      {
        role: "assistant",
        content: "Olá! 👋 Estou aqui para esclarecer dúvidas sobre os editais de forma simples e objetiva. Pode fazer suas perguntas!"
      }
    ]);
  }, [selectedCategory, selectedEdital]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const edital = selectedEdital ? editais.find(e => e.id === selectedEdital) : null;
      const categoryEditais = selectedCategory ? editais.filter(e => e.categoria === selectedCategory) : [];

      // Coleta arquivos relevantes
      const fileUrls = [];
      if (edital) {
        edital.documentos_modelo?.forEach(d => {
          if (d.url && /\.(pdf|png|jpg|jpeg)(\?|$)/i.test(d.url)) {
            fileUrls.push(d.url);
          }
        });
        edital.etapas?.forEach(etapa => {
          etapa.documentos?.forEach(d => {
            if (d.url && /\.(pdf|png|jpg|jpeg)(\?|$)/i.test(d.url)) {
              fileUrls.push(d.url);
            }
          });
        });
      }

      let contextStr = "";
      if (edital) {
        contextStr = `EDITAL: "${edital.titulo}"
Número: ${edital.numero || "N/I"}
Órgão: ${edital.orgao || ""}
Descrição: ${edital.descricao || ""}
Encerramento: ${edital.data_encerramento || ""}
Valor Total: ${edital.valor_total || ""}
Área: ${edital.area || ""}`;
      } else if (selectedCategory) {
        const categoryLabels = {
          inovacao_startups: "Inovação & Startups",
          apoio_pesquisa: "Apoio à Pesquisa",
          empreendedorismo: "Empreendedorismo",
          bolsas_editais: "Bolsas & Editais",
          outros_programas: "Outros Programas",
        };
        contextStr = `CATEGORIA: ${categoryLabels[selectedCategory]}
EDITAIS NESTA CATEGORIA: ${categoryEditais.map(e => `"${e.titulo}" (${e.orgao})`).join(", ")}`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente amigável e simplificado da plataforma Munnin Crow que ajuda a compreender editais de fomento de forma clara e acessível.

${contextStr}

INSTRUÇÕES CRÍTICAS:
1. SIMPLIFIQUE SEMPRE: Traduz jargão técnico em linguagem comum. Em vez de "elegibilidade de gastos", use "o que você pode gastar o dinheiro".
2. QUEM É? E PARA QUÊ?: Quando perguntado sobre "para quem é", explique em linguagem clara os públicos-alvo (startups, pesquisadores, empreendedores, etc.).
3. PREMISSAS: Explain the main requirements and assumptions simply (não faça listas longas, seja conversacional).
4. SEM JARGÃO: Evite siglas e termos técnicos. Se precisar usar, explique imediatamente.
5. BREVE E DIRETO: Respostas curtas, máximo 2-3 parágrafos por resposta.
6. MARKDOWN SIMPLES: Use apenas negrito para destaque, sem muita formatação.

Histórico:
${messages.slice(-4).map(m => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`).join("\n")}

Pergunta do usuário: ${userMsg}

Responda de forma bem simplificada e conversacional.`,
        file_urls: fileUrls.length > 0 ? fileUrls : undefined,
      });

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, houve um erro ao processar sua dúvida. Tente novamente!"
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 ${isLight ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-700"} text-white p-3 rounded-full shadow-lg flex items-center gap-2`}
      >
        <Bot className="w-5 h-5" />
        <span className="text-sm font-medium">Dúvidas?</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-40 w-96 max-h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${textBg} border ${borderColor}`}>
      {/* Header */}
      <div className={`bg-indigo-600 text-white px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">Tira-dúvidas do Edital</p>
            <p className="text-xs text-indigo-100">Pergunte de forma simples</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 p-1 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                msg.role === "user" ? userBubble : aiBubble
              }`}
            >
              {msg.role === "user" ? (
                <p>{msg.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className={`${aiBubble} p-2 rounded-lg`}>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`px-4 py-3 border-t ${borderColor} flex gap-2`}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Escreva sua dúvida..."
          className={`text-sm ${inputBg}`}
          disabled={loading}
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}