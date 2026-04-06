import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";
import { getAppearance } from "@/hooks/useAppearance";

export default function EditalDetailModal({ edital, open, onClose }) {
  const isLight = getAppearance().tema === "light";
  if (!edital) return null;

  const diasRestantes = edital.data_encerramento
    ? moment(edital.data_encerramento).diff(moment(), "days")
    : null;

  const modalBg = isLight ? "bg-white border-slate-200" : "bg-[#1a1d2e] border-white/10";
  const titleCls = isLight ? "text-slate-900" : "text-white";
  const dateCls = isLight ? "text-slate-400" : "text-white/50";
  const labelCls = isLight ? "text-slate-400" : "text-white/30";
  const descCls = isLight ? "text-slate-600" : "text-white/70";
  const docLinkCls = isLight
    ? "bg-slate-50 hover:bg-indigo-50 text-indigo-600"
    : "bg-white/5 hover:bg-white/10 text-indigo-300";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[85vh] overflow-y-auto ${modalBg}`}>
        <DialogHeader>
          <DialogTitle className={`text-xl ${titleCls}`}>{edital.titulo}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mt-1">
          {edital.area && <Badge className="bg-indigo-500/20 text-indigo-500 border-0">{edital.area}</Badge>}
          {edital.valor_total && <Badge className="bg-green-500/20 text-green-600 border-0">{edital.valor_total}</Badge>}
          {edital.status && <Badge className={`border-0 ${isLight ? "bg-slate-100 text-slate-500" : "bg-white/10 text-white/60"}`}>{edital.status}</Badge>}
        </div>

        <div className={`flex items-center gap-4 text-sm mt-2 ${dateCls}`}>
          {edital.data_abertura && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Abertura: {moment(edital.data_abertura).format("DD/MM/YYYY")}
            </span>
          )}
          {edital.data_encerramento && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Encerra: {moment(edital.data_encerramento).format("DD/MM/YYYY")}
            </span>
          )}
        </div>

        {edital.descricao && (
          <div className="mt-4">
            <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${labelCls}`}>Sobre o Edital</p>
            <p className={`text-sm leading-relaxed ${descCls}`}>{edital.descricao}</p>
          </div>
        )}

        {edital.documentos_modelo?.length > 0 && (
          <div className="mt-4">
            <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${labelCls}`}>Documentos Modelo</p>
            <div className="space-y-2">
              {edital.documentos_modelo.map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-3 rounded-lg transition-colors text-sm ${docLinkCls}`}>
                  <FileText className="w-4 h-4" />
                  {doc.nome}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {edital.url_fapes && (
            <a href={edital.url_fapes} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className={isLight ? "border-slate-200 text-slate-600 hover:bg-slate-50" : "border-white/10 text-white/70 hover:bg-white/5 hover:text-white"}>
                <ExternalLink className="w-4 h-4 mr-2" /> Ler Edital Completo
              </Button>
            </a>
          )}
          <Link to={createPageUrl(`Edital?id=${edital.id}`)} onClick={onClose}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <FileText className="w-4 h-4 mr-2" /> Elaborar Proposta
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}