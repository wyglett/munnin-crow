import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, FileText, Presentation, ExternalLink, Lock, Pencil, Trash2, Youtube } from "lucide-react";

const CATEGORIA_LABELS = {
  submissao_proposta: "Submissão de Proposta",
  escrita_material: "Escrita de Material",
  gestao_projeto: "Gestão de Projeto",
  elaboracao_relatorio: "Elaboração de Relatório",
  captacao_recursos: "Captação de Recursos",
  outro: "Outro",
};

const TIPO_CONFIG = {
  youtube: { icon: Youtube, color: "text-red-500", label: "YouTube", bg: "bg-red-50" },
  canva: { icon: Presentation, color: "text-purple-500", label: "Canva", bg: "bg-purple-50" },
  pdf: { icon: FileText, color: "text-orange-500", label: "PDF", bg: "bg-orange-50" },
  documento: { icon: ExternalLink, color: "text-blue-500", label: "Link", bg: "bg-blue-50" },
};

export default function OrientacaoCard({ orientacao, onView, onEdit, onDelete, isOwner }) {
  const config = TIPO_CONFIG[orientacao.tipo] || TIPO_CONFIG.documento;
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer" onClick={onView}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">{orientacao.titulo}</h3>
              {isOwner && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={onEdit} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {orientacao.descricao && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{orientacao.descricao}</p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {orientacao.categoria && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {CATEGORIA_LABELS[orientacao.categoria] || orientacao.categoria}
                </Badge>
              )}
              {orientacao.direcionado_orgao && (
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                  {orientacao.direcionado_orgao}
                </Badge>
              )}
              {(orientacao.direcionado_editais || []).map((e, i) => (
                <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{e}</Badge>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-medium ${config.color}`}>{config.label}</span>
                {!orientacao.acesso_livre && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                    <Lock className="w-3 h-3" /> Restrito
                  </span>
                )}
              </div>
              {orientacao.consultor_nome && (
                <span className="text-[10px] text-slate-400">por {orientacao.consultor_nome}</span>
              )}
            </div>
          </div>
        </div>

        {/* Play overlay for video */}
        {orientacao.tipo === "youtube" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 group-hover:text-indigo-600 transition-colors">
            <Play className="w-3.5 h-3.5" />
            Clique para assistir
          </div>
        )}
      </CardContent>
    </Card>
  );
}