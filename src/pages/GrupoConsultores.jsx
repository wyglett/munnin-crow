import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users, Plus, Loader2, Send, Trash2, UserPlus, ChevronDown,
  ChevronRight, FileText, TrendingUp, Clock, CheckCircle, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_MAP = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
  em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800" },
  aprovada: { label: "Aprovada", color: "bg-green-100 text-green-800" },
  rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
  em_julgamento: { label: "Em Julgamento", color: "bg-blue-100 text-blue-800" },
  contratada: { label: "Contratada", color: "bg-emerald-100 text-emerald-800" },
  submetida: { label: "Submetida", color: "bg-blue-100 text-blue-800" },
};

export default function GrupoConsultores() {
  const [user, setUser] = useState(null);
  const [dialogGrupo, setDialogGrupo] = useState(false);
  const [dialogMembro, setDialogMembro] = useState(null); // grupoId
  const [dialogDistribuir, setDialogDistribuir] = useState(null); // proposta
  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [novoMembroEmail, setNovoMembroEmail] = useState("");
  const [novoMembroNome, setNovoMembroNome] = useState("");
  const [consultorDestino, setConsultorDestino] = useState("");
  const [grupoExpandido, setGrupoExpandido] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: grupos = [], isLoading: loadingGrupos } = useQuery({
    queryKey: ["grupos-consultor", user?.email],
    queryFn: () => base44.entities.GrupoConsultor.filter({ dono_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: todasPropostas = [], isLoading: loadingPropostas } = useQuery({
    queryKey: ["propostas-grupo", user?.email],
    queryFn: () => base44.entities.Proposta.list("-created_date", 200),
    enabled: !!user?.email,
  });

  // Propostas que estão com consultores do grupo
  const todosMembros = grupos.flatMap(g => g.membros || []);
  const emailsMembros = todosMembros.map(m => m.email);
  const propostasGrupo = todasPropostas.filter(p =>
    p.consultor_status === "em_apoio" &&
    (emailsMembros.includes(p.consultor_email) || p.consultor_email === user?.email)
  );

  // Propostas sem consultor atribuído (disponíveis para distribuir)
  const propostasSemConsultor = todasPropostas.filter(p =>
    (p.consultor_status === "sem_consultor" || !p.consultor_status) &&
    p.created_by !== user?.email
  );

  const criarGrupo = useMutation({
    mutationFn: () => base44.entities.GrupoConsultor.create({
      nome: novoGrupoNome,
      dono_email: user.email,
      dono_nome: user.full_name,
      membros: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos-consultor"] });
      setDialogGrupo(false);
      setNovoGrupoNome("");
    },
  });

  const adicionarMembro = useMutation({
    mutationFn: (grupoId) => {
      const grupo = grupos.find(g => g.id === grupoId);
      const membros = [...(grupo.membros || []), { email: novoMembroEmail, nome: novoMembroNome || novoMembroEmail }];
      return base44.entities.GrupoConsultor.update(grupoId, { membros });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos-consultor"] });
      setDialogMembro(null);
      setNovoMembroEmail("");
      setNovoMembroNome("");
    },
  });

  const removerMembro = async (grupoId, email) => {
    const grupo = grupos.find(g => g.id === grupoId);
    const membros = (grupo.membros || []).filter(m => m.email !== email);
    await base44.entities.GrupoConsultor.update(grupoId, { membros });
    queryClient.invalidateQueries({ queryKey: ["grupos-consultor"] });
  };

  const excluirGrupo = async (grupoId) => {
    await base44.entities.GrupoConsultor.delete(grupoId);
    queryClient.invalidateQueries({ queryKey: ["grupos-consultor"] });
  };

  const distribuirProposta = useMutation({
    mutationFn: () => {
      const consultor = todosMembros.find(m => m.email === consultorDestino);
      return base44.entities.Proposta.update(dialogDistribuir.id, {
        consultor_email: consultorDestino,
        consultor_nome: consultor?.nome || consultorDestino,
        consultor_status: "solicitado",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas-grupo"] });
      setDialogDistribuir(null);
      setConsultorDestino("");
    },
  });

  // Estatísticas por consultor
  const statsPorConsultor = emailsMembros.reduce((acc, email) => {
    const props = propostasGrupo.filter(p => p.consultor_email === email);
    const membro = todosMembros.find(m => m.email === email);
    acc[email] = {
      nome: membro?.nome || email,
      total: props.length,
      contratadas: props.filter(p => p.status === "contratada").length,
      em_julgamento: props.filter(p => p.status === "em_julgamento" || p.status === "submetida").length,
      rascunho: props.filter(p => p.status === "rascunho").length,
    };
    return acc;
  }, {});

  if (!user) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("PropostasConsultor")}>
          <Button variant="ghost" className="mb-4 -ml-2"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grupos de Consultores</h1>
            <p className="text-gray-500 text-sm">Gerencie equipes e distribua propostas</p>
          </div>
          <Button onClick={() => setDialogGrupo(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Grupo
          </Button>
        </div>

        <Tabs defaultValue="grupos">
          <TabsList className="mb-6">
            <TabsTrigger value="grupos"><Users className="w-4 h-4 mr-2" />Meus Grupos ({grupos.length})</TabsTrigger>
            <TabsTrigger value="distribuir"><Send className="w-4 h-4 mr-2" />Distribuir Propostas</TabsTrigger>
            <TabsTrigger value="relatorio"><TrendingUp className="w-4 h-4 mr-2" />Relatório</TabsTrigger>
          </TabsList>

          {/* ── ABA GRUPOS ── */}
          <TabsContent value="grupos">
            {loadingGrupos ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
            ) : grupos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Nenhum grupo criado ainda</p>
                  <p className="text-sm text-gray-400 mt-1">Crie um grupo para gerenciar sua equipe de consultores</p>
                  <Button onClick={() => setDialogGrupo(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> Criar Grupo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {grupos.map(grupo => {
                  const expanded = grupoExpandido === grupo.id;
                  const membros = grupo.membros || [];
                  return (
                    <Card key={grupo.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-3 bg-white">
                        <div className="flex items-center justify-between">
                          <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setGrupoExpandido(expanded ? null : grupo.id)}>
                            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Users className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{grupo.nome}</CardTitle>
                              <p className="text-xs text-gray-400">{membros.length} consultor{membros.length !== 1 ? "es" : ""}</p>
                            </div>
                            {expanded ? <ChevronDown className="w-4 h-4 text-gray-400 ml-2" /> : <ChevronRight className="w-4 h-4 text-gray-400 ml-2" />}
                          </button>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setDialogMembro(grupo.id)}>
                              <UserPlus className="w-3.5 h-3.5 mr-1" /> Adicionar
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => excluirGrupo(grupo.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expanded && (
                        <CardContent className="pt-0 px-4 pb-4">
                          {membros.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">Nenhum membro. Adicione consultores ao grupo.</p>
                          ) : (
                            <div className="space-y-2 mt-2">
                              {membros.map((m, i) => {
                                const stats = statsPorConsultor[m.email] || { total: 0, contratadas: 0, em_julgamento: 0 };
                                return (
                                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                      <span className="text-indigo-700 font-bold text-xs">{(m.nome || m.email)[0].toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-800">{m.nome || m.email}</p>
                                      <p className="text-xs text-gray-400">{m.email}</p>
                                    </div>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{stats.total} props</span>
                                      {stats.contratadas > 0 && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{stats.contratadas} contrat.</span>}
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => removerMembro(grupo.id, m.email)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── ABA DISTRIBUIR ── */}
          <TabsContent value="distribuir">
            {loadingPropostas ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : todosMembros.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2" />
                  <p>Crie um grupo e adicione consultores primeiro.</p>
                </CardContent>
              </Card>
            ) : propostasSemConsultor.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-gray-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
                  <p>Nenhuma proposta disponível para distribuição.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">{propostasSemConsultor.length} proposta(s) sem consultor atribuído</p>
                {propostasSemConsultor.map(p => (
                  <Card key={p.id} className="border-l-4 border-l-amber-300">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{p.titulo}</h3>
                        {p.edital_titulo && <p className="text-xs text-indigo-600 mt-0.5">{p.edital_titulo}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">Por: {p.created_by}</p>
                      </div>
                      <Badge className={(STATUS_MAP[p.status] || STATUS_MAP.rascunho).color}>{(STATUS_MAP[p.status] || STATUS_MAP.rascunho).label}</Badge>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setDialogDistribuir(p); setConsultorDestino(""); }}>
                        <Send className="w-3.5 h-3.5 mr-1" /> Distribuir
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── ABA RELATÓRIO ── */}
          <TabsContent value="relatorio">
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Total Propostas</p>
                  <p className="text-2xl font-bold text-indigo-700">{propostasGrupo.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Contratadas</p>
                  <p className="text-2xl font-bold text-emerald-600">{propostasGrupo.filter(p => p.status === "contratada").length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Em Julgamento</p>
                  <p className="text-2xl font-bold text-blue-600">{propostasGrupo.filter(p => p.status === "em_julgamento" || p.status === "submetida").length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Consultores Ativos</p>
                  <p className="text-2xl font-bold text-purple-600">{Object.keys(statsPorConsultor).length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela por consultor */}
            {Object.keys(statsPorConsultor).length === 0 ? (
              <Card>
                <CardContent className="text-center py-10 text-gray-400">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2" />
                  <p>Sem dados para exibir. Distribua propostas à equipe.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Consultor</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Total</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Contratadas</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Em Julgamento</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Rascunho</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(statsPorConsultor).map(([email, s]) => (
                        <tr key={email} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-xs text-indigo-700 font-bold">{s.nome[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{s.nome}</p>
                                <p className="text-xs text-gray-400">{email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-center px-4 py-3 font-bold text-indigo-700">{s.total}</td>
                          <td className="text-center px-4 py-3">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />{s.contratadas}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                              <Clock className="w-3 h-3" />{s.em_julgamento}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3 text-gray-500">{s.rascunho}</td>
                          <td className="text-center px-4 py-3">
                            {s.total > 0 ? (
                              <span className={`text-xs font-bold ${s.contratadas / s.total >= 0.5 ? "text-emerald-600" : "text-amber-600"}`}>
                                {Math.round((s.contratadas / s.total) * 100)}%
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* Listagem de propostas do grupo */}
            {propostasGrupo.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Propostas da Equipe
                </h3>
                <div className="space-y-2">
                  {propostasGrupo.map(p => {
                    const s = STATUS_MAP[p.status] || STATUS_MAP.rascunho;
                    return (
                      <Card key={p.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{p.titulo}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Consultor: {p.consultor_nome || p.consultor_email} · Por: {p.created_by}
                            </p>
                          </div>
                          <Badge className={s.color}>{s.label}</Badge>
                          <Link to={createPageUrl(`PropostaDetalhe?id=${p.id}`)}>
                            <Button size="sm" variant="outline">Ver</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog criar grupo */}
      <Dialog open={dialogGrupo} onOpenChange={setDialogGrupo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Grupo de Consultores</DialogTitle></DialogHeader>
          <div>
            <Label>Nome do Grupo *</Label>
            <Input value={novoGrupoNome} onChange={e => setNovoGrupoNome(e.target.value)} placeholder="Ex: Equipe FAPES, Consultores ES..." className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogGrupo(false)}>Cancelar</Button>
            <Button onClick={() => criarGrupo.mutate()} disabled={!novoGrupoNome || criarGrupo.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {criarGrupo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog adicionar membro */}
      <Dialog open={!!dialogMembro} onOpenChange={() => setDialogMembro(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Consultor ao Grupo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>E-mail do Consultor *</Label>
              <Input value={novoMembroEmail} onChange={e => setNovoMembroEmail(e.target.value)} placeholder="consultor@email.com" type="email" className="mt-1" />
            </div>
            <div>
              <Label>Nome (opcional)</Label>
              <Input value={novoMembroNome} onChange={e => setNovoMembroNome(e.target.value)} placeholder="Nome do consultor" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMembro(null)}>Cancelar</Button>
            <Button onClick={() => adicionarMembro.mutate(dialogMembro)} disabled={!novoMembroEmail || adicionarMembro.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {adicionarMembro.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <UserPlus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog distribuir proposta */}
      <Dialog open={!!dialogDistribuir} onOpenChange={() => setDialogDistribuir(null)}>
        {dialogDistribuir && (
          <DialogContent>
            <DialogHeader><DialogTitle>Distribuir Proposta</DialogTitle></DialogHeader>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
              <p className="font-semibold text-gray-900 text-sm">{dialogDistribuir.titulo}</p>
              {dialogDistribuir.edital_titulo && <p className="text-xs text-gray-500 mt-0.5">{dialogDistribuir.edital_titulo}</p>}
            </div>
            <div>
              <Label>Atribuir ao Consultor</Label>
              <select
                value={consultorDestino}
                onChange={e => setConsultorDestino(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Selecione um consultor</option>
                {todosMembros.map((m, i) => (
                  <option key={i} value={m.email}>{m.nome || m.email}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogDistribuir(null)}>Cancelar</Button>
              <Button onClick={() => distribuirProposta.mutate()} disabled={!consultorDestino || distribuirProposta.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {distribuirProposta.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Send className="w-4 h-4 mr-2" /> Distribuir
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}