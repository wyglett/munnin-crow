import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, MessageSquare, FileText, Activity, BookOpen, Settings, User, Menu, X, ChevronRight, Info, CreditCard, Receipt, Building2, LogOut } from "lucide-react";

import PontosNotificacao from "./components/gamification/PontosNotificacao";
import OnboardingModal from "./components/onboarding/OnboardingModal";
import NotificacoesPanel from "./components/notificacoes/NotificacoesPanel";
import GuidedTour from "./components/onboarding/GuidedTour";
import BannerPendente from "./components/layout/BannerPendente";
import FirstAccessGuide from "./components/onboarding/FirstAccessGuide";
import AppearanceFloatingPanel from "./components/layout/AppearanceFloatingPanel";
import { getAppearance } from "@/hooks/useAppearance";
import V2HomePage from "@/components/layout/V2HomePage";
import PontosButton from "@/components/gamification/PontosButton";
import NorseBackground from "@/components/layout/NorseBackground";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_699eeda5be72b683e3bedcf3/7507bc7bf_e6e55591-30ba-4237-91e5-2d46775150cf.png";

const getNavItems = (role, user) => {
  if (role === "consultor") {
    const items = [
      { key: "s1", label_section: "Trabalho" },
      { name: "ConsultorDashboard", label: "Tutorias", icon: MessageSquare },
      { name: "PropostasConsultor", label: "Propostas", icon: FileText },
      { name: "Acompanhamento", label: "Acompanhamento", icon: Activity },
      { key: "s2", label_section: "Gestão" },
      { name: "ConsultorGestao", label: "Gestão & Recibos", icon: Receipt },
      { key: "s3", label_section: "Comunidade" },
      { name: "Comunidade", label: "Comunidade", icon: MessageSquare },
      { name: "Orientacoes", label: "Orientações", icon: BookOpen },
      { key: "s4", label_section: "Conta" },
      { name: "Planos", label: "Planos", icon: CreditCard },
    ];
    if (user?.e_organizacao) {
      items.splice(5, 0, { name: "GestaoOrganizacao", label: "Minha Organização", icon: Building2 });
    }
    return items;
  }
  return [
    { key: "s1", label_section: "Descoberta" },
    { name: "Home", label: "Editais", icon: Home },
    { key: "s2", label_section: "Meus Projetos" },
    { name: "MinhasPropostas", label: "Minhas Propostas", icon: FileText },
    { name: "Acompanhamento", label: "Acompanhamento", icon: Activity },
    { key: "s3", label_section: "Apoio" },
    { name: "Comunidade", label: "Comunidade", icon: MessageSquare },
    { key: "s4", label_section: "Conteúdo" },
    { name: "Orientacoes", label: "Orientações", icon: BookOpen },
    { key: "s5", label_section: "Conta" },
    { name: "Planos", label: "Planos", icon: CreditCard },
  ];
};

// ─── Edgy Layout (original dark sidebar) ─────────────────────────────────────
function EdgyLayout({ user, isAdmin, effectiveRole, viewAsRole, setViewAsRole, currentPageName, children, mobileOpen, setMobileOpen, showVerComo, setShowVerComo, verComoRef, showTour, setShowTour, showOnboarding, setShowOnboarding, setUser }) {
  const isLight = getAppearance().tema === "light";

  const sidebar = isLight
    ? { bg: "bg-white border-r border-slate-200", navBg: "", activeCls: "bg-indigo-600 text-white", inactiveCls: "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50", sectionCls: "text-slate-400", mobileBg: "bg-white" }
    : { bg: "bg-[#0c0f1a]/80 backdrop-blur-xl border-r border-white/5", navBg: "", activeCls: "bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20", inactiveCls: "text-slate-400 hover:text-white hover:bg-white/5", sectionCls: "text-slate-600", mobileBg: "bg-[#0c0f1a]" };

  const rootBg = isLight
    ? "bg-slate-100"
    : "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)";

  const renderNavItem = (item) => {
    if (item.separator) return <div key={item.key} className="pt-3 pb-1"><div className={`h-px ${isLight ? "bg-slate-100" : "bg-white/5"}`} /></div>;
    if (item.label_section) return <p key={item.key} className={`text-[10px] font-bold ${sidebar.sectionCls} uppercase tracking-[0.15em] px-4 pb-1 pt-3`}>{item.label_section}</p>;
    const isActive = currentPageName === item.name;
    const Icon = item.icon;
    return (
      <Link key={item.name} to={createPageUrl(item.name)} onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? sidebar.activeCls : sidebar.inactiveCls}`}>
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const logoFilter = isLight
    ? "none"
    : "drop-shadow(0 0 2px rgba(255,255,255,1)) drop-shadow(0 0 8px rgba(165,180,252,0.9)) drop-shadow(0 0 20px rgba(99,102,241,0.6))";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`px-5 py-5 border-b ${isLight ? "border-slate-100" : "border-white/5"}`}>
        <Link to={createPageUrl("Home")} className="flex items-center justify-center" onClick={() => setMobileOpen(false)}>
          <div className="relative">
            {!isLight && (
              <>
                <div className="absolute -inset-3 bg-indigo-500/20 blur-2xl rounded-full" />
                <div className="absolute -inset-1 bg-white/8 blur-lg rounded-full" />
              </>
            )}
            <img src={LOGO_URL} alt="Munnin Crow" className="relative h-12 w-auto object-contain" style={{ filter: logoFilter }} />
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {viewAsRole && (
          <div className="mb-3 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
            <p className="text-[10px] text-amber-300 font-bold mb-1">MODO VISUALIZAÇÃO</p>
            <p className="text-xs text-amber-200">Vendo como: {viewAsRole === "empreendedor" ? "Empreendedor" : "Consultor"}</p>
            <button onClick={() => setViewAsRole(null)} className="text-xs text-amber-100 underline hover:text-white mt-1">Voltar ao Admin</button>
          </div>
        )}
        {getNavItems(effectiveRole, user).map(renderNavItem)}
        {isAdmin && !viewAsRole && (
          <>
            <div className="pt-4" />
            <p className={`text-[10px] font-bold ${sidebar.sectionCls} uppercase tracking-[0.15em] px-4 pb-2`}>Gestão</p>
            {renderNavItem({ name: "AdminEditais", label: "Administração", icon: Settings })}
          </>
        )}
      </nav>

      <div className="px-3 pb-1">
        <div className={`flex items-center gap-2 px-4 py-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          <PontosButton user={user} />
          <span className="text-xs">Pontos</span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          <NotificacoesPanel user={user} />
          <span className="text-xs">Notificações</span>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-1">
        {isAdmin && !viewAsRole && (
          <div className={`mb-2 pb-2 border-b ${isLight ? "border-slate-100" : "border-white/5"} relative`} ref={verComoRef}>
            <button onClick={() => setShowVerComo(v => !v)}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${isLight ? "text-slate-500 hover:text-indigo-700 hover:bg-indigo-50" : "text-slate-500 hover:text-white hover:bg-white/5"}`}>
              <Settings className="w-3.5 h-3.5" /><span>Ver Como</span>
              <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${showVerComo ? "rotate-90" : ""}`} />
            </button>
            {showVerComo && (
              <div className={`mt-1 ${isLight ? "bg-white border border-slate-200" : "bg-[#0c0f1a] border border-white/10"} rounded-xl p-1.5 shadow-2xl`}>
                {["empreendedor", "consultor"].map(r => (
                  <button key={r} onClick={() => { setViewAsRole(r); setShowVerComo(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${isLight ? "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    <User className="w-3 h-3" /> {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <Link to={createPageUrl("SobreNos")} onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs transition-all ${isLight ? "text-slate-500 hover:text-indigo-700 hover:bg-indigo-50" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>
          <Info className="w-3.5 h-3.5" /><span>Sobre Nós</span>
        </Link>
        <div className={`border-t ${isLight ? "border-slate-100" : "border-white/5"} pt-2`}>
          {user ? (
            <>
              <Link to={createPageUrl("Perfil")} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${currentPageName === "Perfil" ? sidebar.activeCls : isLight ? "text-slate-700 hover:bg-indigo-50" : "hover:bg-white/5 text-slate-300"}`}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30" />
                  : <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center"><User className="w-4 h-4 text-indigo-300" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.full_name || "Meu Perfil"}</p>
                  <p className={`text-[10px] truncate ${isLight ? "text-slate-400" : "text-slate-500"}`}>{user?.email || ""}</p>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
              </Link>
              <button onClick={() => base44.auth.logout(window.location.origin)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut className="w-3.5 h-3.5" /><span>Sair</span>
              </button>
            </>
          ) : (
            <button onClick={() => base44.auth.redirectToLogin()}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${isLight ? "text-slate-700 hover:bg-indigo-50" : "hover:bg-indigo-600/20 text-slate-300 hover:text-white"}`}>
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 group-hover:bg-indigo-600/50 flex items-center justify-center transition-all">
                <User className="w-4 h-4 text-indigo-300" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium">Acessar Meu Usuário</p>
                <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>Entrar ou cadastrar</p>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const rootStyle = isLight ? { background: "#f1f5f9" } : { background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" };

  return (
    <div className="flex h-screen overflow-hidden" style={rootStyle}>
      <aside className={`hidden md:flex w-60 flex-col flex-shrink-0 ${sidebar.bg}`}>{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className={`absolute left-0 top-0 bottom-0 w-60 ${sidebar.mobileBg} flex flex-col z-10`}>
            <button onClick={() => setMobileOpen(false)} className={`absolute top-4 right-4 ${isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}><X className="w-5 h-5" /></button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`md:hidden flex items-center gap-3 px-4 py-3 border-b ${isLight ? "bg-white border-slate-200" : "bg-[#0c0f1a] border-white/5"}`}>
          <button onClick={() => setMobileOpen(true)} className={`${isLight ? "text-slate-600" : "text-slate-400"} hover:text-indigo-600 p-1`}><Menu className="w-5 h-5" /></button>
          <div className="relative flex-1 flex justify-center">
            {!isLight && (
              <>
                <div className="absolute -inset-2 bg-indigo-500/25 blur-xl rounded-full" />
                <div className="absolute -inset-0.5 bg-white/10 blur-md rounded-full" />
              </>
            )}
            <img src={LOGO_URL} alt="Munnin Crow" className="relative h-8 w-auto object-contain" style={{ filter: logoFilter }} />
          </div>
          <NotificacoesPanel user={user} />
        </header>
        {user && user.role !== "admin" && user.tipo_usuario === "consultor" && !user.acesso_liberado && (
          <BannerPendente tipoUsuario={user.tipo_usuario} acesso_liberado={user.acesso_liberado} />
        )}
        <main className={`flex-1 overflow-y-auto relative ${isLight ? "bg-slate-50" : "bg-[#0b0f1c]"}`}>
          <NorseBackground isLight={isLight} intensity="subtle" />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

// ─── V2 Layout (immersive top-nav) ───────────────────────────────────────────
function V2Layout({ user, isAdmin, effectiveRole, viewAsRole, setViewAsRole, currentPageName, children, mobileOpen, setMobileOpen, setUser, showOnboarding, setShowOnboarding, showTour, setShowTour, verComoRef, showVerComo, setShowVerComo }) {
  const isLight = getAppearance().tema === "light";

  const navItems = getNavItems(effectiveRole, user).filter(i => i.name); // only real nav items

  const topBarBg = isLight ? "bg-white border-b border-slate-200 shadow-sm" : "bg-[#0c0f1a]/95 backdrop-blur-xl border-b border-white/5";
  const activeCls = isLight ? "bg-indigo-600 text-white" : "bg-indigo-600/90 text-white";
  const inactiveCls = isLight ? "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50" : "text-slate-400 hover:text-white hover:bg-white/8";
  const rootBg = isLight ? { background: "#f1f5f9" } : { background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" };
  const mainBg = isLight ? "bg-slate-50" : "bg-white/[0.02]";

  const isHome = currentPageName === "Home";

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={rootBg}>
      {/* Top bar — hidden on Home page (V2HomePage has its own chrome) */}
      <header className={`flex-shrink-0 ${topBarBg} ${isHome ? "hidden" : ""}`}>
        <div className="flex items-center gap-3 px-4 h-14">
          {/* Logo compact */}
          <Link to={createPageUrl("Home")} className="flex-shrink-0 mr-2">
            <img src={LOGO_URL} alt="Munnin Crow" className="h-8 w-auto object-contain"
              style={{ filter: isLight ? "none" : "drop-shadow(0 0 2px rgba(255,255,255,1)) drop-shadow(0 0 10px rgba(165,180,252,0.9)) drop-shadow(0 0 24px rgba(99,102,241,0.5))" }} />
          </Link>

          {/* Nav tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPageName === item.name;
              return (
                <Link key={item.name} to={createPageUrl(item.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${isActive ? activeCls : inactiveCls}`}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && !viewAsRole && (
              <Link to={createPageUrl("AdminEditais")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ml-2 border ${
                  currentPageName === "AdminEditais"
                    ? activeCls
                    : isLight ? "border-slate-200 text-slate-500 hover:text-indigo-700" : "border-white/10 text-slate-400 hover:text-white"
                }`}>
                <Settings className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
          </nav>

          {/* Right: notifications + avatar */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <PontosButton user={user} />
            <NotificacoesPanel user={user} />
            {user && (
              <Link to={createPageUrl("Perfil")} className="flex items-center gap-2">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30" />
                  : <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center"><User className="w-3.5 h-3.5 text-indigo-300" /></div>}
                <span className={`text-xs font-medium hidden lg:block ${isLight ? "text-slate-700" : "text-slate-300"}`}>{user.full_name?.split(" ")[0]}</span>
              </Link>
            )}
            {/* Mobile hamburger */}
            <button className={`md:hidden ${isLight ? "text-slate-600" : "text-slate-400"} hover:text-indigo-500`} onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className={`absolute left-0 top-0 bottom-0 w-56 ${isLight ? "bg-white" : "bg-[#0c0f1a]"} flex flex-col z-10 p-4`}>
            <button onClick={() => setMobileOpen(false)} className={`self-end mb-4 ${isLight ? "text-slate-500" : "text-slate-400"}`}><X className="w-5 h-5" /></button>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPageName === item.name;
                return (
                  <Link key={item.name} to={createPageUrl(item.name)} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? activeCls : inactiveCls}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />{item.label}
                  </Link>
                );
              })}
            </nav>
            {user && (
              <button onClick={() => base44.auth.logout(window.location.origin)}
                className="flex items-center gap-2 px-4 py-2 mt-4 text-xs text-red-400 hover:bg-red-50 rounded-lg">
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            )}
          </aside>
        </div>
      )}

      {/* Page content — V2 home shows its own full-screen experience */}
      <main className={`flex-1 overflow-y-auto relative ${mainBg}`}>
        {currentPageName !== "Home" && <NorseBackground isLight={isLight} intensity="subtle" />}
        <div className="relative z-10">
          {currentPageName === "Home"
            ? <V2HomePage user={user} isAdmin={isAdmin} effectiveRole={effectiveRole} />
            : children
          }
        </div>
      </main>

      {/* Footer with admin "Ver Como" option */}
      {isAdmin && !viewAsRole && (
        <footer className={`flex-shrink-0 border-t ${isLight ? "bg-white border-slate-200" : "bg-[#0c0f1a]/50 border-white/5"} px-4 py-3`}>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setViewAsRole("empreendedor")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${isLight ? "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              Ver como Empreendedor
            </button>
            <div className={`w-px h-4 ${isLight ? "bg-slate-200" : "bg-white/10"}`} />
            <button
              onClick={() => setViewAsRole("consultor")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${isLight ? "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              Ver como Consultor
            </button>
          </div>
        </footer>
      )}

      {/* Footer showing active "Ver Como" mode */}
      {viewAsRole && (
        <footer className={`flex-shrink-0 border-t ${isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30"} px-4 py-2`}>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className={isLight ? "text-amber-700" : "text-amber-300"}>Modo visualização ativo: {viewAsRole === "empreendedor" ? "Empreendedor" : "Consultor"}</span>
            <button
              onClick={() => setViewAsRole(null)}
              className={`ml-2 px-2 py-0.5 rounded transition-all ${isLight ? "text-amber-600 hover:bg-amber-200" : "text-amber-200 hover:bg-amber-500/20"}`}
            >
              Voltar
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewAsRole, setViewAsRole] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showVerComo, setShowVerComo] = useState(false);
  const [appearance, setAppearance] = useState(getAppearance);
  const [showFirstAccessGuide, setShowFirstAccessGuide] = useState(false);
  const verComoRef = useRef(null);

  // Re-read appearance on storage change (across tabs or same tab)
  useEffect(() => {
    const handler = () => setAppearance(getAppearance());
    window.addEventListener("storage", handler);
    // Also poll every 300ms to catch same-tab localStorage writes
    const interval = setInterval(() => setAppearance(getAppearance()), 300);
    return () => { window.removeEventListener("storage", handler); clearInterval(interval); };
  }, []);

  // Check for first access
  useEffect(() => {
    if (!user) return;
    const hasSeenFirstAccess = localStorage.getItem(`first_access_${user.email}`);
    if (!hasSeenFirstAccess && user.perfil_concluido) {
      setShowFirstAccessGuide(true);
      localStorage.setItem(`first_access_${user.email}`, "true");
    }
  }, [user]);

  useEffect(() => {
    if (!showVerComo) return;
    const handler = (e) => { if (verComoRef.current && !verComoRef.current.contains(e.target)) setShowVerComo(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVerComo]);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
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

  const sharedProps = {
    user, isAdmin, effectiveRole, viewAsRole, setViewAsRole,
    currentPageName, children, mobileOpen, setMobileOpen,
    showVerComo, setShowVerComo, verComoRef, showTour, setShowTour,
    showOnboarding, setShowOnboarding, setUser,
  };

  const handleAppearanceChange = (newAppearance) => {
    localStorage.setItem("appearance", JSON.stringify(newAppearance));
    setAppearance(newAppearance);
  };

  return (
    <>
      {appearance.layout === "v2"
        ? <V2Layout {...sharedProps} />
        : <EdgyLayout {...sharedProps} />
      }
      <PontosNotificacao />
      {showTour && <GuidedTour onFinish={() => setShowTour(false)} />}
      
      {/* Show appearance floating panel on first access */}
      {showFirstAccessGuide && user && (
        <AppearanceFloatingPanel
          isLight={appearance.tema === "light"}
          onThemeChange={(tema) => handleAppearanceChange({ ...appearance, tema })}
          onLayoutChange={(layout) => handleAppearanceChange({ ...appearance, layout })}
          currentLayout={appearance.layout}
        />
      )}

      <FirstAccessGuide
        open={showFirstAccessGuide}
        onClose={() => setShowFirstAccessGuide(false)}
        onAppearanceChange={handleAppearanceChange}
      />

      <OnboardingModal
        user={user}
        open={showOnboarding}
        onComplete={(tipoUsuario) => {
          setShowOnboarding(false);
          setUser(u => u ? { ...u, tipo_usuario: tipoUsuario, perfil_concluido: true } : u);
          const tourDone = localStorage.getItem("guided_tour_done");
          if (!tourDone) setShowTour(true);
        }}
      />
    </>
  );
}