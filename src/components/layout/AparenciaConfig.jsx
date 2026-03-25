import React from "react";
import { useAppearance } from "@/hooks/useAppearance";
import { Sun } from "lucide-react";

/**
 * AparenciaConfig
 * Shown inside the Perfil page. Lets the user pick tema (light/dark only).
 * Layout is always v2.0.
 */
export default function AparenciaConfig() {
  const { prefs, setTema } = useAppearance();

  const temas = [
    {
      id: "dark",
      label: "Escuro",
      desc: "Tema escuro e imersivo com tons de índigo e slate.",
      icon: Sun,
      preview: "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900",
      textColor: "text-slate-100",
      badge: "bg-indigo-600 text-white",
    },
    {
      id: "light",
      label: "Claro",
      desc: "Tema claro com fundo branco, tipografia limpa e toques de índigo.",
      icon: Sun,
      preview: "bg-gradient-to-br from-white via-indigo-50 to-slate-100",
      textColor: "text-slate-800",
      badge: "bg-indigo-500 text-white",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Tema */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Tema</h3>
        <p className="text-xs text-gray-500 mb-4">Escolha entre o tema escuro padrão ou um tema claro.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {temas.map(t => {
            const Icon = t.icon;
            const active = prefs.tema === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTema(t.id)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  active
                    ? "border-indigo-600 shadow-md shadow-indigo-100"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                {/* Mini preview */}
                <div className={`w-full h-16 rounded-lg mb-3 ${t.preview} flex items-end justify-start p-2 overflow-hidden`}>
                  <div className="flex gap-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1.5 rounded-full ${t.badge}`} style={{ width: `${12 + i * 8}px` }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">{t.label}</span>
                  {active && (
                    <span className="ml-auto text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">Ativo</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-gray-400">O layout Aparência 2.0 é usado por todos os usuários. As preferências de tema são salvas automaticamente.</p>
    </div>
  );
}