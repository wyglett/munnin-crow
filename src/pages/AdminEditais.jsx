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
import { Download, Loader2, Plus, Pencil, Trash2, FolderOpen, UserPlus, Users, BookOpen, ChevronDown, ChevronRight, Info, TrendingUp, Brain, Zap, LayoutGrid, LayoutList, Moon, Sun, FileText, BarChart3, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EditalDocumentosAdmin from "../components/admin/EditalDocumentosAdmin";
import InformativosTab from "../components/admin/InformativosTab";
import ReceitaUsoTab from "../components/admin/ReceitasUsoTab";
import ModelosRelatorioAdmin from "../components/admin/ModelosRelatorioAdmin";
import ModelosPropostaAdmin from "../components/admin/ModelosPropostaAdmin";
import NotificacoesAdminPanel from "../components/notificacoes/NotificacoesAdminPanel";
import AbsorverConhecimentoModal from "../components/admin/AbsorverConhecimentoModal";
import ModelosUnificadoAdmin from "../components/admin/ModelosUnificadoAdmin";
import UsuariosAdmin from "../components/admin/UsuariosAdmin";
import DashboardAdmin from "../components/admin/DashboardAdmin";
import LogsAdmin from "../components/admin/LogsAdmin";

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
  
  const [defaultAppearance, setDefaultAppearance] = useState({ layout: "v2", tema: "dark" });
  const [appearanceSaved, setAppearanceSaved] = useState(false);

  const [activeTab, setActiveTab] = useState("editais");

  const MENU_ITEMS = [
    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
    { id: "editais", icon: Download, label: "Editais" },
    { id: "usuarios", icon: Users, label: "Usuários" },
    { id: "modelos", icon: FileText, label: "Modelos" },
    { id: "financeiro", icon: BarChart3, label: "Financeiro" },
    { id: "logs", icon: BookOpen, label: "Logs" },
    { id: "notificacoes", icon: Bell, label: "Notificações" },
    { id: "informativos", icon: BookOpen, label: "Informativos" },
    { id: "configuracoes", icon: Zap, label: "Configurações" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Sidebar refinado */}
      <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 flex flex-col shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Administração</h2>
              <p className="text-xs text-slate-500">Painel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-150 text-sm ${
                  activeTab === item.id
                    ? "bg-indigo-50 text-indigo-700 font-medium border border-indigo-200/60"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">v3.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Background nórdico decorativo */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-200/15 rounded-full blur-3xl -z-10" />
          <svg className="absolute top-12 right-20 w-32 h-32 opacity-5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 50 L30 40 L40 45 L50 30 L60 50 L70 35 L80 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="35" cy="60" r="3" fill="currentColor"/>
            <circle cx="65" cy="70" r="2" fill="currentColor"/>
          </svg>
        </div>

        <div className="p-8 relative">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {MENU_ITEMS.find(m => m.id === activeTab)?.label}
              </h1>
              <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full" />
            </div>

            {/* Content Sections */}
            <div className="space-y-6">

            {activeTab === "dashboard" && <DashboardAdmin />}

            {activeTab === "editais" && (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={importar} disabled={importando} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all">
                    {importando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    {importando ? "Importando..." : "Importar Editais"}
                  </Button>
                  <Button onClick={openNew} variant="outline" className="border-slate-300 hover:bg-slate-100 text-slate-700"><Plus className="w-4 h-4 mr-2" /> Novo</Button>
                </div>

                <div className="space-y-2.5">
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
              </div>
            )}

            {activeTab === "usuarios" && <UsuariosAdmin />}

            {activeTab === "modelos" && <ModelosUnificadoAdmin />}

            {activeTab === "financeiro" && <ReceitaUsoTab />}

            {activeTab === "notificacoes" && (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60 p-6 shadow-sm">
                <NotificacoesAdminPanel />
              </div>
            )}

            {activeTab === "informativos" && (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/60 p-6 shadow-sm">
                <InformativosTab />
              </div>
            )}

            {activeTab === "configuracoes" && (
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  Aparência Padrão
                </CardTitle>
                <p className="text-xs text-slate-500 font-normal mt-1">
                  Configure como novos usuários veem a plataforma.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-3 block text-slate-700">Layout:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={defaultAppearance.layout === "v2" ? "default" : "outline"}
                      onClick={() => setDefaultAppearance({ ...defaultAppearance, layout: "v2" })}
                      className="justify-start text-sm h-9"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                      Topo
                    </Button>
                    <Button
                      variant={defaultAppearance.layout === "edgy" ? "default" : "outline"}
                      onClick={() => setDefaultAppearance({ ...defaultAppearance, layout: "edgy" })}
                      className="justify-start text-sm h-9"
                    >
                      <LayoutList className="w-3.5 h-3.5 mr-2" />
                      Sidebar
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block text-slate-700">Tema:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={defaultAppearance.tema === "dark" ? "default" : "outline"}
                      onClick={() => setDefaultAppearance({ ...defaultAppearance, tema: "dark" })}
                      className="justify-start text-sm h-9"
                    >
                      <Moon className="w-3.5 h-3.5 mr-2" />
                      Escuro
                    </Button>
                    <Button
                      variant={defaultAppearance.tema === "light" ? "default" : "outline"}
                      onClick={() => setDefaultAppearance({ ...defaultAppearance, tema: "light" })}
                      className="justify-start text-sm h-9"
                    >
                      <Sun className="w-3.5 h-3.5 mr-2" />
                      Claro
                    </Button>
                  </div>
                </div>

                <div>
                  <Button
                    onClick={() => {
                      localStorage.setItem("default_appearance", JSON.stringify(defaultAppearance));
                      setAppearanceSaved(true);
                      setTimeout(() => setAppearanceSaved(false), 3000);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-full text-sm h-9"
                  >
                    {appearanceSaved ? "✓ Salvo!" : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
            </div>
          </div>
        </div>
      </main>

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