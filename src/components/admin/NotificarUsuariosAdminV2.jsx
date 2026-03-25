import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function NotificarUsuariosAdminV2() {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("aviso");
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: (data) => base44.asServiceRole.entities.NotificacaoPlataforma.create(data),
    onSuccess: () => {
      setTitulo("");
      setMensagem("");
      setTipo("aviso");
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    }
  });

  const handleSend = () => {
    if (!titulo || !mensagem) return;
    sendMutation.mutate({
      titulo,
      mensagem,
      tipo,
      para_todos: true,
    });
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Título</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título da notificação"
          className="w-full border border-slate-200 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2"
        >
          <option value="aviso">Aviso</option>
          <option value="novo_recurso">Novo Recurso</option>
          <option value="correcao">Correção</option>
          <option value="sistema">Sistema</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Mensagem</label>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Mensagem para os usuários"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 h-24"
        />
      </div>

      <Button
        onClick={handleSend}
        disabled={!titulo || !mensagem || sendMutation.isPending}
        className="w-full gap-2"
      >
        <Send className="w-4 h-4" />
        Enviar Notificação para Todos
      </Button>

      {sendMutation.isSuccess && (
        <p className="text-green-600 text-sm">Notificação enviada com sucesso!</p>
      )}
    </div>
  );
}