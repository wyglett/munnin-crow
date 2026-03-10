import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, UserCheck, ArrowRight, Building2, Loader2, Trash2, CheckCircle } from "lucide-react";

export default function GestaoOrganizacao() {
  const [user, setUser] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [delegarDialog, setDelegarDialog] = useState(null); // solicitacao
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: membros = [], isLoading } = useQuery({
    queryKey: ["membros-org", user?.email],
    queryFn: () => base44.entities.MembroOrganizacao.filter({ organizacao_email: user.email, status: "ativo" }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["solicitacoes-org", user?.email],
    queryFn: () => base44.entities.SolicitacaoTutoria.filter({ consultor_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const adicionarMembro = useMutation({
    mutationFn: () => base44.entities.MembroOrganizacao.create({
      organizacao_email: user.email,
      organizacao_nome: user.nome_fantasia || user.razao_social || user.full_name,
      consultor_email: novoEmail,
      consultor_nome: novoNome,
      status: "ativo",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membros-org"] });
      setAddDialog(false);
      setNovoEmail("");
      setNovoNome("");
    },
  });

  const removerMembro = useMutation({
    mutationFn: (id) => base44.entities.MembroOrganizacao.update(id, { status: "inativo" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["membros-org"] }),
  });

  const delegarSolicitacao = useMutation({
    mutationFn: ({ solId, membro }) => base44.entities.SolicitacaoTutoria.update(solId, {
      consultor_email: membro.consultor_email,
      consultor_nome: membro.consultor_nome,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-org"] });
      setDelegarDialog(null);
    },
  });

  if (!user) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  if (!user.e_organizacao) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Área exclusiva para Organizações</h2>
            <p className="text-sm text-gray-500">Seu perfil não está configurado como uma organização de consultores. Se você gerencia uma equipe, atualize seu perfil.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendentes = solicitacoes.filter(s => s.status === "pendente");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Organização</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{user.nome_fantasia || user.razao_social}</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie sua equipe e delegue solicitações de acompanhamento</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">CNPJ</p>
            <p className="text-sm font-mono font-medium text-gray-700">{user.cnpj}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Consultores na Equipe", value: membros.length, icon: Users, color: "text-purple-600" },
            { label: "Solicitações Recebidas", value: solicitacoes.length, icon: CheckCircle, color: "text-blue-600" },
            { label: "Aguardando Delegação", value: pendentes.length, icon: ArrowRight, color: "text-amber-600" },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <c.icon className={`w-8 h-8 ${c.color} opacity-70`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                  <p className="text-xs text-gray-500">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="equipe">
          <TabsList>
            <TabsTrigger value="equipe">👥 Equipe de Consultores</TabsTrigger>
            <TabsTrigger value="solicitacoes">
              📋 Solicitações
              {pendentes.length > 0 && <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendentes.length}</span>}
            </TabsTrigger>
          </TabsList>

          {/* ABA EQUIPE */}
          <TabsContent value="equipe" className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800">Consultores da Equipe</h2>
              <Button onClick={() => setAddDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Consultor
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
            ) : membros.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Nenhum consultor na equipe ainda</p>
                  <p className="text-xs mt-1">Adicione consultores para delegar solicitações</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {membros.map(m => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{m.consultor_nome || m.consultor_email}</p>
                        <p className="text-sm text-gray-500">{m.consultor_email}</p>
                        {m.especialidades?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {m.especialidades.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                          </div>
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removerMembro.mutate(m.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ABA SOLICITAÇÕES */}
          <TabsContent value="solicitacoes" className="mt-4">
            <div className="space-y-3">
              {solicitacoes.length === 0 ? (
                <Card><CardContent className="text-center py-10 text-gray-400">Nenhuma solicitação recebida</CardContent></Card>
              ) : solicitacoes.map(s => {
                const jaFoiDelegada = s.consultor_email !== user.email;
                return (
                  <Card key={s.id} className={`border-l-4 ${jaFoiDelegada ? "border-l-green-400" : "border-l-amber-400"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{s.titulo}</p>
                            <Badge className={{
                              pendente: "bg-yellow-100 text-yellow-800",
                              em_negociacao: "bg-blue-100 text-blue-800",
                              em_atendimento: "bg-green-100 text-green-800",
                              concluida: "bg-gray-100 text-gray-700",
                            }[s.status] || "bg-gray-100 text-gray-700"}>
                              {s.status?.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{s.descricao}</p>
                          <p className="text-xs text-indigo-600 mt-1">Empreendedor: {s.empreendedor_nome || s.empreendedor_email}</p>
                          {jaFoiDelegada && (
                            <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" /> Delegada para: {s.consultor_nome || s.consultor_email}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end flex-shrink-0">
                          {membros.length > 0 && (
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs h-8"
                              onClick={() => setDelegarDialog(s)}>
                              <ArrowRight className="w-3 h-3 mr-1" />
                              {jaFoiDelegada ? "Redelegar" : "Delegar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog adicionar consultor */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar Consultor à Equipe</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>E-mail do Consultor *</Label>
              <Input value={novoEmail} onChange={e => setNovoEmail(e.target.value)} placeholder="consultor@exemplo.com" />
            </div>
            <div>
              <Label>Nome do Consultor</Label>
              <Input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome completo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancelar</Button>
            <Button onClick={() => adicionarMembro.mutate()} disabled={!novoEmail || adicionarMembro.isPending}
              className="bg-purple-600 hover:bg-purple-700">
              {adicionarMembro.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog delegar solicitação */}
      <Dialog open={!!delegarDialog} onOpenChange={() => setDelegarDialog(null)}>
        {delegarDialog && (
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Delegar Solicitação</DialogTitle></DialogHeader>
            <div>
              <p className="text-sm text-gray-600 mb-1 font-medium">{delegarDialog.titulo}</p>
              <p className="text-xs text-gray-400 mb-4">Selecione qual consultor da equipe irá atender esta solicitação:</p>
              <div className="space-y-2">
                {membros.map(m => (
                  <button key={m.id}
                    onClick={() => delegarSolicitacao.mutate({ solId: delegarDialog.id, membro: m })}
                    disabled={delegarSolicitacao.isPending}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-purple-400 hover:bg-purple-50 transition-all text-left">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{m.consultor_nome || m.consultor_email}</p>
                      <p className="text-xs text-gray-500">{m.consultor_email}</p>
                    </div>
                    {delegarSolicitacao.isPending && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}