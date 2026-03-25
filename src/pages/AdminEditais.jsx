import React, { useState, useEffect } from "react";
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
import { Download, Loader2, Plus, Pencil, Trash2, FolderOpen, UserPlus, Users, BookOpen, ChevronDown, ChevronRight, Info, TrendingUp, Brain, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EditalDocumentosAdmin from "../components/admin/EditalDocumentosAdmin";
import InformativosTab from "../components/admin/InformativosTab";
import ReceitaUsoTab from "../components/admin/ReceitasUsoTab";
import ModelosRelatorioAdmin from "../components/admin/ModelosRelatorioAdmin";
import ModelosPropostaAdmin from "../components/admin/ModelosPropostaAdmin";
import NotificarUsuariosAdmin from "../components/admin/NotificarUsuariosAdmin";
import AbsorverConhecimentoModal from "../components/admin/AbsorverConhecimentoModal";

const ESTADO_LABELS = {
  ES: "Espírito Santo — FAPES", RJ: "Rio de Janeiro — FAPERJ",
  SP: "São Paulo — FAPESP", MG: "Minas Gerais — FAPEMIG",
};

function GrupoEstado({ estado, editais, onEdit, onDelete, onDocs, onAbsorver }) {
  const [aberto, setAberto] = useState(true);
  const label = ESTADO_LABELS[estado] || estado;
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
        onClick={() => setAberto(v => !v)}
      >
        <div className="flex items-center gap-2">
          {aberto ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          <span className="font-semibold text-gray-800">{label}</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{editais.length}</span>
        </div>
      </button>
      {aberto && (
        <div className="divide-y">
          {editais.map(e => (
            <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{e.titulo}</p>
                <div className="flex gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${e.status === "encerrado" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{e.status}</span>
                  {e.area && <Badge className="bg-blue-100 text-blue-800 text-xs">{e.area}</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => onDocs(e)} title="Documentos & IA"><BookOpen className="w-4 h-4 text-indigo-500" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onAbsorver(e)} title="Absorver Conhecimento"><Brain className="w-4 h-4 text-purple-500" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onEdit(e)}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(e.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminEditais() {
  const [importando, setImportando] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [docsEdital, setDocsEdital] = useState(null);
  const [absorverEdital, setAbsorverEdital] = useState(null);
  const [form, setForm] = useState({ titulo: "", numero: "", descricao: "", area: "", categoria: "outros_programas", valor_total: "", data_encerramento: "", url_fapes: "", status: "aberto", estado: "ES", orgao: "FAPES" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("empreendedor");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

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
    const fontes = [
      { url: "https://fapes.es.gov.br/Editais/Abertos", estado: "ES", orgao: "FAPES" },
      { url: "https://www.faperj.br/?id=28.5.7", estado: "RJ", orgao: "FAPERJ" },
      { url: "https://fapesp.br/chamadas/", estado: "SP", orgao: "FAPESP" },
      { url: "https://fapemig.br/oportunidades/chamadas-e-editais", estado: "MG", orgao: "FAPEMIG" }
    ];

    for (const { url, estado, orgao } of fontes) {
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Acesse a página ${url} e liste TODOS os editais/chamadas abertas ou vigentes que aparecem. Para cada edital retorne:
- titulo: nome do edital
- numero: número/código do edital (se houver)
- descricao: breve descrição do edital
- data_encerramento: data de encerramento no formato YYYY-MM-DD (se disponível)
- url_fapes: URL direta do edital (link para mais detalhes)
- area: área temática (ex: Pesquisa, Inovação, Saúde, etc.)
- categoria: uma das opções: inovacao_startups, apoio_pesquisa, empreendedorismo, bolsas_editais, outros_programas

Retorne apenas editais com status aberto/vigente. Não invente dados — use apenas o que está na página.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            editais: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  numero: { type: "string" },
                  descricao: { type: "string" },
                  data_encerramento: { type: "string" },
                  url_fapes: { type: "string" },
                  area: { type: "string" },
                  categoria: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (r.editais?.length) {
        for (const e of r.editais) {
          await base44.entities.Edital.create({ ...e, status: "aberto", estado, orgao });
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ["editais"] });
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
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="editais">Editais</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
            <TabsTrigger value="receitas">Receitas & Uso</TabsTrigger>
            <TabsTrigger value="modelos">Modelos de Relatório</TabsTrigger>
            <TabsTrigger value="modelos_proposta">Modelos de Proposta</TabsTrigger>
            <TabsTrigger value="informativos">Informativos</TabsTrigger>
          </TabsList>

          <TabsContent value="editais" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={importar} disabled={importando} className="bg-indigo-600 hover:bg-indigo-700">
                {importando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {importando ? "Importando editais..." : "Importar Editais (ES, RJ, SP, MG)"}
              </Button>
              <Button onClick={openNew} variant="outline"><Plus className="w-4 h-4 mr-2" /> Cadastrar Edital</Button>
            </div>

            <div className="space-y-3">
              {/* Agrupa por estado */}
              {(() => {
                const grupos = {};
                editais.forEach(e => {
                  const uf = e.estado || "ES";
                  if (!grupos[uf]) grupos[uf] = [];
                  grupos[uf].push(e);
                });
                const ordem = ["ES", "RJ", "SP", "MG"];
                const estados = [...new Set([...ordem, ...Object.keys(grupos)])].filter(k => grupos[k]);
                return estados.map(uf => (
                  <GrupoEstado
                   key={uf}
                   estado={uf}
                   editais={grupos[uf]}
                   onEdit={openEdit}
                   onDelete={(id) => deleteEdital.mutate(id)}
                   onDocs={setDocsEdital}
                   onAbsorver={setAbsorverEdital}
                  />
                ));
              })()}
            </div>
          </TabsContent>

          <TabsContent value="notificacoes">
            <NotificarUsuariosAdmin />
          </TabsContent>

          <TabsContent value="receitas">
            <ReceitaUsoTab />
          </TabsContent>

          <TabsContent value="modelos">
            <ModelosRelatorioAdmin />
          </TabsContent>

          <TabsContent value="modelos_proposta">
            <ModelosPropostaAdmin />
          </TabsContent>

          <TabsContent value="informativos">
            <InformativosTab />
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
                  if (!inviteEmail || inviting) return;
                  setInviting(true);
                  await base44.users.inviteUser(inviteEmail, inviteRole);
                  setInviteEmail("");
                  setInviting(false);
                }} disabled={inviting} className="bg-indigo-600 hover:bg-indigo-700">
                  {inviting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Convidando...</> : <><UserPlus className="w-4 h-4 mr-2" /> Convidar</>}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {users.map(u => {
                const isCurrentUser = currentUser?.email === u.email;
                const isCurrentUserAdmin = currentUser?.role === "admin";
                const canChangeRole = isCurrentUserAdmin && !isCurrentUser;
                return (
                  <div key={u.id} className="p-4 bg-white rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{u.full_name || u.email} {isCurrentUser && <span className="text-xs text-indigo-600">(Você)</span>}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                    <div className="relative">
                      <Select 
                        value={u.role || "empreendedor"} 
                        onValueChange={(v) => updateRole.mutate({ id: u.id, role: v })}
                        disabled={!canChangeRole || updateRole.isPending}
                      >
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="empreendedor">Empreendedor</SelectItem>
                          <SelectItem value="consultor">Consultor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {updateRole.isPending && updateRole.variables?.id === u.id && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Documentos & IA Dialog */}
      <Dialog open={!!docsEdital} onOpenChange={() => setDocsEdital(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documentos & IA — {docsEdital?.titulo}</DialogTitle>
          </DialogHeader>
          {docsEdital && (
            <EditalDocumentosAdmin
              edital={docsEdital}
              onUpdate={async (data) => {
                await base44.entities.Edital.update(docsEdital.id, data);
                queryClient.invalidateQueries({ queryKey: ["editais"] });
                setDocsEdital(prev => ({ ...prev, ...data }));
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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
            <DialogFooter className="flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              {editando && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => { setFormOpen(false); setAbsorverEdital(editando); }}
                >
                  <Brain className="w-4 h-4 mr-2" /> Absorver Conhecimento
                </Button>
              )}
              <Button type="submit" disabled={createEdital.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {createEdital.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editando ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Absorver Conhecimento Modal */}
      <AbsorverConhecimentoModal
        open={!!absorverEdital}
        onClose={() => setAbsorverEdital(null)}
        editalDestino={absorverEdital}
        editaisDisponiveis={editais}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["editais"] });
          setAbsorverEdital(null);
        }}
      />
    </div>
  );
}