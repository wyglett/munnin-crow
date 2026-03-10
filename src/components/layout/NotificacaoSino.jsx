import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, Info, Settings, Zap, AlertCircle } from "lucide-react";

const TIPO_CONFIG = {
  modificacao_admin: { icon: Settings, color: "text-blue-600", bg: "bg-blue-50", label: "Atualização" },
  novo_recurso: { icon: Zap, color: "text-green-600", bg: "bg-green-50", label: "Novo Recurso" },
  correcao: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50", label: "Correção" },
  info: { icon: Info, color: "text-gray-600", bg: "bg-gray-50", label: "Info" },
};

export default function NotificacaoSino({ userEmail }) {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.NotificacaoPlataforma.filter({ destinatario_email: userEmail }, "-created_date", 20)
      .then(setNotifs).catch(() => {});
  }, [userEmail]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const naoLidas = notifs.filter(n => !n.lida).length;

  const marcarLida = async (id) => {
    await base44.entities.NotificacaoPlataforma.update(id, { lida: true });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const marcarTodasLidas = async () => {
    const pendentes = notifs.filter(n => !n.lida);
    for (const n of pendentes) {
      await base44.entities.NotificacaoPlataforma.update(n.id, { lida: true });
    }
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <Bell className="w-4 h-4" />
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[420px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="font-semibold text-gray-900 text-sm">Notificações</p>
            <div className="flex items-center gap-2">
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas} className="text-xs text-indigo-600 hover:underline">Marcar todas lidas</button>
              )}
              <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhuma notificação
              </div>
            ) : notifs.map(n => {
              const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.lida && marcarLida(n.id)}
                  className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.lida ? "bg-indigo-50/40" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${n.lida ? "text-gray-600" : "text-gray-900"}`}>{n.titulo}</p>
                        {!n.lida && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensagem}</p>
                      {n.entidade_titulo && (
                        <p className="text-xs text-indigo-600 mt-1 truncate">📁 {n.entidade_titulo}</p>
                      )}
                      {n.mudancas && (
                        <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">"{n.mudancas}"</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.created_date).toLocaleDateString("pt-BR")}
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