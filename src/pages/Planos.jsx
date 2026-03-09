import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, Zap, Star, Crown, Rocket, Clock, Lock } from "lucide-react";

// ─── Dados dos planos ─────────────────────────────────────────────────────────

const PLANOS_EMPREENDEDOR = [
  {
    id: "freemium",
    nome: "Freemium",
    preco: "Grátis",
    periodo: "",
    descricao: "Para explorar a plataforma e dar os primeiros passos.",
    cor: "#64748b",
    icone: Clock,
    destaque: false,
    badge: null,
    recursos: [
      { label: "1 projeto ativo", ok: true },
      { label: "5 gerações IA por dia (propostas)", ok: true },
      { label: "Tira-Dúvidas: 5 perguntas/dia", ok: true },
      { label: "Visualização completa de editais", ok: true },
      { label: "Comunidade (leitura e postagem)", ok: true },
      { label: "Acompanhamento com IA (importar PDF, gerar seções)", ok: false },
      { label: "Geração automática de relatório de prestação de contas", ok: false },
      { label: "Exportação DOCX do relatório", ok: false },
      { label: "Integração com Google Drive", ok: false },
      { label: "Acesso ao marketplace de consultores", ok: false },
    ],
  },
  {
    id: "basico",
    nome: "Básico",
    preco: "Em breve",
    periodo: "/mês",
    descricao: "Para empreendedores iniciando suas candidaturas a editais.",
    cor: "#6366f1",
    icone: Zap,
    destaque: false,
    badge: null,
    recursos: [
      { label: "3 projetos ativos por mês", ok: true },
      { label: "20 gerações IA por dia (propostas)", ok: true },
      { label: "Tira-Dúvidas ilimitado", ok: true },
      { label: "Comunidade completa", ok: true },
      { label: "Acompanhamento manual (sem IA)", ok: true },
      { label: "Suporte por e-mail", ok: true },
      { label: "IA no Acompanhamento (importar PDF, gerar seções)", ok: false },
      { label: "Geração automática de relatório", ok: false },
      { label: "Exportação DOCX do relatório", ok: false },
      { label: "Integração com Google Drive", ok: false },
    ],
  },
  {
    id: "premium",
    nome: "Premium",
    preco: "Em breve",
    periodo: "/mês",
    descricao: "Para quem gerencia múltiplos projetos e precisa de IA avançada.",
    cor: "#8b5cf6",
    icone: Star,
    destaque: true,
    badge: "⭐ Recomendado",
    recursos: [
      { label: "10 projetos ativos por mês", ok: true },
      { label: "50 gerações IA por dia", ok: true },
      { label: "Tira-Dúvidas ilimitado", ok: true },
      { label: "IA no Acompanhamento (importar PDF, gerar seções 8.1)", ok: true },
      { label: "Geração automática de relatório de prestação de contas", ok: true },
      { label: "Integração com Google Drive", ok: true },
      { label: "Biblioteca de Orientações completa", ok: true },
      { label: "Suporte prioritário", ok: true },
      { label: "Exportação DOCX do relatório", ok: false },
      { label: "Múltiplos consultores por projeto", ok: false },
    ],
  },
  {
    id: "pro",
    nome: "Pro",
    preco: "Em breve",
    periodo: "/mês",
    descricao: "Para empreendedores com alta demanda e portfólio robusto.",
    cor: "#f59e0b",
    icone: Rocket,
    destaque: false,
    badge: "🔥 Popular",
    recursos: [
      { label: "25 projetos ativos por mês", ok: true },
      { label: "150 gerações IA por dia", ok: true },
      { label: "Todas as ferramentas IA do Acompanhamento", ok: true },
      { label: "Exportação DOCX do relatório", ok: true },
      { label: "Múltiplos consultores por projeto", ok: true },
      { label: "Integração com Google Drive", ok: true },
      { label: "Relatórios de análise de desempenho", ok: true },
      { label: "Suporte dedicado via chat", ok: true },
      { label: "Projetos ilimitados", ok: false },
      { label: "API de integração", ok: false },
    ],
  },
  {
    id: "master",
    nome: "Master",
    preco: "Em breve",
    periodo: "/mês",
    descricao: "Para organizações e gestores de portfólio de projetos.",
    cor: "#dc2626",
    icone: Crown,
    destaque: false,
    badge: null,
    recursos: [
      { label: "Projetos ilimitados", ok: true },
      { label: "Gerações IA ilimitadas", ok: true },
      { label: "Todas as ferramentas e integrações", ok: true },
      { label: "Exportação DOCX e HTML do relatório", ok: true },
      { label: "Múltiplos usuários na conta (até 5 membros)", ok: true },
      { label: "API de integração externa", ok: true },
      { label: "Dashboard de portfólio organizacional", ok: true },
      { label: "Onboarding e configuração personalizada", ok: true },
      { label: "Acesso antecipado a novos recursos", ok: true },
      { label: "SLA garantido e suporte 24/7", ok: true },
    ],
  },
];

const PLANOS_CONSULTOR = [
  {
    id: "freemium",
    nome: "Freemium",
    preco: "Grátis",
    periodo: "",
    descricao: "Para consultores iniciando sua atuação na plataforma.",
    cor: "#64748b",
    icone: Clock,
    destaque: false,
    badge: null,
    recursos: [
      { label: "2 tutorias simultâneas", ok: true },
      { label: "Perfil básico no marketplace", ok: true },
      { label: "Biblioteca de Orientações (somente leitura)", ok: true },
      { label: "Participação na comunidade", ok: true },
      { label: "IA para análise de propostas dos mentorados", ok: false },
      { label: "Criação de orientações para a biblioteca", ok: false },
      { label: "Acesso ao módulo de Acompanhamento dos mentorados", ok: false },
      { label: "Relatórios de desempenho", ok: false },
    ],
  },
  {
    id: "basico",
    nome: "Básico",
    preco: "Em breve",
    periodo: "/mês",
    descricao: "Para consultores que desejam ampliar sua base de mentorados.",
    cor: "#6366f1",
    icone: Zap,
    destaque: false,
    badge: null,
    recursos: [
      { label: "5 tutorias simultâneas", ok: true },
      { label: "10 gerações IA/dia para análise de propostas", ok: true },
      { label: "Perfil completo no marketplace", ok: true },
      { label: "Biblioteca de Orientações completa (leitura)", ok: true },
      { label: "Comunidade completa", ok: true },
      { label: "Suporte por e-mail", ok: true },
      { label: "Criação de orientações para a biblioteca", ok: false },
      { label: "Acesso ao módulo de Acompanhamento dos mentorados", ok: false },
    ],
  },
  {
    id: "premium",
    nome: "Premium",
    preco: "Em breve",
    periodo: "/mês",
    descricao: "Para consultores que querem se destacar e ampliar seu impacto.",
    cor: "#8b5cf6",
    icone: Star,
    destaque: true,
    badge: "⭐ Recomendado",
    recursos: [
      { label: "15 tutorias simultâneas", ok: true },
      { label: "30 gerações IA/dia (análise e elaboração)", ok: true },
      { label: "Criar e publicar orientações na biblioteca", ok: true },
      { label: "Acesso ao módulo de Acompanhamento dos mentorados", ok: true },
      { label: "Apoio IA na elaboração de novas propostas dos mentorados", ok: true },
      { label: "Relatórios de desempenho do portfólio", ok: true },
      { label: "Suporte prioritário", ok: true },
      { label: "Destaque permanente no marketplace", ok: false },
    ],
  },
  {
    id: "pro",
    nome: "Pro",
    preco: "Em breve",
    periodo: "/mês",
    descricao: "Para consultores com alta demanda e múltiplos projetos ativos.",
    cor: "#f59e0b",
    icone: Rocket,
    destaque: false,
    badge: "🔥 Popular",
    recursos: [
      { label: "30 tutorias simultâneas", ok: true },
      { label: "100 gerações IA/dia", ok: true },
      { label: "IA completa: análise de propostas e relatórios dos mentorados", ok: true },
      { label: "Dashboard de portfólio de mentorados", ok: true },
      { label: "Destaque prioritário e verificado no marketplace", ok: true },
      { label: "Criação ilimitada de orientações", ok: true },
      { label: "Suporte dedicado via chat", ok: true },
      { label: "Tutorias ilimitadas", ok: false },
    ],
  },
  {
    id: "master",
    nome: "Master",
    preco: "Em breve",
    periodo: "/mês",
    descricao: "Para consultores especializados com atuação de alto volume.",
    cor: "#dc2626",
    icone: Crown,
    destaque: false,
    badge: null,
    recursos: [
      { label: "Tutorias ilimitadas", ok: true },
      { label: "Gerações IA ilimitadas", ok: true },
      { label: "Perfil verificado e destacado permanentemente", ok: true },
      { label: "Mentoria em novas propostas: ilimitada", ok: true },
      { label: "Analytics avançados de desempenho e impacto", ok: true },
      { label: "Acesso antecipado a novos editais importados", ok: true },
      { label: "Treinamento exclusivo da plataforma", ok: true },
      { label: "SLA garantido e suporte 24/7", ok: true },
    ],
  },
];

// ─── Card de plano ────────────────────────────────────────────────────────────

function PlanoCard({ plano, index }) {
  const Icon = plano.icone;
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 ${
        plano.destaque
          ? "border-2 shadow-2xl"
          : "border border-white/10 bg-white/5"
      }`}
      style={
        plano.destaque
          ? {
              background: `linear-gradient(160deg, ${plano.cor}25 0%, ${plano.cor}10 100%)`,
              borderColor: plano.cor,
              boxShadow: `0 20px 60px ${plano.cor}25`,
            }
          : {}
      }
    >
      {/* Badge de destaque */}
      {plano.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span
            className="text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap"
            style={{ background: `linear-gradient(90deg, ${plano.cor}, ${plano.cor}cc)` }}
          >
            {plano.badge}
          </span>
        </div>
      )}

      {/* Ícone + nome */}
      <div className="mb-4 mt-1">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
          style={{ background: plano.cor + "25", border: `1.5px solid ${plano.cor}50` }}
        >
          <Icon className="w-5 h-5" style={{ color: plano.cor }} />
        </div>
        <h3 className="text-xl font-black text-white">{plano.nome}</h3>
        <p className="text-xs text-slate-400 mt-1 min-h-[36px] leading-relaxed">{plano.descricao}</p>
      </div>

      {/* Preço */}
      <div className="mb-5 pb-5 border-b border-white/10">
        {plano.preco === "Grátis" ? (
          <div>
            <span className="text-3xl font-black text-green-400">Grátis</span>
            <span className="text-slate-500 text-sm ml-1">para sempre</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full border"
              style={{ background: plano.cor + "20", color: plano.cor, borderColor: plano.cor + "50" }}
            >
              Em breve
            </span>
          </div>
        )}
      </div>

      {/* Recursos */}
      <ul className="flex-1 space-y-2.5 mb-6">
        {plano.recursos.map((r, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                r.ok ? "bg-green-500/20" : "bg-white/5"
              }`}
            >
              {r.ok ? (
                <Check className="w-2.5 h-2.5 text-green-400" />
              ) : (
                <X className="w-2.5 h-2.5 text-slate-600" />
              )}
            </span>
            <span className={`text-xs leading-relaxed ${r.ok ? "text-slate-300" : "text-slate-600"}`}>
              {r.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        disabled
        className="w-full py-3 rounded-xl text-sm font-bold cursor-not-allowed transition-all"
        style={
          plano.id === "freemium"
            ? { background: "#16a34a20", color: "#4ade80", border: "1px solid #16a34a40" }
            : plano.destaque
            ? { background: plano.cor, color: "white", opacity: 0.7 }
            : { background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }
        }
      >
        {plano.id === "freemium" ? "✓ Plano atual" : "🔒 Em breve"}
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Planos() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState("empreendedor");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        setUser(u);
        if (u?.role === "consultor") setPerfil("consultor");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const planos = perfil === "consultor" ? PLANOS_CONSULTOR : PLANOS_EMPREENDEDOR;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      }}
    >
      {/* Hero */}
      <div className="text-center px-6 pt-16 pb-10">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-xs text-indigo-300 font-semibold mb-6">
          🚀 Lançamento em breve — cadastre-se gratuitamente agora
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          O plano certo para{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            cada etapa
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
          {perfil === "consultor"
            ? "Amplie sua atuação como consultor, acesse mais mentorados e use IA para potencializar cada projeto."
            : "Acelere a captação de recursos, simplifique a prestação de contas e gerencie seus projetos com IA."}
        </p>

        {/* Toggle de perfil */}
        <div className="inline-flex bg-white/8 border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setPerfil("empreendedor")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              perfil === "empreendedor"
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🏢 Empreendedor
          </button>
          <button
            onClick={() => setPerfil("consultor")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              perfil === "consultor"
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🤝 Consultor
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {planos.map((plano, i) => (
            <PlanoCard key={plano.id} plano={plano} index={i} />
          ))}
        </div>
      </div>

      {/* Aviso */}
      <div className="max-w-2xl mx-auto px-6 pb-16 text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-slate-400 text-sm leading-relaxed">
            <span className="text-white font-semibold">💡 Cobrança ainda não habilitada.</span>
            {" "}Todos os usuários têm acesso gratuito durante o período de lançamento.
            Os planos e preços definitivos serão divulgados em breve.
          </p>
          <p className="text-slate-600 text-xs mt-3">
            Funcionalidades e valores sujeitos a ajustes antes do lançamento oficial.
          </p>
        </div>
      </div>
    </div>
  );
}