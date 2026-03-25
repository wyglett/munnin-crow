import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Trophy, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NIVEIS = [
  { min: 0,   max: 50,       nome: "Filhote de Corvo",  icone: "🥚", cor: "#94a3b8" },
  { min: 51,  max: 130,      nome: "Corvo Aprendiz",    icone: "🐦", cor: "#6366f1" },
  { min: 131, max: 250,      nome: "Corvo Experiente",  icone: "🦅", cor: "#8b5cf6" },
  { min: 251, max: 380,      nome: "Mestre do Voo",     icone: "🪶", cor: "#f59e0b" },
  { min: 381, max: Infinity, nome: "Lenda do Corvo",    icone: "⚜️", cor: "#dc2626" },
];

const TRILHA_EMPREENDEDOR = [
  { id: "proposta_criada", titulo: "Criar primeira proposta", pontos: 40 },
  { id: "comunidade_participou", titulo: "Participar da Comunidade", pontos: 20 },
  { id: "tiraduvidas_ia", titulo: "Usar o Tira-Dúvidas IA", pontos: 25 },
  { id: "orientacao_lida", titulo: "Estudar uma Orientação", pontos: 15 },
  { id: "proposta_submetida", titulo: "Submeter uma proposta", pontos: 60 },
  { id: "projeto_criado", titulo: "Criar projeto de acompanhamento", pontos: 60 },
  { id: "gasto_registrado", titulo: "Registrar um gasto no projeto", pontos: 30 },
  { id: "consultor_contratado", titulo: "Contratar um consultor", pontos: 50 },
  { id: "relatorio_iniciado", titulo: "Iniciar relatório de prestação de contas", pontos: 80 },
];

const TRILHA_CONSULTOR = [
  { id: "comunidade_participou", titulo: "Participar da Comunidade", pontos: 20 },
  { id: "orientacao_criada", titulo: "Criar uma Orientação", pontos: 40 },
  { id: "proposta_tutoria", titulo: "Enviar proposta de tutoria", pontos: 50 },
  { id: "tutoria_aprovada", titulo: "Ter tutoria aprovada", pontos: 100 },
  { id: "projeto_acompanhando", titulo: "Acompanhar projeto como consultor", pontos: 60 },
  { id: "gasto_revisado", titulo: "Revisar gastos do projeto", pontos: 30 },
  { id: "relatorio_apoiado", titulo: "Apoiar relatório de prestação de contas", pontos: 80 },
];

function getNivel(pontos) {
  return NIVEIS.find(n => pontos >= n.min && pontos <= n.max) || NIVEIS[0];
}

export default function PontosButton({ user }) {
  const [open, setOpen] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const [panelStyle, setPanelStyle] = useState({});
  const btnRef = useRef(null);
  const panelRef = useRef(null);

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
      const panelW = 300;
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
  const role = user.tipo_usuario === "consultor" ? "consultor" : "empreendedor";
  const trilha = role === "consultor" ? TRILHA_CONSULTOR : TRILHA_EMPREENDEDOR;
  const concluidas = new Set(progresso?.tarefas_concluidas || []);

  // Próximas tarefas: pendentes ordenadas por pontos (mais próximas primeiro)
  const pendentes = trilha.filter(t => !concluidas.has(t.id));
  const proximas = pendentes.slice(0, 4);

  // Progresso até o próximo nível
  const idxNivel = NIVEIS.indexOf(nivel);
  const proximoNivel = NIVEIS[idxNivel + 1];
  const ptsPct = proximoNivel
    ? Math.min(100, Math.round(((pontos - nivel.min) / (proximoNivel.min - nivel.min)) * 100))
    : 100;

  const panel = open ? (
    <div
      ref={panelRef}
      style={{ ...panelStyle, maxHeight: "80vh" }}
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{nivel.icone}</span>
          <div>
            <p className="text-xs font-bold text-slate-700">{nivel.nome}</p>
            <p className="text-[11px] text-slate-500">{pontos} pontos</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Barra de progresso */}
      {proximoNivel && (
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Progresso para <strong>{proximoNivel.icone} {proximoNivel.nome}</strong></span>
            <span>{ptsPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: `linear-gradient(90deg, #6366f1, #8b5cf6)` }}
              initial={{ width: 0 }}
              animate={{ width: `${ptsPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Tarefas próximas */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 pt-3 pb-1">
          {proximas.length > 0 ? "Próximas tarefas" : "Trilha concluída! 🎉"}
        </p>
        {proximas.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-indigo-600">+{t.pontos}</span>
            </div>
            <p className="text-sm text-slate-700 flex-1 leading-tight">{t.titulo}</p>
          </div>
        ))}
        {concluidas.size > 0 && (
          <div className="px-4 py-2 border-t border-gray-50 mt-1">
            <p className="text-[10px] text-slate-400">
              ✅ {concluidas.size} de {trilha.length} tarefas concluídas
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