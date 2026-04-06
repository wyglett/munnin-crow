import React from "react";
import { Lightbulb, FlaskConical, TrendingUp, Award, Layers } from "lucide-react";
import { getAppearance } from "@/hooks/useAppearance";

const CATEGORIES = [
  { id: "inovacao_startups", label: "Inovação & Startups", icon: Lightbulb, darkColor: "from-indigo-600/20 to-violet-600/20 border-indigo-500/20", lightColor: "from-indigo-100 to-violet-100 border-indigo-200" },
  { id: "apoio_pesquisa", label: "Apoio à Pesquisa", icon: FlaskConical, darkColor: "from-emerald-600/20 to-teal-600/20 border-emerald-500/20", lightColor: "from-emerald-100 to-teal-100 border-emerald-200" },
  { id: "empreendedorismo", label: "Empreendedorismo", icon: TrendingUp, darkColor: "from-blue-600/20 to-cyan-600/20 border-blue-500/20", lightColor: "from-blue-100 to-cyan-100 border-blue-200" },
  { id: "bolsas_editais", label: "Bolsas & Editais", icon: Award, darkColor: "from-amber-600/20 to-orange-600/20 border-amber-500/20", lightColor: "from-amber-100 to-orange-100 border-amber-200" },
  { id: "outros_programas", label: "Outros Programas", icon: Layers, darkColor: "from-slate-600/20 to-gray-600/20 border-slate-500/20", lightColor: "from-slate-200 to-gray-200 border-slate-300" },
];

export default function CategoryCards({ editais, onSelectCategory }) {
  const isLight = getAppearance().tema === "light";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {CATEGORIES.map((cat) => {
        const count = editais.filter(e => e.categoria === cat.id).length;
        const Icon = cat.icon;
        const colorClass = isLight ? cat.lightColor : cat.darkColor;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`text-left p-5 rounded-xl bg-gradient-to-br ${colorClass} border backdrop-blur-sm hover:scale-[1.02] transition-all duration-200`}
          >
            <Icon className={`w-7 h-7 mb-3 ${isLight ? "text-slate-500" : "text-white/70"}`} />
            <p className={`font-semibold text-sm ${isLight ? "text-slate-800" : "text-white"}`}>{cat.label}</p>
            <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-white/40"}`}>{count} editais</p>
          </button>
        );
      })}
    </div>
  );
}