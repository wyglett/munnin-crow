import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";

export default function BotaoFavorito({ editalId, editalTitulo, editalOrgao, user }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: isFavorited = false } = useQuery({
    queryKey: ["favorito", editalId, user?.email],
    queryFn: () =>
      user
        ? base44.entities.EditalFavorito.filter({
            user_email: user.email,
            edital_id: editalId,
          }).then((items) => items.length > 0)
        : Promise.resolve(false),
    enabled: !!user,
  });

  const { data: favorito } = useQuery({
    queryKey: ["favorito-data", editalId, user?.email],
    queryFn: () =>
      user
        ? base44.entities.EditalFavorito.filter({
            user_email: user.email,
            edital_id: editalId,
          }).then((items) => items[0])
        : Promise.resolve(null),
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited && favorito) {
        await base44.entities.EditalFavorito.delete(favorito.id);
      } else {
        await base44.entities.EditalFavorito.create({
          user_email: user.email,
          edital_id: editalId,
          edital_titulo: editalTitulo,
          edital_orgao: editalOrgao,
          notas: notes,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorito"] });
      setShowNotes(false);
      setNotes("");
    },
  });

  const handleClick = () => {
    if (isFavorited) {
      toggleMutation.mutate();
    } else {
      setShowNotes(true);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`p-2 rounded-lg transition-all ${
          isFavorited
            ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
        title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Star
          className="w-5 h-5"
          fill={isFavorited ? "currentColor" : "none"}
        />
      </button>

      {showNotes && (
        <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg p-3 w-48 z-10">
          <textarea
            placeholder="Adicionar notas sobre este edital..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded p-2 mb-2"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowNotes(false)}
              className="flex-1 text-xs px-2 py-1 text-slate-600 hover:bg-slate-50 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={() => toggleMutation.mutate()}
              className="flex-1 text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}