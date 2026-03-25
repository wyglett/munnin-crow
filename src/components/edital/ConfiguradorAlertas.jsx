import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Smartphone } from "lucide-react";

export default function ConfiguradorAlertas({ user }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: alertas = {} } = useQuery({
    queryKey: ["meus-alertas", user?.email],
    queryFn: () =>
      user
        ? base44.entities.AlertaEdital.filter({ user_email: user.email }).then(
            (items) => items[0] || {}
          )
        : Promise.resolve({}),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data) =>
      alertas.id
        ? base44.entities.AlertaEdital.update(alertas.id, data)
        : base44.entities.AlertaEdital.create({
            user_email: user.email,
            user_nome: user.full_name,
            ...data,
          }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["meus-alertas"] }),
  });

  const handleToggleNotificacao = (tipo) => {
    const tipos = alertas.tipos || ["email"];
    const newTipos = tipos.includes(tipo)
      ? tipos.filter((t) => t !== tipo)
      : [...tipos, tipo];
    updateMutation.mutate({ tipos: newTipos });
  };

  const handleToggleCategoria = (categoria) => {
    const cats = alertas.categorias_interesse || [];
    const newCats = cats.includes(categoria)
      ? cats.filter((c) => c !== categoria)
      : [...cats, categoria];
    updateMutation.mutate({ categorias_interesse: newCats });
  };

  const categorias = [
    "inovacao_startups",
    "apoio_pesquisa",
    "empreendedorismo",
    "bolsas_editais",
    "outros_programas",
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-900">Alertas de Editais</span>
        </div>
        <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Tipos de Notificação
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(alertas.tipos || []).includes("email")}
                  onChange={() => handleToggleNotificacao("email")}
                  className="rounded"
                />
                <Mail className="w-4 h-4" />
                <span className="text-sm text-slate-700">E-mail</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(alertas.tipos || []).includes("push")}
                  onChange={() => handleToggleNotificacao("push")}
                  className="rounded"
                />
                <Smartphone className="w-4 h-4" />
                <span className="text-sm text-slate-700">
                  Notificação no navegador
                </span>
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Categorias de Interesse
            </p>
            <div className="space-y-2">
              {categorias.map((cat) => (
                <label key={cat} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(alertas.categorias_interesse || []).includes(cat)}
                    onChange={() => handleToggleCategoria(cat)}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">
                    {cat.replace(/_/g, " ").toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => updateMutation.mutate(alertas)}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            Salvar Preferências
          </Button>
        </div>
      )}
    </div>
  );
}