import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminRevenueTabV2() {
  const { data: receitas = [] } = useQuery({
    queryKey: ["receitas"],
    queryFn: () => base44.asServiceRole.entities.Receita.list("-created_date", 500),
  });

  const total = receitas.reduce((sum, r) => sum + (r.valor || 0), 0);
  const porTipo = receitas.reduce((acc, r) => {
    const tipo = r.tipo || "outro";
    acc[tipo] = (acc[tipo] || 0) + r.valor;
    return acc;
  }, {});

  const dados = Object.entries(porTipo).map(([tipo, valor]) => ({
    tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    valor
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">Receita Total</p>
          <p className="text-2xl font-bold text-blue-900">R$ {(total / 1000).toFixed(1)}k</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Transações</p>
          <p className="text-2xl font-bold text-green-900">{receitas.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <p className="text-sm text-purple-700 mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-purple-900">R$ {(total / receitas.length).toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-4">Receita por Tipo</h3>
        {dados.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Bar dataKey="valor" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-center py-8">Sem dados de receita</p>
        )}
      </div>
    </div>
  );
}