import React from "react";
import { Lightbulb, FlaskConical, TrendingUp, Award, Layers } from "lucide-react";

const CATEGORIES = [
  { id: "inovacao_startups", label: "Inovação & Startups", icon: Lightbulb, color: "from-indigo-600/20 to-violet-600/20 border-indigo-500/20" },
  { id: "apoio_pesquisa", label: "Apoio à Pesquisa", icon: FlaskConical, color: "from-emerald-600/20 to-teal-600/20 border-emerald-500/20" },
  { id: "empreendedorismo", label: "Empreendedorismo", icon: TrendingUp, color: "from-blue-600/20 to-cyan-600/20 border-blue-500/20" },
  { id: "bolsas_editais", label: "Bolsas & Editais", icon: Award, color: "from-amber-600/20 to-orange-600/20 border-amber-500/20" },
  { id: "outros_programas", label: "Outros Programas", icon: Layers, color: "from-slate-600/20 to-gray-600/20 border-slate-500/20" },
];

export default function CategoryCards({ editais, onSelectCategory }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {CATEGORIES.map((cat) => {
        const count = editais.filter(e => e.categoria === cat.id).length;
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`text-left p-5 rounded-xl bg-gradient-to-br ${cat.color} border backdrop-blur-sm hover:scale-[1.02] transition-all duration-200`}
          >
            <Icon className="w-7 h-7 text-white/70 mb-3" />
            <p className="text-white font-semibold text-sm">{cat.label}</p>
            <p className="text-white/40 text-xs mt-0.5">{count} editais</p>
          </button>
        );
      })}
    </div>
  );
}