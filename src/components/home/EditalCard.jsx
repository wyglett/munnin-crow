import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import moment from "moment";

export default function EditalCard({ edital, onClick }) {
  const diasRestantes = edital.data_encerramento
    ? moment(edital.data_encerramento).diff(moment(), "days")
    : null;
  const encerrado = diasRestantes !== null && diasRestantes < 0;

  return (
    <button
      onClick={() => onClick(edital)}
      className="w-full text-left p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.06] transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{edital.titulo}</h3>
          {edital.numero && <p className="text-xs text-white/30 mt-0.5">Nº {edital.numero}</p>}
          {edital.descricao && (
            <p className="text-sm text-white/50 mt-2 line-clamp-2">{edital.descricao}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {edital.area && (
              <Badge className="bg-indigo-500/20 text-indigo-300 border-0 text-xs">{edital.area}</Badge>
            )}
            {edital.valor_total && (
              <Badge className="bg-green-500/20 text-green-300 border-0 text-xs">{edital.valor_total}</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {diasRestantes !== null && (
            <Badge className={`border-0 text-xs ${encerrado ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"}`}>
              <Clock className="w-3 h-3 mr-1" />
              {encerrado ? "Encerrado" : `${diasRestantes}d`}
            </Badge>
          )}
          {edital.data_encerramento && (
            <span className="text-[10px] text-white/30 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {moment(edital.data_encerramento).format("DD/MM/YY")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}