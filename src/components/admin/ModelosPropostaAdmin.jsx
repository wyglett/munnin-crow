import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Upload, Loader2, Sparkles, CheckCircle2, FileText, ChevronDown, ChevronRight, Eye, EyeOff, LayoutTemplate } from "lucide-react";
import ModeloTemplateEditorProposta from "./ModeloTemplateEditorProposta";

const TIPO_LABELS = {
  inovacao: "Inovação & Startup",
  pesquisa: "Pesquisa",
  empreendedorismo: "Empreendedorismo",
  bolsa: "Bolsa",
  outro: "Outro"
};
const TIPO_COLORS = {
  inovacao: "bg-indigo-100 text-indigo-700",
  pesquisa: "bg-blue-100 text-blue-700",
  empreendedorismo: "bg-emerald-100 text-emerald-700",
  bolsa: "bg-amber-100 text-amber-700",
  outro: "bg-gray-100 text-gray-600"
};

const TIPOS_RESPOSTA = [
  { value: "texto_longo", label: "Texto Longo" },
  { value: "texto_curto", label: "Texto Curto" },
  { value: "numero", label: "Número" },
  { value: "data", label: "Data" },
  { value: "tabela_itens", label: "Tabela de Itens" },
  { value: "membros_equipe", label: "Membros da Equipe" },
  { value: "objetivos", label: "Objetivos" },
  { value: "cronograma", label: "Cronograma" },
  { value: "tabela_valores", label: "Tabela de Valores" },
  { value: "lista_simples", label: "Lista Simples" },
];

function CampoProposta({ campo, idx, onChange, onDelete }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50" onClick={() => setAberto(v => !v)}>
        <span className="text-xs text-gray-400 w-5 flex-shrink-0">{idx + 1}.</span>
        <div className="flex-1 min-w-0">
          {campo.area && <span className="text-[10px] text-indigo-500 font-bold uppercase mr-1">{campo.area}</span>}
          {campo.subarea && <span className="text-[10px] text-purple-400 mr-1">› {campo.subarea}</span>}
          <span className="text-xs text-gray-800 font-medium">{campo.pergunta || "Campo sem nome"}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge className="text-[10px] bg-gray-100 text-gray-500">{campo.tipo_resposta || "texto_longo"}</Badge>
          {campo.obrigatorio === false && <Badge className="text-[10px] bg-yellow-50 text-yellow-600">opcional</Badge>}
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600 ml-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {aberto ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
      </div>
      {aberto && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Área Principal</label>
              <Input value={campo.area || ""} onChange={e => onChange({ ...campo, area: e.target.value })} className="mt-0.5 h-7 text-xs" placeholder="Ex: Identificação do Projeto" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Subárea (opcional)</label>
              <Input value={campo.subarea || ""} onChange={e => onChange({ ...campo, subarea: e.target.value })} className="mt-0.5 h-7 text-xs" placeholder="Ex: Dados do Coordenador" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo de Resposta</label>
              <Select value={campo.tipo_resposta || "texto_longo"} onValueChange={v => onChange({ ...campo, tipo_resposta: v })}>
                <SelectTrigger className="mt-0.5 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_RESPOSTA.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Obrigatório</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={campo.obrigatorio !== false}
                  onChange={e => onChange({ ...campo, obrigatorio: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs text-gray-600">Sim</span>
              </label>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Pergunta / Label</label>
            <Input value={campo.pergunta || ""} onChange={e => onChange({ ...campo, pergunta: e.target.value })} className="mt-0.5 h-7 text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Instrução para IA (opcional)</label>
            <Input value={campo.instrucao_ia || ""} onChange={e => onChange({ ...campo, instrucao_ia: e.target.value })} className="mt-0.5 h-7 text-xs" placeholder="Ex: Descreva de forma técnica e objetiva..." />
          </div>
        </div>
      )}
    </div>
  );
}

// Agrupa campos por área
function CamposAgrupados({ campos, onChange, onDelete }) {
  const areas = [...new Set(campos.map(c => c.area || "Sem Área"))];
  return (
    <div className="space-y-3">
      {areas.map(area => {
        const idxsCampos = campos.map((c, i) => ({ c, i })).filter(({ c }) => (c.area || "Sem Área") === area);
        return (
          <div key={area}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-px flex-1 bg-indigo-100" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase px-2 py-0.5 bg-indigo-50 rounded-full">{area}</span>
              <div className="h-px flex-1 bg-indigo-100" />
            </div>
            <div className="space-y-1.5">
              {idxsCampos.map(({ c, i }) => (
                <CampoProposta key={c.id || i} campo={c} idx={i} onChange={novo => onChange(i, novo)} onDelete={() => onDelete(i)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModeloCard({ modelo, onEdit, onDelete, onToggleStatus, onEditTemplate }) {
  return (
    <div className="bg-white border rounded-xl p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{modelo.nome}</span>
          <Badge className={TIPO_COLORS[modelo.tipo_proposta] || "bg-gray-100 text-gray-600"}>
            {TIPO_LABELS[modelo.tipo_proposta] || modelo.tipo_proposta}
          </Badge>
          <Badge className={modelo.status === "publicado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
            {modelo.status === "publicado" ? "Publicado" : "Rascunho"}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {modelo.orgao}
          {modelo.versao && ` • v${modelo.versao}`}
          {` • ${modelo.campos_mapeados?.length || 0} campos`}
          {` • ${modelo.usos || 0} usos`}
        </p>
        {modelo.descricao && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{modelo.descricao}</p>}
        {/* Resumo de áreas */}
        {modelo.campos_mapeados?.length > 0 && (() => {
          const areas = [...new Set(modelo.campos_mapeados.map(c => c.area).filter(Boolean))];
          return areas.length > 0 ? (
            <div className="flex gap-1 mt-1 flex-wrap">
              {areas.slice(0, 4).map((a, i) => <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{a}</span>)}
              {areas.length > 4 && <span className="text-[10px] text-gray-400">+{areas.length - 4}</span>}
            </div>
          ) : null;
        })()}
        {modelo.tags?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {modelo.tags.map((t, i) => <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">#{t}</span>)}
          </div>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button size="sm" variant="ghost" onClick={() => onToggleStatus(modelo)} title={modelo.status === "publicado" ? "Despublicar" : "Publicar"}>
          {modelo.status === "publicado" ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-green-500" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEditTemplate(modelo)} title="Montar Template">
          <LayoutTemplate className="w-4 h-4 text-indigo-500" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(modelo)}><Pencil className="w-4 h-4" /></Button>
        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => onDelete(modelo.id)}><Trash2 className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

const FORM_INICIAL = {
  nome: "", descricao: "", orgao: "FAPES", tipo_proposta: "inovacao",
  tags: [], versao: "1.0", status: "rascunho",
  campos_mapeados: [], file_url: "", file_tipo: "pdf", file_nome: ""
};

export default function ModelosPropostaAdmin() {
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extraindo, setExtraindo] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [visualizacao, setVisualizacao] = useState("lista"); // "lista" | "areas"
  const [templateModelo, setTemplateModelo] = useState(null);
  const qc = useQueryClient();

  const { data: modelos = [] } = useQuery({
    queryKey: ["modelos_proposta"],
    queryFn: () => base44.entities.ModeloProposta.list("-created_date", 100)
  });

  const salvar = useMutation({
    mutationFn: (d) => editando
      ? base44.entities.ModeloProposta.update(editando.id, d)
      : base44.entities.ModeloProposta.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modelos_proposta"] });
      setDialogOpen(false);
      setEditando(null);
    }
  });

  const excluir = useMutation({
    mutationFn: (id) => base44.entities.ModeloProposta.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modelos_proposta"] })
  });

  const toggleStatus = useMutation({
    mutationFn: (m) => base44.entities.ModeloProposta.update(m.id, { status: m.status === "publicado" ? "rascunho" : "publicado" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modelos_proposta"] })
  });

  const openNew = () => { setEditando(null); setForm(FORM_INICIAL); setTagInput(""); setVisualizacao("lista"); setDialogOpen(true); };
  const openEdit = (m) => {
    setEditando(m);
    setForm({ ...FORM_INICIAL, ...m, tags: m.tags || [], campos_mapeados: m.campos_mapeados || [] });
    setTagInput("");
    setVisualizacao("lista");
    setDialogOpen(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url, file_tipo: isDocx ? "docx" : "pdf", file_nome: file.name }));
    setUploading(false);
  };

  const extrairCampos = async () => {
    if (!form.file_url) return;
    setExtraindo(true);
    let textoExtraido = null;
    if (form.file_tipo === "docx") {
      try {
        const resp = await base44.functions.invoke("extrairDocx", { file_url: form.file_url });
        textoExtraido = resp.data?.text || null;
      } catch { textoExtraido = null; }
    }
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise este modelo de proposta de projeto (${form.file_tipo?.toUpperCase()}). Identifique TODOS os campos/seções que precisam ser preenchidos pelo proponente. Para cada campo retorne: area (área/seção principal como "Identificação do Projeto", "Equipe", "Orçamento", etc.), subarea (subseção opcional), pergunta (o que deve ser preenchido), tipo_resposta ("texto_longo", "texto_curto", "numero", "data", "tabela_itens", "membros_equipe", "objetivos", "cronograma", "tabela_valores", "lista_simples"), obrigatorio (true/false). Ordene pela ordem do documento, agrupando por área.${textoExtraido ? `\n\nTexto do documento:\n${textoExtraido.slice(0, 8000)}` : ""}`,
      ...(form.file_tipo === "docx" ? {} : { file_urls: [form.file_url] }),
      response_json_schema: {
        type: "object",
        properties: {
          campos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                area: { type: "string" },
                subarea: { type: "string" },
                pergunta: { type: "string" },
                tipo_resposta: { type: "string" },
                obrigatorio: { type: "boolean" }
              }
            }
          }
        }
      }
    });
    if (r.campos) {
      setForm(f => ({
        ...f,
        campos_mapeados: r.campos.map((c, i) => ({
          id: `campo-${Date.now()}-${i}`,
          area: c.area || "",
          subarea: c.subarea || "",
          pergunta: c.pergunta || `Campo ${i + 1}`,
          tipo_resposta: c.tipo_resposta || "texto_longo",
          obrigatorio: c.obrigatorio !== false,
          instrucao_ia: ""
        }))
      }));
      setVisualizacao("areas");
    }
    setExtraindo(false);
  };

  const updateCampo = (i, novo) => setForm(f => ({ ...f, campos_mapeados: f.campos_mapeados.map((c, idx) => idx === i ? novo : c) }));
  const deleteCampo = (i) => setForm(f => ({ ...f, campos_mapeados: f.campos_mapeados.filter((_, idx) => idx !== i) }));
  const addCampo = () => setForm(f => ({
    ...f,
    campos_mapeados: [...f.campos_mapeados, {
      id: `campo-${Date.now()}`,
      area: "", subarea: "", pergunta: "", tipo_resposta: "texto_longo", obrigatorio: true, instrucao_ia: ""
    }]
  }));
  const addTag = () => { if (!tagInput.trim()) return; setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] })); setTagInput(""); };
  const removeTag = (i) => setForm(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }));

  const publicados = modelos.filter(m => m.status === "publicado");
  const rascunhos = modelos.filter(m => m.status !== "publicado");

  // Contagem de áreas nos campos atuais
  const areasAtuais = [...new Set((form.campos_mapeados || []).map(c => c.area).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Modelos de Proposta</h2>
          <p className="text-xs text-gray-500 mt-0.5">{publicados.length} publicados · {rascunhos.length} rascunhos</p>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Modelo
        </Button>
      </div>

      {modelos.length === 0 && (
        <Card><CardContent className="text-center py-10 text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum modelo de proposta cadastrado ainda.</p>
          <p className="text-xs mt-1">Cadastre modelos da FAPES, FAPERJ e outros órgãos para guiar a elaboração de propostas.</p>
        </CardContent></Card>
      )}

      {publicados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Publicados</p>
          {publicados.map(m => <ModeloCard key={m.id} modelo={m} onEdit={openEdit} onDelete={id => excluir.mutate(id)} onToggleStatus={m => toggleStatus.mutate(m)} />)}
        </div>
      )}

      {rascunhos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Rascunhos</p>
          {rascunhos.map(m => <ModeloCard key={m.id} modelo={m} onEdit={openEdit} onDelete={id => excluir.mutate(id)} onToggleStatus={m => toggleStatus.mutate(m)} />)}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Modelo de Proposta" : "Novo Modelo de Proposta"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Metadados */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nome do Modelo *</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: FAPES Gênesis – Proposta de Inovação" className="mt-1" />
              </div>
              <div>
                <Label>Órgão *</Label>
                <Input value={form.orgao} onChange={e => setForm(f => ({ ...f, orgao: e.target.value }))} placeholder="FAPES, FAPERJ..." className="mt-1" />
              </div>
              <div>
                <Label>Tipo de Proposta</Label>
                <Select value={form.tipo_proposta} onValueChange={v => setForm(f => ({ ...f, tipo_proposta: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inovacao">Inovação & Startup</SelectItem>
                    <SelectItem value="pesquisa">Pesquisa</SelectItem>
                    <SelectItem value="empreendedorismo">Empreendedorismo</SelectItem>
                    <SelectItem value="bolsa">Bolsa</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Versão</Label>
                <Input value={form.versao} onChange={e => setForm(f => ({ ...f, versao: e.target.value }))} placeholder="1.0" className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} placeholder="Breve descrição do modelo e quando usar..." className="mt-1" />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags de busca</Label>
              <div className="flex gap-2 mt-1">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="gênesis, startup, pesquisa..." className="flex-1 h-8 text-sm" />
                <Button type="button" size="sm" variant="outline" onClick={addTag}>Adicionar</Button>
              </div>
              {form.tags?.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {form.tags.map((t, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      #{t}
                      <button onClick={() => removeTag(i)} className="text-indigo-400 hover:text-red-500">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Upload */}
            <div>
              <Label>Arquivo Modelo (PDF ou DOCX)</Label>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <label className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Enviando..." : "Upload do arquivo"}
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleUpload} disabled={uploading} />
                </label>
                {form.file_nome && <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded flex items-center gap-1"><FileText className="w-3 h-3" />{form.file_nome}</span>}
                {form.file_url && (
                  <Button type="button" size="sm" variant="outline" onClick={extrairCampos} disabled={extraindo} className="text-indigo-700 border-indigo-300">
                    {extraindo ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Extraindo...</> : <><Sparkles className="w-3 h-3 mr-1" />Extrair campos com IA</>}
                  </Button>
                )}
              </div>
            </div>

            {/* Campos mapeados */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label>Campos Mapeados ({form.campos_mapeados?.length || 0})</Label>
                  {areasAtuais.length > 0 && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{areasAtuais.length} área(s): {areasAtuais.slice(0, 3).join(", ")}{areasAtuais.length > 3 ? "..." : ""}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {form.campos_mapeados?.length > 0 && (
                    <div className="flex rounded border overflow-hidden text-xs">
                      <button onClick={() => setVisualizacao("lista")} className={`px-2 py-1 ${visualizacao === "lista" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Lista</button>
                      <button onClick={() => setVisualizacao("areas")} className={`px-2 py-1 ${visualizacao === "areas" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Por Área</button>
                    </div>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={addCampo}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Campo
                  </Button>
                </div>
              </div>

              {form.campos_mapeados?.length === 0 && (
                <p className="text-xs text-gray-400 italic">Faça upload do arquivo e clique em "Extrair campos com IA" para preencher automaticamente, ou adicione manualmente.</p>
              )}

              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {visualizacao === "areas" && form.campos_mapeados?.length > 0 ? (
                  <CamposAgrupados campos={form.campos_mapeados} onChange={updateCampo} onDelete={deleteCampo} />
                ) : (
                  form.campos_mapeados?.map((c, i) => (
                    <CampoProposta key={c.id || i} campo={c} idx={i} onChange={novo => updateCampo(i, novo)} onDelete={() => deleteCampo(i)} />
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => salvar.mutate(form)} disabled={salvar.isPending || !form.nome || !form.orgao} className="bg-indigo-600 hover:bg-indigo-700">
              {salvar.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {editando ? "Salvar" : "Criar Modelo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}