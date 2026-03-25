import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  FileText, Activity, Bot, BookOpen, MessageSquare,
  CreditCard, Feather, Receipt, Building2, Settings, User,
  Home, LogOut, ChevronRight
} from "lucide-react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import NotificacoesPanel from "@/components/notificacoes/NotificacoesPanel";

// Block definitions — each has its own gradient identity
const getBlocks = (role, user, isAdmin) => {
  const empreendedorBlocks = [
    {
      name: "Home",
      label: "Editais",
      sub: "Descubra oportunidades de fomento",
      icon: Home,
      grad: ["#4f46e5", "#7c3aed", "#312e81"],   // indigo → violet
      accent: "#a78bfa",
    },
    {
      name: "MinhasPropostas",
      label: "Minhas Propostas",
      sub: "Gerencie suas submissões",
      icon: FileText,
      grad: ["#0ea5e9", "#0284c7", "#0c4a6e"],   // sky
      accent: "#38bdf8",
    },
    {
      name: "Acompanhamento",
      label: "Acompanhamento",
      sub: "Monitore projetos contratados",
      icon: Activity,
      grad: ["#10b981", "#059669", "#064e3b"],   // emerald
      accent: "#6ee7b7",
    },
    {
      name: "TiraDuvidas",
      label: "Tira-dúvidas IA",
      sub: "Converse com a inteligência artificial",
      icon: Bot,
      grad: ["#f59e0b", "#d97706", "#78350f"],   // amber
      accent: "#fcd34d",
    },
    {
      name: "Comunidade",
      label: "Comunidade",
      sub: "Conecte-se com empreendedores",
      icon: MessageSquare,
      grad: ["#ec4899", "#db2777", "#831843"],   // pink
      accent: "#f9a8d4",
    },
    {
      name: "VooDoCorvo",
      label: "O Voo do Corvo",
      sub: "Conteúdo e inspiração",
      icon: Feather,
      grad: ["#8b5cf6", "#7c3aed", "#4c1d95"],   // purple
      accent: "#c4b5fd",
    },
    {
      name: "Orientacoes",
      label: "Orientações",
      sub: "Guias e materiais de apoio",
      icon: BookOpen,
      grad: ["#14b8a6", "#0d9488", "#134e4a"],   // teal
      accent: "#5eead4",
    },
    {
      name: "MeusRecibos",
      label: "Recibos / NFs",
      sub: "Controle seus documentos fiscais",
      icon: Receipt,
      grad: ["#64748b", "#475569", "#1e293b"],   // slate
      accent: "#94a3b8",
    },
    {
      name: "Planos",
      label: "Planos",
      sub: "Conheça os planos disponíveis",
      icon: CreditCard,
      grad: ["#f97316", "#ea580c", "#7c2d12"],   // orange
      accent: "#fdba74",
    },
  ];

  const consultorBlocks = [
    {
      name: "ConsultorDashboard",
      label: "Tutorias",
      sub: "Suas solicitações ativas",
      icon: MessageSquare,
      grad: ["#4f46e5", "#7c3aed", "#312e81"],
      accent: "#a78bfa",
    },
    {
      name: "PropostasConsultor",
      label: "Propostas",
      sub: "Propostas de consultoria",
      icon: FileText,
      grad: ["#0ea5e9", "#0284c7", "#0c4a6e"],
      accent: "#38bdf8",
    },
    {
      name: "Acompanhamento",
      label: "Acompanhamento",
      sub: "Projetos que você apoia",
      icon: Activity,
      grad: ["#10b981", "#059669", "#064e3b"],
      accent: "#6ee7b7",
    },
    {
      name: "ConsultorGestao",
      label: "Gestão & Recibos",
      sub: "Controle financeiro",
      icon: Receipt,
      grad: ["#f59e0b", "#d97706", "#78350f"],
      accent: "#fcd34d",
    },
    {
      name: "Comunidade",
      label: "Comunidade",
      sub: "Rede de consultores",
      icon: MessageSquare,
      grad: ["#ec4899", "#db2777", "#831843"],
      accent: "#f9a8d4",
    },
    {
      name: "VooDoCorvo",
      label: "O Voo do Corvo",
      sub: "Conteúdo e inspiração",
      icon: Feather,
      grad: ["#8b5cf6", "#7c3aed", "#4c1d95"],
      accent: "#c4b5fd",
    },
    {
      name: "Orientacoes",
      label: "Orientações",
      sub: "Materiais e guias",
      icon: BookOpen,
      grad: ["#14b8a6", "#0d9488", "#134e4a"],
      accent: "#5eead4",
    },
    {
      name: "Planos",
      label: "Planos",
      sub: "Conheça os planos",
      icon: CreditCard,
      grad: ["#f97316", "#ea580c", "#7c2d12"],
      accent: "#fdba74",
    },
  ];

  let blocks = role === "consultor" ? consultorBlocks : empreendedorBlocks;
  if (user?.e_organizacao && role === "consultor") {
    blocks = [
      ...blocks.slice(0, 4),
      {
        name: "GestaoOrganizacao",
        label: "Minha Organização",
        sub: "Gerencie sua organização",
        icon: Building2,
        grad: ["#6366f1", "#4338ca", "#1e1b4b"],
        accent: "#a5b4fc",
      },
      ...blocks.slice(4),
    ];
  }
  if (isAdmin) {
    blocks = [
      ...blocks,
      {
        name: "AdminEditais",
        label: "Administração",
        sub: "Painel de administração",
        icon: Settings,
        grad: ["#dc2626", "#b91c1c", "#450a0a"],
        accent: "#fca5a5",
      },
    ];
  }
  return blocks;
};

// Individual animated block
function NavBlock({ block, index }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useTransform(mouseY, [0, 1], [6, -6]);
  const rotateY = useTransform(mouseX, [0, 1], [-6, 6]);

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
    mouseX.set(0.5);
    mouseY.set(0.5);
    setMousePos({ x: 50, y: 50 });
    setHovered(false);
  };

  const Icon = block.icon;
  const [c1, c2, c3] = block.grad;

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
          {/* Base gradient — shifts based on mouse position */}
          <div
            className="absolute inset-0 transition-all duration-200"
            style={{
              background: hovered
                ? `radial-gradient(ellipse at ${mousePos.x}% ${mousePos.y}%, ${c1}ff 0%, ${c2}dd 40%, ${c3}bb 100%)`
                : `linear-gradient(135deg, ${c1}cc, ${c2}aa, ${c3}99)`,
            }}
          />

          {/* Accent glow that follows cursor */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none transition-all duration-100"
                style={{
                  background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${block.accent}66 0%, transparent 55%)`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }} />

          {/* Border glow */}
          <div
            className="absolute inset-0 rounded-2xl border transition-all duration-300"
            style={{
              borderColor: hovered ? `${block.accent}88` : `${block.accent}22`,
              boxShadow: hovered ? `0 0 30px ${block.accent}44, inset 0 0 30px ${block.accent}11` : "none",
            }}
          />

          {/* Content */}
          <div className="relative h-full p-5 flex flex-col justify-between" style={{ transform: "translateZ(20px)" }}>
            <motion.div
              animate={{ scale: hovered ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${block.accent}33`, border: `1px solid ${block.accent}44` }}
            >
              <Icon className="w-5 h-5" style={{ color: block.accent }} />
            </motion.div>

            <div>
              <p className="text-white font-bold text-base leading-tight">{block.label}</p>
              <p className="text-white/50 text-xs mt-0.5">{block.sub}</p>
            </div>
          </div>

          {/* Arrow on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="absolute top-4 right-4"
              >
                <ChevronRight className="w-4 h-4 text-white/60" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    </motion.div>
  );
}

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_699eeda5be72b683e3bedcf3/7507bc7bf_e6e55591-30ba-4237-91e5-2d46775150cf.png";

export default function V2HomePage({ user, isAdmin, effectiveRole }) {
  const blocks = getBlocks(effectiveRole, user, isAdmin);
  const firstName = user?.full_name?.split(" ")[0] || "por aqui";

  const greetings = [
    `Bom dia, ${firstName}. Para onde vamos?`,
    `Olá, ${firstName}. O que vamos explorar hoje?`,
    `E aí, ${firstName}. Qual o próximo passo?`,
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a0e1a 0%, #0f172a 40%, #150d2e 100%)" }}
    >
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full"
          style={{ background: "radial-gradient(circle, #4f46e511 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full"
          style={{ background: "radial-gradient(circle, #7c3aed0d 0%, transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <img
            src={LOGO_URL}
            alt="Munnin Crow"
            className="h-10 w-auto object-contain"
            style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.6))" }}
          />
          <div className="flex items-center gap-3">
            <NotificacoesPanel user={user} />
            <Link to={createPageUrl("Perfil")} className="flex items-center gap-2 group">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40" />
                : <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center"><User className="w-4 h-4 text-indigo-300" /></div>
              }
              <span className="text-sm text-white/60 group-hover:text-white transition-colors hidden sm:block">{user?.full_name?.split(" ")[0]}</span>
            </Link>
            <button
              onClick={() => base44.auth.logout(window.location.origin)}
              className="text-white/30 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-10"
        >
          <p className="text-white/30 text-xs uppercase tracking-[0.2em] font-bold mb-2">Plataforma Munnin Crow</p>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-snug">
            {greeting}
          </h1>
        </motion.div>

        {/* Blocks grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {blocks.map((block, i) => (
            <NavBlock key={block.name} block={block} index={i} />
          ))}
        </div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-4 mt-10 text-white/20 text-xs"
        >
          <Link to={createPageUrl("SobreNos")} className="hover:text-white/50 transition-colors">Sobre Nós</Link>
          <span>·</span>
          <Link to={createPageUrl("Perfil")} className="hover:text-white/50 transition-colors">Perfil & Aparência</Link>
        </motion.div>
      </div>
    </div>
  );
}