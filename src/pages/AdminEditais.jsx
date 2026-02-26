import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, Loader2, Plus, Pencil, Trash2, FolderOpen, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminEditais() {
  const [importando, setImportando] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo: "", numero: "", descricao: "", area: "", categoria: "outros_programas", valor_total: "", data_encerramento: "", url_fapes: "", status: "aberto", estado: "ES", orgao: "FAPES" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("empreendedor");
  const queryClient = useQueryClient();

  const { data: editais = [] } = useQuery({ queryKey: ["editais"], queryFn: () => base44.entities.Edital.list("-created_date", 200) });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => base44.entities.User.list() });

  const createEdital = useMutation({
    mutationFn: (d) => editando ? base44.entities.Edital.update(editando.id, d) : base44.entities.Edital.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["editais"] }); setFormOpen(false); setEditando(null); },
  });

  const deleteEdital = useMutation({
    mutationFn: (id) => base44.entities.Edital.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["editais"] }),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const openEdit = (e) => {
    setEditando(e);
    setForm({ titulo: e.titulo || "", numero: e.numero || "", descricao: e.descricao || "", area: e.area || "", categoria: e.categoria || "outros_programas", valor_total: e.valor_total || "", data_encerramento: e.data_encerramento || "", url_fapes: e.url_fapes || "", status: e.status || "aberto", estado: e.estado || "ES", orgao: e.orgao || "FAPES" });
    setFormOpen(true);
  };

  const openNew = () => {
    setEditando(null);
    setForm({ titulo: "", numero: "", descricao: "", area: "", categoria: "outros_programas", valor_total: "", data_encerramento: "", url_fapes: "", status: "aberto", estado: "ES", orgao: "FAPES" });
    setFormOpen(true);
  };

  const importar = async () => {
    setImportando(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: "Acesse https://fapes.es.gov.br/Editais/Abertos e extraia TODOS os editais abertos. Para cada um: titulo, numero, descricao, data_encerramento (YYYY-MM-DD), url_fapes, area, categoria (inovacao_startups, apoio_pesquisa, empreendedorismo, bolsas_editais, outros_programas).",
      add_context_from_internet: true,
      response_json_schema: { type: "object", properties: { editais: { type: "array", items: { type: "object", properties: { titulo: { type: "string" }, numero: { type: "string" }, descricao: { type: "string" }, data_encerramento: { type: "string" }, url_fapes: { type: "string" }, area: { type: "string" }, categoria: { type: "string" } } } } } }
    });
    if (r.editais?.length) {
      for (const e of r.editais) await base44.entities.Edital.create({ ...e, status: "aberto", estado: "ES", orgao: "FAPES" });
      queryClient.invalidateQueries({ queryKey: ["editais"] });
    }
    setImportando(false);
  };

  const ROLE_LABELS = { admin: "Administrador", empreendedor: "Empreendedor", consultor: "Consultor" };
  const ROLE_COLORS = { admin: "bg-red-100 text-red-800", empreendedor: "bg-blue-100 text-blue-800", consultor: "bg-purple-100 text-purple-800" };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Administração</h1>
        <p className="text-gray-500 text-sm mb-6">Gerencie editais, usuários e configurações</p>

        <Tabs defaultValue="editais">
          <TabsList className="mb-6">
            <TabsTrigger value="editais">Editais</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="editais" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={importar} disabled={importando} className="bg-indigo-600 hover:bg-indigo-700">
                {importando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {importando ? "Importando..." : "Importar da FAPES"}
              </Button>
              <Button onClick={openNew} variant="outline"><Plus className="w-4 h-4 mr-2" /> Cadastrar Edital</Button>
            </div>

            <div className="space-y-2">
              {editais.map(e => (
                <div key={e.id} className="p-4 bg-white rounded-lg border hover:border-indigo-300 transition-colors flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{e.titulo}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {e.area && <Badge className="bg-blue-100 text-blue-800 text-xs">{e.area}</Badge>}
                      {e.categoria && <Badge className="bg-gray-100 text-gray-700 text-xs">{e.categoria}</Badge>}
                      {e.documentos_modelo?.length > 0 && <Badge className="bg-green-100 text-green-800 text-xs">{e.documentos_modelo.length} docs</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteEdital.mutate(e.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Convidar Novo Usuário</CardTitle></CardHeader>
              <CardContent className="flex gap-3">
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" className="flex-1" />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empreendedor">Empreendedor</SelectItem>
                    <SelectItem value="consultor">Consultor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={async () => {
                  if (!inviteEmail) return;
                  await base44.users.inviteUser(inviteEmail, inviteRole === "admin" ? "admin" : "user");
                  setInviteEmail("");
                }} className="bg-indigo-600 hover:bg-indigo-700"><UserPlus className="w-4 h-4 mr-2" /> Convidar</Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="p-4 bg-white rounded-lg border flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{u.full_name || u.email}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                  <Select value={u.role || "empreendedor"} onValueChange={(v) => updateRole.mutate({ id: u.id, role: v })}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empreendedor">Empreendedor</SelectItem>
                      <SelectItem value="consultor">Consultor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edital Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editando ? "Editar Edital" : "Cadastrar Edital"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createEdital.mutate(form); }} className="space-y-3">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Número</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aberto">Aberto</SelectItem><SelectItem value="em_breve">Em breve</SelectItem><SelectItem value="encerrado">Encerrado</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Área</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
              <div><Label>Categoria</Label><Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="inovacao_startups">Inovação & Startups</SelectItem><SelectItem value="apoio_pesquisa">Apoio à Pesquisa</SelectItem><SelectItem value="empreendedorismo">Empreendedorismo</SelectItem><SelectItem value="bolsas_editais">Bolsas & Editais</SelectItem><SelectItem value="outros_programas">Outros</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor Total</Label><Input value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} /></div>
              <div><Label>Encerramento</Label><Input type="date" value={form.data_encerramento} onChange={(e) => setForm({ ...form, data_encerramento: e.target.value })} /></div>
            </div>
            <div><Label>Link do Edital</Label><Input value={form.url_fapes} onChange={(e) => setForm({ ...form, url_fapes: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createEdital.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {createEdital.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editando ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}