import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Loader2, Eye, Edit2, Save } from "lucide-react";

const BLOCK_TYPES = [
  { value: "titulo", label: "Título", icon: "H1" },
  { value: "subtitulo", label: "Subtítulo", icon: "H2" },
  { value: "paragrafo", label: "Parágrafo", icon: "¶" },
  { value: "campo_simples", label: "Campo de Texto", icon: "T" },
  { value: "campo_numero", label: "Campo de Número", icon: "#" },
  { value: "campo_data", label: "Campo de Data", icon: "D" },
  { value: "tabela", label: "Tabela", icon: "⊞" },
  { value: "lista", label: "Lista", icon: "•" },
  { value: "pagina_quebra", label: "Quebra de Página", icon: "⎲" },
];

function BlocoPreview({ bloco, onEdit, onDelete }) {
  const tipo = BLOCK_TYPES.find(t => t.value === bloco.type);
  const getPreview = () => {
    switch (bloco.type) {
      case "titulo": return <h1 className="text-2xl font-bold text-gray-900">{bloco.label || "[Título]"}</h1>;
      case "subtitulo": return <h2 className="text-xl font-semibold text-gray-800">{bloco.label || "[Subtítulo]"}</h2>;
      case "paragrafo": return <p className="text-sm text-gray-600">{bloco.conteudo || "[Parágrafo de texto...]"}</p>;
      case "campo_simples": return <div className="border-b-2 border-gray-300 text-xs text-gray-600 py-1">{"[" + (bloco.label || "Campo de texto") + "]"}</div>;
      case "campo_numero": return <div className="border-b-2 border-gray-300 text-xs text-gray-600 py-1">{"[" + (bloco.label || "Valor numérico") + "]"}</div>;
      case "campo_data": return <div className="border-b-2 border-gray-300 text-xs text-gray-600 py-1">{"[" + (bloco.label || "Data") + "]"}</div>;
      case "tabela": return (
        <table className="w-full text-xs border-collapse border border-gray-300">
          <thead><tr className="bg-gray-100">{(bloco.colunas || ["Col 1", "Col 2"]).map((c, i) => <th key={i} className="border p-1">{c}</th>)}</tr></thead>
          <tbody><tr>{(bloco.colunas || ["Col 1", "Col 2"]).map((_, i) => <td key={i} className="border p-1">[...]</td>)}</tr></tbody>
        </table>
      );
      case "lista": return <ul className="text-xs text-gray-600 ml-4"><li>{"[Item 1]"}</li><li>{"[Item 2]"}</li></ul>;
      case "pagina_quebra": return <div className="border-t-2 border-dashed border-gray-400 my-2 py-1 text-[10px] text-gray-500 text-center">--- QUEBRA DE PÁGINA ---</div>;
      default: return <div className="text-xs text-gray-400">Bloco desconhecido</div>;
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-white space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {getPreview()}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={() => onEdit(bloco)}>
            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(bloco.id)}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Button>
        </div>
      </div>
      {bloco.campo_id && (
        <p className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          Vinculado: {bloco.campo_id}
        </p>
      )}
    </div>
  );
}

function BlocoEditDialog({ bloco, campos, open, onClose, onSave }) {
  const [form, setForm] = useState(bloco || {});

  const handleSave = () => {
    onSave({ ...form, id: form.id || `bloco-${Date.now()}` });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bloco ? "Editar Bloco" : "Novo Bloco"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Tipo</label>
            <Select value={form.type || "paragrafo"} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOCK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.type !== "pagina_quebra" && (
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">Label / Texto</label>
              <Input value={form.label || ""} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex: Título do documento, Nome do campo..." className="mt-1" />
            </div>
          )}

          {(form.type === "paragrafo" || form.type === "campo_simples") && (
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">Conteúdo</label>
              <Input value={form.conteudo || ""} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} placeholder="Texto ou placeholder..." className="mt-1" />
            </div>
          )}

          {form.type === "tabela" && (
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">Colunas (separadas por vírgula)</label>
              <Input value={(form.colunas || []).join(", ")} onChange={(e) => setForm({ ...form, colunas: e.target.value.split(",").map(c => c.trim()) })} placeholder="Coluna 1, Coluna 2, Coluna 3..." className="mt-1" />
            </div>
          )}

          {(form.type.startsWith("campo_") || form.type === "tabela") && campos?.length > 0 && (
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">Vincular Campo (opcional)</label>
              <Select value={form.campo_id || ""} onValueChange={(v) => setForm({ ...form, campo_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {campos.map(c => <SelectItem key={c.id} value={c.id}>{c.pergunta}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Salvar Bloco</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ModeloTemplateEditorRelatorio({ open, onClose, modelo, onSave }) {
  const [blocos, setBlocos] = useState(modelo?.template_blocos || []);
  const [editingBloco, setEditingBloco] = useState(null);
  const [blocoDialogOpen, setBlocoDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleAddBloco = (newBloco) => {
    setBlocos([...blocos, newBloco]);
    setBlocoDialogOpen(false);
  };

  const handleEditBloco = (idx, newBloco) => {
    setBlocos(blocos.map((b, i) => i === idx ? newBloco : b));
    setBlocoDialogOpen(false);
    setEditingBloco(null);
  };

  const handleDeleteBloco = (id) => {
    setBlocos(blocos.filter(b => b.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ template_blocos: blocos });
    setSaving(false);
    onClose();
  };

  const campos = modelo?.campos_mapeados || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de Template de Exportação - {modelo?.nome}</DialogTitle>
        </DialogHeader>

        {!previewMode ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Monte o layout do documento. Cada bloco representa uma seção que será preenchida com os dados quando exportado.
            </p>

            <div className="flex gap-2">
              <Button onClick={() => { setEditingBloco(null); setBlocoDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Bloco
              </Button>
              <Button variant="outline" onClick={() => setPreviewMode(true)}>
                <Eye className="w-4 h-4 mr-2" /> Visualizar
              </Button>
            </div>

            <div className="border rounded-lg bg-slate-50 p-4 space-y-3 max-h-96 overflow-y-auto">
              {blocos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum bloco adicionado. Clique em "Adicionar Bloco" para começar.</p>
              ) : (
                blocos.map((bloco, idx) => (
                  <div key={bloco.id}>
                    <BlocoPreview
                      bloco={bloco}
                      onEdit={() => { setEditingBloco({ bloco, idx }); setBlocoDialogOpen(true); }}
                      onDelete={() => handleDeleteBloco(bloco.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              <Edit2 className="w-4 h-4 mr-2" /> Voltar à Edição
            </Button>
            <Card className="bg-white p-6 space-y-4 max-h-96 overflow-y-auto">
              {blocos.map((bloco) => {
                const getPreview = () => {
                  switch (bloco.type) {
                    case "titulo": return <h1 className="text-2xl font-bold text-gray-900">{bloco.label}</h1>;
                    case "subtitulo": return <h2 className="text-xl font-semibold text-gray-800">{bloco.label}</h2>;
                    case "paragrafo": return <p className="text-sm text-gray-600">{bloco.conteudo}</p>;
                    case "campo_simples": return <div className="border-b border-gray-300 py-2 text-sm text-gray-500">_____________________</div>;
                    case "campo_numero": return <div className="border-b border-gray-300 py-2 text-sm text-gray-500">_______</div>;
                    case "campo_data": return <div className="border-b border-gray-300 py-2 text-sm text-gray-500">___/___/_____</div>;
                    case "tabela": return (
                      <table className="w-full border-collapse border border-gray-300 text-xs">
                        <thead><tr className="bg-gray-100">{(bloco.colunas || []).map((c, i) => <th key={i} className="border p-2">{c}</th>)}</tr></thead>
                        <tbody><tr>{(bloco.colunas || []).map((_, i) => <td key={i} className="border p-2">&nbsp;</td>)}</tr></tbody>
                      </table>
                    );
                    case "lista": return <ul className="text-sm text-gray-600 ml-4"><li>Item 1</li><li>Item 2</li></ul>;
                    case "pagina_quebra": return <div className="border-t-2 border-dashed border-gray-400 my-4 py-2" />;
                    default: return null;
                  }
                };
                return <div key={bloco.id}>{getPreview()}</div>;
              })}
            </Card>
          </div>
        )}

        <BlocoEditDialog
          bloco={editingBloco?.bloco}
          campos={campos}
          open={blocoDialogOpen}
          onClose={() => setBlocoDialogOpen(false)}
          onSave={(newBloco) => {
            if (editingBloco) {
              handleEditBloco(editingBloco.idx, newBloco);
            } else {
              handleAddBloco(newBloco);
            }
          }}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}