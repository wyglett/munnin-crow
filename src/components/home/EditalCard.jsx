import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import moment from "moment";
import { getAppearance } from "@/hooks/useAppearance";

export default function EditalCard({ edital, onClick }) {
  const isLight = getAppearance().tema === "light";
  const diasRestantes = edital.data_encerramento
    ? moment(edital.data_encerramento).diff(moment(), "days")
    : null;
  const encerrado = diasRestantes !== null && diasRestantes < 0;

  return (
    <button
      onClick={() => onClick(edital)}
      className={`w-full text-left p-5 rounded-xl border transition-all duration-200 group ${
        isLight
          ? "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
          : "bg-white/[0.03] border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold transition-colors ${isLight ? "text-slate-800 group-hover:text-indigo-600" : "text-white group-hover:text-indigo-300"}`}>
            {edital.titulo}
          </h3>
          {edital.numero && (
            <p className={`text-xs mt-0.5 ${isLight ? "text-slate-400" : "text-white/30"}`}>Nº {edital.numero}</p>
          )}
          {edital.descricao && (
            <p className={`text-sm mt-2 line-clamp-2 ${isLight ? "text-slate-500" : "text-white/50"}`}>{edital.descricao}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {edital.area && (
              <Badge className="bg-indigo-500/20 text-indigo-500 border-0 text-xs">{edital.area}</Badge>
            )}
            {edital.valor_total && (
              <Badge className="bg-green-500/20 text-green-600 border-0 text-xs">{edital.valor_total}</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {diasRestantes !== null && (
            <Badge className={`border-0 text-xs ${encerrado ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-600"}`}>
              <Clock className="w-3 h-3 mr-1" />
              {encerrado ? "Encerrado" : `${diasRestantes}d`}
            </Badge>
          )}
          {edital.data_encerramento && (
            <span className={`text-[10px] flex items-center gap-1 ${isLight ? "text-slate-400" : "text-white/30"}`}>
              <Calendar className="w-3 h-3" />
              {moment(edital.data_encerramento).format("DD/MM/YY")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}