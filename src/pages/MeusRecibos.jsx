import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Eye, Loader2, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_RECIBO = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  enviado: { label: "Disponível", color: "bg-blue-100 text-blue-800", icon: FileText },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejeitado: { label: "Com Problema", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

const TIPO_LABELS = { recibo: "Recibo", nf: "NF", nfse: "NF-e/NFS-e", outro: "Outro" };

export default function MeusRecibos() {
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: recibos = [], isLoading } = useQuery({
    queryKey: ["recibos-empreendedor", user?.email],
    queryFn: () => base44.entities.ReciboPagamento.filter({ empreendedor_email: user.email }, "-created_date", 100),
    enabled: !!user?.email,
  });

  const total = recibos.reduce((s, r) => s + (r.valor || 0), 0);

  if (!user) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Recibos e Notas Fiscais</h1>
        <p className="text-gray-500 text-sm mb-6">Documentos enviados pelos consultores que trabalham com você</p>

        {recibos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="p-4">
              <p className="text-xs text-gray-500">Total em Serviços</p>
              <p className="text-xl font-bold text-gray-900">{fmt(total)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-gray-500">Documentos</p>
              <p className="text-xl font-bold text-gray-900">{recibos.length}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-gray-500">Consultores</p>
              <p className="text-xl font-bold text-gray-900">{new Set(recibos.map(r => r.consultor_email)).size}</p>
            </CardContent></Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
        ) : recibos.length === 0 ? (
          <Card><CardContent className="text-center py-14">
            <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum recibo disponível</p>
            <p className="text-sm text-gray-400 mt-1">Quando um consultor enviar um recibo, ele aparecerá aqui</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {recibos.map(r => {
              const s = STATUS_RECIBO[r.status] || STATUS_RECIBO.enviado;
              const Icon = s.icon;
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-gray-900 truncate">{r.descricao_servico}</p>
                        <Badge className={`text-xs ${s.color}`}><Icon className="w-3 h-3 mr-1" />{s.label}</Badge>
                        <Badge variant="outline" className="text-xs">{TIPO_LABELS[r.tipo]}</Badge>
                      </div>
                      <p className="text-sm text-indigo-600">Consultor: {r.consultor_nome || r.consultor_email}</p>
                      {r.projeto_titulo && <p className="text-xs text-gray-400">Projeto: {r.projeto_titulo}</p>}
                      {r.data_emissao && <p className="text-xs text-gray-400">Emissão: {r.data_emissao}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 mb-1">{fmt(r.valor)}</p>
                      {r.arquivo_url ? (
                        <a href={r.arquivo_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs h-7">
                            <Eye className="w-3 h-3 mr-1" /> Ver Documento
                          </Button>
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400">Arquivo pendente</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}