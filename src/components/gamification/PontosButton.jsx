import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Trophy, ChevronRight, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

const NIVEIS = [
  { min: 0,   max: 50,       nome: "Filhote de Corvo",  icone: "🥚", cor: "#94a3b8" },
  { min: 51,  max: 130,      nome: "Corvo Aprendiz",    icone: "🐦", cor: "#6366f1" },
  { min: 131, max: 250,      nome: "Corvo Experiente",  icone: "🦅", cor: "#8b5cf6" },
  { min: 251, max: 380,      nome: "Mestre do Voo",     icone: "🪶", cor: "#f59e0b" },
  { min: 381, max: Infinity, nome: "Lenda do Corvo",    icone: "⚜️", cor: "#dc2626" },
];

function getNivel(pontos) {
  return NIVEIS.find(n => pontos >= n.min && pontos <= n.max) || NIVEIS[0];
}

// Gera tarefas inteligentes filtrando o que já foi feito e adaptando o texto
function getTarefasInteligentes(role, concluidas, dadosUsuario) {
  const { propostas = [], mensagens = [], projetos = [], orientacoes = [], gastos = [] } = dadosUsuario;

  const TRILHA_EMP = [
    {
      id: "proposta_criada",
      titulo: propostas.length > 0 ? "Submeter sua primeira proposta" : "Criar sua primeira proposta",
      tituloAlt: propostas.length > 0 && propostas.some(p => p.status === "rascunho") ? "Finalizar e submeter uma proposta" : null,
      pontos: 40,
      ocultar: propostas.length > 0 && !propostas.some(p => p.status === "rascunho"), // tem proposta criada mas não em rascunho → hide
    },
    {
      id: "proposta_submetida",
      titulo: "Submeter uma proposta a um edital",
      pontos: 60,
    },
    {
      id: "comunidade_participou",
      titulo: mensagens.length > 0 ? "Continuar ativo na Comunidade" : "Participar da Comunidade pela 1ª vez",
      pontos: 20,
    },
    {
      id: "tiraduvidas_ia",
      titulo: "Usar o Tira-Dúvidas IA",
      pontos: 25,
    },
    {
      id: "orientacao_lida",
      titulo: "Estudar uma Orientação",
      pontos: 15,
    },
    {
      id: "projeto_criado",
      titulo: projetos.length > 0 ? "Criar novo projeto de acompanhamento" : "Criar seu primeiro projeto de acompanhamento",
      pontos: 60,
    },
    {
      id: "gasto_registrado",
      titulo: gastos.length > 0 ? "Registrar mais gastos no projeto" : "Registrar seu primeiro gasto no projeto",
      pontos: 30,
    },
    {
      id: "consultor_contratado",
      titulo: "Contratar um consultor especializado",
      pontos: 50,
    },
    {
      id: "relatorio_iniciado",
      titulo: "Iniciar relatório de prestação de contas",
      pontos: 80,
    },
  ];

  const TRILHA_CON = [
    {
      id: "comunidade_participou",
      titulo: mensagens.length > 0 ? "Continuar ativo na Comunidade" : "Participar da Comunidade pela 1ª vez",
      pontos: 20,
    },
    {
      id: "orientacao_criada",
      titulo: orientacoes.length > 0 ? "Publicar nova Orientação" : "Criar sua primeira Orientação",
      pontos: 40,
    },
    {
      id: "proposta_tutoria",
      titulo: "Enviar proposta de tutoria",
      pontos: 50,
    },
    {
      id: "tutoria_aprovada",
      titulo: "Ter tutoria aprovada por empreendedor",
      pontos: 100,
    },
    {
      id: "projeto_acompanhando",
      titulo: projetos.length > 0 ? "Acompanhar novo projeto como consultor" : "Começar a acompanhar um projeto",
      pontos: 60,
    },
    {
      id: "gasto_revisado",
      titulo: "Revisar gastos do projeto assistido",
      pontos: 30,
    },
    {
      id: "relatorio_apoiado",
      titulo: "Apoiar relatório de prestação de contas",
      pontos: 80,
    },
  ];

  const trilha = role === "consultor" ? TRILHA_CON : TRILHA_EMP;
  return trilha
    .filter(t => !t.ocultar && !concluidas.has(t.id))
    .slice(0, 4);
}

export default function PontosButton({ user }) {
  const [open, setOpen] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const [panelStyle, setPanelStyle] = useState({});
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const role = user?.tipo_usuario === "consultor" ? "consultor" : "empreendedor";

  // Buscar dados do usuário para tarefas inteligentes
  const { data: propostas = [] } = useQuery({
    queryKey: ["pb-propostas", user?.email],
    queryFn: () => base44.entities.Proposta.filter({ created_by: user.email }),
    enabled: !!user?.email && open,
  });
  const { data: mensagens = [] } = useQuery({
    queryKey: ["pb-msgs", user?.email],
    queryFn: () => base44.entities.MensagemChat.filter({ autor_email: user.email }),
    enabled: !!user?.email && open,
  });
  const { data: projetos = [] } = useQuery({
    queryKey: ["pb-projetos", user?.email],
    queryFn: () => role === "consultor"
      ? base44.entities.AcompanhamentoProjeto.filter({ consultor_email: user.email })
      : base44.entities.AcompanhamentoProjeto.filter({ created_by: user.email }),
    enabled: !!user?.email && open,
  });
  const { data: orientacoes = [] } = useQuery({
    queryKey: ["pb-orientacoes", user?.email],
    queryFn: () => base44.entities.Orientacao.filter({ created_by: user.email }),
    enabled: !!user?.email && open && role === "consultor",
  });
  const { data: gastos = [] } = useQuery({
    queryKey: ["pb-gastos", user?.email],
    queryFn: () => base44.entities.GastoProjeto.filter({ created_by: user.email }),
    enabled: !!user?.email && open && role === "empreendedor",
  });

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.ProgressoTrilha.filter({ created_by: user.email })
      .then(lista => setProgresso(lista[0] || null))
      .catch(() => {});
  }, [user?.email]);

  // Escuta atualizações em tempo real
  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.ProgressoTrilha.subscribe((event) => {
      if (event.data?.user_email === user.email) {
        setProgresso(event.data);
      }
    });
    return () => unsub();
  }, [user?.email]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const panelW = 310;
      let left = rect.left - panelW + rect.width;
      if (left < 8) left = 8;
      if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
      setPanelStyle({ position: "fixed", top: rect.bottom + 8, left, width: panelW, zIndex: 9999 });
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) return null;

  const pontos = progresso?.pontos || 0;
  const nivel = getNivel(pontos);
  const concluidas = new Set(progresso?.tarefas_concluidas || []);

  const proximas = getTarefasInteligentes(role, concluidas, { propostas, mensagens, projetos, orientacoes, gastos });

  // Progresso até o próximo nível
  const idxNivel = NIVEIS.indexOf(nivel);
  const proximoNivel = NIVEIS[idxNivel + 1];
  const ptsPct = proximoNivel
    ? Math.min(100, Math.round(((pontos - nivel.min) / (proximoNivel.min - nivel.min)) * 100))
    : 100;

  const totalTarefas = role === "consultor" ? 7 : 9;

  const panel = open ? (
    <div
      ref={panelRef}
      style={{ ...panelStyle, maxHeight: "82vh" }}
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{nivel.icone}</span>
          <div>
            <p className="text-xs font-bold text-slate-700">{nivel.nome}</p>
            <p className="text-[11px] text-slate-500">{pontos} pontos · {concluidas.size}/{totalTarefas} tarefas</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Barra de progresso */}
      {proximoNivel && (
        <div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
            <span>Próximo nível: <strong>{proximoNivel.icone} {proximoNivel.nome}</strong></span>
            <span className="font-bold text-indigo-600">{ptsPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-2 rounded-full"
              style={{ background: `linear-gradient(90deg, #6366f1, #8b5cf6)` }}
              initial={{ width: 0 }}
              animate={{ width: `${ptsPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{proximoNivel.min - pontos} pts restantes</p>
        </div>
      )}

      {/* Tarefas próximas */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 pt-3 pb-2">
          {proximas.length > 0 ? "🎯 Próximas conquistas" : "🎉 Trilha concluída!"}
        </p>
        {proximas.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/60 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-indigo-600">+{t.pontos}</span>
            </div>
            <p className="text-sm text-slate-700 flex-1 leading-tight">{t.titulo}</p>
          </div>
        ))}
        {concluidas.size > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-50 mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <p className="text-[11px] text-slate-400">
              {concluidas.size} de {totalTarefas} tarefas concluídas
            </p>
          </div>
        )}
      </div>

      {/* Ver mais */}
      <div className="border-t border-gray-100 flex-shrink-0">
        <Link
          to={createPageUrl("VooDoCorvo")}
          onClick={() => setOpen(false)}
          className="flex items-center justify-between px-4 py-3 hover:bg-indigo-50 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🪶</span>
            <span className="text-sm font-medium text-indigo-700">O Voo do Corvo</span>
            <span className="text-[10px] text-slate-400">— trilha completa & ranking</span>
          </div>
          <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="relative p-2 text-slate-400 hover:text-yellow-400 transition-colors rounded-lg hover:bg-white/5 flex items-center gap-1.5"
        title="Meus pontos"
      >
        <Trophy className="w-5 h-5" />
        {pontos > 0 && (
          <span className="text-[10px] font-bold text-yellow-400 hidden sm:block">{pontos}</span>
        )}
      </button>
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </>
  );
}