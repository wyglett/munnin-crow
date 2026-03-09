import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, CheckCircle2, Circle, Zap, Sparkles, Lock, Users, TrendingUp, Feather } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ─── Trilhas ──────────────────────────────────────────────────────────────────

const TRILHA_EMPREENDEDOR = [
  { id: "proposta_criada", titulo: "Criar primeira proposta", descricao: "Crie uma proposta para um edital de fomento", pontos: 40, icone: "📝", tipo: "auto", link: "MinhasPropostas" },
  { id: "comunidade_participou", titulo: "Participar da Comunidade", descricao: "Envie sua primeira mensagem na comunidade", pontos: 20, icone: "💬", tipo: "auto", link: "Comunidade" },
  { id: "tiraduvidas_ia", titulo: "Usar o Tira-Dúvidas IA", descricao: "Faça uma pergunta ao assistente especializado", pontos: 25, icone: "🤖", tipo: "selfReport", link: "TiraDuvidas" },
  { id: "orientacao_lida", titulo: "Estudar uma Orientação", descricao: "Leia um material de orientação da plataforma", pontos: 15, icone: "📚", tipo: "selfReport", link: "Orientacoes" },
  { id: "proposta_submetida", titulo: "Submeter uma proposta", descricao: "Submeta uma proposta oficialmente a um edital", pontos: 60, icone: "🚀", tipo: "auto", link: "MinhasPropostas" },
  { id: "projeto_criado", titulo: "Criar projeto de acompanhamento", descricao: "Registre um projeto aprovado na plataforma", pontos: 60, icone: "📊", tipo: "auto", link: "Acompanhamento" },
  { id: "gasto_registrado", titulo: "Registrar um gasto no projeto", descricao: "Controle os gastos do seu projeto aprovado", pontos: 30, icone: "💰", tipo: "selfReport", link: "Acompanhamento" },
  { id: "consultor_contratado", titulo: "Contratar um consultor", descricao: "Tenha um consultor aprovado em seu projeto", pontos: 50, icone: "🤝", tipo: "auto", link: "Acompanhamento" },
  { id: "relatorio_iniciado", titulo: "Iniciar relatório de prestação de contas", descricao: "Faça upload do modelo e inicie o preenchimento", pontos: 80, icone: "📋", tipo: "auto", link: "Acompanhamento" },
];

const TRILHA_CONSULTOR = [
  { id: "comunidade_participou", titulo: "Participar da Comunidade", descricao: "Envie sua primeira mensagem na comunidade", pontos: 20, icone: "💬", tipo: "auto", link: "Comunidade" },
  { id: "orientacao_criada", titulo: "Criar uma Orientação", descricao: "Publique um material educacional para empreendedores", pontos: 40, icone: "📚", tipo: "auto", link: "Orientacoes" },
  { id: "proposta_tutoria", titulo: "Enviar proposta de tutoria", descricao: "Candidate-se a uma solicitação de tutoria aberta", pontos: 50, icone: "📤", tipo: "selfReport", link: "ConsultorDashboard" },
  { id: "tutoria_aprovada", titulo: "Ter tutoria aprovada", descricao: "Tenha uma proposta de tutoria aceita por um empreendedor", pontos: 100, icone: "✅", tipo: "auto", link: "ConsultorDashboard" },
  { id: "projeto_acompanhando", titulo: "Acompanhar projeto como consultor", descricao: "Tenha acesso ao módulo de acompanhamento de um projeto", pontos: 60, icone: "📊", tipo: "auto", link: "Acompanhamento" },
  { id: "gasto_revisado", titulo: "Revisar gastos do projeto", descricao: "Analise os gastos registrados no projeto assistido", pontos: 30, icone: "🗂️", tipo: "selfReport", link: "Acompanhamento" },
  { id: "relatorio_apoiado", titulo: "Apoiar relatório de prestação de contas", descricao: "Contribua no preenchimento do relatório de um projeto", pontos: 80, icone: "📋", tipo: "selfReport", link: "Acompanhamento" },
];

const TOTAL_EMPREENDEDOR = TRILHA_EMPREENDEDOR.reduce((s, t) => s + t.pontos, 0);
const TOTAL_CONSULTOR = TRILHA_CONSULTOR.reduce((s, t) => s + t.pontos, 0);

// ─── Níveis ───────────────────────────────────────────────────────────────────

const NIVEIS = [
  { min: 0, max: 50, nome: "Filhote de Corvo", icone: "🥚", cor: "#94a3b8" },
  { min: 51, max: 130, nome: "Corvo Aprendiz", icone: "🐦", cor: "#6366f1" },
  { min: 131, max: 250, nome: "Corvo Experiente", icone: "🦅", cor: "#8b5cf6" },
  { min: 251, max: 380, nome: "Mestre do Voo", icone: "🪶", cor: "#f59e0b" },
  { min: 381, max: Infinity, nome: "Lenda do Corvo", icone: "⚜️", cor: "#dc2626" },
];

function getNivel(pontos) {
  return NIVEIS.find(n => pontos >= n.min && pontos <= n.max) || NIVEIS[0];
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function calcularPontos(tarefas, trilha) {
  return trilha.filter(t => tarefas.includes(t.id)).reduce((s, t) => s + t.pontos, 0);
}

// ─── Componente de tarefa ──────────────────────────────────────────────────────

function TarefaItem({ tarefa, concluida, onMarcar, loading }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${concluida ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-white hover:border-indigo-200"}`}>
      <div className="text-2xl flex-shrink-0 mt-0.5">{tarefa.icone}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${concluida ? "text-green-800 line-through" : "text-gray-800"}`}>{tarefa.titulo}</p>
          <Badge className={`flex-shrink-0 text-xs font-bold ${concluida ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}>
            +{tarefa.pontos} pts
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{tarefa.descricao}</p>
        {tarefa.tipo === "selfReport" && !concluida && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Auto-declarado</span>
            <Button size="sm" variant="outline" onClick={() => onMarcar(tarefa.id)} disabled={loading}
              className="text-xs h-6 px-2 border-green-300 text-green-700 hover:bg-green-50">
              ✓ Marcar como feito
            </Button>
          </div>
        )}
        {concluida && (
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-600 font-medium">Concluído!</span>
          </div>
        )}
      </div>
      {!concluida && tarefa.link && (
        <Link to={createPageUrl(tarefa.link)} className="flex-shrink-0">
          <Button size="sm" variant="ghost" className="text-xs text-indigo-600 hover:bg-indigo-50 h-7">Ir →</Button>
        </Link>
      )}
    </div>
  );
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

function Ranking({ todosTrilhas, roleFilter }) {
  const filtered = todosTrilhas
    .filter(t => t.role === roleFilter)
    .sort((a, b) => (b.pontos || 0) - (a.pontos || 0))
    .slice(0, 20);

  const medalhas = ["🥇", "🥈", "🥉"];

  if (filtered.length === 0) {
    return <div className="text-center py-12 text-gray-400 text-sm">Nenhum participante nesta trilha ainda. Seja o primeiro!</div>;
  }

  return (
    <div className="space-y-2">
      {filtered.map((t, i) => {
        const nivel = getNivel(t.pontos || 0);
        return (
          <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border ${i < 3 ? "border-yellow-200 bg-yellow-50/50" : "border-gray-200 bg-white"}`}>
            <div className="w-8 text-center flex-shrink-0">
              <span className="text-lg">{medalhas[i] || `#${i + 1}`}</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: nivel.cor + "30" }}>
              <span>{nivel.icone}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{t.user_nome || t.user_email}</p>
              <p className="text-xs text-gray-400">{nivel.nome}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-indigo-700">{t.pontos || 0} pts</p>
              <p className="text-xs text-gray-400">{t.tarefas_concluidas?.length || 0} tarefas</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function VooDoCorvo() {
  const [user, setUser] = useState(null);
  const [abaRanking, setAbaRanking] = useState("empreendedor");
  const [saving, setSaving] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const role = user?.role === "consultor" ? "consultor" : "empreendedor";
  const trilha = role === "consultor" ? TRILHA_CONSULTOR : TRILHA_EMPREENDEDOR;
  const totalPossivel = role === "consultor" ? TOTAL_CONSULTOR : TOTAL_EMPREENDEDOR;

  // Dados para auto-detecção
  const { data: propostas = [] } = useQuery({ queryKey: ["voo-propostas"], queryFn: () => user ? base44.entities.Proposta.filter({ created_by: user.email }) : [], enabled: !!user });
  const { data: mensagens = [] } = useQuery({ queryKey: ["voo-msgs"], queryFn: () => user ? base44.entities.MensagemChat.filter({ autor_email: user.email }) : [], enabled: !!user });
  const { data: projetos = [] } = useQuery({ queryKey: ["voo-projetos"], queryFn: () => user ? base44.entities.AcompanhamentoProjeto.filter({ created_by: user.email }) : [], enabled: !!user });
  const { data: projetosConsultor = [] } = useQuery({ queryKey: ["voo-projetos-consultor"], queryFn: () => user ? base44.entities.AcompanhamentoProjeto.filter({ consultor_email: user.email }) : [], enabled: !!user && role === "consultor" });
  const { data: orientacoesUser = [] } = useQuery({ queryKey: ["voo-orientacoes"], queryFn: () => user ? base44.entities.Orientacao.filter({ created_by: user.email }) : [], enabled: !!user && role === "consultor" });
  const { data: todosTrilhas = [] } = useQuery({ queryKey: ["voo-todos"], queryFn: () => base44.entities.ProgressoTrilha.list("-pontos", 100) });
  const { data: meuProgresso = [] } = useQuery({ queryKey: ["voo-meu"], queryFn: () => user ? base44.entities.ProgressoTrilha.filter({ created_by: user.email }) : [], enabled: !!user });

  const meu = meuProgresso[0] || null;
  const tarefasConcluidas = meu?.tarefas_concluidas || [];

  // Auto-detectar tarefas
  const tarefasAutoDetectadas = (() => {
    const det = new Set(tarefasConcluidas);
    if (role === "empreendedor") {
      if (propostas.length > 0) det.add("proposta_criada");
      if (mensagens.length > 0) det.add("comunidade_participou");
      if (propostas.some(p => p.status === "submetida")) det.add("proposta_submetida");
      if (projetos.length > 0) det.add("projeto_criado");
      if (projetos.some(p => p.consultor_status === "aprovado")) det.add("consultor_contratado");
      if (projetos.some(p => p.relatorio_campos?.length > 0)) det.add("relatorio_iniciado");
    } else {
      if (mensagens.length > 0) det.add("comunidade_participou");
      if (orientacoesUser.length > 0) det.add("orientacao_criada");
      if (projetosConsultor.some(p => p.consultor_status === "aprovado")) det.add("tutoria_aprovada");
      if (projetosConsultor.length > 0) det.add("projeto_acompanhando");
    }
    return [...det];
  })();

  const pontos = calcularPontos(tarefasAutoDetectadas, trilha);
  const nivel = getNivel(pontos);
  const pct = Math.min(100, Math.round((pontos / totalPossivel) * 100));

  // Salvar progresso quando mudar
  useEffect(() => {
    if (!user || !meuProgresso) return;
    const novo = tarefasAutoDetectadas.slice().sort().join(",");
    const velho = (meu?.tarefas_concluidas || []).slice().sort().join(",");
    if (novo === velho && meu?.pontos === pontos) return;

    const save = async () => {
      const dados = { user_email: user.email, user_nome: user.full_name || user.email, role, pontos, tarefas_concluidas: tarefasAutoDetectadas, ultimo_calculo: new Date().toISOString() };
      if (meu) await base44.entities.ProgressoTrilha.update(meu.id, dados);
      else await base44.entities.ProgressoTrilha.create(dados);
    };
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefasAutoDetectadas.join(","), user?.email]);

  const marcarSelfReport = async (tarefaId) => {
    if (!user || tarefasAutoDetectadas.includes(tarefaId)) return;
    setSaving(true);
    const novos = [...tarefasAutoDetectadas, tarefaId];
    const novosPontos = calcularPontos(novos, trilha);
    const dados = { user_email: user.email, user_nome: user.full_name || user.email, role, pontos: novosPontos, tarefas_concluidas: novos, ultimo_calculo: new Date().toISOString() };
    if (meu) await base44.entities.ProgressoTrilha.update(meu.id, dados);
    else await base44.entities.ProgressoTrilha.create(dados);
    // Force refetch
    window.location.reload();
    setSaving(false);
  };

  const [aba, setAba] = useState("trilha");

  if (!user) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;

  const proximo = NIVEIS.find(n => n.min > pontos);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)" }}>
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{ width: Math.random() * 200 + 50, height: Math.random() * 200 + 50, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, background: "white", filter: "blur(40px)" }} />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Feather className="w-6 h-6 text-indigo-400" />
            <span className="text-indigo-400 text-sm font-bold tracking-widest uppercase">Gamificação</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">O Voo do Corvo</h1>
          <p className="text-slate-400 mb-6 max-w-xl">Complete tarefas na plataforma, ganhe pontos e suba de nível. Descubra até onde o seu corvo pode voar.</p>

          {/* Nível e pontos */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 max-w-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">{nivel.icone}</div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{role === "consultor" ? "Asa do Corvo — Consultor" : "Ninho do Corvo — Empreendedor"}</p>
                <p className="text-xl font-bold text-white">{nivel.nome}</p>
                <p className="text-sm text-indigo-300">{pontos} / {totalPossivel} pontos totais</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{pontos}</div>
                <div className="text-xs text-slate-400">pontos</div>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-2">
              <div className="h-2.5 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${nivel.cor}, ${nivel.cor}dd)` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{pct}% do potencial máximo</span>
              {proximo && <span>Próximo nível: {proximo.nome} {proximo.icone} (a partir de {proximo.min} pts)</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex gap-2 -mt-4 mb-6 relative z-10">
          {["trilha", "ranking"].map(a => (
            <button key={a} onClick={() => setAba(a)}
              className={`px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-all ${aba === a ? "bg-indigo-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
              {a === "trilha" ? "🛤️ Minha Trilha" : "🏆 Ranking"}
            </button>
          ))}
        </div>

        {aba === "trilha" && (
          <div className="space-y-3 pb-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-700">{tarefasAutoDetectadas.length} de {trilha.length} tarefas concluídas</p>
              <Badge className="bg-indigo-100 text-indigo-700">
                <Zap className="w-3 h-3 mr-1" />{pontos} pts acumulados
              </Badge>
            </div>
            {trilha.map(tarefa => (
              <TarefaItem key={tarefa.id} tarefa={tarefa} concluida={tarefasAutoDetectadas.includes(tarefa.id)} onMarcar={marcarSelfReport} loading={saving} />
            ))}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <p><strong>💡 Tarefas Auto-detectadas:</strong> verificadas automaticamente com base na sua atividade na plataforma.</p>
              <p className="mt-1"><strong>📋 Tarefas Auto-declaradas:</strong> marcadas manualmente por você ao completar a ação.</p>
            </div>
          </div>
        )}

        {aba === "ranking" && (
          <div className="pb-10">
            <div className="flex gap-2 mb-4">
              {["empreendedor", "consultor"].map(r => (
                <button key={r} onClick={() => setAbaRanking(r)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${abaRanking === r ? (r === "empreendedor" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white") : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
                  {r === "empreendedor" ? "🏢 Empreendedores" : "🎓 Consultores"}
                </button>
              ))}
            </div>
            <Ranking todosTrilhas={todosTrilhas} roleFilter={abaRanking} />
          </div>
        )}
      </div>
    </div>
  );
}