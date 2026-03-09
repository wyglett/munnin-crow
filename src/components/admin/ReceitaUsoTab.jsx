import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Users, FileText, Activity, Plus, Trash2, Pencil, DollarSign, MessageSquare, BookOpen } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";

const STATUS_COLORS = { confirmado: "bg-green-100 text-green-700", pendente: "bg-yellow-100 text-yellow-700", cancelado: "bg-red-100 text-red-700" };
const PLANOS_CORES = { Freemium: "#64748b", Básico: "#6366f1", Premium: "#8b5cf6", Pro: "#f59e0b", Master: "#dc2626" };

const EMPTY_FORM = { tipo: "assinatura", plano: "Básico", user_email: "", user_nome: "", valor: "", descricao: "", data: new Date().toISOString().slice(0, 10), status: "confirmado" };

function StatCard({ icon: IconComp, label, value, sub, cor }) {
  const Icon = IconComp;
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cor + "20" }}>
          <Icon className="w-5 h-5" style={{ color: cor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReceitaUsoTab() {
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const { data: receitas = [] } = useQuery({ queryKey: ["receitas"], queryFn: () => base44.entities.Receita.list("-created_date", 500) });
  const { data: users = [] } = useQuery({ queryKey: ["users-uso"], queryFn: () => base44.entities.User.list() });
  const { data: propostas = [] } = useQuery({ queryKey: ["propostas-uso"], queryFn: () => base44.entities.Proposta.list("-created_date", 500) });
  const { data: projetos = [] } = useQuery({ queryKey: ["projetos-uso"], queryFn: () => base44.entities.AcompanhamentoProjeto.list("-created_date", 500) });
  const { data: mensagens = [] } = useQuery({ queryKey: ["mensagens-uso"], queryFn: () => base44.entities.MensagemChat.list("-created_date", 500) });
  const { data: orientacoes = [] } = useQuery({ queryKey: ["orientacoes-uso"], queryFn: () => base44.entities.Orientacao.list() });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastos-uso"], queryFn: () => base44.entities.GastoProjeto.list("-created_date", 500) });

  const save = useMutation({
    mutationFn: (d) => editando ? base44.entities.Receita.update(editando.id, d) : base44.entities.Receita.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receitas"] }); setFormOpen(false); setEditando(null); setForm(EMPTY_FORM); }
  });
  const remove = useMutation({
    mutationFn: (id) => base44.entities.Receita.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receitas"] })
  });

  const openEdit = (r) => { setEditando(r); setForm({ ...r }); setFormOpen(true); };
  const openNew = () => { setEditando(null); setForm(EMPTY_FORM); setFormOpen(true); };

  // Cálculos
  const receitasConfirmadas = receitas.filter(r => r.status === "confirmado");
  const totalReceita = receitasConfirmadas.reduce((s, r) => s + (Number(r.valor) || 0), 0);

  // Receita por mês (últimos 6 meses)
  const receitaPorMes = (() => {
    const agora = new Date();
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const total = receitas
        .filter(r => r.status === "confirmado" && r.data?.startsWith(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`))
        .reduce((s, r) => s + (Number(r.valor) || 0), 0);
      meses.push({ mes: label, receita: total });
    }
    return meses;
  })();

  // Receita por plano
  const receitaPorPlano = Object.entries(
    receitasConfirmadas.reduce((acc, r) => { acc[r.plano || "Outro"] = (acc[r.plano || "Outro"] || 0) + (Number(r.valor) || 0); return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Usuários por role
  const usersPorRole = [
    { name: "Empreendedor", value: users.filter(u => u.role === "empreendedor" || !u.role).length, fill: "#6366f1" },
    { name: "Consultor", value: users.filter(u => u.role === "consultor").length, fill: "#10b981" },
    { name: "Admin", value: users.filter(u => u.role === "admin").length, fill: "#dc2626" },
  ].filter(u => u.value > 0);

  // Uso por ferramenta
  const usoFerramentas = [
    { ferramenta: "Propostas criadas", total: propostas.length },
    { ferramenta: "Projetos ativos", total: projetos.filter(p => p.status === "ativo").length },
    { ferramenta: "Msgs na comunidade", total: mensagens.length },
    { ferramenta: "Gastos registrados", total: gastos.length },
    { ferramenta: "Orientações", total: orientacoes.length },
    { ferramenta: "Propostas submetidas", total: propostas.filter(p => p.status === "submetida").length },
  ];

  // Atividade recente (últimos 30 dias)
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const receitasMes = receitas.filter(r => r.created_date > trintaDiasAtras && r.status === "confirmado").reduce((s, r) => s + (Number(r.valor) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Receita Total" value={fmt(totalReceita)} sub={`${receitasConfirmadas.length} transações`} cor="#10b981" />
        <StatCard icon={TrendingUp} label="Receita (30 dias)" value={fmt(receitasMes)} sub="últimos 30 dias" cor="#6366f1" />
        <StatCard icon={Users} label="Usuários" value={users.length} sub={`${users.filter(u => u.role === "empreendedor" || !u.role).length} empreendedores`} cor="#f59e0b" />
        <StatCard icon={Activity} label="Projetos Ativos" value={projetos.filter(p => p.status === "ativo").length} sub={`${projetos.length} no total`} cor="#dc2626" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border rounded-xl p-4">
          <p className="text-sm font-bold text-gray-700 mb-4">Receita por Mês</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={receitaPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="receita" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm font-bold text-gray-700 mb-4">Usuários por Perfil</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={usersPorRole} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {usersPorRole.map((u, i) => <Cell key={i} fill={u.fill} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Uso de ferramentas */}
      <div className="bg-white border rounded-xl p-4">
        <p className="text-sm font-bold text-gray-700 mb-4">Uso das Ferramentas</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={usoFerramentas} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="ferramenta" tick={{ fontSize: 11 }} width={140} />
            <Tooltip />
            <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Receitas Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <p className="text-sm font-bold text-gray-700">Controle de Receitas</p>
          <Button size="sm" onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-3.5 h-3.5 mr-1" /> Registrar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-xs text-gray-600 uppercase">
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Usuário</th>
              <th className="text-left p-3">Plano / Tipo</th>
              <th className="text-right p-3">Valor</th>
              <th className="text-center p-3">Status</th>
              <th className="p-3 w-20"></th>
            </tr></thead>
            <tbody className="divide-y">
              {receitas.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Nenhuma receita registrada ainda</td></tr>
              )}
              {receitas.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{fmtDate(r.data)}</td>
                  <td className="p-3">
                    <p className="font-medium text-gray-800">{r.user_nome || "—"}</p>
                    <p className="text-xs text-gray-400">{r.user_email}</p>
                  </td>
                  <td className="p-3">
                    {r.plano && <span className="text-xs font-bold px-2 py-0.5 rounded text-white mr-1" style={{ background: PLANOS_CORES[r.plano] || "#64748b" }}>{r.plano}</span>}
                    <span className="text-xs text-gray-500">{r.tipo}</span>
                    {r.descricao && <p className="text-xs text-gray-400 mt-0.5">{r.descricao}</p>}
                  </td>
                  <td className="p-3 text-right font-bold text-gray-800">{fmt(r.valor)}</td>
                  <td className="p-3 text-center">
                    <Badge className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { if (confirm("Excluir?")) remove.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editando ? "Editar Receita" : "Registrar Receita"}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); save.mutate({ ...form, valor: Number(form.valor) }); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="assinatura">Assinatura</SelectItem><SelectItem value="consultoria">Consultoria</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Plano</Label>
                <Select value={form.plano} onValueChange={v => setForm({ ...form, plano: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Freemium">Freemium</SelectItem><SelectItem value="Básico">Básico</SelectItem><SelectItem value="Premium">Premium</SelectItem><SelectItem value="Pro">Pro</SelectItem><SelectItem value="Master">Master</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Nome do Usuário</Label><Input className="mt-1" value={form.user_nome} onChange={e => setForm({ ...form, user_nome: e.target.value })} /></div>
            <div><Label>E-mail do Usuário</Label><Input className="mt-1" type="email" value={form.user_email} onChange={e => setForm({ ...form, user_email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$)</Label><Input className="mt-1" type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} required /></div>
              <div><Label>Data</Label><Input className="mt-1" type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></div>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="confirmado">Confirmado</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Input className="mt-1" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending} className="bg-indigo-600 hover:bg-indigo-700">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}