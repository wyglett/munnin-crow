import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, CheckCircle, Loader2, Receipt } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_COLORS = {
  pendente: "bg-yellow-100 text-yellow-800",
  enviado: "bg-blue-100 text-blue-800",
  confirmado: "bg-green-100 text-green-800",
};

export default function RecibosDoConsultor() {
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: recibos = [], isLoading } = useQuery({
    queryKey: ["recibos-empreendedor", user?.email],
    queryFn: () => base44.entities.ReciboConsultor.filter({ empreendedor_email: user?.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const total = recibos.reduce((s, r) => s + (r.valor || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Receipt className="w-6 h-6 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recibos dos Consultores</h1>
            <p className="text-gray-500 text-sm">Documentos emitidos pelos consultores contratados</p>
          </div>
        </div>

        {total > 0 && (
          <Card className="mb-6 bg-indigo-50 border-indigo-200">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-sm text-indigo-700 font-medium">Total cobrado pelos consultores</p>
              <p className="text-xl font-bold text-indigo-800">{fmt(total)}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : recibos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16 text-gray-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum recibo recebido ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recibos.map(r => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900">{r.descricao_servico}</p>
                        <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                        <Badge variant="outline" className="text-xs">{r.tipo === "nota_fiscal" ? "NF" : "Recibo"}</Badge>
                      </div>
                      <p className="text-sm text-indigo-600">Consultor: {r.consultor_nome || r.consultor_email}</p>
                      {r.projeto_titulo && <p className="text-sm text-gray-500">📁 {r.projeto_titulo}</p>}
                      {r.tarefas_concluidas?.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          <p className="text-xs font-medium text-gray-700">Tarefas realizadas:</p>
                          {r.tarefas_concluidas.map((t, i) => (
                            <p key={i} className="text-xs text-gray-500 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" /> {t}
                            </p>
                          ))}
                        </div>
                      )}
                      {r.data_emissao && (
                        <p className="text-xs text-gray-400 mt-1">Emitido em: {new Date(r.data_emissao).toLocaleDateString("pt-BR")}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="font-bold text-lg text-gray-900">{fmt(r.valor)}</p>
                      {r.arquivo_url && (
                        <a href={r.arquivo_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" /> Ver PDF
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}