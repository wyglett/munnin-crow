import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus, Loader2 } from "lucide-react";

const CATEGORIAS = [
  { value: "submissao_proposta", label: "Submissão de Proposta" },
  { value: "escrita_material", label: "Escrita de Material" },
  { value: "gestao_projeto", label: "Gestão de Projeto" },
  { value: "elaboracao_relatorio", label: "Elaboração de Relatório" },
  { value: "captacao_recursos", label: "Captação de Recursos" },
  { value: "outro", label: "Outro" },
];

const TIPOS = [
  { value: "youtube", label: "Vídeo YouTube" },
  { value: "canva", label: "Apresentação Canva" },
  { value: "pdf", label: "PDF (upload)" },
  { value: "documento", label: "Link Externo" },
];

export default function OrientacaoFormModal({ open, onClose, onSaved, orientacao: initial }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newEdital, setNewEdital] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo: "youtube",
    url: "",
    arquivo_url: "",
    categoria: "submissao_proposta",
    direcionado_orgao: "",
    direcionado_editais: [],
    acesso_livre: true,
    clientes_liberados: [],
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (initial) {
      setForm({
        titulo: initial.titulo || "",
        descricao: initial.descricao || "",
        tipo: initial.tipo || "youtube",
        url: initial.url || "",
        arquivo_url: initial.arquivo_url || "",
        categoria: initial.categoria || "submissao_proposta",
        direcionado_orgao: initial.direcionado_orgao || "",
        direcionado_editais: initial.direcionado_editais || [],
        acesso_livre: initial.acesso_livre !== false,
        clientes_liberados: initial.clientes_liberados || [],
      });
    } else {
      setForm({
        titulo: "", descricao: "", tipo: "youtube", url: "", arquivo_url: "",
        categoria: "submissao_proposta", direcionado_orgao: "",
        direcionado_editais: [], acesso_livre: true, clientes_liberados: [],
      });
    }
  }, [initial, open]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") return alert("Apenas PDFs são aceitos.");
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("arquivo_url", file_url);
    setUploading(false);
  };

  const addEdital = () => {
    if (!newEdital.trim()) return;
    set("direcionado_editais", [...form.direcionado_editais, newEdital.trim()]);
    setNewEdital("");
  };

  const removeEdital = (i) => set("direcionado_editais", form.direcionado_editais.filter((_, idx) => idx !== i));

  const addEmail = () => {
    if (!newEmail.trim() || form.clientes_liberados.includes(newEmail.trim())) return;
    set("clientes_liberados", [...form.clientes_liberados, newEmail.trim()]);
    setNewEmail("");
  };

  const removeEmail = (i) => set("clientes_liberados", form.clientes_liberados.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.titulo) return;
    if (form.tipo === "pdf" && !form.arquivo_url) return alert("Faça o upload do PDF.");
    if (form.tipo !== "pdf" && !form.url) return alert("Informe a URL do conteúdo.");
    setLoading(true);
    const payload = {
      ...form,
      consultor_email: user?.email,
      consultor_nome: user?.full_name,
    };
    if (initial?.id) {
      await base44.entities.Orientacao.update(initial.id, payload);
    } else {
      await base44.entities.Orientacao.create(payload);
    }
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Conteúdo" : "Adicionar Conteúdo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Tipo */}
          <div>
            <Label>Tipo de Conteúdo</Label>
            <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* URL ou upload */}
          {form.tipo === "pdf" ? (
            <div>
              <Label>Arquivo PDF</Label>
              <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                {form.arquivo_url ? (
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-sm text-green-600 font-medium">PDF carregado</span>
                    <button onClick={() => set("arquivo_url", "")} className="text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                        <p className="text-sm text-slate-500">Clique para enviar o PDF</p>
                      </>
                    )}
                    <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div>
              <Label>
                {form.tipo === "youtube" ? "URL do YouTube" :
                 form.tipo === "canva" ? "URL de compartilhamento do Canva" : "URL do Conteúdo"}
              </Label>
              <Input className="mt-1" placeholder={
                form.tipo === "youtube" ? "https://www.youtube.com/watch?v=..." :
                form.tipo === "canva" ? "https://www.canva.com/design/..." : "https://..."
              } value={form.url} onChange={e => set("url", e.target.value)} />
              {form.tipo === "canva" && (
                <p className="text-xs text-slate-400 mt-1">Use o link de "Compartilhar" → "Visualizar" do Canva</p>
              )}
            </div>
          )}

          {/* Título e Descrição */}
          <div>
            <Label>Título</Label>
            <Input className="mt-1" value={form.titulo} onChange={e => set("titulo", e.target.value)} />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea className="mt-1 h-20 resize-none" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
          </div>

          {/* Categoria */}
          <div>
            <Label>Categoria</Label>
            <Select value={form.categoria} onValueChange={v => set("categoria", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Direcionamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Órgão (ex: FAPES)</Label>
              <Input className="mt-1" placeholder="FAPES" value={form.direcionado_orgao} onChange={e => set("direcionado_orgao", e.target.value)} />
            </div>
            <div>
              <Label>Editais relacionados</Label>
              <div className="flex gap-1 mt-1">
                <Input placeholder="Nome do edital" value={newEdital} onChange={e => setNewEdital(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addEdital()} />
                <Button size="icon" variant="outline" onClick={addEdital}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {form.direcionado_editais.map((e, i) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1">
                    {e} <button onClick={() => removeEdital(i)}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Acesso */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Acesso livre</p>
                <p className="text-xs text-slate-500">Visível para todos os usuários da plataforma</p>
              </div>
              <Switch checked={form.acesso_livre} onCheckedChange={v => set("acesso_livre", v)} />
            </div>

            {!form.acesso_livre && (
              <div>
                <Label className="text-xs">Liberar apenas para (emails dos clientes):</Label>
                <div className="flex gap-1 mt-1">
                  <Input placeholder="email@cliente.com" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addEmail()} />
                  <Button size="icon" variant="outline" onClick={addEmail}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.clientes_liberados.map((em, i) => (
                    <Badge key={i} variant="outline" className="text-xs gap-1">
                      {em} <button onClick={() => removeEmail(i)}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? "Salvar Alterações" : "Publicar Conteúdo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}