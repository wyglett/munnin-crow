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
import { Users, Building2, Plus, Loader2, Send, CheckCircle, AlertCircle, UserPlus, Trash2 } from "lucide-react";

export default function GestaoOrganizacao() {
  const [user, setUser] = useState(null);
  const [dialogMembro, setDialogMembro] = useState(false);
  const [dialogDirecionamento, setDialogDirecionamento] = useState(false);
  const [novoEmail, setNovoEmail] = useState("");
  const [adicionandoNome, setAdicionandoNome] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: membros = [], isLoading: loadingMembros } = useQuery({
    queryKey: ["membros-org", user?.email],
    queryFn: () => base44.entities.MembroOrganizacao.filter({ organizacao_email: user.email }, "-created_date", 100),
    enabled: !!user?.email,
  });

  const { data: solicitacoesPendentes = [] } = useQuery({
    queryKey: ["solicitacoes-org-pendentes"],
    queryFn: () => base44.entities.SolicitacaoTutoria.filter({ status: "pendente" }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: todosConsultores = [] } = useQuery({
    queryKey: ["consultores-lista"],
    queryFn: () => base44.entities.User.filter({ role: "consultor" }, "-created_date", 200),
    enabled: !!user?.email,
  });

  const adicionarMembro = useMutation({
    mutationFn: () => {
      const consultor = todosConsultores.find(c => c.email === novoEmail);
      return base44.entities.MembroOrganizacao.create({
        organizacao_email: user.email,
        organizacao_nome: user.nome_fantasia || user.razao_social || user.full_name,
        consultor_email: novoEmail,
        consultor_nome: consultor?.full_name || adicionandoNome || novoEmail,
        status: "ativo",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membros-org"] });
      setDialogMembro(false);
      setNovoEmail("");
      setAdicionandoNome("");
    },
  });

  const removerMembro = useMutation({
    mutationFn: (id) => base44.entities.MembroOrganizacao.update(id, { status: "inativo" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["membros-org"] }),
  });

  const [direcionando, setDirecionando] = useState(null);
  const [consultorEscolhido, setConsultorEscolhido] = useState("");

  const direcionarSolicitacao = useMutation({
    mutationFn: () => base44.entities.SolicitacaoTutoria.update(direcionando.id, {
      consultor_email: consultorEscolhido,
      consultor_nome: membros.find(m => m.consultor_email === consultorEscolhido)?.consultor_nome || consultorEscolhido,
      status: "em_negociacao",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-org-pendentes"] });
      setDirecionando(null);
      setConsultorEscolhido("");
    },
  });

  if (!user) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  if (!user.e_organizacao) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Acesso Restrito</h2>
            <p className="text-gray-500 text-sm">Esta área é exclusiva para organizações que gerenciam consultores. Seu perfil não está configurado como organização.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const membrosAtivos = membros.filter(m => m.status === "ativo");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.nome_fantasia || user.razao_social || "Minha Organização"}</h1>
              <p className="text-sm text-gray-500">Gestão de equipe de consultores · CNPJ: {user.cnpj}</p>
            </div>
          </div>
          <Button onClick={() => setDialogMembro(true)} className="bg-purple-600 hover:bg-purple-700">
            <UserPlus className="w-4 h-4 mr-2" /> Adicionar Consultor
          </Button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Consultores na Equipe</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{membrosAtivos.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Requisições Pendentes</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{solicitacoesPendentes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total de Membros</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{membros.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="equipe">
          <TabsList>
            <TabsTrigger value="equipe">👥 Equipe</TabsTrigger>
            <TabsTrigger value="requisicoes">
              📋 Requisições Abertas
              {solicitacoesPendentes.length > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{solicitacoesPendentes.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ABA EQUIPE */}
          <TabsContent value="equipe" className="mt-4">
            {loadingMembros ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
            ) : membrosAtivos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum consultor na equipe ainda.</p>
                  <p className="text-sm mt-1">Adicione consultores cadastrados na plataforma para sua equipe.</p>
                  <Button onClick={() => setDialogMembro(true)} className="mt-4 bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Consultor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {membrosAtivos.map(m => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold text-sm">{(m.consultor_nome || m.consultor_email)[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{m.consultor_nome || m.consultor_email}</p>
                        <p className="text-sm text-gray-400">{m.consultor_email}</p>
                        {m.especialidades?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {m.especialidades.map((e, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removerMembro.mutate(m.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ABA REQUISIÇÕES */}
          <TabsContent value="requisicoes" className="mt-4">
            {solicitacoesPendentes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-gray-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
                  <p>Nenhuma requisição pendente no momento.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {solicitacoesPendentes.map(s => (
                  <Card key={s.id} className="border-l-4 border-l-amber-400">
                    <CardContent className="p-4 flex items-start gap-3 justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{s.titulo}</p>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{s.descricao}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-amber-100 text-amber-700 text-xs">{s.area || "Geral"}</Badge>
                          <Badge className={{
                            baixa: "bg-gray-100 text-gray-600", media: "bg-blue-100 text-blue-700", alta: "bg-red-100 text-red-700"
                          }[s.prioridade] || "bg-gray-100 text-gray-600"} >
                            Prioridade {s.prioridade}
                          </Badge>
                          <span className="text-xs text-gray-400">Por: {s.empreendedor_nome || s.empreendedor_email}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
                        disabled={membrosAtivos.length === 0}
                        onClick={() => { setDirecionando(s); setConsultorEscolhido(""); }}
                      >
                        <Send className="w-3 h-3 mr-1" /> Direcionar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog adicionar membro */}
      <Dialog open={dialogMembro} onOpenChange={setDialogMembro}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Consultor à Equipe</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecionar consultor cadastrado</Label>
              <select
                value={novoEmail}
                onChange={e => {
                  const c = todosConsultores.find(c => c.email === e.target.value);
                  setNovoEmail(e.target.value);
                  setAdicionandoNome(c?.full_name || "");
                }}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Selecione um consultor</option>
                {todosConsultores
                  .filter(c => !membrosAtivos.some(m => m.consultor_email === c.email))
                  .map(c => (
                    <option key={c.id} value={c.email}>{c.full_name || c.email} ({c.email})</option>
                  ))}
              </select>
            </div>
            {novoEmail && (
              <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-700">
                <p className="font-medium">{adicionandoNome || novoEmail}</p>
                <p className="text-xs text-indigo-500">{novoEmail}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMembro(false)}>Cancelar</Button>
            <Button
              onClick={() => adicionarMembro.mutate()}
              disabled={!novoEmail || adicionarMembro.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {adicionarMembro.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar à Equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog direcionar requisição */}
      <Dialog open={!!direcionando} onOpenChange={() => setDirecionando(null)}>
        {direcionando && (
          <DialogContent>
            <DialogHeader><DialogTitle>Direcionar Requisição</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-semibold text-gray-900 text-sm">{direcionando.titulo}</p>
                <p className="text-xs text-gray-500 mt-1">{direcionando.descricao}</p>
              </div>
              <div>
                <Label>Escolher consultor da equipe</Label>
                <select
                  value={consultorEscolhido}
                  onChange={e => setConsultorEscolhido(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Selecione um consultor</option>
                  {membrosAtivos.map(m => (
                    <option key={m.id} value={m.consultor_email}>{m.consultor_nome || m.consultor_email}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDirecionando(null)}>Cancelar</Button>
              <Button
                onClick={() => direcionarSolicitacao.mutate()}
                disabled={!consultorEscolhido || direcionarSolicitacao.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {direcionarSolicitacao.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Send className="w-4 h-4 mr-2" /> Direcionar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}