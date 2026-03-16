import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Upload, Loader2, FileText, Sparkles, Brain, ChevronDown, ChevronUp, GripVertical, MessageSquarePlus, Link2, X } from "lucide-react";
import ConversaAdminIA from "./ConversaAdminIA";

const TIPO_LABELS = {
  edital_completo: { label: "Edital Completo", color: "bg-blue-100 text-blue-800", desc: "IA lê para tirar dúvidas" },
  manual_recurso: { label: "Manual de Uso de Recursos", color: "bg-teal-100 text-teal-800", desc: "IA consulta para dúvidas de compras/pagamentos" },
  anexo_proposta: { label: "Anexo da Proposta", color: "bg-purple-100 text-purple-800", desc: "Template editável" },
  perguntas_site: { label: "Perguntas do Site", color: "bg-orange-100 text-orange-800", desc: "Formulário guiado" },
  outro: { label: "Outro", color: "bg-gray-100 text-gray-700", desc: "" },
};

export default function EditalDocumentosAdmin({ edital, onUpdate }) {
  const [etapas, setEtapas] = useState(edital.etapas || []);
  const [treinamento, setTreinamento] = useState(edital.ia_treinamento || []);
  const [uploading, setUploading] = useState(null);
  const [novaPerguntaIA, setNovaPerguntaIA] = useState({ pergunta: "", resposta: "", categoria: "" });
  const [extraindo, setExtraindo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedEtapas, setExpandedEtapas] = useState({});
  const [linkInputs, setLinkInputs] = useState({}); // { "etapaId-tipo": url }

  const save = async (novasEtapas, novoTreinamento) => {
    setSaving(true);
    await onUpdate({ etapas: novasEtapas ?? etapas, ia_treinamento: novoTreinamento ?? treinamento });
    setSaving(false);
  };

  const addEtapa = () => {
    const novas = [...etapas, { id: Date.now().toString(), nome: `Etapa ${etapas.length + 1}`, descricao: "", ordem: etapas.length + 1, data_encerramento: "", documentos: [], perguntas_formulario: [] }];
    setEtapas(novas);
    save(novas, null);
  };

  const removeEtapa = (id) => {
    const novas = etapas.filter(e => e.id !== id);
    setEtapas(novas);
    save(novas, null);
  };

  const updateEtapa = (id, field, value) => {
    const novas = etapas.map(e => e.id === id ? { ...e, [field]: value } : e);
    setEtapas(novas);
  };

  const saveEtapa = (id) => {
    save(etapas, null);
  };

  const handleUploadDoc = async (etapaId, tipo, file) => {
    setUploading(`${etapaId}-${tipo}`);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const novas = etapas.map(e => {
      if (e.id !== etapaId) return e;
      const docs = [...(e.documentos || [])];
      const existing = docs.findIndex(d => d.tipo === tipo);
      const novo = { id: Date.now().toString(), nome: file.name, tipo, url: file_url, instrucoes: "" };
      if (existing >= 0) docs[existing] = novo; else docs.push(novo);
      return { ...e, documentos: docs };
    });
    setEtapas(novas);
    setUploading(null);
    await save(novas, null);
  };

  const removeDoc = (etapaId, docId) => {
    const novas = etapas.map(e => e.id !== etapaId ? e : { ...e, documentos: e.documentos.filter(d => d.id !== docId) });
    setEtapas(novas);
    save(novas, null);
  };

  const handleLinkDoc = async (etapaId, tipo) => {
    const url = linkInputs[`${etapaId}-${tipo}`];
    if (!url) return;
    const novas = etapas.map(e => {
      if (e.id !== etapaId) return e;
      const docs = [...(e.documentos || [])];
      const existing = docs.findIndex(d => d.tipo === tipo);
      const nome = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] + " (link)";
      const novo = { id: Date.now().toString(), nome, tipo, url, instrucoes: "" };
      if (existing >= 0) docs[existing] = novo; else docs.push(novo);
      return { ...e, documentos: docs };
    });
    setEtapas(novas);
    setLinkInputs(prev => ({ ...prev, [`${etapaId}-${tipo}`]: "" }));
    await save(novas, null);
  };

  // extrairTipo: "perguntas_site" → campos do site de submissão | "anexo_proposta" → seções descritivas do anexo
  const extrairPerguntas = async (etapaId, extrairTipo) => {
    const etapa = etapas.find(e => e.id === etapaId);
    const doc = etapa?.documentos?.find(d => d.tipo === extrairTipo);
    if (!doc) return;

    const chave = `${etapaId}-${extrairTipo}`;
    setExtraindo(chave);

    const promptPorTipo = extrairTipo === "anexo_proposta"
      ? `Analise o Anexo da Proposta "${doc.nome}" do edital "${edital.titulo}" (etapa: ${etapa.nome}). Este é o documento que o empreendedor preenche e envia. Extraia todas as seções e campos descritivos que precisam ser preenchidos (título do projeto, descrição, objetivos, justificativa, metodologia, orçamento, equipe, cronograma, etc.). Organize por seções. Retorne JSON com "perguntas": array de { id (número como string), secao, pergunta, tipo_resposta (texto_longo/texto_curto/numero/data) }.`
      : `Analise o documento de Perguntas do Site "${doc.nome}" do edital "${edital.titulo}" (etapa: ${etapa.nome}). Este é o formulário do site de submissão (ex: Sigfapes, plataforma do órgão) com perguntas cadastrais e de projeto. Extraia todas as perguntas/campos que o empreendedor precisa preencher no site. Organize por seções. Retorne JSON com "perguntas": array de { id (número como string), secao, pergunta, tipo_resposta (texto_longo/texto_curto/numero/data) }.`;

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: promptPorTipo,
      file_urls: [doc.url],
      response_json_schema: {
        type: "object",
        properties: {
          perguntas: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, secao: { type: "string" }, pergunta: { type: "string" }, tipo_resposta: { type: "string" } }
            }
          }
        }
      }
    });

    if (r.perguntas?.length) {
      // Cada tipo armazena em chave separada: perguntas_formulario (anexo) e perguntas_site_formulario (site)
      const campoDestino = extrairTipo === "anexo_proposta" ? "perguntas_formulario" : "perguntas_site_formulario";
      const novas = etapas.map(e => e.id === etapaId ? { ...e, [campoDestino]: r.perguntas } : e);
      setEtapas(novas);
      await save(novas, null);
    }
    setExtraindo(null);
  };

  const addTreinamento = () => {
    if (!novaPerguntaIA.pergunta || !novaPerguntaIA.resposta) return;
    const novo = [...treinamento, { id: Date.now().toString(), ...novaPerguntaIA }];
    setTreinamento(novo);
    setNovaPerguntaIA({ pergunta: "", resposta: "", categoria: "" });
    save(null, novo);
  };

  const removeTreinamento = (id) => {
    const novo = treinamento.filter(t => t.id !== id);
    setTreinamento(novo);
    save(null, novo);
  };

  const toggleEtapa = (id) => setExpandedEtapas(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      <Tabs defaultValue="etapas">
        <TabsList>
          <TabsTrigger value="etapas">📂 Etapas & Documentos</TabsTrigger>
          <TabsTrigger value="ia"><Brain className="w-4 h-4 mr-1" />Treinar IA</TabsTrigger>
        </TabsList>

        {/* ── ETAPAS ── */}
        <TabsContent value="etapas" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Configure as etapas do edital e os documentos de cada uma. A IA usará esses documentos para orientar empreendedores.</p>
            <Button size="sm" onClick={addEtapa} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-1" /> Nova Etapa
            </Button>
          </div>

          {etapas.length === 0 && (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
              <p className="text-sm">Nenhuma etapa cadastrada. Clique em "Nova Etapa" para começar.</p>
            </div>
          )}

          {etapas.map((etapa) => (
            <Card key={etapa.id} className="border border-gray-200">
              <CardContent className="p-4">
                {/* Header da etapa */}
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="w-4 h-4 text-gray-300" />
                  <Input
                    value={etapa.nome}
                    onChange={e => updateEtapa(etapa.id, "nome", e.target.value)}
                    onBlur={() => saveEtapa(etapa.id)}
                    className="font-semibold text-sm flex-1"
                  />
                  <Input
                    type="date"
                    value={etapa.data_encerramento || ""}
                    onChange={e => updateEtapa(etapa.id, "data_encerramento", e.target.value)}
                    onBlur={() => saveEtapa(etapa.id)}
                    className="w-40 text-xs"
                    placeholder="Encerramento"
                  />
                  <button onClick={() => toggleEtapa(etapa.id)} className="text-gray-400 hover:text-gray-600 p-1">
                    {expandedEtapas[etapa.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <Button size="icon" variant="ghost" className="text-red-400 h-7 w-7" onClick={() => removeEtapa(etapa.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {expandedEtapas[etapa.id] && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label className="text-xs">Descrição da etapa</Label>
                      <Input value={etapa.descricao || ""} onChange={e => updateEtapa(etapa.id, "descricao", e.target.value)} onBlur={() => saveEtapa(etapa.id)} placeholder="Descreva o que é esta etapa..." className="text-sm" />
                    </div>

                    {/* Documentos por tipo */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Documentos da Etapa</p>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(TIPO_LABELS).map(([tipo, info]) => {
                          const doc = etapa.documentos?.find(d => d.tipo === tipo);
                          const isUploading = uploading === `${etapa.id}-${tipo}`;
                          return (
                            <div key={tipo} className={`p-3 rounded-lg border ${doc ? "bg-gray-50 border-gray-200" : "border-dashed border-gray-200"}`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Badge className={`${info.color} text-xs flex-shrink-0`}>{info.label}</Badge>
                                  {info.desc && <span className="text-xs text-gray-400">{info.desc}</span>}
                                  {doc && (
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline truncate flex items-center gap-1">
                                      <FileText className="w-3 h-3" />{doc.nome}
                                    </a>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1 flex-shrink-0">
                                  {tipo === "manual_recurso" && !doc && (
                                    <div className="flex gap-1 items-center">
                                      <input
                                        type="url"
                                        placeholder="Colar URL do site..."
                                        value={linkInputs[`${etapa.id}-${tipo}`] || ""}
                                        onChange={e => setLinkInputs(prev => ({ ...prev, [`${etapa.id}-${tipo}`]: e.target.value }))}
                                        className="text-xs border border-gray-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-teal-400"
                                      />
                                      <Button size="sm" variant="outline" className="h-7 text-xs border-teal-300 text-teal-700 hover:bg-teal-50" onClick={() => handleLinkDoc(etapa.id, tipo)} disabled={!linkInputs[`${etapa.id}-${tipo}`]}>
                                        <Link2 className="w-3 h-3 mr-1" /> Linkar
                                      </Button>
                                    </div>
                                  )}
                                  <div className="flex gap-1">
                                    {doc && (tipo === "perguntas_site" || tipo === "anexo_proposta") && (
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => extrairPerguntas(etapa.id, tipo)} disabled={extraindo === `${etapa.id}-${tipo}`}>
                                        {extraindo === `${etapa.id}-${tipo}` ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                        {tipo === "anexo_proposta" ? "Extrair Seções" : "Extrair Perguntas"}
                                      </Button>
                                    )}
                                    {doc && <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => removeDoc(etapa.id, doc.id)}><Trash2 className="w-3 h-3" /></Button>}
                                    <Label htmlFor={`up-${etapa.id}-${tipo}`} className="cursor-pointer">
                                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${doc ? "border-gray-300 text-gray-600" : "border-indigo-300 text-indigo-600 bg-indigo-50"} hover:bg-indigo-50 transition-all`}>
                                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                        {doc ? "Substituir" : "Upload"}
                                      </div>
                                    </Label>
                                    <input id={`up-${etapa.id}-${tipo}`} type="file" className="hidden" onChange={e => e.target.files[0] && handleUploadDoc(etapa.id, tipo, e.target.files[0])} accept=".pdf,.doc,.docx,.xlsx,.xls" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seções extraídas do Anexo da Proposta */}
                    {etapa.perguntas_formulario?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                          Seções do Anexo da Proposta ({etapa.perguntas_formulario.length})
                          <Badge className="ml-2 bg-purple-100 text-purple-700 text-xs">Formulário descritivo</Badge>
                        </p>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {etapa.perguntas_formulario.map((p, i) => (
                            <div key={p.id} className="flex items-start gap-2 p-2 bg-purple-50 rounded text-xs">
                              <span className="text-gray-400 w-4 flex-shrink-0">{i + 1}.</span>
                              <div className="flex-1">
                                <span className="text-purple-600 font-medium">{p.secao}</span>
                                <span className="text-gray-500 mx-1">›</span>
                                <span className="text-gray-800">{p.pergunta}</span>
                              </div>
                              <Badge className="bg-gray-100 text-gray-500 text-[10px]">{p.tipo_resposta}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Perguntas extraídas do Site de Submissão */}
                    {etapa.perguntas_site_formulario?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                          Perguntas do Site de Submissão ({etapa.perguntas_site_formulario.length})
                          <Badge className="ml-2 bg-orange-100 text-orange-700 text-xs">Formulário do site</Badge>
                        </p>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {etapa.perguntas_site_formulario.map((p, i) => (
                            <div key={p.id} className="flex items-start gap-2 p-2 bg-orange-50 rounded text-xs">
                              <span className="text-gray-400 w-4 flex-shrink-0">{i + 1}.</span>
                              <div className="flex-1">
                                <span className="text-orange-600 font-medium">{p.secao}</span>
                                <span className="text-gray-500 mx-1">›</span>
                                <span className="text-gray-800">{p.pergunta}</span>
                              </div>
                              <Badge className="bg-gray-100 text-gray-500 text-[10px]">{p.tipo_resposta}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── TREINAR IA ── */}
        <TabsContent value="ia" className="mt-4 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <h3 className="font-semibold text-indigo-800 mb-1 flex items-center gap-2"><Brain className="w-4 h-4" /> Base de Conhecimento da IA</h3>
            <p className="text-indigo-700 text-sm">Converse com a IA sobre lacunas do edital — ela aprende em tempo real e salva automaticamente na base. Você também pode adicionar conhecimento manualmente.</p>
          </div>

          <Tabs defaultValue="conversa">
            <TabsList>
              <TabsTrigger value="conversa"><MessageSquarePlus className="w-3.5 h-3.5 mr-1" />Ensinar por Conversa</TabsTrigger>
              <TabsTrigger value="manual"><Plus className="w-3.5 h-3.5 mr-1" />Adicionar Manual</TabsTrigger>
              <TabsTrigger value="base">Base Salva ({treinamento.length})</TabsTrigger>
            </TabsList>

            {/* Conversa com admin */}
            <TabsContent value="conversa" className="mt-3">
              <ConversaAdminIA edital={edital} treinamento={treinamento} onLearn={(novo) => { const updated = [...treinamento, novo]; setTreinamento(updated); save(null, updated); }} />
            </TabsContent>

            {/* Manual */}
            <TabsContent value="manual" className="mt-3">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs">Categoria (opcional)</Label>
                    <Input value={novaPerguntaIA.categoria} onChange={e => setNovaPerguntaIA({ ...novaPerguntaIA, categoria: e.target.value })} placeholder="Ex: Elegibilidade, Orçamento..." className="text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Pergunta / Contexto *</Label>
                    <Input value={novaPerguntaIA.pergunta} onChange={e => setNovaPerguntaIA({ ...novaPerguntaIA, pergunta: e.target.value })} placeholder="Ex: Startups em fase de ideação são elegíveis?" className="text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Resposta / Orientação *</Label>
                    <Textarea value={novaPerguntaIA.resposta} onChange={e => setNovaPerguntaIA({ ...novaPerguntaIA, resposta: e.target.value })} placeholder="Ex: Sim, o edital aceita projetos em fase pré-operacional desde que..." rows={3} className="text-sm" />
                  </div>
                  <Button size="sm" onClick={addTreinamento} disabled={!novaPerguntaIA.pergunta || !novaPerguntaIA.resposta} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Base salva */}
            <TabsContent value="base" className="mt-3">
              {treinamento.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">Nenhum conhecimento salvo ainda.</div>
              ) : (
                <div className="space-y-2">
                  {treinamento.map(t => (
                    <Card key={t.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex gap-2 mb-1 flex-wrap">
                              {t.categoria && <Badge className="bg-indigo-100 text-indigo-700 text-xs">{t.categoria}</Badge>}
                              {t.origem === "conversa_admin" && <Badge className="bg-teal-100 text-teal-700 text-xs">Aprendido em conversa</Badge>}
                            </div>
                            <p className="font-medium text-sm text-gray-900">{t.pergunta}</p>
                            <p className="text-sm text-gray-600 mt-1">{t.resposta}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 flex-shrink-0" onClick={() => removeTreinamento(t.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
        </div>
      )}
    </div>
  );
}