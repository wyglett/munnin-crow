import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Lock, Trophy, Star, Loader2, RefreshCw } from "lucide-react";

// ─── Definição das tarefas ───────────────────────────────────────────────────

const NIVEIS = [
  { nome: "Corvo Ninhego", minPts: 0, cor: "#94a3b8", emoji: "🥚" },
  { nome: "Corvo Curioso", minPts: 100, cor: "#6366f1", emoji: "🐦‍⬛" },
  { nome: "Corvo Plumado", minPts: 300, cor: "#8b5cf6", emoji: "🪶" },
  { nome: "Corvo Sábio", minPts: 600, cor: "#f59e0b", emoji: "🦅" },
  { nome: "Grande Corvo", minPts: 900, cor: "#dc2626", emoji: "👑" },
];

function getNivel(pts) {
  return [...NIVEIS].reverse().find(n => pts >= n.minPts) || NIVEIS[0];
}
function getProxNivel(pts) {
  return NIVEIS.find(n => n.minPts > pts) || null;
}

const TAREFAS_EMPREENDEDOR = [
  { id: "login", titulo: "Dar o Primeiro Voo", desc: "Fazer login e explorar a plataforma pela primeira vez", pontos: 10, emoji: "🐦‍⬛", auto: true },
  { id: "primeira_proposta", titulo: "Primeira Proposta", desc: "Criar sua primeira proposta de projeto", pontos: 50, emoji: "📝" },
  { id: "proposta_completa", titulo: "Proposta Detalhada", desc: "Concluir campos de uma proposta com IA", pontos: 100, emoji: "✅" },
  { id: "tira_duvidas", titulo: "Conselho do Corvo", desc: "Usar o Tira-Dúvidas com IA pela primeira vez", pontos: 30, emoji: "🤔", manual: true },
  { id: "comunidade", titulo: "Voz na Comunidade", desc: "Participar do fórum da comunidade", pontos: 40, emoji: "💬" },
  { id: "orientacao", titulo: "Lição do Mestre", desc: "Ler uma orientação disponível", pontos: 30, emoji: "📚", manual: true },
  { id: "acompanhamento", titulo: "Projeto em Voo", desc: "Criar um projeto de acompanhamento", pontos: 60, emoji: "🚀" },
  { id: "gasto", titulo: "Finanças em Ordem", desc: "Registrar um gasto no projeto", pontos: 40, emoji: "💰" },
  { id: "consultoria", titulo: "Aliança Estratégica", desc: "Solicitar consultoria para um projeto", pontos: 80, emoji: "🤝" },
  { id: "relatorio", titulo: "Prestação de Contas", desc: "Subir o modelo de relatório de um projeto", pontos: 50, emoji: "📊" },
];

const TAREFAS_CONSULTOR = [
  { id: "login", titulo: "Dar o Primeiro Voo", desc: "Fazer login e explorar a plataforma pela primeira vez", pontos: 10, emoji: "🐦‍⬛", auto: true },
  { id: "proposta_tutoria", titulo: "Primeira Oferta", desc: "Enviar proposta para uma solicitação de tutoria", pontos: 50, emoji: "✉️" },
  { id: "tutoria_aprovada", titulo: "Tutoria Firmada", desc: "Ter uma proposta de tutoria aceita por um empreendedor", pontos: 100, emoji: "🏆" },
  { id: "orientacao_criada", titulo: "Conhecimento Compartilhado", desc: "Criar uma orientação para empreendedores", pontos: 60, emoji: "📖" },
  { id: "comunidade", titulo: "Voz na Comunidade", desc: "Participar do fórum da comunidade", pontos: 40, emoji: "💬" },
  { id: "gasto_consultor", titulo: "Análise Financeira", desc: "Registrar análise em um projeto acompanhado", pontos: 50, emoji: "📊" },
  { id: "3_projetos", titulo: "Bando de Corvos", desc: "Ter 3 ou mais projetos de empreendedores em acompanhamento", pontos: 150, emoji: "🦅" },
  { id: "perfil_manual", titulo: "Identidade do Corvo", desc: "Completar seu perfil profissional", pontos: 30, emoji: "👤", manual: true },
];

// ─── Auto-detecção de tarefas concluídas ─────────────────────────────────────

async function detectarTarefasEmpreendedor(userEmail) {
  const concluidas = new Set(["login"]);

  const [propostas, projetos, mensagens, gastos, tutorias] = await Promise.all([
    base44.entities.Proposta.filter({ created_by: userEmail }),
    base44.entities.AcompanhamentoProjeto.filter({ created_by: userEmail }),
    base44.entities.MensagemChat.filter({ autor_email: userEmail }),
    base44.entities.GastoProjeto.filter({ created_by: userEmail }),
    base44.entities.SolicitacaoTutoria.filter({ empreendedor_email: userEmail }),
  ]);

  if (propostas.length > 0) concluidas.add("primeira_proposta");
  if (propostas.some(p => p.campos_formulario?.some(c => c.concluido))) concluidas.add("proposta_completa");
  if (mensagens.length > 0) concluidas.add("comunidade");
  if (projetos.length > 0) concluidas.add("acompanhamento");
  if (gastos.length > 0) concluidas.add("gasto");
  if (tutorias.length > 0) concluidas.add("consultoria");
  if (projetos.some(p => p.relatorio_template_url)) concluidas.add("relatorio");

  return concluidas;
}

async function detectarTarefasConsultor(userEmail) {
  const concluidas = new Set(["login"]);

  const [tutorias, projetos, orientacoes, mensagens, gastos] = await Promise.all([
    base44.entities.SolicitacaoTutoria.list("-created_date", 200),
    base44.entities.AcompanhamentoProjeto.filter({ consultor_email: userEmail }),
    base44.entities.Orientacao.filter({ created_by: userEmail }),
    base44.entities.MensagemChat.filter({ autor_email: userEmail }),
    base44.entities.GastoProjeto.filter({ adicionado_por: "consultor", created_by: userEmail }),
  ]);

  const temProposta = tutorias.some(t => t.propostas?.some(p => p.consultor_email === userEmail));
  const temAprovada = projetos.some(p => p.consultor_status === "aprovado");

  if (temProposta) concluidas.add("proposta_tutoria");
  if (temAprovada) concluidas.add("tutoria_aprovada");
  if (orientacoes.length > 0) concluidas.add("orientacao_criada");
  if (mensagens.length > 0) concluidas.add("comunidade");
  if (gastos.length > 0) concluidas.add("gasto_consultor");
  if (projetos.length >= 3) concluidas.add("3_projetos");

  return concluidas;
}

// ─── Componente da Tarefa ──────────────────────────────────────────────────────

function TarefaCard({ tarefa, concluida, onMarcar, marcando }) {
  return (
    <div className={`relative border rounded-2xl p-4 transition-all ${
      concluida
        ? "bg-gradient-to-r from-indigo-900/60 to-purple-900/40 border-indigo-500/50"
        : "bg-white/5 border-white/10 hover:border-white/20"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
          concluida ? "bg-indigo-500/30" : "bg-white/10"
        }`}>
          {tarefa.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-bold ${concluida ? "text-white" : "text-slate-300"}`}>{tarefa.titulo}</p>
              <p className={`text-xs mt-0.5 ${concluida ? "text-indigo-300" : "text-slate-500"}`}>{tarefa.desc}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                concluida ? "bg-indigo-500/40 text-indigo-200" : "bg-white/10 text-slate-400"
              }`}>+{tarefa.pontos} pts</span>
              {concluida
                ? <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                : <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
              }
            </div>
          </div>
          {!concluida && tarefa.manual && (
            <button
              onClick={() => onMarcar(tarefa.id)}
              disabled={marcando === tarefa.id}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
            >
              {marcando === tarefa.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Marcar como concluído
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

function RankingRow({ p, idx }) {
  const nivel = getNivel(p.pontos || 0);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5">
      <div className={`w-8 text-center font-black text-lg ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-slate-600"}`}>
        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{p.user_name || p.user_email}</p>
        <p className="text-xs text-slate-500">{nivel.emoji} {nivel.nome} · {(p.tarefas_concluidas || []).length} tarefas</p>
      </div>
      <div className="text-right">
        <p className="text-base font-black text-indigo-400">{p.pontos || 0}</p>
        <p className="text-xs text-slate-600">pts</p>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function VooCorvo() {
  const [user, setUser] = useState(null);
  const [progresso, setProgresso] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [marcando, setMarcando] = useState(null);
  const [aba, setAba] = useState("trilha");

  const isConsultor = user?.role === "consultor";
  const tarefas = isConsultor ? TAREFAS_CONSULTOR : TAREFAS_EMPREENDEDOR;

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    carregarEAtualizar();
  }, [user]);

  const carregarEAtualizar = async () => {
    setAtualizando(true);
    try {
      // Carrega progresso atual
      const registros = await base44.entities.ProgressoGamificacao.filter({ user_email: user.email });
      let reg = registros[0] || null;

      // Auto-detecta tarefas concluídas
      const detectadas = isConsultor
        ? await detectarTarefasConsultor(user.email)
        : await detectarTarefasEmpreendedor(user.email);

      const jaConcluidasIds = new Set((reg?.tarefas_concluidas || []).map(t => t.id));
      const novasIds = [...detectadas].filter(id => !jaConcluidasIds.has(id));

      // Mesclando manuais com detectadas
      const todasConcluidas = [
        ...(reg?.tarefas_concluidas || []),
        ...novasIds.map(id => {
          const t = tarefas.find(x => x.id === id);
          return { id, titulo: t?.titulo || id, pontos: t?.pontos || 0, data: new Date().toISOString() };
        })
      ];

      const totalPts = todasConcluidas.reduce((s, t) => s + (t.pontos || 0), 0);
      const nivel = getNivel(totalPts);

      const dados = {
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: user.role || "empreendedor",
        pontos: totalPts,
        nivel: nivel.nome,
        tarefas_concluidas: todasConcluidas,
      };

      if (!reg) {
        reg = await base44.entities.ProgressoGamificacao.create(dados);
      } else if (novasIds.length > 0) {
        reg = await base44.entities.ProgressoGamificacao.update(reg.id, dados);
      }

      setProgresso({ ...reg, ...dados });

      // Ranking
      const todos = await base44.entities.ProgressoGamificacao.list("-pontos", 50);
      setRanking(todos);
    } finally {
      setAtualizando(false);
      setLoading(false);
    }
  };

  const marcarManual = async (tarefaId) => {
    setMarcando(tarefaId);
    const tarefa = tarefas.find(t => t.id === tarefaId);
    if (!tarefa || !progresso) { setMarcando(null); return; }

    const jaConcluidasIds = new Set((progresso.tarefas_concluidas || []).map(t => t.id));
    if (jaConcluidasIds.has(tarefaId)) { setMarcando(null); return; }

    const novasTarefas = [
      ...(progresso.tarefas_concluidas || []),
      { id: tarefaId, titulo: tarefa.titulo, pontos: tarefa.pontos, data: new Date().toISOString() }
    ];
    const totalPts = novasTarefas.reduce((s, t) => s + (t.pontos || 0), 0);
    const nivel = getNivel(totalPts);

    const dados = { ...progresso, pontos: totalPts, nivel: nivel.nome, tarefas_concluidas: novasTarefas };

    const registros = await base44.entities.ProgressoGamificacao.filter({ user_email: user.email });
    if (registros[0]) {
      await base44.entities.ProgressoGamificacao.update(registros[0].id, dados);
    }

    setProgresso(dados);
    const todos = await base44.entities.ProgressoGamificacao.list("-pontos", 50);
    setRanking(todos);
    setMarcando(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const concluidasSet = new Set((progresso?.tarefas_concluidas || []).map(t => t.id));
  const totalPontos = progresso?.pontos || 0;
  const nivelAtual = getNivel(totalPontos);
  const proxNivel = getProxNivel(totalPontos);
  const pctNivel = proxNivel
    ? Math.round(((totalPontos - nivelAtual.minPts) / (proxNivel.minPts - nivelAtual.minPts)) * 100)
    : 100;
  const pctTrilha = Math.round((concluidasSet.size / tarefas.length) * 100);
  const meuRankPos = ranking.findIndex(r => r.user_email === user?.email);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-6 max-w-4xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🐦‍⬛</span>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">O Voo do Corvo</h1>
                <p className="text-indigo-300 text-sm font-medium">
                  Trilha {isConsultor ? "do Consultor" : "do Empreendedor"}
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-lg">
              Complete missões, acumule pontos e suba no ranking. Cada ferramenta que você usa é um voo mais alto.
            </p>
          </div>
          <button onClick={carregarEAtualizar} disabled={atualizando} className="text-slate-500 hover:text-slate-300 p-2">
            <RefreshCw className={`w-4 h-4 ${atualizando ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Status card */}
        <div className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{nivelAtual.emoji}</div>
              <div>
                <p className="text-white font-bold text-lg">{nivelAtual.nome}</p>
                <p className="text-slate-400 text-xs">{user?.full_name || user?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-indigo-400">{totalPontos}</p>
              <p className="text-xs text-slate-500">pontos totais</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{concluidasSet.size}/{tarefas.length}</p>
              <p className="text-xs text-slate-500">missões</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{pctTrilha}%</p>
              <p className="text-xs text-slate-500">da trilha</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">#{meuRankPos >= 0 ? meuRankPos + 1 : "—"}</p>
              <p className="text-xs text-slate-500">no ranking</p>
            </div>
          </div>

          {proxNivel && (
            <>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{nivelAtual.nome}</span>
                <span>{proxNivel.nome} em {proxNivel.minPts - totalPontos} pts</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pctNivel}%`, background: `linear-gradient(90deg, ${nivelAtual.cor}, ${proxNivel.cor})` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5">
          <button onClick={() => setAba("trilha")} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${aba === "trilha" ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}>
            🗺️ Trilha
          </button>
          <button onClick={() => setAba("ranking")} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${aba === "ranking" ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}>
            🏆 Ranking
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-12 max-w-4xl mx-auto">
        {aba === "trilha" && (
          <div className="space-y-3">
            {tarefas.map((tarefa, i) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                concluida={concluidasSet.has(tarefa.id)}
                onMarcar={marcarManual}
                marcando={marcando}
              />
            ))}

            {pctTrilha === 100 && (
              <div className="text-center py-8 bg-gradient-to-br from-yellow-900/30 to-amber-900/20 border border-yellow-500/30 rounded-2xl">
                <div className="text-5xl mb-3">👑</div>
                <p className="text-white font-black text-xl">Trilha Completa!</p>
                <p className="text-yellow-300 text-sm mt-1">Você atingiu o status de Grande Corvo da plataforma.</p>
              </div>
            )}
          </div>
        )}

        {aba === "ranking" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="text-white font-bold">Ranking Geral — O Voo do Corvo</h2>
              <span className="text-xs text-slate-500 ml-auto">{ranking.length} participantes</span>
            </div>
            {ranking.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">Nenhum participante ainda. Seja o primeiro a voar!</p>
            ) : (
              <div>
                {ranking.map((p, i) => <RankingRow key={p.id || i} p={p} idx={i} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}