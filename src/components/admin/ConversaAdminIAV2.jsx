import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { TrendingUp, MessageSquare } from "lucide-react";
import moment from "moment";

export default function ConversaAdminIAV2() {
  const [filtroCategoria, setFiltroCategoria] = useState("útil");

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["feedback-ia-admin"],
    queryFn: () => base44.asServiceRole.entities.FeedbackIAEdital.list("-created_date", 100),
  });

  const feedbacksFiltrados = feedbacks.filter(f => {
    if (filtroCategoria === "útil") return f.feedback === "útil";
    if (filtroCategoria === "parcialmente") return f.feedback === "parcialmente_útil";
    if (filtroCategoria === "não_útil") return f.feedback === "não_útil";
    return true;
  });

  const stats = {
    total: feedbacks.length,
    útil: feedbacks.filter(f => f.feedback === "útil").length,
    parcialmente: feedbacks.filter(f => f.feedback === "parcialmente_útil").length,
    não_útil: feedbacks.filter(f => f.feedback === "não_útil").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <p className="text-xs text-green-700 mb-1">Útil</p>
          <p className="text-2xl font-bold text-green-900">{stats.útil}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
          <p className="text-xs text-yellow-700 mb-1">Parcialmente</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.parcialmente}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
          <p className="text-xs text-red-700 mb-1">Não Útil</p>
          <p className="text-2xl font-bold text-red-900">{stats.não_útil}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p className="text-xs text-blue-700 mb-1">Total</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
      </div>

      <div>
        <div className="flex gap-2 mb-4">
          {["útil", "parcialmente", "não_útil"].map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                filtroCategoria === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {feedbacksFiltrados.slice(0, 10).map(fb => (
            <div key={fb.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-slate-900">{fb.user_nome}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  fb.feedback === "útil" ? "bg-green-100 text-green-700" :
                  fb.feedback === "parcialmente_útil" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {fb.feedback}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                <strong>P:</strong> {fb.pergunta}
              </p>
              {fb.correcao_sugerida && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mb-2">
                  <strong>Sugestão:</strong> {fb.correcao_sugerida}
                </p>
              )}
              <p className="text-[10px] text-slate-400">
                {moment(fb.created_date).format("DD/MM/YYYY HH:mm")}
                {fb.integrado_treino && " • Integrado ao treino"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}