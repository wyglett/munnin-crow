import React from "react";
import { useAppearance } from "@/hooks/useAppearance";
import { Monitor, Sun, LayoutGrid, Layers } from "lucide-react";

/**
 * AparenciaConfig
 * Shown inside the Perfil page. Lets the user pick tema + layout.
 */
export default function AparenciaConfig() {
  const { prefs, setTema, setLayout } = useAppearance();

  const temas = [
    {
      id: "edgy",
      label: "Edgy (Padrão)",
      desc: "Tema escuro e imersivo com tons de índigo e slate.",
      icon: Monitor,
      preview: "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900",
      textColor: "text-slate-100",
      badge: "bg-indigo-600 text-white",
    },
    {
      id: "light",
      label: "Light",
      desc: "Tema claro com fundo branco, tipografia limpa e toques de índigo.",
      icon: Sun,
      preview: "bg-gradient-to-br from-white via-indigo-50 to-slate-100",
      textColor: "text-slate-800",
      badge: "bg-indigo-500 text-white",
    },
  ];

  const layouts = [
    {
      id: "default",
      label: "Padrão",
      desc: "Sidebar lateral fixa com navegação vertical.",
      icon: LayoutGrid,
    },
    {
      id: "v2",
      label: "Aparência 2.0",
      desc: "Layout imersivo com nav em abas no topo e sidebar minimizada — mais foco no conteúdo.",
      icon: Layers,
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

      {/* Layout */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Layout</h3>
        <p className="text-xs text-gray-500 mb-4">Organize a interface como preferir.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {layouts.map(l => {
            const Icon = l.icon;
            const active = prefs.layout === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  active
                    ? "border-indigo-600 shadow-md shadow-indigo-100"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                {/* Mockup */}
                <div className="w-full h-16 rounded-lg mb-3 bg-slate-100 flex overflow-hidden">
                  {l.id === "default" ? (
                    <>
                      <div className="w-8 h-full bg-slate-800 flex-shrink-0" />
                      <div className="flex-1 bg-slate-50 p-1.5 space-y-1">
                        <div className="h-2 bg-slate-200 rounded w-3/4" />
                        <div className="h-2 bg-slate-200 rounded w-1/2" />
                        <div className="h-2 bg-indigo-200 rounded w-2/3" />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="h-5 bg-slate-800 flex items-center px-2 gap-1.5">
                        {[1,2,3].map(i => <div key={i} className="h-1.5 w-6 bg-indigo-400 rounded-full" />)}
                      </div>
                      <div className="flex-1 bg-slate-50 p-1.5 space-y-1">
                        <div className="h-2 bg-slate-200 rounded w-full" />
                        <div className="h-2 bg-slate-200 rounded w-2/3" />
                        <div className="h-2 bg-indigo-200 rounded w-1/2" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">{l.label}</span>
                  {active && (
                    <span className="ml-auto text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">Ativo</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{l.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-gray-400">As preferências são salvas automaticamente neste dispositivo.</p>
    </div>
  );
}