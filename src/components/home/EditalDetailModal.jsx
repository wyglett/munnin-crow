import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function EditalDetailModal({ edital, open, onClose }) {
  if (!edital) return null;
  const diasRestantes = edital.data_encerramento
    ? moment(edital.data_encerramento).diff(moment(), "days")
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1a1d2e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">{edital.titulo}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mt-1">
          {edital.area && <Badge className="bg-indigo-500/20 text-indigo-300 border-0">{edital.area}</Badge>}
          {edital.valor_total && <Badge className="bg-green-500/20 text-green-300 border-0">{edital.valor_total}</Badge>}
          {edital.status && <Badge className="bg-white/10 text-white/60 border-0">{edital.status}</Badge>}
        </div>

        <div className="flex items-center gap-4 text-sm text-white/50 mt-2">
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
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Sobre o Edital</p>
            <p className="text-sm text-white/70 leading-relaxed">{edital.descricao}</p>
          </div>
        )}

        {edital.documentos_modelo?.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Documentos Modelo</p>
            <div className="space-y-2">
              {edital.documentos_modelo.map((doc, i) => (
                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-indigo-300">
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
              <Button variant="outline" className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white">
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