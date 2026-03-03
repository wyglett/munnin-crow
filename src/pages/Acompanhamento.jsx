import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Activity, Calendar, DollarSign, Loader2, ArrowRight, Users, Clock, CheckCircle, Upload, FileText, Sparkles, Link2 } from "lucide-react";
import moment from "moment";

const STATUS_MAP = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-800" },
  concluido: { label: "Concluído", color: "bg-blue-100 text-blue-800" },
  suspenso: { label: "Suspenso", color: "bg-yellow-100 text-yellow-800" },
};

const CONSULTOR_STATUS = {
  sem_consultor: null,
  aguardando: { label: "Buscando Consultor", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  em_negociacao: { label: "Em Negociação", color: "bg-blue-100 text-blue-700", icon: Users },
  aprovado: { label: "Consultor Aprovado", color: "bg-green-100 text-green-700", icon: CheckCircle },
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function Acompanhamento() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao_projeto: "", orgao_financiador: "", numero_edital: "", valor_contratado: "", data_inicio: "", data_fim_prevista: "", status: "ativo" });
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const isConsultor = user?.role === "consultor";

  const { data: projetos = [], isLoading } = useQuery({
    queryKey: ["acompanhamentos"],
    queryFn: () => base44.entities.AcompanhamentoProjeto.list("-created_date", 50),
  });

  // Consultores só veem projetos que estão abertos para propostas ou onde foram convidados
  const projetosFiltrados = isConsultor
    ? projetos.filter(p =>
        p.busca_consultor === "aberto" ||
        (p.busca_consultor === "direto" && p.consultor_solicitado_email === user?.email)
      )
    : projetos.filter(p => p.created_by === user?.email);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AcompanhamentoProjeto.create({ ...data, valor_contratado: data.valor_contratado ? parseFloat(data.valor_contratado) : null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] }); setDialogOpen(false); setForm({ titulo: "", descricao_projeto: "", orgao_financiador: "", numero_edital: "", valor_contratado: "", data_inicio: "", data_fim_prevista: "", status: "ativo" }); },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isConsultor ? "Projetos Disponíveis" : "Acompanhamento de Projetos"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isConsultor ? "Projetos de empreendedores buscando consultoria" : "Gerencie projetos contratados — gastos, relatórios e documentação"}
            </p>
          </div>
          {!isConsultor && (
            <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Novo Projeto
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : projetosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {isConsultor ? "Nenhum projeto disponível para consultoria no momento" : "Nenhum projeto em acompanhamento"}
              </p>
              {!isConsultor && (
                <Button onClick={() => setDialogOpen(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> Criar Projeto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {projetosFiltrados.map((p) => {
              const consultorInfo = CONSULTOR_STATUS[p.consultor_status];
              const IconC = consultorInfo?.icon;
              return (
                <Card key={p.id} className="border-l-4 border-l-indigo-600 hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <h2 className="font-semibold text-gray-900">{p.titulo}</h2>
                        <Badge className={STATUS_MAP[p.status]?.color}>{STATUS_MAP[p.status]?.label}</Badge>
                        {consultorInfo && (
                          <Badge className={`${consultorInfo.color} flex items-center gap-1`}>
                            {IconC && <IconC className="w-3 h-3" />} {consultorInfo.label}
                          </Badge>
                        )}
                      </div>
                      {p.orgao_financiador && <p className="text-sm text-indigo-600">{p.orgao_financiador}{p.numero_edital ? ` · ${p.numero_edital}` : ""}</p>}
                      {isConsultor && p.descricao_projeto && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{p.descricao_projeto}</p>}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                        {p.valor_contratado && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-green-600" /> {fmt(p.valor_contratado)}</span>}
                        {p.data_inicio && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {moment(p.data_inicio).format("DD/MM/YYYY")} → {p.data_fim_prevista ? moment(p.data_fim_prevista).format("DD/MM/YYYY") : "—"}</span>}
                        {isConsultor && p.busca_consultor === "aberto" && <Badge className="bg-indigo-50 text-indigo-700 text-xs">Aberto para propostas</Badge>}
                      </div>
                    </div>
                    <Link to={createPageUrl(`ProjetoDetalhe?id=${p.id}`)}>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0">
                        {isConsultor ? "Ver Projeto" : "Gerenciar"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required placeholder="Nome do projeto" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Órgão Financiador</Label><Input value={form.orgao_financiador} onChange={(e) => setForm({ ...form, orgao_financiador: e.target.value })} placeholder="FAPES, CNPq..." /></div>
              <div><Label>Nº do Edital</Label><Input value={form.numero_edital} onChange={(e) => setForm({ ...form, numero_edital: e.target.value })} placeholder="Ex: 03/2025" /></div>
            </div>
            <div><Label>Valor Contratado (R$)</Label><Input type="number" step="0.01" value={form.valor_contratado} onChange={(e) => setForm({ ...form, valor_contratado: e.target.value })} placeholder="0,00" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
              <div><Label>Término Previsto</Label><Input type="date" value={form.data_fim_prevista} onChange={(e) => setForm({ ...form, data_fim_prevista: e.target.value })} /></div>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.descricao_projeto} onChange={(e) => setForm({ ...form, descricao_projeto: e.target.value })} rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar Projeto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}