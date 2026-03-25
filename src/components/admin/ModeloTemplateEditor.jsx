import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Eye, Code, AlignLeft, Users, Target, Calendar, DollarSign, FileText, Heading1, Heading2, Minus, Table, X } from "lucide-react";

const BLOCK_TYPES = [
  { type: "titulo", label: "Título do Documento", icon: Heading1, color: "bg-gray-100 text-gray-700" },
  { type: "subtitulo", label: "Subtítulo / Seção", icon: Heading2, color: "bg-blue-50 text-blue-700" },
  { type: "texto_fixo", label: "Texto Fixo", icon: AlignLeft, color: "bg-yellow-50 text-yellow-700" },
  { type: "divisor", label: "Divisor", icon: Minus, color: "bg-gray-50 text-gray-400" },
  { type: "campo_dados", label: "Campo de Dados", icon: FileText, color: "bg-indigo-50 text-indigo-700" },
  { type: "bloco_membros", label: "Bloco de Membros", icon: Users, color: "bg-purple-50 text-purple-700" },
  { type: "bloco_objetivos", label: "Bloco de Objetivos", icon: Target, color: "bg-green-50 text-green-700" },
  { type: "bloco_cronograma", label: "Bloco de Cronograma", icon: Calendar, color: "bg-orange-50 text-orange-700" },
  { type: "tabela_valores", label: "Tabela de Valores", icon: DollarSign, color: "bg-emerald-50 text-emerald-700" },
  { type: "tabela_generica", label: "Tabela Genérica", icon: Table, color: "bg-teal-50 text-teal-700" },
];

const TIPO_ICONS = {
  titulo: Heading1, subtitulo: Heading2, texto_fixo: AlignLeft, divisor: Minus,
  campo_dados: FileText, bloco_membros: Users, bloco_objetivos: Target,
  bloco_cronograma: Calendar, tabela_valores: DollarSign, tabela_generica: Table,
};

const TIPO_COLORS = {
  titulo: "border-l-4 border-gray-400 bg-gray-50",
  subtitulo: "border-l-4 border-blue-400 bg-blue-50",
  texto_fixo: "border-l-4 border-yellow-400 bg-yellow-50",
  divisor: "bg-gray-100",
  campo_dados: "border-l-4 border-indigo-400 bg-indigo-50",
  bloco_membros: "border-l-4 border-purple-400 bg-purple-50",
  bloco_objetivos: "border-l-4 border-green-400 bg-green-50",
  bloco_cronograma: "border-l-4 border-orange-400 bg-orange-50",
  tabela_valores: "border-l-4 border-emerald-400 bg-emerald-50",
  tabela_generica: "border-l-4 border-teal-400 bg-teal-50",
};

function renderBlockPreview(bloco, campos) {
  const campoRef = campos?.find(c => c.id === bloco.campo_id);
  switch (bloco.type) {
    case "titulo":
      return <h1 className="text-xl font-bold text-gray-900">{bloco.conteudo || "Título do Relatório"}</h1>;
    case "subtitulo":
      return <h2 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-1">{bloco.conteudo || "Subtítulo da Seção"}</h2>;
    case "texto_fixo":
      return <p className="text-sm text-gray-600 whitespace-pre-wrap">{bloco.conteudo || "Texto fixo aqui..."}</p>;
    case "divisor":
      return <hr className="border-gray-300" />;
    case "campo_dados":
      return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-indigo-600 uppercase">{bloco.label || campoRef?.pergunta || "Campo de Dados"}</p>
          <div className="bg-white border border-dashed border-indigo-300 rounded p-2 min-h-[36px]">
            <p className="text-xs text-gray-400 italic">[{campoRef?.tipo_resposta || "valor do campo"}]</p>
          </div>
        </div>
      );
    case "bloco_membros":
      return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-purple-600 uppercase">{bloco.label || "Equipe do Projeto"}</p>
          <div className="bg-white border border-dashed border-purple-300 rounded p-2">
            <div className="grid grid-cols-3 gap-1 text-xs text-gray-400">
              <span className="font-medium">Nome</span><span className="font-medium">Função</span><span className="font-medium">CH Semanal</span>
              <span className="italic">—</span><span className="italic">—</span><span className="italic">—</span>
            </div>
          </div>
        </div>
      );
    case "bloco_objetivos":
      return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-green-600 uppercase">{bloco.label || "Objetivos"}</p>
          <div className="bg-white border border-dashed border-green-300 rounded p-2 space-y-1">
            {["Objetivo Geral", "Objetivos Específicos"].map((o, i) => (
              <p key={i} className="text-xs text-gray-400 italic">• {o}: [valor]</p>
            ))}
          </div>
        </div>
      );
    case "bloco_cronograma":
      return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-orange-600 uppercase">{bloco.label || "Cronograma de Execução"}</p>
          <div className="bg-white border border-dashed border-orange-300 rounded p-2">
            <div className="grid grid-cols-4 gap-1 text-xs text-gray-400">
              <span className="font-medium">Atividade</span><span className="font-medium">Início</span><span className="font-medium">Fim</span><span className="font-medium">Responsável</span>
              <span className="italic col-span-4 text-center">—</span>
            </div>
          </div>
        </div>
      );
    case "tabela_valores":
      return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-emerald-600 uppercase">{bloco.label || "Orçamento / Valores"}</p>
          <div className="bg-white border border-dashed border-emerald-300 rounded p-2">
            <div className="grid grid-cols-4 gap-1 text-xs text-gray-400">
              <span className="font-medium">Item</span><span className="font-medium">Qtd</span><span className="font-medium">Valor Unit.</span><span className="font-medium">Total</span>
              <span className="italic col-span-4 text-center">—</span>
            </div>
          </div>
        </div>
      );
    case "tabela_generica":
      return (
        <div className="space-y-1">
          <p className="text-xs font-bold text-teal-600 uppercase">{bloco.label || "Tabela"}</p>
          <div className="bg-white border border-dashed border-teal-300 rounded p-2">
            <div className="flex gap-2 text-xs text-gray-400">
              {(bloco.colunas || ["Coluna 1", "Coluna 2"]).map((col, i) => (
                <span key={i} className="flex-1 font-medium text-center">{col}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 italic text-center mt-1">—</p>
          </div>
        </div>
      );
    default:
      return <div className="text-xs text-gray-400">[bloco desconhecido]</div>;
  }
}

function BlocoConfig({ bloco, onChange, campos, onDelete }) {
  return (
    <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase">{BLOCK_TYPES.find(b => b.type === bloco.type)?.label || bloco.type}</p>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={onDelete}><X className="w-3.5 h-3.5" /></Button>
      </div>

      {(bloco.type === "titulo" || bloco.type === "subtitulo" || bloco.type === "texto_fixo") && (
        <div>
          <Label className="text-xs">Conteúdo</Label>
          {bloco.type === "texto_fixo"
            ? <Textarea value={bloco.conteudo || ""} onChange={e => onChange({ ...bloco, conteudo: e.target.value })} rows={3} className="text-xs mt-0.5" />
            : <Input value={bloco.conteudo || ""} onChange={e => onChange({ ...bloco, conteudo: e.target.value })} className="h-7 text-xs mt-0.5" />
          }
        </div>
      )}

      {bloco.type === "campo_dados" && (
        <>
          <div>
            <Label className="text-xs">Campo vinculado</Label>
            <Select value={bloco.campo_id || ""} onValueChange={v => onChange({ ...bloco, campo_id: v, label: campos?.find(c => c.id === v)?.pergunta || bloco.label })}>
              <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue placeholder="Selecionar campo..." /></SelectTrigger>
              <SelectContent>
                {campos?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.secao ? `[${c.secao}] ` : ""}{c.pergunta}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Label exibido (opcional)</Label>
            <Input value={bloco.label || ""} onChange={e => onChange({ ...bloco, label: e.target.value })} className="h-7 text-xs mt-0.5" placeholder="Deixe vazio para usar o nome do campo" />
          </div>
        </>
      )}

      {(bloco.type === "bloco_membros" || bloco.type === "bloco_objetivos" || bloco.type === "bloco_cronograma" || bloco.type === "tabela_valores") && (
        <div>
          <Label className="text-xs">Título da seção</Label>
          <Input value={bloco.label || ""} onChange={e => onChange({ ...bloco, label: e.target.value })} className="h-7 text-xs mt-0.5" />
        </div>
      )}

      {bloco.type === "tabela_generica" && (
        <>
          <div>
            <Label className="text-xs">Título da tabela</Label>
            <Input value={bloco.label || ""} onChange={e => onChange({ ...bloco, label: e.target.value })} className="h-7 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-xs">Colunas (uma por linha)</Label>
            <Textarea
              value={(bloco.colunas || []).join("\n")}
              onChange={e => onChange({ ...bloco, colunas: e.target.value.split("\n").filter(Boolean) })}
              rows={3}
              className="text-xs mt-0.5"
              placeholder={"Coluna 1\nColuna 2\nColuna 3"}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function ModeloTemplateEditor({ open, onClose, modelo, onSave }) {
  const [blocos, setBlocos] = useState(modelo?.template_blocos || []);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [viewMode, setViewMode] = useState("split"); // split | editor | preview
  const [dragging, setDragging] = useState(null);
  const dragOver = useRef(null);

  React.useEffect(() => {
    if (open) {
      setBlocos(modelo?.template_blocos || []);
      setSelectedIdx(null);
    }
  }, [open, modelo]);

  const addBloco = (type) => {
    const novo = { id: `bloco-${Date.now()}`, type, conteudo: "", label: "", campo_id: "" };
    setBlocos(b => [...b, novo]);
    setSelectedIdx(blocos.length);
  };

  const updateBloco = (i, novo) => setBlocos(b => b.map((bl, idx) => idx === i ? novo : bl));
  const deleteBloco = (i) => { setBlocos(b => b.filter((_, idx) => idx !== i)); setSelectedIdx(null); };
  const moveBloco = (from, to) => {
    setBlocos(b => {
      const arr = [...b];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setSelectedIdx(to);
  };

  const handleSave = () => {
    onSave({ template_blocos: blocos });
    onClose();
  };

  const campos = modelo?.campos_mapeados || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[96vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-4 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base">Editor de Template — {modelo?.nome}</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">Monte o layout do relatório arrastando e configurando blocos</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border overflow-hidden">
                <button onClick={() => setViewMode("split")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "split" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Split</button>
                <button onClick={() => setViewMode("editor")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "editor" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}><Code className="w-3 h-3" /></button>
                <button onClick={() => setViewMode("preview")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "preview" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}><Eye className="w-3 h-3" /></button>
              </div>
              <Button size="sm" onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Salvar Template</Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Painel de blocos (sidebar) */}
          {viewMode !== "preview" && (
            <div className="w-48 flex-shrink-0 border-r bg-slate-50 overflow-y-auto">
              <div className="p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Adicionar Bloco</p>
                <div className="space-y-1">
                  {BLOCK_TYPES.map(b => {
                    const Icon = b.icon;
                    return (
                      <button
                        key={b.type}
                        onClick={() => addBloco(b.type)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs font-medium hover:opacity-80 transition-opacity ${b.color}`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Editor de blocos */}
          {viewMode !== "preview" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white" style={{ maxWidth: viewMode === "split" ? "42%" : undefined }}>
              <p className="text-xs text-gray-400 mb-3">Clique em um bloco para editar. Arraste para reordenar.</p>
              {blocos.length === 0 && (
                <div className="text-center py-10 text-gray-300">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum bloco. Adicione usando o painel à esquerda.</p>
                </div>
              )}
              {blocos.map((bloco, i) => {
                const Icon = TIPO_ICONS[bloco.type] || FileText;
                const isSelected = selectedIdx === i;
                return (
                  <div key={bloco.id || i}>
                    <div
                      className={`rounded-lg p-2 cursor-pointer transition-all ${TIPO_COLORS[bloco.type] || "bg-gray-50"} ${isSelected ? "ring-2 ring-indigo-400" : "hover:ring-1 hover:ring-gray-300"}`}
                      draggable
                      onDragStart={() => setDragging(i)}
                      onDragOver={(e) => { e.preventDefault(); dragOver.current = i; }}
                      onDrop={() => { if (dragging !== null && dragging !== dragOver.current) moveBloco(dragging, dragOver.current); setDragging(null); }}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => setSelectedIdx(isSelected ? null : i)}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-grab" />
                        <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                        <span className="text-xs font-medium flex-1 truncate">{bloco.conteudo || bloco.label || BLOCK_TYPES.find(b => b.type === bloco.type)?.label || bloco.type}</span>
                        <span className="text-[10px] text-gray-400">{i + 1}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-1">
                        <BlocoConfig bloco={bloco} onChange={novo => updateBloco(i, novo)} campos={campos} onDelete={() => deleteBloco(i)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Preview do documento */}
          {viewMode !== "editor" && (
            <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
              <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8 min-h-full">
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Preview do Relatório</p>
                  <p className="text-xs text-gray-500">{modelo?.nome} • {modelo?.orgao}</p>
                </div>
                {blocos.length === 0 && (
                  <p className="text-sm text-gray-300 text-center py-16 italic">Adicione blocos para visualizar o layout</p>
                )}
                <div className="space-y-4">
                  {blocos.map((bloco, i) => (
                    <div key={bloco.id || i} className="relative group">
                      {renderBlockPreview(bloco, campos)}
                      <div className="absolute -left-5 top-0 opacity-0 group-hover:opacity-100 text-[10px] text-gray-300">{i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}