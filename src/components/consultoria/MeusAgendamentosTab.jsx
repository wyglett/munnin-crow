import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, X } from "lucide-react";
import moment from "moment";
import "moment/locale/pt-br";
moment.locale("pt-br");

const STATUS_COLORS = {
  pendente: "bg-yellow-100 text-yellow-800",
  confirmada: "bg-green-100 text-green-800",
  realizada: "bg-blue-100 text-blue-800",
  cancelada: "bg-red-100 text-red-800",
};

export default function MeusAgendamentosTab({ user }) {
  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ["agendamentos", user?.email],
    queryFn: () => user ? base44.entities.AgendamentoConsultoria.filter(
      { $or: [{ cliente_email: user.email }, { consultor_email: user.email }] },
      "-data_hora",
      50
    ) : Promise.resolve([]),
    enabled: !!user,
  });

  const handleCancelar = async (id) => {
    if (!confirm("Cancelar este agendamento?")) return;
    try {
      await base44.entities.AgendamentoConsultoria.update(id, { status: "cancelada" });
      // Refetch
    } catch (err) {
      console.error("Erro ao cancelar:", err);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Minhas Reuniões de Consultoria</h3>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Carregando...</div>
      ) : agendamentos.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum agendamento ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agendamentos.map((agendamento) => (
            <div
              key={agendamento.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-sm">{agendamento.titulo}</h4>
                  <p className="text-xs text-slate-500 mt-1">{agendamento.descricao}</p>
                </div>
                <Badge className={STATUS_COLORS[agendamento.status] || "bg-gray-100"}>
                  {agendamento.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>{moment(agendamento.data_hora).format("DD/MM/YYYY")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>{moment(agendamento.data_hora).format("HH:mm")}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                {user?.email === agendamento.cliente_email ? (
                  <span>Com: <strong>{agendamento.consultor_nome}</strong></span>
                ) : (
                  <span>Cliente: <strong>{agendamento.cliente_nome}</strong></span>
                )}
              </div>

              {agendamento.link_meet && (
                <div className="mb-3 p-2 bg-indigo-50 rounded text-xs">
                  <a href={agendamento.link_meet} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    🔗 Abrir Google Meet
                  </a>
                </div>
              )}

              {agendamento.status === "pendente" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCancelar(agendamento.id)}
                  className="text-red-600 hover:bg-red-50 w-full"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}