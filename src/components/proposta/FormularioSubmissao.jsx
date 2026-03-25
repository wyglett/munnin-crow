import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, Lock, Unlock, Loader2, MessageSquare, Download, FileText, FilePlus, Sparkles } from "lucide-react";
import { marcarAtividade } from "@/components/gamification/gamificacao";
import AIChatField from "@/components/ai/AIChatField";
import GerarPropostaCompleta from "@/components/ai/GerarPropostaCompleta";

// Remove aspas do texto gerado por IA
const limparAspas = (texto) => texto?.replace(/["""''`]/g, "") || "";

// Limita resposta a um máximo de caracteres (baseado no tipo do campo)
const maxChars = (tipo) => tipo === "texto_curto" ? 300 : tipo === "numero" ? 20 : 2000;

export default function FormularioSubmissao({ proposta, edital, onSave }) {
  const [campos, setCampos] = useState(proposta.campos_formulario || []);
  const [gerando, setGerando] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [lockDialog, setLockDialog] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { onSave({ campos_formulario: campos }); }, 1000);
    return () => clearTimeout(t);
  }, [campos]);

  const perguntasDoEdital = () => {
    if (!edital?.etapas?.length) return null;
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
    const perguntasAnexo = perguntasDoEdital();
    if (perguntasAnexo) {
      setCampos(perguntasAnexo.map(p => ({
        id: p.id || `${Date.now()}-${Math.random()}`,
        secao: p.secao,
        pergunta: p.pergunta,
        tipo_resposta: p.tipo_resposta || "texto_longo",
        resposta: "",
        concluido: false,
      })));
      setGerando(false);
      return;
    }

    const isSupportedFile = (url) => /\.(pdf|png|jpg|jpeg)(\?|$)/i.test(url);
    const fileUrls = [];
    edital.etapas?.forEach(etapa => {
      etapa.documentos?.forEach(d => { if (d.url && isSupportedFile(d.url) && (d.tipo === "perguntas_site" || d.tipo === "anexo_proposta")) fileUrls.push(d.url); });
    });
    edital.documentos_modelo?.forEach(d => { if (d.url && isSupportedFile(d.url)) fileUrls.push(d.url); });

    if (fileUrls.length > 0) {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise os documentos do edital "${edital.titulo}". Extraia todos os campos que o empreendedor precisa preencher para submissão. Retorne JSON com "campos": array de { id, secao, pergunta, tipo_resposta (texto_longo/texto_curto/numero/data) }.`,
        file_urls: fileUrls,
        response_json_schema: { type: "object", properties: { campos: { type: "array", items: { type: "object", properties: { id: { type: "string" }, secao: { type: "string" }, pergunta: { type: "string" }, tipo_resposta: { type: "string" } } } } } }
      });
      if (r.campos?.length) {
        setCampos(r.campos.map(c => ({ ...c, resposta: "", concluido: false })));
        setGerando(false);
        return;
      }
    }

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Edital: "${edital.titulo}" (${edital.orgao || ""}), área: ${edital.area || ""}, descrição: ${edital.descricao || ""}. Gere formulário estruturado para elaboração de proposta. Retorne JSON "campos": array de { id, secao, pergunta, tipo_resposta (texto_longo) }. Máximo 12 perguntas em 4-5 seções.`,
      response_json_schema: { type: "object", properties: { campos: { type: "array", items: { type: "object", properties: { id: { type: "string" }, secao: { type: "string" }, pergunta: { type: "string" }, tipo_resposta: { type: "string" } } } } } }
    });
    if (r.campos) setCampos(r.campos.map(c => ({ ...c, resposta: "", concluido: false })));
    setGerando(false);
  };

  const updateCampo = (id, resposta) => {
    const campo = campos.find(c => c.id === id);
    const max = maxChars(campo?.tipo_resposta);
    setCampos(prev => prev.map(c => c.id === id ? { ...c, resposta: resposta.slice(0, max) } : c));
  };

  const toggleConcluido = (id, current) => {
    if (current) setLockDialog({ id });
    else setCampos(prev => prev.map(c => c.id === id ? { ...c, concluido: true } : c));
  };

  const confirmarDesbloquear = () => {
    setCampos(prev => prev.map(c => c.id === lockDialog.id ? { ...c, concluido: false } : c));
    setLockDialog(null);
  };

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
    a.href = url;
    a.download = `proposta_${(edital?.titulo || "").replace(/[^a-z0-9]/gi, "_").substring(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preencher anexo com IA e salvar na proposta como documento
  const preencherAnexoEGerarPDF = async () => {
    setGerandoPDF(true);

    // Montar texto das respostas para a IA preencher o anexo
    const respostasTexto = campos.map(c => `${c.secao} > ${c.pergunta}:\n${c.resposta || "(sem resposta)"}`).join("\n\n");

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um redator especialista em propostas para editais de fomento.
Edital: ${edital.titulo} | Órgão: ${edital.orgao || ""}
Proposta: ${proposta.titulo}

Com base nas respostas abaixo, redija o documento de proposta completo no formato de texto estruturado, pronto para ser revisado e enviado. Não use aspas, mantenha linguagem técnica e formal. Organize as seções conforme os dados fornecidos.

RESPOSTAS DO EMPREENDEDOR:
${respostasTexto}

Retorne o documento completo em texto puro, bem estruturado com títulos de seção em MAIÚSCULAS.`
    });

    const conteudoDocumento = limparAspas(r);

    // Salvar como documento de texto na proposta
    const novoDoc = {
      nome: `Proposta Preenchida - ${edital.titulo} - ${new Date().toLocaleDateString("pt-BR")}.txt`,
      tipo: "proposta_preenchida",
      url: `data:text/plain;charset=utf-8,${encodeURIComponent(conteudoDocumento)}`,
    };

    const docsAtuais = proposta.documentos || [];
    await onSave({ documentos: [...docsAtuais, novoDoc] });

    // Também oferecer download imediato
    const blob = new Blob([conteudoDocumento], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = novoDoc.nome;
    a.click();
    URL.revokeObjectURL(url);

    setGerandoPDF(false);
  };

  const secoes = [...new Set(campos.map(c => c.secao))];
  const concluidos = campos.filter(c => c.concluido).length;
  const todosCompletos = campos.length > 0 && concluidos === campos.length;
  const temPerguntasAnexo = !!perguntasDoEdital();
  const contextoIA = `Edital: ${edital?.titulo || ""} | Órgão: ${edital?.orgao || ""} | Área: ${edital?.area || ""}`;

  if (campos.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-700 mb-2">Formulário de Submissão</h3>
        {temPerguntasAnexo ? (
          <p className="text-gray-500 text-sm mb-3 max-w-sm mx-auto">
            Perguntas extraídas do anexo oficial do edital.
          </p>
        ) : (
          <p className="text-gray-500 text-sm mb-3 max-w-sm mx-auto">
            A IA vai gerar um formulário baseado nos requisitos do edital.
          </p>
        )}
        {temPerguntasAnexo && (
          <div className="inline-flex items-center gap-2 mb-4 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-1.5 rounded-full">
            <FileText className="w-3.5 h-3.5" /> Baseado no anexo oficial
          </div>
        )}
        <div>
          <Button onClick={gerarCampos} disabled={gerando} className="bg-indigo-600 hover:bg-indigo-700">
            {gerando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Carregando...</> : <><Sparkles className="w-4 h-4 mr-2" />{temPerguntasAnexo ? "Carregar Formulário do Edital" : "Gerar Formulário com IA"}</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Form */}
      <div className="min-w-0 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm text-gray-500">{concluidos}/{campos.length} campos concluídos</div>
          <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${campos.length ? (concluidos / campos.length) * 100 : 0}%` }} />
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            <GerarPropostaCompleta
              edital={edital}
              propostaId={proposta?.id}
              campos={campos}
              onApply={(novosCampos) => setCampos(novosCampos)}
            />
            <Button size="sm" variant="outline" onClick={downloadRespostas} className="h-7 text-xs">
              <Download className="w-3 h-3 mr-1" /> Baixar Respostas
            </Button>
            {todosCompletos && (
              <Button size="sm" onClick={preencherAnexoEGerarPDF} disabled={gerandoPDF} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                {gerandoPDF ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Gerando...</> : <><FilePlus className="w-3 h-3 mr-1" />Preencher Anexo e Gerar PDF</>}
              </Button>
            )}
          </div>
        </div>

        {/* Sections */}
        {secoes.map(secao => (
          <div key={secao}>
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3 pb-2 border-b">{secao}</h3>
            <div className="space-y-3">
              {campos.filter(c => c.secao === secao).map(campo => {
                const isActive = expandedId === campo.id || hoveredId === campo.id;
                const max = maxChars(campo.tipo_resposta);
                const chars = campo.resposta?.length || 0;
                return (
                  <div
                    key={campo.id}
                    onMouseEnter={() => !campo.concluido && setHoveredId(campo.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => !campo.concluido && setExpandedId(expandedId === campo.id ? null : campo.id)}
                    className={`rounded-xl border transition-all duration-200 cursor-pointer ${campo.concluido ? "bg-green-50 border-green-200" : isActive ? "bg-white border-indigo-300 shadow-md" : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
                      <label className={`text-sm font-medium transition-colors ${campo.concluido ? "text-green-700" : isActive ? "text-indigo-800" : "text-gray-700"}`}>
                        {campo.pergunta}
                      </label>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className={`h-7 w-7 ${campo.concluido ? "text-green-600" : "text-gray-400"}`} onClick={() => toggleConcluido(campo.id, campo.concluido)}>
                          {campo.concluido ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {/* Preview comprimido */}
                    {!isActive && !campo.concluido && campo.resposta && (
                      <p className="px-4 pb-3 text-xs text-gray-500 line-clamp-1 truncate">{campo.resposta}</p>
                    )}

                    {/* Textarea expandido */}
                    {(isActive || campo.concluido) && (
                      <div className="px-4 pb-3" onClick={e => e.stopPropagation()}>
                        <Textarea
                          value={campo.resposta}
                          onChange={(e) => updateCampo(campo.id, e.target.value)}
                          disabled={campo.concluido}
                          placeholder="Sua resposta..."
                          rows={campo.tipo_resposta === "texto_longo" ? 5 : 2}
                          autoFocus={isActive && expandedId === campo.id}
                          className={`resize-none transition-all ${campo.concluido ? "bg-green-50 text-gray-600" : "bg-white"}`}
                        />
                        <div className="flex items-center justify-between mt-1.5">
                          {campo.concluido ? (
                            <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Concluído</span>
                          ) : (
                            <span className="text-[10px] text-gray-400">{chars}/{max} caracteres</span>
                          )}
                          {!campo.concluido && (
                            <AIChatField
                              pergunta={campo.pergunta}
                              contexto={contextoIA}
                              respostaAtual={campo.resposta}
                              onApprove={(txt) => updateCampo(campo.id, txt.slice(0, max))}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Collapsed empty state */}
                    {!isActive && !campo.concluido && !campo.resposta && (
                      <p className="px-4 pb-3 text-xs text-gray-400 italic">Clique para responder...</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Lock dialog */}
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