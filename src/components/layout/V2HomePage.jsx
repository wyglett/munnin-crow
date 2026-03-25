import React, { useState, useRef, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  FileText, Activity, Bot, BookOpen, MessageSquare,
  CreditCard, Feather, Receipt, Building2, Settings, User,
  Home, LogOut, ChevronRight, Sparkles, ArrowUpRight
} from "lucide-react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import NotificacoesPanel from "@/components/notificacoes/NotificacoesPanel";
import PontosButton from "@/components/gamification/PontosButton";
import { getAppearance } from "@/hooks/useAppearance";
import NorseBackground from "@/components/layout/NorseBackground";

// Block definitions
const getBlocks = (role, user, isAdmin) => {
  const empreendedorBlocks = [
    { name: "BuscarEditais",   label: "Editais",           sub: "Descubra oportunidades de fomento",  icon: Home,         grad: ["#4f46e5","#7c3aed","#312e81"], accent: "#a78bfa", pastel: ["#ede9fe","#ddd6fe","#c4b5fd"], bgImage: "💰" },
    { name: "MinhasPropostas", label: "Minhas Propostas",  sub: "Gerencie suas submissões",            icon: FileText,     grad: ["#0ea5e9","#0284c7","#0c4a6e"], accent: "#38bdf8", pastel: ["#e0f2fe","#bae6fd","#7dd3fc"], bgImage: "📄" },
    { name: "Acompanhamento",  label: "Acompanhamento",    sub: "Monitore projetos contratados",       icon: Activity,     grad: ["#10b981","#059669","#064e3b"], accent: "#6ee7b7", pastel: ["#d1fae5","#a7f3d0","#6ee7b7"], bgImage: "🤝" },
    { name: "Comunidade",      label: "Comunidade",        sub: "Conecte-se com empreendedores",       icon: MessageSquare,grad: ["#ec4899","#db2777","#831843"], accent: "#f9a8d4", pastel: ["#fce7f3","#fbcfe8","#f9a8d4"], bgImage: "👥" },
    { name: "Orientacoes",     label: "Orientações",       sub: "Guias e materiais de apoio",          icon: BookOpen,     grad: ["#14b8a6","#0d9488","#134e4a"], accent: "#5eead4", pastel: ["#ccfbf1","#99f6e4","#5eead4"], bgImage: "📚" },
    { name: "Planos",          label: "Planos",            sub: "Conheça os planos disponíveis",       icon: CreditCard,   grad: ["#f97316","#ea580c","#7c2d12"], accent: "#fdba74", pastel: ["#ffedd5","#fed7aa","#fdba74"], bgImage: "🎓" },
  ];

  const consultorBlocks = [
    { name: "ConsultorDashboard", label: "Tutorias",       sub: "Suas solicitações ativas",      icon: MessageSquare, grad: ["#4f46e5","#7c3aed","#312e81"], accent: "#a78bfa", pastel: ["#ede9fe","#ddd6fe","#c4b5fd"], bgImage: "💬" },
    { name: "PropostasConsultor", label: "Propostas",      sub: "Propostas de consultoria",      icon: FileText,      grad: ["#0ea5e9","#0284c7","#0c4a6e"], accent: "#38bdf8", pastel: ["#e0f2fe","#bae6fd","#7dd3fc"], bgImage: "📄" },
    { name: "Acompanhamento",     label: "Acompanhamento", sub: "Projetos que você apoia",       icon: Activity,      grad: ["#10b981","#059669","#064e3b"], accent: "#6ee7b7", pastel: ["#d1fae5","#a7f3d0","#6ee7b7"], bgImage: "🤝" },
    { name: "ConsultorGestao",    label: "Gestão & Recibos",sub: "Controle financeiro",          icon: Receipt,       grad: ["#f59e0b","#d97706","#78350f"], accent: "#fcd34d", pastel: ["#fef3c7","#fde68a","#fcd34d"], bgImage: "💰" },
    { name: "Comunidade",         label: "Comunidade",     sub: "Rede de consultores",           icon: MessageSquare, grad: ["#ec4899","#db2777","#831843"], accent: "#f9a8d4", pastel: ["#fce7f3","#fbcfe8","#f9a8d4"], bgImage: "👥" },
    { name: "Orientacoes",        label: "Orientações",    sub: "Materiais e guias",             icon: BookOpen,      grad: ["#14b8a6","#0d9488","#134e4a"], accent: "#5eead4", pastel: ["#ccfbf1","#99f6e4","#5eead4"], bgImage: "📚" },
    { name: "Planos",             label: "Planos",         sub: "Conheça os planos",             icon: CreditCard,    grad: ["#f97316","#ea580c","#7c2d12"], accent: "#fdba74", pastel: ["#ffedd5","#fed7aa","#fdba74"], bgImage: "🎓" },
  ];

  let blocks = role === "consultor" ? consultorBlocks : empreendedorBlocks;
  if (user?.e_organizacao && role === "consultor") {
    blocks = [
      ...blocks.slice(0, 4),
      { name: "GestaoOrganizacao", label: "Minha Organização", sub: "Gerencie sua organização", icon: Building2, grad: ["#6366f1","#4338ca","#1e1b4b"], accent: "#a5b4fc", pastel: ["#e0e7ff","#c7d2fe","#a5b4fc"] },
      ...blocks.slice(4),
    ];
  }
  if (isAdmin && role === "admin") {
    blocks = [...blocks, { name: "AdminEditais", label: "Administração", sub: "Painel de administração", icon: Settings, grad: ["#dc2626","#b91c1c","#450a0a"], accent: "#fca5a5", pastel: ["#fee2e2","#fecaca","#fca5a5"], bgImage: "💰" }];
  }
  return blocks;
};

// ── NavBlock ──────────────────────────────────────────────────────────────────
function NavBlock({ block, index, isLight }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useTransform(mouseY, [0, 1], [5, -5]);
  const rotateY = useTransform(mouseX, [0, 1], [-5, 5]);
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
    mouseX.set(x / 100);
    mouseY.set(y / 100);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5); mouseY.set(0.5);
    setMousePos({ x: 50, y: 50 });
    setHovered(false);
  };

  const Icon = block.icon;
  const [c1, c2, c3] = block.grad;
  const [p1, p2, p3] = block.pastel || [c1 + "22", c2 + "18", c3 + "10"];

  if (isLight) {
    // ── Light mode: rich pastel gradient card with blue cursor-light ─────────
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.055 }}
        style={{ perspective: 900 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        <Link to={createPageUrl(block.name)} className="block">
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative rounded-2xl overflow-hidden cursor-pointer h-36 md:h-40"
          >
            {/* Pastel base gradient */}
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${p1} 0%, ${p2} 60%, ${p3} 100%)`,
            }} />

            {/* Blue/indigo cursor light */}
            <div
              className="absolute inset-0 transition-opacity duration-150 pointer-events-none"
              style={{
                opacity: hovered ? 1 : 0,
                background: `radial-gradient(ellipse 60% 60% at ${mousePos.x}% ${mousePos.y}%, #6366f155 0%, #3b82f622 40%, transparent 70%)`,
              }}
            />

            {/* Colored cursor spot (block's own accent) */}
            <div
              className="absolute inset-0 transition-opacity duration-150 pointer-events-none"
              style={{
                opacity: hovered ? 0.7 : 0,
                background: `radial-gradient(circle 80px at ${mousePos.x}% ${mousePos.y}%, ${c1}44 0%, transparent 70%)`,
              }}
            />

            {/* Subtle noise */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }} />

            {/* Border */}
            <div
              className="absolute inset-0 rounded-2xl border transition-all duration-300"
              style={{
                borderColor: hovered ? `${c1}55` : `${c1}25`,
                boxShadow: hovered
                  ? `0 8px 32px ${c1}22, 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`
                  : `0 1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)`,
              }}
            />

            {/* Top shine */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)` }} />

            {/* Content */}
            <div className="relative h-full p-5 flex flex-col justify-between" style={{ transform: "translateZ(20px)" }}>
              <div className="flex items-start justify-between">
                <motion.div
                  animate={{ scale: hovered ? 1.08 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${c1}30, ${c2}20)`,
                    border: `1px solid ${c1}40`,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: c1 }} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <ArrowUpRight className="w-4 h-4" style={{ color: c1 }} />
                </motion.div>
              </div>

              <div>
                <p className="text-slate-800 font-bold text-base leading-tight">{block.label}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{block.sub}</p>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  // ── Dark / Edgy mode ────────────────────────────────────────────────────────
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      style={{ perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      <Link to={createPageUrl(block.name)} className="block">
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative rounded-2xl overflow-hidden cursor-pointer h-36 md:h-40"
        >
          <div className="absolute inset-0 transition-all duration-200" style={{
            background: hovered
              ? `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, ${c1}ff 0%, ${c2}dd 40%, ${c3}bb 100%)`
              : `linear-gradient(135deg, ${c1}cc, ${c2}aa, ${c3}99)`,
          }} />
          <AnimatePresence>
            {hovered && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${block.accent}66 0%, transparent 55%)` }}
              />
            )}
          </AnimatePresence>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }} />
          <div className="absolute inset-0 rounded-2xl border transition-all duration-300" style={{
            borderColor: hovered ? `${block.accent}88` : `${block.accent}22`,
            boxShadow: hovered ? `0 0 30px ${block.accent}44, inset 0 0 30px ${block.accent}11` : "none",
          }} />
          <div className="relative h-full p-5 flex flex-col justify-between" style={{ transform: "translateZ(20px)" }}>
            <div className="flex items-start justify-between">
              <motion.div
                animate={{ scale: hovered ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${block.accent}33`, border: `1px solid ${block.accent}44` }}
              >
                <Icon className="w-5 h-5" style={{ color: block.accent }} />
              </motion.div>
              <AnimatePresence>
                {hovered && (
                  <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }}>
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">{block.label}</p>
              <p className="text-white/50 text-xs mt-0.5">{block.sub}</p>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_699eeda5be72b683e3bedcf3/7507bc7bf_e6e55591-30ba-4237-91e5-2d46775150cf.png";

export default function V2HomePage({ user, isAdmin, effectiveRole }) {
  const [isLight, setIsLight] = useState(() => getAppearance().tema === "light");

  useEffect(() => {
    const interval = setInterval(() => setIsLight(getAppearance().tema === "light"), 300);
    return () => clearInterval(interval);
  }, []);

  const blocks = getBlocks(effectiveRole, user, isAdmin);
  const firstName = user?.full_name?.split(" ")[0] || "por aqui";

  const greeting = useMemo(() => {
    const list = [
      `Bom dia, ${firstName}. Para onde vamos?`,
      `Olá, ${firstName}. O que vamos explorar hoje?`,
      `E aí, ${firstName}. Qual o próximo passo?`,
    ];
    return list[Math.floor(Math.random() * list.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName]);

  const rootBg = isLight
    ? "linear-gradient(160deg, #eef2ff 0%, #f1f5f9 45%, #faf5ff 100%)"
    : "linear-gradient(160deg, #0a0e1a 0%, #0f172a 40%, #150d2e 100%)";

  const logoFilter = isLight ? "none" : "drop-shadow(0 0 4px rgba(255,255,255,0.6))";

  return (
    <div className="v2-home min-h-screen relative overflow-hidden" style={{ background: rootBg }}>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute top-[-15%] left-[-8%] w-[55vw] h-[55vw] rounded-full"
          style={{ background: isLight ? "radial-gradient(circle, #6366f125 0%, transparent 65%)" : "radial-gradient(circle, #4f46e511 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] rounded-full"
          style={{ background: isLight ? "radial-gradient(circle, #8b5cf620 0%, transparent 65%)" : "radial-gradient(circle, #7c3aed0d 0%, transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] rounded-full"
          style={{ background: isLight ? "radial-gradient(circle, #0ea5e918 0%, transparent 65%)" : "radial-gradient(circle, #0ea5e908 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Norse background — both light and dark */}
      <NorseBackground isLight={isLight} intensity={isLight ? "normal" : "subtle"} />

      <div className="relative max-w-5xl mx-auto px-6 py-10">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Munnin Crow" className="h-10 w-auto object-contain" style={{ filter: logoFilter }} />
          </div>
          <div className="flex items-center gap-3">
            <PontosButton user={user} />
            <NotificacoesPanel user={user} />
            <Link to={createPageUrl("Perfil")} className="flex items-center gap-2 group">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-400/40" />
                : <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLight ? "bg-indigo-100" : "bg-indigo-600/30"}`}>
                    <User className={`w-4 h-4 ${isLight ? "text-indigo-600" : "text-indigo-300"}`} />
                  </div>
              }
              <span className={`text-sm font-medium hidden sm:block transition-colors ${isLight ? "text-slate-600 group-hover:text-slate-900" : "text-white/60 group-hover:text-white"}`}>
                {user?.full_name?.split(" ")[0]}
              </span>
            </Link>
            <button onClick={() => base44.auth.logout(window.location.origin)}
              className={`transition-colors ${isLight ? "text-slate-400 hover:text-red-500" : "text-white/30 hover:text-red-400"}`}
              title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Greeting section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className={`w-3.5 h-3.5 ${isLight ? "text-indigo-400" : "text-indigo-400"}`} />
            <p className={`text-xs uppercase tracking-[0.22em] font-bold ${isLight ? "text-indigo-400" : "text-indigo-400/70"}`}>
              Plataforma Munnin Crow
            </p>
          </div>
          <h1 className={`text-3xl md:text-4xl font-black leading-snug ${isLight ? "text-slate-900" : "text-white"}`}>
            {greeting}
          </h1>
          <p className={`mt-2 text-sm ${isLight ? "text-slate-500" : "text-white/40"}`}>
            Selecione uma área para começar
          </p>
        </motion.div>

        {/* Blocks grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {blocks.map((block, i) => (
            <NavBlock key={block.name} block={block} index={i} isLight={isLight} />
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className={`flex items-center gap-4 mt-10 text-xs ${isLight ? "text-slate-400" : "text-white/20"}`}
        >
          <Link to={createPageUrl("SobreNos")} className={`transition-colors ${isLight ? "hover:text-slate-600" : "hover:text-white/50"}`}>Sobre Nós</Link>
          <span>·</span>
          <Link to={createPageUrl("Perfil")} className={`transition-colors ${isLight ? "hover:text-slate-600" : "hover:text-white/50"}`}>Perfil & Aparência</Link>
        </motion.div>
      </div>
    </div>
  );
}