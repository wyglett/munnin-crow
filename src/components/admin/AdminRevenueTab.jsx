import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Activity, MessageSquare, TrendingUp, DollarSign, BookOpen, Handshake } from "lucide-react";


import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const PLANO_VALORES = { freemium: 0, basico: 49, premium: 99, pro: 199, master: 499 };
const PLANO_CORES = { freemium: "#94a3b8", basico: "#6366f1", premium: "#8b5cf6", pro: "#f59e0b", master: "#dc2626" };
const STATUS_CORES = { rascunho: "#94a3b8", em_analise: "#6366f1", submetida: "#f59e0b", aprovada: "#22c55e", rejeitada: "#ef4444" };

function StatCard({ icon: Icon, title, value, sub, color = "#6366f1" }) {
  // Icon is used as a component below
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: color + "20" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function groupByMonth(items) {
  const groups = {};
  items.forEach(item => {
    const d = item.created_date ? new Date(item.created_date) : null;
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    groups[key] = (groups[key] || 0) + 1;
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mes, total]) => ({ mes: mes.slice(5) + "/" + mes.slice(0, 4), total }));
}

export default function AdminRevenueTab() {
  const [abaSelecionada, setAbaSelecionada] = useState("visao_geral");

  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: () => base44.entities.User.list() });
  const { data: propostas = [] } = useQuery({ queryKey: ["admin-propostas"], queryFn: () => base44.entities.Proposta.list("-created_date", 500) });
  const { data: projetos = [] } = useQuery({ queryKey: ["admin-projetos"], queryFn: () => base44.entities.AcompanhamentoProjeto.list("-created_date", 500) });
  const { data: mensagens = [] } = useQuery({ queryKey: ["admin-mensagens"], queryFn: () => base44.entities.MensagemChat.list("-created_date", 500) });
  const { data: tutorias = [] } = useQuery({ queryKey: ["admin-tutorias"], queryFn: () => base44.entities.SolicitacaoTutoria.list("-created_date", 500) });
  const { data: gastos = [] } = useQuery({ queryKey: ["admin-gastos"], queryFn: () => base44.entities.GastoProjeto.list("-created_date", 500) });
  const { data: assinaturas = [] } = useQuery({ queryKey: ["admin-assinaturas"], queryFn: () => base44.entities.RegistroAssinatura.list("-created_date", 500) });
  const { data: progressos = [] } = useQuery({ queryKey: ["admin-progressos"], queryFn: () => base44.entities.ProgressoGamificacao.list("-pontos", 100) });

  const empreendedores = users.filter(u => u.role === "empreendedor" || !u.role).length;
  const consultores = users.filter(u => u.role === "consultor").length;
  const admins = users.filter(u => u.role === "admin").length;

  const receitaMensal = assinaturas
    .filter(a => a.status === "ativo")
    .reduce((s, a) => s + (PLANO_VALORES[a.plano] || 0), 0);

  const receitaPotencial = users.length * 49; // base estimate

  const distribuicaoRoles = [
    { name: "Empreendedores", value: empreendedores, cor: "#6366f1" },
    { name: "Consultores", value: consultores, cor: "#10b981" },
    { name: "Admins", value: admins, cor: "#dc2626" },
  ].filter(r => r.value > 0);

  const distribuicaoPlanos = Object.entries(
    assinaturas.reduce((acc, a) => { acc[a.plano] = (acc[a.plano] || 0) + 1; return acc; }, {})
  ).map(([plano, count]) => ({ name: plano.charAt(0).toUpperCase() + plano.slice(1), value: count, cor: PLANO_CORES[plano] || "#6366f1" }));

  const propostasStatus = Object.entries(
    propostas.reduce((acc, p) => { acc[p.status || "rascunho"] = (acc[p.status || "rascunho"] || 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ name: status, total: count, cor: STATUS_CORES[status] || "#6366f1" }));

  const crescimentoUsuarios = groupByMonth(users);
  const crescimentoPropostas = groupByMonth(propostas);

  const totalGastos = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  const ABA_STYLE = (id) => `px-4 py-2 rounded-lg text-sm font-medium transition-all ${abaSelecionada === id ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`;

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setAbaSelecionada("visao_geral")} className={ABA_STYLE("visao_geral")}>Visão Geral</button>
        <button onClick={() => setAbaSelecionada("receitas")} className={ABA_STYLE("receitas")}>Receitas & Planos</button>
        <button onClick={() => setAbaSelecionada("uso")} className={ABA_STYLE("uso")}>Uso das Ferramentas</button>
        <button onClick={() => setAbaSelecionada("gamificacao")} className={ABA_STYLE("gamificacao")}>Gamificação</button>
      </div>

      {abaSelecionada === "visao_geral" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} title="Total de Usuários" value={users.length} sub={`${empreendedores} empreend. · ${consultores} consult.`} color="#6366f1" />
            <StatCard icon={FileText} title="Propostas" value={propostas.length} sub={`${propostas.filter(p => p.status === "aprovada").length} aprovadas`} color="#8b5cf6" />
            <StatCard icon={Activity} title="Projetos" value={projetos.length} sub={`${projetos.filter(p => p.status === "ativo").length} ativos`} color="#0ea5e9" />
            <StatCard icon={MessageSquare} title="Mensagens" value={mensagens.length} sub="na Comunidade" color="#f43f5e" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Handshake} title="Tutorias" value={tutorias.length} sub={`${tutorias.filter(t => t.status === "em_atendimento").length} em andamento`} color="#10b981" />
            <StatCard icon={DollarSign} title="Total em Gastos" value={fmt(totalGastos)} sub="em projetos" color="#f59e0b" />
            <StatCard icon={BookOpen} title="Assinaturas" value={assinaturas.filter(a => a.status === "ativo").length} sub="planos ativos" color="#dc2626" />
            <StatCard icon={TrendingUp} title="MRR Atual" value={fmt(receitaMensal)} sub={`Potencial: ${fmt(receitaPotencial)}`} color="#16a34a" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Distribuição por Papel</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={distribuicaoRoles} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      {distribuicaoRoles.map((r, i) => <Cell key={i} fill={r.cor} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Crescimento de Usuários (últimos 6 meses)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={crescimentoUsuarios}>
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#6366f1" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Feed de atividade recente */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Atividade Recente</CardTitle></CardHeader>
            <CardContent className="divide-y max-h-72 overflow-y-auto">
              {[
                ...propostas.slice(0, 5).map(p => ({ tipo: "Proposta", desc: p.titulo, data: p.created_date, cor: "#8b5cf6", emoji: "📝" })),
                ...projetos.slice(0, 5).map(p => ({ tipo: "Projeto", desc: p.titulo, data: p.created_date, cor: "#0ea5e9", emoji: "🚀" })),
                ...tutorias.slice(0, 5).map(t => ({ tipo: "Tutoria", desc: t.titulo, data: t.created_date, cor: "#10b981", emoji: "🤝" })),
              ]
                .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
                .slice(0, 15)
                .map((item, i) => (
                  <div key={i} className="py-2.5 flex items-center gap-3">
                    <span className="text-base">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold mr-2" style={{ color: item.cor }}>{item.tipo}</span>
                      <span className="text-sm text-gray-700 truncate">{item.desc}</span>
                    </div>
                    {item.data && <span className="text-xs text-gray-400 flex-shrink-0">{new Date(item.data).toLocaleDateString("pt-BR")}</span>}
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {abaSelecionada === "receitas" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={DollarSign} title="MRR (Atual)" value={fmt(receitaMensal)} sub="receita mensal recorrente" color="#16a34a" />
            <StatCard icon={TrendingUp} title="ARR (Atual)" value={fmt(receitaMensal * 12)} sub="receita anual recorrente" color="#6366f1" />
            <StatCard icon={Users} title="Assinantes Pagantes" value={assinaturas.filter(a => a.status === "ativo" && a.plano !== "freemium").length} sub={`de ${assinaturas.length} total`} color="#f59e0b" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Distribuição de Planos</CardTitle></CardHeader>
              <CardContent>
                {distribuicaoPlanos.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={distribuicaoPlanos} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {distribuicaoPlanos.map((p, i) => <Cell key={i} fill={p.cor} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm text-gray-400">Nenhuma assinatura registrada ainda.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Detalhamento por Plano</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {["freemium", "basico", "premium", "pro", "master"].map(plano => {
                  const count = assinaturas.filter(a => a.plano === plano && a.status === "ativo").length;
                  const mrr = count * PLANO_VALORES[plano];
                  return (
                    <div key={plano} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: PLANO_CORES[plano] }} />
                        <span className="text-sm font-medium capitalize">{plano}</span>
                        <Badge className="text-xs" style={{ background: PLANO_CORES[plano] + "20", color: PLANO_CORES[plano] }}>{count} usuários</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">{fmt(mrr)}/mês</p>
                        <p className="text-xs text-gray-400">{fmt(PLANO_VALORES[plano])}/usuário</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Lista de assinantes */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Assinaturas ({assinaturas.length})</CardTitle></CardHeader>
            <CardContent className="divide-y max-h-80 overflow-y-auto">
              {assinaturas.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Nenhuma assinatura registrada ainda.</p>
              ) : assinaturas.map((a, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.user_name || a.user_email}</p>
                    <p className="text-xs text-gray-500">{a.user_email} · {a.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge style={{ background: PLANO_CORES[a.plano] + "20", color: PLANO_CORES[a.plano] }} className="capitalize">{a.plano}</Badge>
                    <Badge className={a.status === "ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>{a.status}</Badge>
                    <span className="text-sm font-bold text-gray-700">{fmt(PLANO_VALORES[a.plano])}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {abaSelecionada === "uso" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={FileText} title="Propostas Criadas" value={propostas.length} sub={`${propostas.filter(p => p.status === "aprovada").length} aprovadas · ${propostas.filter(p => p.status === "rejeitada").length} rejeitadas`} color="#8b5cf6" />
            <StatCard icon={Activity} title="Projetos de Acompanhamento" value={projetos.length} sub={`${projetos.filter(p => p.status === "ativo").length} ativos`} color="#0ea5e9" />
            <StatCard icon={DollarSign} title="Gastos Registrados" value={gastos.length} sub={fmt(totalGastos) + " total"} color="#f59e0b" />
            <StatCard icon={MessageSquare} title="Mensagens na Comunidade" value={mensagens.length} sub="posts no fórum" color="#f43f5e" />
            <StatCard icon={Handshake} title="Solicitações de Tutoria" value={tutorias.length} sub={`${tutorias.filter(t => t.status === "em_atendimento").length} em andamento`} color="#10b981" />
            <StatCard icon={TrendingUp} title="Usuários Gamificados" value={progressos.length} sub="no Voo do Corvo" color="#dc2626" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Propostas por Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={propostasStatus} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="total" radius={4}>
                      {propostasStatus.map((p, i) => <Cell key={i} fill={p.cor} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Criação de Propostas (últimos 6 meses)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={crescimentoPropostas}>
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8b5cf6" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Adoção de features */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Adoção das Ferramentas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { feature: "Criação de Propostas", count: [...new Set(propostas.map(p => p.created_by))].length, total: empreendedores || 1, cor: "#8b5cf6" },
                { feature: "Acompanhamento de Projetos", count: [...new Set(projetos.map(p => p.created_by))].length, total: empreendedores || 1, cor: "#0ea5e9" },
                { feature: "Participação na Comunidade", count: [...new Set(mensagens.map(m => m.autor_email))].length, total: users.length || 1, cor: "#f43f5e" },
                { feature: "Controle de Gastos", count: [...new Set(gastos.map(g => g.created_by))].length, total: empreendedores || 1, cor: "#f59e0b" },
                { feature: "Solicitações de Tutoria", count: [...new Set(tutorias.map(t => t.empreendedor_email))].length, total: empreendedores || 1, cor: "#10b981" },
              ].map((f, i) => {
                const pct = Math.min(100, Math.round((f.count / f.total) * 100));
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{f.feature}</span>
                      <span className="text-sm font-bold text-gray-600">{f.count} usuários ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: f.cor }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {abaSelecionada === "gamificacao" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={TrendingUp} title="Usuários no Voo do Corvo" value={progressos.length} sub="com progresso registrado" color="#7c3aed" />
            <StatCard icon={Users} title="Total de Pontos" value={progressos.reduce((s, p) => s + (p.pontos || 0), 0)} sub="pontos acumulados na plataforma" color="#6366f1" />
            <StatCard icon={Activity} title="Média de Pontos" value={progressos.length ? Math.round(progressos.reduce((s, p) => s + (p.pontos || 0), 0) / progressos.length) : 0} sub="por usuário" color="#10b981" />
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Ranking Completo — O Voo do Corvo</CardTitle></CardHeader>
            <CardContent className="divide-y max-h-96 overflow-y-auto">
              {progressos.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Nenhum progresso registrado ainda.</p>
              ) : progressos.map((p, i) => (
                <div key={p.id || i} className="py-3 flex items-center gap-3">
                  <span className={`text-lg font-black w-8 text-center ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-300"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{p.user_name || p.user_email}</p>
                    <p className="text-xs text-gray-500">{p.nivel || "Corvo Ninhego"} · {p.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-indigo-600">{p.pontos || 0} pts</p>
                    <p className="text-xs text-gray-400">{(p.tarefas_concluidas || []).length} tarefas</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}