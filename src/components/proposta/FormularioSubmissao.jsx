import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, Lock, Unlock, Sparkles, Loader2, MessageSquare, X, Send, ChevronDown, ChevronUp, Download, FileText } from "lucide-react";

export default function FormularioSubmissao({ proposta, edital, onSave }) {
  const [campos, setCampos] = useState(proposta.campos_formulario || []);
  const [gerando, setGerando] = useState(false);
  const [lockDialog, setLockDialog] = useState(null); // { id }
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCampoId, setChatCampoId] = useState(null);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Debounce auto-save
  useEffect(() => {
    const t = setTimeout(() => { onSave({ campos_formulario: campos }); }, 1000);
    return () => clearTimeout(t);
  }, [campos]);

  // Retorna as perguntas da etapa ativa do edital (se houver) ou de todas as etapas
  const perguntasDoEdital = () => {
    if (!edital?.etapas?.length) return null;
    // Pega todas as perguntas de todas as etapas, marcando a etapa como seção prefixo
    const todas = [];
    edital.etapas
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .forEach(etapa => {
        if (etapa.perguntas_formulario?.length) {
          etapa.perguntas_formulario.forEach(p => {
            todas.push({ ...p, secao: `[${etapa.nome}] ${p.secao || "Geral"}` });
          });
        }
      });
    return todas.length > 0 ? todas : null;
  };

  const gerarCampos = async () => {
    setGerando(true);

    // 1. Usar perguntas extraídas dos anexos do edital (prioridade máxima)
    const perguntasAnexo = perguntasDoEdital();
    if (perguntasAnexo) {
      const novos = perguntasAnexo.map(p => ({
        id: p.id || `${Date.now()}-${Math.random()}`,
        secao: p.secao,
        pergunta: p.pergunta,
        tipo_resposta: p.tipo_resposta || "texto_longo",
        resposta: "",
        concluido: false,
      }));
      setCampos(novos);
      setGerando(false);
      return;
    }

    // 2. Fallback: IA tenta extrair perguntas dos documentos do edital (apenas PDFs e imagens suportados)
    const isSupportedFile = (url) => /\.(pdf|png|jpg|jpeg)(\?|$)/i.test(url);
    const fileUrls = [];
    edital.etapas?.forEach(etapa => {
      etapa.documentos?.forEach(d => { if (d.url && isSupportedFile(d.url) && (d.tipo === "perguntas_site" || d.tipo === "anexo_proposta")) fileUrls.push(d.url); });
    });
    edital.documentos_modelo?.forEach(d => { if (d.url && isSupportedFile(d.url)) fileUrls.push(d.url); });

    if (fileUrls.length > 0) {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise os documentos anexados do edital "${edital.titulo}" (${edital.orgao || ""}). Extraia TODAS as perguntas/campos que o empreendedor precisa responder para submissão da proposta. Organize por seções. Retorne JSON com "campos": array de { id (número como string), secao, pergunta, tipo_resposta (texto_longo/texto_curto/numero/data) }.`,
        file_urls: fileUrls,
        response_json_schema: {
          type: "object",
          properties: {
            campos: {
              type: "array",
              items: {
                type: "object",
                properties: { id: { type: "string" }, secao: { type: "string" }, pergunta: { type: "string" }, tipo_resposta: { type: "string" } }
              }
            }
          }
        }
      });
      if (r.campos?.length) {
        setCampos(r.campos.map(c => ({ ...c, resposta: "", concluido: false })));
        setGerando(false);
        return;
      }
    }

    // 3. Fallback final: gerar via descrição do edital
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Com base no edital "${edital.titulo}" (${edital.orgao || ""}), área: ${edital.area || ""}, descrição: ${edital.descricao || ""}, gere uma lista estruturada de seções e perguntas para elaboração de uma proposta. Retorne JSON com campo "campos": array de { id (uuid simples), secao, pergunta, tipo_resposta (texto_longo) }. Máximo 12 perguntas distribuídas em 4-5 seções.`,
      response_json_schema: {
        type: "object",
        properties: {
          campos: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, secao: { type: "string" }, pergunta: { type: "string" }, tipo_resposta: { type: "string" } }
            }
          }
        }
      }
    });
    if (r.campos) setCampos(r.campos.map(c => ({ ...c, resposta: "", concluido: false })));
    setGerando(false);
  };

  const updateCampo = (id, resposta) => {
    setCampos(prev => prev.map(c => c.id === id ? { ...c, resposta } : c));
  };

  const toggleConcluido = (id, current) => {
    if (current) {
      setLockDialog({ id });
    } else {
      setCampos(prev => prev.map(c => c.id === id ? { ...c, concluido: true } : c));
    }
  };

  const confirmarDesbloquear = () => {
    setCampos(prev => prev.map(c => c.id === lockDialog.id ? { ...c, concluido: false } : c));
    setLockDialog(null);
  };

  const abrirChat = (campoId) => {
    setChatCampoId(campoId);
    const campo = campos.find(c => c.id === campoId);
    setChatHistory([{
      role: "assistant",
      content: `Olá! Vou te ajudar a responder: **"${campo?.pergunta}"**\n\nMe conte sobre seu projeto e te ajudo a estruturar uma resposta forte para este edital.`
    }]);
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
      prompt: `Você é um especialista em propostas para editais de fomento à inovação. 
Edital: ${edital.titulo} | Órgão: ${edital.orgao || ""}
Seção da proposta: ${campo?.secao}
Pergunta: ${campo?.pergunta}
Resposta atual do empreendedor: ${campo?.resposta || "(em branco)"}
Histórico da conversa: ${newHistory.map(m => `${m.role}: ${m.content}`).join("\n")}
Resposta do usuário agora: ${userMsg}

Oriente o empreendedor a construir uma resposta forte. Se tiver uma sugestão concreta de texto pronto, termine com "[SUGESTÃO DE TEXTO]:" e o texto sugerido.`
    });

    const assistantMsg = { role: "assistant", content: r };
    setChatHistory([...newHistory, assistantMsg]);

    // Extrair sugestão automática
    if (r.includes("[SUGESTÃO DE TEXTO]:")) {
      const sugestao = r.split("[SUGESTÃO DE TEXTO]:")[1].trim();
      if (sugestao) {
        setCampos(prev => prev.map(c => c.id === chatCampoId ? { ...c, resposta: sugestao } : c));
      }
    }
    setChatLoading(false);
  };

  // Baixar respostas como TXT
  const downloadRespostas = () => {
    const linhas = [];
    const secoes_ = [...new Set(campos.map(c => c.secao))];
    linhas.push(`PROPOSTA: ${edital?.titulo || ""}`);
    linhas.push(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`);
    linhas.push("=".repeat(60));
    secoes_.forEach(sec => {
      linhas.push(`\n${sec.toUpperCase()}`);
      linhas.push("-".repeat(40));
      campos.filter(c => c.secao === sec).forEach(c => {
        linhas.push(`\nPergunta: ${c.pergunta}`);
        linhas.push(`Resposta: ${c.resposta || "(sem resposta)"}`);
      });
    });
    const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `proposta_${(edital?.titulo || "").replace(/[^a-z0-9]/gi, "_").substring(0, 30)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Agrupar por seção
  const secoes = [...new Set(campos.map(c => c.secao))];
  const concluidos = campos.filter(c => c.concluido).length;
  const chatCampo = campos.find(c => c.id === chatCampoId);
  const temPerguntasAnexo = !!perguntasDoEdital();

  if (campos.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-700 mb-2">Formulário de Submissão</h3>
        {temPerguntasAnexo ? (
          <p className="text-gray-500 text-sm mb-2 max-w-sm mx-auto">
            As perguntas foram extraídas dos anexos oficiais do edital cadastrados pelo administrador.
          </p>
        ) : (
          <p className="text-gray-500 text-sm mb-2 max-w-sm mx-auto">
            A IA vai gerar um formulário estruturado baseado nos requisitos do edital para guiar sua proposta.
          </p>
        )}
        {temPerguntasAnexo && (
          <div className="inline-flex items-center gap-2 mb-4 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-1.5 rounded-full">
            <FileText className="w-3.5 h-3.5" /> Perguntas baseadas no anexo oficial do edital
          </div>
        )}
        <div>
          <Button onClick={gerarCampos} disabled={gerando} className="bg-indigo-600 hover:bg-indigo-700">
            {gerando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Carregando formulário...</> : <><Sparkles className="w-4 h-4 mr-2" />{temPerguntasAnexo ? "Carregar Formulário do Edital" : "Gerar Formulário com IA"}</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Form */}
      <div className={`flex-1 space-y-6 ${chatOpen ? "max-w-[60%]" : ""}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm text-gray-500">{concluidos}/{campos.length} campos concluídos</div>
            <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${campos.length ? (concluidos / campos.length) * 100 : 0}%` }} />
            </div>
            <Button size="sm" variant="outline" onClick={downloadRespostas} className="h-7 text-xs ml-auto">
              <Download className="w-3 h-3 mr-1" /> Baixar Respostas
            </Button>
          </div>
        </div>

        {secoes.map(secao => (
          <div key={secao}>
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3 pb-2 border-b">{secao}</h3>
            <div className="space-y-4">
              {campos.filter(c => c.secao === secao).map(campo => (
                <div key={campo.id} className={`rounded-xl border p-4 transition-all ${campo.concluido ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-800">{campo.pergunta}</label>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-500" onClick={() => abrirChat(campo.id)} title="Pedir ajuda à IA">
                        <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className={`h-7 w-7 ${campo.concluido ? "text-green-600" : "text-gray-400"}`} onClick={() => toggleConcluido(campo.id, campo.concluido)}>
                        {campo.concluido ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={campo.resposta}
                    onChange={(e) => updateCampo(campo.id, e.target.value)}
                    disabled={campo.concluido}
                    placeholder="Sua resposta..."
                    rows={3}
                    className={campo.concluido ? "bg-green-50 text-gray-600 resize-none" : "resize-none"}
                  />
                  {campo.concluido && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" /> Campo concluído
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI Chat Panel */}
      {chatOpen && (
        <div className="w-80 flex-shrink-0 bg-slate-900 rounded-xl flex flex-col h-[600px]">
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div>
              <p className="text-white text-xs font-semibold flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-400" /> Assistente IA</p>
              {chatCampo && <p className="text-white/50 text-[10px] truncate max-w-[180px]">{chatCampo.secao}</p>}
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatHistory.map((m, i) => (
              <div key={i} className={`text-xs p-2.5 rounded-lg ${m.role === "user" ? "bg-indigo-600 text-white ml-4" : "bg-white/10 text-white/90 mr-4"}`}>
                {m.content.replace(/\[SUGESTÃO DE TEXTO\]:[\s\S]*/g, "").trim()}
                {m.content.includes("[SUGESTÃO DE TEXTO]:") && (
                  <div className="mt-2 p-2 bg-green-500/20 rounded border border-green-500/30 text-green-300 text-[10px]">
                    ✓ Sugestão aplicada ao campo
                  </div>
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
              className="flex-1 bg-white/10 text-white placeholder-white/30 text-xs rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-indigo-500"
            />
            <Button size="icon" onClick={enviarChat} disabled={chatLoading} className="bg-indigo-600 hover:bg-indigo-700 h-8 w-8">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Lock confirm dialog */}
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