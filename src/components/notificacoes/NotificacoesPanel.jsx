import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, X, CheckCheck, Info, Wrench, Sparkles, AlertTriangle, Shield } from "lucide-react";

const TIPO_CONFIG = {
  admin_modificou: { icon: Shield, color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
  novo_recurso:    { icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200" },
  correcao:        { icon: Wrench, color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  aviso:           { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
  sistema:         { icon: Info, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

export default function NotificacoesPanel({ user }) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const queryClient = useQueryClient();

  // Compute panel position from button rect
  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const panelW = 320;
      let left = rect.left - panelW + rect.width;
      if (left < 8) left = 8;
      if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
      setPanelStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width: panelW,
        zIndex: 9999,
      });
    }
    setOpen(v => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const { data: notificacoes = [] } = useQuery({
    queryKey: ["notificacoes", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const [minhas, gerais] = await Promise.all([
        base44.entities.NotificacaoPlataforma.filter({ user_email: user.email }, "-created_date", 20),
        base44.entities.NotificacaoPlataforma.filter({ para_todos: true }, "-created_date", 20),
      ]);
      const todas = [...minhas, ...gerais];
      const unique = todas.filter((n, i, arr) => arr.findIndex(x => x.id === n.id) === i);
      return unique.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const marcarLida = useMutation({
    mutationFn: (id) => base44.entities.NotificacaoPlataforma.update(id, { lida: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  if (!user) return null;

  const panel = open ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
      style={{ ...panelStyle, maxHeight: "70vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-gray-800 text-sm">Notificações</span>
          {naoLidas > 0 && (
            <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {naoLidas}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {naoLidas > 0 && (
            <button
              onClick={() => notificacoes.filter(n => !n.lida).forEach(n => marcarLida.mutate(n.id))}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
            </button>
          )}
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {notificacoes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Nenhuma notificação</p>
            <p className="text-xs mt-1 text-gray-300">Tudo em dia por aqui!</p>
          </div>
        ) : notificacoes.map(n => {
          const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.sistema;
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className={`px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.lida ? "bg-indigo-50/40" : ""}`}
              onClick={() => !n.lida && marcarLida.mutate(n.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg border ${cfg.bg} flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm text-gray-900 leading-tight ${!n.lida ? "font-semibold" : "font-medium"}`}>{n.titulo}</p>
                    {!n.lida && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.mensagem}</p>
                  {n.modificacoes && (
                    <div className="mt-1.5 p-2 bg-gray-50 rounded-lg text-xs text-gray-500 border border-gray-200">
                      <span className="font-medium text-gray-700">O que mudou: </span>{n.modificacoes}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    {new Date(n.created_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
      >
        <Bell className="w-5 h-5" />
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </>
  );
}