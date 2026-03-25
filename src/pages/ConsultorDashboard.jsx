import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Inbox, Users, Clock, CheckCircle, DollarSign, MessageSquare, Send, Receipt, Bell } from "lucide-react";
import CobrancasTab from "../components/consultor/CobrancasTab";
import NotificacoesConsultorPanel from "../components/notificacoes/NotificacoesConsultorPanel";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function ConsultorDashboard() {
  const [user, setUser] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [propostaOpen, setPropostaOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contrapropostaOpen, setContrapropostaOpen] = useState(false);
  const [contrapropostaValor, setContrapropostaValor] = useState("");
  const [contrapropostaMsg, setContrapropostaMsg] = useState("");
  const queryClient = useQueryClient();

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["solicitacoes-consultor"],
    queryFn: () => base44.entities.SolicitacaoTutoria.list("-created_date", 100),
  });

  const minhasAtribuidas = solicitacoes.filter(s => s.consultor_email === user?.email);
  const gerais = solicitacoes.filter(s => s.tipo === "geral" && s.status === "pendente");

  const enviarProposta = useMutation({
    mutationFn: async ({ taskId, valor, descricao }) => {
      const task = solicitacoes.find(t => t.id === taskId);
      const propostas = task.propostas || [];
      propostas.push({
        id: Date.now().toString(),
        consultor_email: user.email,
        consultor_nome: user.full_name,
        valor: parseFloat(valor),
        descricao,
        status: "aguardando",
        contrapropostas: []
      });
      return base44.entities.SolicitacaoTutoria.update(taskId, { propostas, status: "em_negociacao" });
    },
    onSuccess: () => { queryClient.invalidateQueries(["solicitacoes-consultor"]); setPropostaOpen(false); setValor(""); setDescricao(""); },
  });

  const responderContraproposta = useMutation({
    mutationFn: async ({ taskId, propostaId, acao, novoValor, mensagem }) => {
      const task = solicitacoes.find(t => t.id === taskId);
      const propostas = [...(task.propostas || [])];
      const proposta = propostas.find(p => p.id === propostaId);
      if (acao === "aceitar") {
        proposta.status = "aceita";
        return base44.entities.SolicitacaoTutoria.update(taskId, { 
          propostas, 
          status: "em_atendimento", 
          consultor_email: proposta.consultor_email,
          consultor_nome: proposta.consultor_nome 
        });
      } else {
        proposta.contrapropostas.push({ autor: "consultor", valor: parseFloat(novoValor), mensagem, data: new Date().toISOString() });
        return base44.entities.SolicitacaoTutoria.update(taskId, { propostas });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(["solicitacoes-consultor"]); setContrapropostaOpen(false); },
  });

  const STATUS_MAP = {
    pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    em_negociacao: { label: "Em Negociação", color: "bg-blue-100 text-blue-800" },
    em_atendimento: { label: "Em Atendimento", color: "bg-green-100 text-green-800" },
    concluida: { label: "Concluída", color: "bg-gray-100 text-gray-700" },
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard de Consultor</h1>
        <p className="text-gray-500 text-sm mb-6">Gerencie suas requisições e propostas</p>

        <Tabs defaultValue="atribuidas">
          <TabsList>
            <TabsTrigger value="atribuidas">Minhas Requisições ({minhasAtribuidas.length})</TabsTrigger>
            <TabsTrigger value="gerais">Requisições Gerais ({gerais.length})</TabsTrigger>
            <TabsTrigger value="cobrancas">Recibos / NF</TabsTrigger>
            <TabsTrigger value="notificacoes"><Bell className="w-3.5 h-3.5 mr-1 inline" />Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="atribuidas" className="mt-6">
            {minhasAtribuidas.length === 0 ? (
              <Card><CardContent className="text-center py-12 text-gray-400">Nenhuma requisição atribuída</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {minhasAtribuidas.map(s => (
                  <Card key={s.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{s.titulo}</h3>
                            <Badge className={STATUS_MAP[s.status]?.color}>{STATUS_MAP[s.status]?.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{s.descricao}</p>
                          <p className="text-xs text-indigo-600 mt-2">Solicitado por: {s.empreendedor_nome || s.created_by}</p>
                        </div>
                        <Button size="sm" onClick={() => setSelectedTask(s)}>Ver Detalhes</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="gerais" className="mt-6">
            {gerais.length === 0 ? (
              <Card><CardContent className="text-center py-12 text-gray-400">Nenhuma requisição geral disponível</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {gerais.map(s => {
                  const jaPropus = s.propostas?.some(p => p.consultor_email === user?.email);
                  return (
                    <Card key={s.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{s.titulo}</h3>
                            <p className="text-sm text-gray-600 mt-1">{s.descricao}</p>
                            {s.area && <Badge className="mt-2 bg-indigo-100 text-indigo-700 text-xs">{s.area}</Badge>}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => { setSelectedTask(s); setPropostaOpen(true); }}
                            disabled={jaPropus}
                          >
                            {jaPropus ? "Proposta Enviada" : "Enviar Proposta"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          <TabsContent value="cobrancas" className="mt-6">
            <CobrancasTab user={user} />
          </TabsContent>
          <TabsContent value="notificacoes" className="mt-6">
            <NotificacoesConsultorPanel user={user} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Proposta */}
      <Dialog open={propostaOpen} onOpenChange={setPropostaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar Proposta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" required /></div>
            <div><Label>Descrição da Proposta *</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o que você oferece..." rows={3} required /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropostaOpen(false)}>Cancelar</Button>
            <Button onClick={() => enviarProposta.mutate({ taskId: selectedTask?.id, valor, descricao })} disabled={!valor || !descricao} className="bg-indigo-600 hover:bg-indigo-700">Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={!!selectedTask && !propostaOpen} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selectedTask?.titulo}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><p className="text-sm text-gray-600">{selectedTask?.descricao}</p></div>
            {selectedTask?.propostas?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Propostas / Negociações</h4>
                {selectedTask.propostas.filter(p => p.consultor_email === user?.email).map(p => (
                  <Card key={p.id} className="mb-2">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div><p className="font-medium">{fmt(p.valor)}</p><p className="text-xs text-gray-500">{p.descricao}</p></div>
                        <Badge className={p.status === "aceita" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{p.status === "aceita" ? "Aceita" : "Aguardando"}</Badge>
                      </div>
                      {p.contrapropostas?.length > 0 && (
                        <div className="border-t pt-2 mt-2 space-y-2">
                          {p.contrapropostas.map((cp, i) => (
                            <div key={i} className={`p-2 rounded text-xs ${cp.autor === "empreendedor" ? "bg-blue-50" : "bg-gray-50"}`}>
                              <p className="font-medium">{cp.autor === "empreendedor" ? "Empreendedor" : "Você"}: {fmt(cp.valor)}</p>
                              <p className="text-gray-600">{cp.mensagem}</p>
                            </div>
                          ))}
                          {p.contrapropostas[p.contrapropostas.length - 1]?.autor === "empreendedor" && p.status !== "aceita" && (
                            <Button size="sm" onClick={() => setContrapropostaOpen(true)} className="mt-2">Responder</Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}