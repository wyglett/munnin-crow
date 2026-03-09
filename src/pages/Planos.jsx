import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, Zap, Star, Crown, Rocket, Gift } from "lucide-react";

// ─── Definição dos planos ─────────────────────────────────────────────────────

const PLANOS_EMPREENDEDOR = [
  {
    id: "freemium",
    nome: "Freemium",
    descricao: "Para conhecer a plataforma",
    preco: "Gratuito",
    periodo: "",
    cor: "#64748b",
    corBg: "#f8fafc",
    corBorda: "#e2e8f0",
    icone: Gift,
    destaque: false,
    items: [
      { texto: "1 projeto ativo", incluso: true },
      { texto: "Acesso ao portal de editais", incluso: true },
      { texto: "Comunidade e fórum", incluso: true },
      { texto: "Tira-dúvidas básico (5 perguntas/dia)", incluso: true },
      { texto: "Elaboração de propostas com IA", incluso: false },
      { texto: "Ferramentas de IA no relatório", incluso: false },
      { texto: "Importação de projeto aprovado (IA)", incluso: false },
      { texto: "Exportação ao Google Drive", incluso: false },
      { texto: "Acesso a consultores", incluso: false },
      { texto: "Geração automática de campos 8.1", incluso: false },
    ],
  },
  {
    id: "basico",
    nome: "Básico",
    descricao: "Para empreendedores iniciando",
    preco: "Em breve",
    periodo: "",
    cor: "#6366f1",
    corBg: "#eef2ff",
    corBorda: "#a5b4fc",
    icone: Zap,
    destaque: false,
    items: [
      { texto: "3 projetos ativos por mês", incluso: true },
      { texto: "Acesso ao portal de editais", incluso: true },
      { texto: "Comunidade e fórum", incluso: true },
      { texto: "Tira-dúvidas IA (20 perguntas/dia)", incluso: true },
      { texto: "Elaboração manual de propostas (sem IA)", incluso: true },
      { texto: "Acompanhamento: cadastros manuais", incluso: true },
      { texto: "Geração de conteúdo IA p/ propostas (10/mês)", incluso: true },
      { texto: "Ferramentas de IA no relatório", incluso: false },
      { texto: "Importação de projeto aprovado (IA)", incluso: false },
      { texto: "Exportação ao Google Drive", incluso: false },
    ],
  },
  {
    id: "premium",
    nome: "Premium",
    descricao: "Para quem quer acelerar resultados",
    preco: "Em breve",
    periodo: "",
    cor: "#8b5cf6",
    corBg: "#f5f3ff",
    corBorda: "#c4b5fd",
    icone: Star,
    destaque: true,
    badge: "Mais popular",
    items: [
      { texto: "10 projetos ativos por mês", incluso: true },
      { texto: "Acesso ao portal de editais", incluso: true },
      { texto: "Comunidade e fórum", incluso: true },
      { texto: "Tira-dúvidas IA (ilimitado)", incluso: true },
      { texto: "Elaboração de propostas com IA", incluso: true },
      { texto: "Geração de conteúdo IA p/ propostas (50/mês)", incluso: true },
      { texto: "Acompanhamento com IA (relatório, extração)", incluso: true },
      { texto: "Importação de projeto aprovado (IA)", incluso: true },
      { texto: "Exportação ao Google Drive", incluso: true },
      { texto: "Acesso a consultores", incluso: true },
    ],
  },
  {
    id: "pro",
    nome: "Pro",
    descricao: "Para equipes e múltiplos projetos",
    preco: "Em breve",
    periodo: "",
    cor: "#f59e0b",
    corBg: "#fffbeb",
    corBorda: "#fcd34d",
    icone: Crown,
    destaque: false,
    items: [
      { texto: "30 projetos ativos por mês", incluso: true },
      { texto: "Tudo do Premium", incluso: true },
      { texto: "Geração de conteúdo IA (200/mês)", incluso: true },
      { texto: "Suporte prioritário", incluso: true },
      { texto: "Relatórios exportados em Word e HTML", incluso: true },
      { texto: "Múltiplos modelos de relatório por projeto", incluso: true },
      { texto: "Dashboard de gastos avançado", incluso: true },
      { texto: "Histórico completo de versões do relatório", incluso: true },
      { texto: "Análise de risco de reprovação de propostas", incluso: true },
      { texto: "Integração com múltiplos Drives", incluso: true },
    ],
  },
  {
    id: "master",
    nome: "Master",
    descricao: "Para aceleradoras e incubadoras",
    preco: "Em breve",
    periodo: "",
    cor: "#dc2626",
    corBg: "#fff1f2",
    corBorda: "#fca5a5",
    icone: Rocket,
    destaque: false,
    items: [
      { texto: "Projetos ilimitados", incluso: true },
      { texto: "Tudo do Pro", incluso: true },
      { texto: "Geração de conteúdo IA ilimitada", incluso: true },
      { texto: "Gestão de múltiplos empreendedores", incluso: true },
      { texto: "Painel consolidado de portfólio", incluso: true },
      { texto: "Onboarding e treinamento dedicado", incluso: true },
      { texto: "API de integração com sistemas internos", incluso: true },
      { texto: "White-label (marca própria)", incluso: true },
      { texto: "SLA garantido e suporte 24/7", incluso: true },
      { texto: "Consultores ilimitados vinculados", incluso: true },
    ],
  },
];

const PLANOS_CONSULTOR = [
  {
    id: "freemium",
    nome: "Freemium",
    descricao: "Para explorar a plataforma",
    preco: "Gratuito",
    periodo: "",
    cor: "#64748b",
    corBg: "#f8fafc",
    corBorda: "#e2e8f0",
    icone: Gift,
    destaque: false,
    items: [
      { texto: "Visualizar editais abertos", incluso: true },
      { texto: "Acesso à comunidade e fórum", incluso: true },
      { texto: "Ver solicitações de tutoria (até 3)", incluso: true },
      { texto: "Enviar propostas de tutoria", incluso: false },
      { texto: "Apoio à elaboração de propostas com IA", incluso: false },
      { texto: "Acesso ao módulo de acompanhamento", incluso: false },
      { texto: "Criar orientações e materiais educativos", incluso: false },
      { texto: "Perfil destacado para empreendedores", incluso: false },
    ],
  },
  {
    id: "basico",
    nome: "Básico",
    descricao: "Para consultores iniciando",
    preco: "Em breve",
    periodo: "",
    cor: "#6366f1",
    corBg: "#eef2ff",
    corBorda: "#a5b4fc",
    icone: Zap,
    destaque: false,
    items: [
      { texto: "Visualizar todos os editais abertos", incluso: true },
      { texto: "Comunidade e fórum", incluso: true },
      { texto: "Ver e responder solicitações de tutoria (até 5/mês)", incluso: true },
      { texto: "Enviar propostas de tutoria", incluso: true },
      { texto: "Apoio à elaboração de propostas (manual, sem IA)", incluso: true },
      { texto: "Acesso ao acompanhamento de empreendedores", incluso: true },
      { texto: "Ferramentas de IA para apoio ao relatório", incluso: false },
      { texto: "Criação de orientações e materiais educativos", incluso: false },
    ],
  },
  {
    id: "premium",
    nome: "Premium",
    descricao: "Para consultores que querem crescer",
    preco: "Em breve",
    periodo: "",
    cor: "#8b5cf6",
    corBg: "#f5f3ff",
    corBorda: "#c4b5fd",
    icone: Star,
    destaque: true,
    badge: "Mais popular",
    items: [
      { texto: "Tudo do Básico", incluso: true },
      { texto: "Tutorias ilimitadas por mês", incluso: true },
      { texto: "Apoio à elaboração de propostas com IA (30/mês)", incluso: true },
      { texto: "Ferramentas de IA no acompanhamento", incluso: true },
      { texto: "Análise de propostas com pontuação estimada", incluso: true },
      { texto: "Criar e publicar orientações e materiais", incluso: true },
      { texto: "Perfil destacado para empreendedores", incluso: true },
      { texto: "Histórico completo de tutorias anteriores", incluso: true },
    ],
  },
  {
    id: "pro",
    nome: "Pro",
    descricao: "Para consultores especializados",
    preco: "Em breve",
    periodo: "",
    cor: "#f59e0b",
    corBg: "#fffbeb",
    corBorda: "#fcd34d",
    icone: Crown,
    destaque: false,
    items: [
      { texto: "Tudo do Premium", incluso: true },
      { texto: "Apoio à elaboração de propostas com IA (ilimitado)", incluso: true },
      { texto: "Assistente IA para revisão de propostas dos mentorados", incluso: true },
      { texto: "Dashboard consolidado de todos os projetos acompanhados", incluso: true },
      { texto: "Exportação de relatórios dos projetos em Word/HTML", incluso: true },
      { texto: "Suporte prioritário ao consultor", incluso: true },
      { texto: "Indicação automática aos empreendedores (match IA)", incluso: true },
      { texto: "Criação de trilhas de orientação por edital", incluso: true },
    ],
  },
  {
    id: "master",
    nome: "Master",
    descricao: "Para escritórios de consultoria",
    preco: "Em breve",
    periodo: "",
    cor: "#dc2626",
    corBg: "#fff1f2",
    corBorda: "#fca5a5",
    icone: Rocket,
    destaque: false,
    items: [
      { texto: "Tudo do Pro", incluso: true },
      { texto: "Equipe de consultores subordinados", incluso: true },
      { texto: "Painel de gestão de portfólio de clientes", incluso: true },
      { texto: "Relatórios executivos de desempenho da equipe", incluso: true },
      { texto: "IA ilimitada para todos os consultores da equipe", incluso: true },
      { texto: "White-label parcial (marca do escritório)", incluso: true },
      { texto: "Onboarding dedicado e suporte 24/7", incluso: true },
      { texto: "Integrações avançadas e API de acesso", incluso: true },
    ],
  },
];

// ─── Card de plano ────────────────────────────────────────────────────────────

function CardPlano({ plano }) {
  const Icone = plano.icone;
  return (
    <div
      className="relative rounded-2xl border-2 flex flex-col transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
      style={{
        background: plano.corBg,
        borderColor: plano.destaque ? plano.cor : plano.corBorda,
        boxShadow: plano.destaque ? `0 0 0 4px ${plano.cor}22` : undefined,
      }}
    >
      {plano.badge && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
          style={{ background: plano.cor }}
        >
          {plano.badge}
        </div>
      )}

      <div className="p-6 pb-4 border-b" style={{ borderColor: plano.corBorda }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: plano.cor + "20" }}>
            <Icone className="w-5 h-5" style={{ color: plano.cor }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{plano.nome}</h3>
            <p className="text-xs text-gray-500">{plano.descricao}</p>
          </div>
        </div>

        <div className="mt-3">
          <span className="text-2xl font-black" style={{ color: plano.cor }}>{plano.preco}</span>
          {plano.periodo && <span className="text-sm text-gray-400 ml-1">{plano.periodo}</span>}
        </div>

        <button
          disabled
          className="mt-4 w-full py-2 rounded-xl text-sm font-semibold transition-all cursor-not-allowed opacity-60"
          style={{
            background: plano.destaque ? plano.cor : "transparent",
            color: plano.destaque ? "white" : plano.cor,
            border: `2px solid ${plano.cor}`,
          }}
        >
          {plano.id === "freemium" ? "Plano atual" : "Em breve"}
        </button>
      </div>

      <div className="p-5 flex-1">
        <ul className="space-y-2.5">
          {plano.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: item.incluso ? plano.cor + "20" : "#f1f5f9" }}
              >
                {item.incluso
                  ? <Check className="w-2.5 h-2.5" style={{ color: plano.cor }} />
                  : <X className="w-2.5 h-2.5 text-gray-300" />}
              </span>
              <span className={`text-xs leading-relaxed ${item.incluso ? "text-gray-700" : "text-gray-400 line-through"}`}>
                {item.texto}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Planos() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isConsultor = user?.role === "consultor";
  const planos = isConsultor ? PLANOS_CONSULTOR : PLANOS_EMPREENDEDOR;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white px-6 py-20 text-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)"
        }} />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-200 mb-6">
            <Zap className="w-3 h-3" />
            Planos e assinaturas — Em desenvolvimento
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight">
            Escolha o plano ideal para{" "}
            {isConsultor ? (
              <span className="text-violet-300">sua consultoria</span>
            ) : (
              <span className="text-indigo-300">seu projeto</span>
            )}
          </h1>
          <p className="text-indigo-200 text-base leading-relaxed max-w-xl mx-auto">
            {isConsultor
              ? "Amplie sua atuação como consultor: apoie mais empreendedores, acesse ferramentas de IA para revisão de propostas e gerencie seu portfólio de mentorias com eficiência."
              : "Gerencie editais, propostas e prestações de contas com o apoio de IA. Do cadastro ao relatório final, tudo em um só lugar."}
          </p>
          <p className="mt-6 text-sm text-indigo-300/80 bg-indigo-800/40 inline-block px-4 py-2 rounded-lg border border-indigo-700/50">
            🚀 A cobrança ainda não está ativada. Todos os recursos estão disponíveis durante o período de acesso antecipado.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {planos.map(plano => (
            <CardPlano key={plano.id} plano={plano} />
          ))}
        </div>

        {/* Nota de rodapé */}
        <div className="mt-14 text-center">
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Todos os planos pagos estão em fase de definição. Os preços e limites finais serão divulgados em breve.
            Usuários do período de acesso antecipado terão condições especiais de lançamento.
          </p>
        </div>

        {/* Comparativo resumido */}
        <div className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Resumo comparativo</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Funcionalidade</th>
                  {planos.map(p => (
                    <th key={p.id} className="px-4 py-3 text-center font-bold text-xs" style={{ color: p.cor }}>
                      {p.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {planos[0].items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700 text-xs">{item.texto}</td>
                    {planos.map(p => (
                      <td key={p.id} className="px-4 py-3 text-center">
                        {p.items[i]?.incluso
                          ? <Check className="w-4 h-4 mx-auto" style={{ color: p.cor }} />
                          : <X className="w-4 h-4 mx-auto text-gray-200" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}