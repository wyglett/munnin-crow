import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Lock, Star, Trophy, Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ─── Definição das trilhas ────────────────────────────────────────────────────

const TAREFAS_EMPREENDEDOR = [
  { id: "primeira_proposta", titulo: "Primeira Proposta", desc: "Crie sua primeira proposta para um edital", pontos: 100, emoji: "📋", auto: true },
  { id: "tiraduvidas", titulo: "Consultor Digital", desc: "Use o Tira-Dúvidas IA pela primeira vez", pontos: 50, emoji: "🤖", manual: true, link: "TiraDuvidas" },
  { id: "orientacao", titulo: "Aluno Dedicado", desc: "Leia uma orientação da plataforma", pontos: 30, emoji: "📚", manual: true, link: "Orientacoes" },
  { id: "comunidade", titulo: "Voz Ativa", desc: "Participe do fórum da comunidade", pontos: 30, emoji: "💬", auto: true },
  { id: "acompanhamento", titulo: "Projeto em Voo", desc: "Inicie um projeto de acompanhamento", pontos: 150, emoji: "🚀", auto: true },
  { id: "primeiro_gasto", titulo: "Financeiro Organizado", desc: "Registre seu primeiro gasto no projeto", pontos: 75, emoji: "💰", auto: true },
  { id: "relatorio", titulo: "Prestação Concluída", desc: "Exporte um relatório de prestação de contas", pontos: 200, emoji: "📊", manual: true, link: "Acompanhamento" },
  { id: "consultor_contratado", titulo: "Com Apoio Especializado", desc: "Contrate um consultor para seu projeto", pontos: 100, emoji: "🤝", auto: true },
];

const TAREFAS_CONSULTOR = [
  { id: "comunidade", titulo: "Mentor Visível", desc: "Interaja no fórum da comunidade", pontos: 30, emoji: "💬", auto: true },
  { id: "proposta_tutoria", titulo: "Primeira Oferta", desc: "Envie proposta para uma solicitação de tutoria", pontos: 100, emoji: "✉️", auto: true },
  { id: "orientacao_criada", titulo: "Compartilhador de Conhecimento", desc: "Crie uma orientação para a plataforma", pontos: 75, emoji: "📚", manual: true, link: "Orientacoes" },
  { id: "tutoria_ativa", titulo: "Tutoria em Andamento", desc: "Tenha uma tutoria aprovada e ativa", pontos: 100, emoji: "🎓", auto: true },
  { id: "acompanhamento_consultado", titulo: "Corvo Guardião", desc: "Acesse o painel de acompanhamento de um projeto", pontos: 50, emoji: "🔭", manual: true, link: "Acompanhamento" },
  { id: "tutoria_concluida", titulo: "Missão Cumprida", desc: "Conclua uma tutoria com aprovação do empreendedor", pontos: 200, emoji: "🏆", auto: true },
];

const NIVEIS = [
  { min: 0,   max: 99,   nome: "Filhote de Corvo",   cor: "#94a3b8", bg: "#f1f5f9" },
  { min: 100, max: 299,  nome: "Corvo Explorador",   cor: "#6366f1", bg: "#eef2ff" },
  { min: 300, max: 499,  nome: "Corvo Guardião",     cor: "#8b5cf6", bg: "#f5f3ff" },
  { min: 500, max: 749,  nome: "Corvo Sábio",        cor: "#f59e0b", bg: "#fffbeb" },
  { min: 750, max: 99999, nome: "Munnin — O Supremo",cor: "#dc2626", bg: "#fff1f2" },
];

function getNivel(pontos) {
  return NIVEIS.find(n => pontos >= n.min && pontos <= n.max) || NIVEIS[0];
}

// ─── Componente de tarefa ─────────────────────────────────────────────────────

function TarefaCard({ tarefa, concluida, onConcluir, salvando }) {
  return (
    <div className={`rounded-xl border p-4 transition-all ${concluida ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-white hover:border-indigo-200"}`}>
      <div className="flex items-center gap-3">
        <div className={`text-2xl flex-shrink-0 ${concluida ? "grayscale-0" : "opacity-80"}`}>{tarefa.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold ${concluida ? "text-green-700" : "text-gray-800"}`}>{tarefa.titulo}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${concluida ? "bg-green-100 text-green-700" : "bg-indigo-50 text-indigo-600"}`}>
              +{tarefa.pontos} pts
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{tarefa.desc}</p>
        </div>
        {concluida ? (
          <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
        ) : tarefa.manual ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            {tarefa.link && (
              <Link to={createPageUrl(tarefa.link)} className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
                Ir <ChevronRight className="w-3 h-3" />
              </Link>
            )}
            <button
              onClick={() => onConcluir(tarefa.id, tarefa.pontos)}
              disabled={salvando}
              className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              Marcar feito
            </button>
          </div>
        ) : (
          <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function VooDoCorvo() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const email = user?.email;
  const role = user?.role || "empreendedor";
  const tarefas = role === "consultor" ? TAREFAS_CONSULTOR : TAREFAS_EMPREENDEDOR;

  // Dados para auto-detecção
  const { data: propostas = [] } = useQuery({
    queryKey: ["voo-propostas", email],
    queryFn: () => base44.entities.Proposta.filter({ created_by: email }),
    enabled: !!email,
  });
  const { data: acompanhamentos = [] } = useQuery({
    queryKey: ["voo-acomp", email],
    queryFn: () => base44.entities.AcompanhamentoProjeto.filter({ created_by: email }),
    enabled: !!email,
  });
  const { data: gastos = [] } = useQuery({
    queryKey: ["voo-gastos", email],
    queryFn: () => base44.entities.GastoProjeto.filter({ created_by: email }),
    enabled: !!email,
  });
  const { data: mensagens = [] } = useQuery({
    queryKey: ["voo-msgs", email],
    queryFn: () => base44.entities.MensagemChat.filter({ autor_email: email }),
    enabled: !!email,
  });
  const { data: tutorias = [] } = useQuery({
    queryKey: ["voo-tutorias", email],
    queryFn: () => base44.entities.SolicitacaoTutoria.list(),
    enabled: !!email && role === "consultor",
  });
  const { data: orientacoes = [] } = useQuery({
    queryKey: ["voo-orientacoes", email],
    queryFn: () => base44.entities.Orientacao.filter({ created_by: email }),
    enabled: !!email && role === "consultor",
  });
  const { data: progressoList = [] } = useQuery({
    queryKey: ["progresso-trilha", email],
    queryFn: () => base44.entities.ProgressoTrilha.filter({ usuario_email: email }),
    enabled: !!email,
  });
  const { data: todoProgresso = [] } = useQuery({
    queryKey: ["progresso-all"],
    queryFn: () => base44.entities.ProgressoTrilha.list("-pontos", 50),
  });

  const progresso = progressoList[0];

  // Auto-detecção de tarefas concluídas
  const autoDetect = (id) => {
    if (role === "empreendedor") {
      if (id === "primeira_proposta") return propostas.length > 0;
      if (id === "comunidade") return mensagens.length > 0;
      if (id === "acompanhamento") return acompanhamentos.length > 0;
      if (id === "primeiro_gasto") return gastos.length > 0;
      if (id === "consultor_contratado") return acompanhamentos.some(a => a.consultor_status === "aprovado");
    } else {
      if (id === "comunidade") return mensagens.length > 0;
      if (id === "proposta_tutoria") return tutorias.some(t => t.propostas?.some(p => p.consultor_email === email));
      if (id === "tutoria_ativa") return tutorias.some(t => t.consultor_email === email && t.status === "em_atendimento");
      if (id === "tutoria_concluida") return tutorias.some(t => t.consultor_email === email && t.status === "concluida");
      if (id === "orientacao_criada") return orientacoes.length > 0;
    }
    return false;
  };

  const tarefasConcluidas = new Set([
    ...(progresso?.tarefas_concluidas || []),
    ...tarefas.filter(t => t.auto && autoDetect(t.id)).map(t => t.id),
  ]);

  const pontosTotal = tarefas
    .filter(t => tarefasConcluidas.has(t.id))
    .reduce((s, t) => s + t.pontos, 0);

  const nivel = getNivel(pontosTotal);
  const proximoNivel = NIVEIS.find(n => n.min > pontosTotal);
  const pct = proximoNivel
    ? ((pontosTotal - nivel.min) / (proximoNivel.min - nivel.min)) * 100
    : 100;

  // Mutation para marcar tarefa manualmente
  const salvarProgresso = useMutation({
    mutationFn: async ({ tarefaId, pontos }) => {
      const novasConcluidas = [...tarefasConcluidas, tarefaId];
      const novosPontos = tarefas.filter(t => novasConcluidas.has(t.id)).reduce((s, t) => s + t.pontos, 0);
      const dados = {
        usuario_email: email,
        usuario_nome: user?.full_name || email,
        role,
        tarefas_concluidas: novasConcluidas,
        pontos: novosPontos,
      };
      if (progresso?.id) {
        return base44.entities.ProgressoTrilha.update(progresso.id, dados);
      } else {
        return base44.entities.ProgressoTrilha.create(dados);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progresso-trilha", email] });
      queryClient.invalidateQueries({ queryKey: ["progresso-all"] });
    },
  });

  // Sincroniza progresso automático
  useEffect(() => {
    if (!email || !user) return;
    const autoIds = tarefas.filter(t => t.auto && autoDetect(t.id)).map(t => t.id);
    const jaConcluidasManual = progresso?.tarefas_concluidas || [];
    const novas = autoIds.filter(id => !jaConcluidasManual.includes(id));
    if (novas.length === 0) return;
    const novasConcluidas = [...new Set([...jaConcluidasManual, ...autoIds])];
    const novosPontos = tarefas.filter(t => novasConcluidas.includes(t.id)).reduce((s, t) => s + t.pontos, 0);
    const dados = { usuario_email: email, usuario_nome: user?.full_name || email, role, tarefas_concluidas: novasConcluidas, pontos: novosPontos };
    if (progresso?.id) {
      base44.entities.ProgressoTrilha.update(progresso.id, dados).then(() => {
        queryClient.invalidateQueries({ queryKey: ["progresso-trilha", email] });
        queryClient.invalidateQueries({ queryKey: ["progresso-all"] });
      });
    } else if (novasConcluidas.length > 0) {
      base44.entities.ProgressoTrilha.create(dados).then(() => {
        queryClient.invalidateQueries({ queryKey: ["progresso-trilha", email] });
        queryClient.invalidateQueries({ queryKey: ["progresso-all"] });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, propostas.length, acompanhamentos.length, gastos.length, mensagens.length, tutorias.length]);

  const trilhaNome = role === "consultor" ? "Trilha do Consultor" : "Trilha do Empreendedor";
  const concluidas = tarefas.filter(t => tarefasConcluidas.has(t.id)).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      {/* Hero */}
      <div className="px-6 pt-10 pb-8 text-center">
        <div className="text-6xl mb-3">🦅</div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-1">O Voo do Corvo</h1>
        <p className="text-indigo-300 text-sm font-medium">{trilhaNome} · Platforma Munnin Crow</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6">
        {/* Card de nível */}
        <div className="rounded-2xl p-6 text-center" style={{ background: nivel.bg, border: `2px solid ${nivel.cor}40` }}>
          <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: nivel.cor }}>Nível Atual</div>
          <div className="text-2xl font-black mb-1" style={{ color: nivel.cor }}>{nivel.nome}</div>
          <div className="text-5xl font-black text-gray-900 mb-4">{pontosTotal} pts</div>
          <div className="bg-gray-200 rounded-full h-3 max-w-xs mx-auto overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: nivel.cor }} />
          </div>
          {proximoNivel && (
            <p className="text-xs mt-2" style={{ color: nivel.cor }}>
              {proximoNivel.min - pontosTotal} pts até <strong>{proximoNivel.nome}</strong>
            </p>
          )}
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-bold">{concluidas}</span> de <span className="font-bold">{tarefas.length}</span> tarefas concluídas
          </div>
        </div>

        {/* Trilha */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{trilhaNome}</h2>
          </div>
          <div className="space-y-2">
            {tarefas.map(tarefa => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                concluida={tarefasConcluidas.has(tarefa.id)}
                onConcluir={(id, pontos) => salvarProgresso.mutate({ tarefaId: id, pontos })}
                salvando={salvarProgresso.isPending}
              />
            ))}
          </div>
        </div>

        {/* Ranking */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ranking Geral</h2>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-4 text-[10px] font-bold text-slate-500 uppercase px-4 py-3 border-b border-white/5">
              <span>Pos.</span>
              <span className="col-span-2">Usuário</span>
              <span className="text-right">Pontos</span>
            </div>
            {todoProgresso.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">Seja o primeiro a voar! 🦅</div>
            ) : (
              todoProgresso.map((p, i) => {
                const isMe = p.usuario_email === email;
                const nv = getNivel(p.pontos || 0);
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={p.id} className={`grid grid-cols-4 px-4 py-3 items-center border-b border-white/5 last:border-0 ${isMe ? "bg-indigo-600/20" : "hover:bg-white/5"}`}>
                    <span className="text-base">{medals[i] || `${i + 1}º`}</span>
                    <div className="col-span-2">
                      <p className={`text-sm font-semibold ${isMe ? "text-indigo-300" : "text-white"}`}>
                        {p.usuario_nome || p.usuario_email?.split("@")[0]}
                        {isMe && <span className="text-xs ml-1 text-indigo-400">(você)</span>}
                      </p>
                      <p className="text-[10px] font-medium" style={{ color: nv.cor }}>{nv.nome}</p>
                    </div>
                    <span className="text-right font-black" style={{ color: nv.cor }}>{p.pontos || 0}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}