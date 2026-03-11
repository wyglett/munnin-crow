import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, MessageSquare, FileText, Activity, Bot, BookOpen, Settings, User, Menu, X, ChevronRight, Info, CreditCard, Feather, Receipt, Building2, LogOut } from "lucide-react";

import PontosNotificacao from "./components/gamification/PontosNotificacao";
import OnboardingModal from "./components/onboarding/OnboardingModal";
import NotificacoesPanel from "./components/notificacoes/NotificacoesPanel";
import GuidedTour from "./components/onboarding/GuidedTour";
import BannerPendente from "./components/layout/BannerPendente";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_699eeda5be72b683e3bedcf3/7507bc7bf_e6e55591-30ba-4237-91e5-2d46775150cf.png";

const getNavItems = (role, user) => {
  if (role === "consultor") {
    const items = [
      // Trabalho principal
      { name: "ConsultorDashboard", label: "Tutorias", icon: MessageSquare },
      { name: "PropostasConsultor", label: "Propostas", icon: FileText },
      { name: "Acompanhamento", label: "Acompanhamento", icon: Activity },
      // Gestão
      { name: "ConsultorGestao", label: "Gestão & Recibos", icon: Receipt },
      // Organização (se aplicável)
      // Conteúdo & comunidade
      { name: "Comunidade", label: "Comunidade", icon: MessageSquare },
      { name: "VooDoCorvo", label: "O Voo do Corvo", icon: Feather },
      { name: "Orientacoes", label: "Orientações", icon: BookOpen },
      // Planos
      { name: "Planos", label: "Planos", icon: CreditCard },
    ];
    if (user?.e_organizacao) {
      items.splice(3, 0, { name: "GestaoOrganizacao", label: "Minha Organização", icon: Building2 });
    }
    return items;
  }
  return [
    // Descoberta
    { name: "Home", label: "Editais", icon: Home },
    // Propostas & Projetos
    { name: "MinhasPropostas", label: "Minhas Propostas", icon: FileText },
    { name: "Acompanhamento", label: "Acompanhamento", icon: Activity },
    { name: "MeusRecibos", label: "Recibos / NFs", icon: Receipt },
    // Apoio & Conhecimento
    { name: "TiraDuvidas", label: "Tira-dúvidas IA", icon: Bot },
    { name: "Comunidade", label: "Comunidade", icon: MessageSquare },
    { name: "VooDoCorvo", label: "O Voo do Corvo", icon: Feather },
    { name: "Orientacoes", label: "Orientações", icon: BookOpen },
    // Planos
    { name: "Planos", label: "Planos", icon: CreditCard },
  ];
};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewAsRole, setViewAsRole] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showVerComo, setShowVerComo] = useState(false);
  const verComoRef = useRef(null);

  // Close Ver Como on outside click
  useEffect(() => {
    if (!showVerComo) return;
    const handler = (e) => {
      if (verComoRef.current && !verComoRef.current.contains(e.target)) {
        setShowVerComo(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVerComo]);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);

      // Aplicar tipo_usuario pendente (vindo do fluxo pre-login)
      const pendingTipo = localStorage.getItem("pending_tipo_usuario");
      if (pendingTipo && u && u.role !== "admin" && !u.tipo_usuario) {
        localStorage.removeItem("pending_tipo_usuario");
        await base44.auth.updateMe({ tipo_usuario: pendingTipo });
        setUser(prev => ({ ...prev, tipo_usuario: pendingTipo }));
      }

      if (u && u.role !== "admin" && (!u.perfil_concluido || !u.tipo_usuario)) {
        setShowOnboarding(true);
      }
    }).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";
  const effectiveRole = viewAsRole || user?.tipo_usuario || user?.role;

  const renderNavItem = (item) => {
    if (item.separator) {
      return <div key={item.key} className="pt-3 pb-1"><div className="h-px bg-white/5" /></div>;
    }
    if (item.label_section) {
      return <p key={item.key} className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] px-4 pb-1 pt-3">{item.label_section}</p>;
    }
    const isActive = currentPageName === item.name;
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        to={createPageUrl(item.name)}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <Link to={createPageUrl("Home")} className="flex items-center justify-center" onClick={() => setMobileOpen(false)}>
          <div className="relative">
            <div className="absolute -inset-2 bg-white/10 blur-xl" />
            <img 
              src={LOGO_URL} 
              alt="Munnin Crow" 
              className="relative h-12 w-auto object-contain" 
              style={{
                filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.8)) drop-shadow(0 0 4px rgba(255,255,255,0.6)) drop-shadow(0 0 8px rgba(255,255,255,0.4))'
              }}
            />
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {viewAsRole && (
          <div className="mb-3 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
            <p className="text-[10px] text-amber-300 font-bold mb-1">MODO VISUALIZAÇÃO</p>
            <p className="text-xs text-amber-200">Vendo como: {viewAsRole === "empreendedor" ? "Empreendedor" : "Consultor"}</p>
            <button onClick={() => setViewAsRole(null)} className="text-xs text-amber-100 underline hover:text-white mt-1">Voltar ao Admin</button>
          </div>
        )}
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] px-4 pb-2">Principal</p>
        {getNavItems(effectiveRole, user).map(renderNavItem)}
        {isAdmin && !viewAsRole && (
          <>
            <div className="pt-4" />
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] px-4 pb-2">Gestão</p>
            {renderNavItem({ name: "AdminEditais", label: "Administração", icon: Settings })}
          </>
        )}
      </nav>

      {/* Notificações */}
      <div className="px-3 pb-1">
        <div className="flex items-center gap-2 px-4 py-2 text-slate-400">
          <NotificacoesPanel user={user} />
          <span className="text-xs">Notificações</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-3 space-y-1">
        {isAdmin && !viewAsRole && (
          <div className="mb-2 pb-2 border-b border-white/5 relative" ref={verComoRef}>
            <button
              onClick={() => setShowVerComo(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ver Como</span>
              <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${showVerComo ? "rotate-90" : ""}`} />
            </button>
            {showVerComo && (
              <div className="mt-1 bg-[#0c0f1a] border border-white/10 rounded-xl p-1.5 shadow-2xl">
                <button
                  onClick={() => { setViewAsRole("empreendedor"); setShowVerComo(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <User className="w-3 h-3" /> Empreendedor
                </button>
                <button
                  onClick={() => { setViewAsRole("consultor"); setShowVerComo(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <User className="w-3 h-3" /> Consultor
                </button>
              </div>
            )}
          </div>
        )}
        <Link
          to={createPageUrl("SobreNos")}
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Sobre Nós</span>
        </Link>
        <div className="border-t border-white/5 pt-2">
          {user ? (
            <>
              <Link
                to={createPageUrl("Perfil")}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  currentPageName === "Perfil"
                    ? "bg-indigo-600/90 text-white"
                    : "hover:bg-white/5 text-slate-300"
                }`}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-indigo-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.full_name || "Meu Perfil"}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || ""}</p>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
              </Link>
              <button
                onClick={() => base44.auth.logout(window.location.origin)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-indigo-600/20 text-slate-300 hover:text-white transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 group-hover:bg-indigo-600/50 flex items-center justify-center transition-all">
                <User className="w-4 h-4 text-indigo-300" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium">Acessar Meu Usuário</p>
                <p className="text-[10px] text-slate-500">Entrar ou cadastrar</p>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0 bg-[#0c0f1a]/80 backdrop-blur-xl border-r border-white/5">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-[#0c0f1a] flex flex-col z-10">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#0c0f1a] border-b border-white/5">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative flex-1 flex justify-center">
            <div className="absolute -inset-1 bg-white/10 blur-md" />
            <img 
              src={LOGO_URL} 
              alt="Munnin Crow" 
              className="relative h-8 w-auto object-contain" 
              style={{
                filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.8)) drop-shadow(0 0 4px rgba(255,255,255,0.6))'
              }}
            />
          </div>
          <NotificacoesPanel user={user} />
        </header>
        {user && user.role !== "admin" && user.tipo_usuario === "consultor" && !user.acesso_liberado && (
          <BannerPendente tipoUsuario={user.tipo_usuario} acesso_liberado={user.acesso_liberado} />
        )}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
      <PontosNotificacao />
      {showTour && <GuidedTour onFinish={() => setShowTour(false)} />}
      <OnboardingModal
        user={user}
        open={showOnboarding}
        onComplete={(tipoUsuario) => {
          setShowOnboarding(false);
          setUser(u => u ? { ...u, tipo_usuario: tipoUsuario, perfil_concluido: true } : u);
          // Mostrar tour após completar onboarding
          const tourDone = localStorage.getItem("guided_tour_done");
          if (!tourDone) setShowTour(true);
        }}
      />
    </div>
  );
}