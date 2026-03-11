import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, FileText, Activity, MessageSquare, DollarSign, TrendingUp, Award, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatCard({ icon: Icon, label, value, sub, cor }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: cor + "22" }}>
          <Icon className="w-5 h-5" style={{ color: cor }} />
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cor + "15", color: cor }}>
          {sub}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function agruparPorMes(items, campo = "created_date") {
  const meses = {};
  items.forEach(item => {
    const d = item[campo];
    if (!d) return;
    const key = d.slice(0, 7); // YYYY-MM
    if (!meses[key]) meses[key] = 0;
    meses[key]++;
  });
  return Object.entries(meses)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mes, total]) => ({
      mes: mes.slice(5) + "/" + mes.slice(2, 4),
      total,
    }));
}

export default function ReceitasUsoTab() {
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: () => base44.entities.User.list() });
  const { data: propostas = [] } = useQuery({ queryKey: ["admin-propostas"], queryFn: () => base44.entities.Proposta.list("-created_date", 500) });
  const { data: acompanhamentos = [] } = useQuery({ queryKey: ["admin-acomp"], queryFn: () => base44.entities.AcompanhamentoProjeto.list("-created_date", 500) });
  const { data: gastos = [] } = useQuery({ queryKey: ["admin-gastos"], queryFn: () => base44.entities.GastoProjeto.list("-created_date", 500) });
  const { data: mensagens = [] } = useQuery({ queryKey: ["admin-msgs"], queryFn: () => base44.entities.MensagemChat.list("-created_date", 500) });
  const { data: progressos = [] } = useQuery({ queryKey: ["admin-progressos"], queryFn: () => base44.entities.ProgressoTrilha.list("-pontos", 100) });

  const totalGastos = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const fmt = v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const empreendedores = users.filter(u => u.role === "empreendedor" || !u.role);
  const consultores = users.filter(u => u.role === "consultor");
  const admins = users.filter(u => u.role === "admin");

  const propostasPorMes = agruparPorMes(propostas);
  const usuariosPorMes = agruparPorMes(users);
  const msgsPorMes = agruparPorMes(mensagens);

  // Atividade recente: une todos os itens e ordena por data
  const atividadeRecente = [
    ...propostas.slice(0, 20).map(p => ({ tipo: "Proposta criada", nome: p.titulo, data: p.created_date, email: p.created_by, cor: "#8b5cf6" })),
    ...acompanhamentos.slice(0, 20).map(a => ({ tipo: "Projeto iniciado", nome: a.titulo, data: a.created_date, email: a.created_by, cor: "#0ea5e9" })),
    ...mensagens.slice(0, 20).map(m => ({ tipo: "Mensagem comunidade", nome: m.conteudo?.slice(0, 40) + "...", data: m.created_date, email: m.autor_email, cor: "#f43f5e" })),
    ...gastos.slice(0, 10).map(g => ({ tipo: "Gasto registrado", nome: g.descricao, data: g.created_date, email: g.created_by, cor: "#f59e0b" })),
  ]
    .filter(a => a.data)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 25);

  const roleData = [
    { role: "Empreendedores", total: empreendedores.length, cor: "#6366f1" },
    { role: "Consultores", total: consultores.length, cor: "#10b981" },
    { role: "Admins", total: admins.length, cor: "#dc2626" },
  ];

  const topUsuarios = progressos.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Usuários cadastrados" value={users.length} sub={`${empreendedores.length} emp. · ${consultores.length} cons.`} cor="#6366f1" />
        <StatCard icon={FileText} label="Propostas criadas" value={propostas.length} sub={`${propostas.filter(p => p.status === "aprovada").length} aprovadas`} cor="#8b5cf6" />
        <StatCard icon={Activity} label="Projetos acompanhados" value={acompanhamentos.length} sub={`${acompanhamentos.filter(a => a.status === "ativo").length} ativos`} cor="#0ea5e9" />
        <StatCard icon={DollarSign} label="Total gastos registrados" value={fmt(totalGastos)} sub={`${gastos.length} lançamentos`} cor="#f59e0b" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={MessageSquare} label="Mensagens na comunidade" value={mensagens.length} sub="Interações totais" cor="#f43f5e" />
        <StatCard icon={Award} label="Usuários na trilha gamificada" value={progressos.length} sub={`${progressos.reduce((s, p) => s + (p.pontos || 0), 0)} pontos distribuídos`} cor="#10b981" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-bold text-gray-700 mb-4">Propostas por Mês</p>
          {propostasPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={propostasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sem dados ainda</div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-bold text-gray-700 mb-4">Mensagens na Comunidade por Mês</p>
          {msgsPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={msgsPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sem dados ainda</div>
          )}
        </div>
      </div>

      {/* Distribuição de usuários */}
      <div className="bg-white rounded-xl border p-5">
        <p className="text-sm font-bold text-gray-700 mb-4">Distribuição de Usuários por Perfil</p>
        <div className="flex gap-6 items-center">
          {roleData.map(r => (
            <div key={r.role} className="flex-1 text-center">
              <div className="text-3xl font-black mb-1" style={{ color: r.cor }}>{r.total}</div>
              <div className="text-xs text-gray-500">{r.role}</div>
              <div className="h-2 rounded-full mt-2" style={{ background: r.cor + "33" }}>
                <div className="h-2 rounded-full transition-all" style={{ width: users.length > 0 ? `${(r.total / users.length) * 100}%` : "0%", background: r.cor }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking O Voo do Corvo */}
      {topUsuarios.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-bold text-gray-700 mb-4">🦅 Top Usuários — O Voo do Corvo</p>
          <div className="divide-y">
            {topUsuarios.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2">
                <span className="text-sm font-bold w-6 text-center" style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c54" : "#cbd5e1" }}>
                  {i + 1}º
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{p.usuario_nome || p.usuario_email}</p>
                  <p className="text-xs text-gray-400">{p.role} · {(p.tarefas_concluidas || []).length} tarefas</p>
                </div>
                <span className="text-sm font-bold text-indigo-600">{p.pontos || 0} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline de atividade recente */}
      <div className="bg-white rounded-xl border p-5">
        <p className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Atividade Recente da Plataforma
        </p>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {atividadeRecente.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma atividade registrada ainda.</p>
          ) : (
            atividadeRecente.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.cor }} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold mr-1.5" style={{ color: a.cor }}>{a.tipo}</span>
                  <span className="text-xs text-gray-600 truncate">{a.nome}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400">{a.email?.split("@")[0]}</p>
                  <p className="text-[10px] text-gray-300">{a.data ? new Date(a.data).toLocaleDateString("pt-BR") : ""}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}