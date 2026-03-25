import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";

export default function FeedbackIAComponent({ editalId, pergunta, respostaIA, user }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("útil");
  const [sugestao, setSugestao] = useState("");
  const queryClient = useQueryClient();

  const saveFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.FeedbackIAEdital.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-ia"] });
      setShowFeedback(false);
      setFeedback("útil");
      setSugestao("");
    },
  });

  const handleSaveFeedback = () => {
    saveFeedbackMutation.mutate({
      user_email: user.email,
      edital_id: editalId,
      pergunta,
      resposta_ia: respostaIA,
      feedback,
      correcao_sugerida: sugestao,
    });
  };

  return (
    <div className="mt-2 pt-2 border-t flex items-center gap-2">
      <span className="text-xs text-slate-500">Esta resposta foi útil?</span>

      {!showFeedback ? (
        <div className="flex gap-1">
          <button
            onClick={() => {
              setFeedback("útil");
              setShowFeedback(true);
            }}
            className="p-1 hover:bg-green-50 rounded text-slate-400 hover:text-green-600"
            title="Útil"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setFeedback("não_útil");
              setShowFeedback(true);
            }}
            className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
            title="Não útil"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex-1 bg-slate-50 p-2 rounded">
          <div className="text-xs mb-1">
            <label className="flex items-center gap-2 mb-1">
              <input
                type="radio"
                value="útil"
                checked={feedback === "útil"}
                onChange={(e) => setFeedback(e.target.value)}
              />
              Útil
            </label>
            <label className="flex items-center gap-2 mb-1">
              <input
                type="radio"
                value="parcialmente_útil"
                checked={feedback === "parcialmente_útil"}
                onChange={(e) => setFeedback(e.target.value)}
              />
              Parcialmente útil
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="não_útil"
                checked={feedback === "não_útil"}
                onChange={(e) => setFeedback(e.target.value)}
              />
              Não útil
            </label>
          </div>
          <textarea
            placeholder="Sugestão de melhoria (opcional)"
            value={sugestao}
            onChange={(e) => setSugestao(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded p-1 mb-1"
            rows={2}
          />
          <div className="flex gap-1">
            <button
              onClick={() => setShowFeedback(false)}
              className="flex-1 text-xs px-2 py-1 text-slate-600 hover:bg-white rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveFeedback}
              disabled={saveFeedbackMutation.isPending}
              className="flex-1 text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}