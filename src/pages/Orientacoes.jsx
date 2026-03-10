import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function Orientacoes() {
  const { data: orientacoes = [], isLoading } = useQuery({
    queryKey: ["orientacoes"],
    queryFn: () => base44.entities.Orientacao.list("-created_date", 50),
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Orientações</h1>
        <p className="text-gray-500 text-sm mb-6">Apresentações, vídeos e materiais de apoio para elaboração de propostas</p>

        {orientacoes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum material disponível ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orientacoes.map((o) => (
              <a key={o.id} href={o.url} target="_blank" rel="noopener noreferrer">
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-gray-900">{o.titulo}</h3>
                    {o.descricao && <p className="text-sm text-gray-500 mt-1">{o.descricao}</p>}
                    {o.categoria && <span className="inline-block mt-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{o.categoria}</span>}
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}