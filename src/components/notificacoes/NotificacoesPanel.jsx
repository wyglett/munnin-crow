import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, X, CheckCheck, Info, Wrench, Sparkles, AlertTriangle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TIPO_CONFIG = {
  admin_modificou: { icon: Shield, color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
  novo_recurso: { icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200" },
  correcao: { icon: Wrench, color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  aviso: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
  sistema: { icon: Info, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

export default function NotificacoesPanel({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const { data: notificacoes = [] } = useQuery({
    queryKey: ["notificacoes", user?.email],
    queryFn: async () => {
      const minhas = await base44.entities.NotificacaoPlataforma.filter({ user_email: user.email }, "-created_date", 20);
      const gerais = await base44.entities.NotificacaoPlataforma.filter({ para_todos: true }, "-created_date", 20);
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

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            <div className="flex items-center gap-2">
              {naoLidas > 0 && (
                <button
                  onClick={() => notificacoes.filter(n => !n.lida).forEach(n => marcarLida.mutate(n.id))}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notificacoes.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : notificacoes.map(n => {
              const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.sistema;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.lida ? "bg-indigo-50/30" : ""}`}
                  onClick={() => !n.lida && marcarLida.mutate(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${cfg.bg} flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-sm font-medium text-gray-900 leading-tight ${!n.lida ? "font-semibold" : ""}`}>{n.titulo}</p>
                        {!n.lida && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.mensagem}</p>
                      {n.modificacoes && (
                        <div className="mt-1.5 p-2 bg-gray-50 rounded text-xs text-gray-500 border border-gray-200">
                          <p className="font-medium text-gray-700 mb-0.5">O que foi alterado:</p>
                          {n.modificacoes}
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.created_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}