import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AgendarConsultoriaModal({ open, onClose, consultor }) {
  const [formData, setFormData] = useState({
    data: "",
    hora: "",
    duracao_minutos: 60,
    titulo: "",
    descricao: "",
    tipo_reuniao: "inicial",
  });

  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      base44.auth.me().then(setUser).catch(() => {});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.AgendamentoConsultoria.create(data),
    onSuccess: () => {
      toast.success("Reunião agendada com sucesso! Confirmação será enviada por email.");
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      setFormData({ data: "", hora: "", duracao_minutos: 60, titulo: "", descricao: "", tipo_reuniao: "inicial" });
      onClose();
    },
    onError: (err) => {
      toast.error("Erro ao agendar: " + (err.message || "tente novamente"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.data || !formData.hora || !formData.titulo) {
      toast.error("Preencha data, hora e título");
      return;
    }

    const dataHora = new Date(`${formData.data}T${formData.hora}`);
    if (dataHora < new Date()) {
      toast.error("Selecione uma data e hora futuras");
      return;
    }

    mutation.mutate({
      consultor_email: consultor.email,
      consultor_nome: consultor.full_name,
      cliente_email: user.email,
      cliente_nome: user.full_name,
      data_hora: dataHora.toISOString(),
      duracao_minutos: parseInt(formData.duracao_minutos),
      titulo: formData.titulo,
      descricao: formData.descricao,
      tipo_reuniao: formData.tipo_reuniao,
      status: "pendente",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Reunião com {consultor?.full_name}</DialogTitle>
          <DialogDescription>Escolha a data, hora e detalhes da reunião de consultoria</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Data</label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Hora</label>
              <Input
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Duração (minutos)</label>
            <Input
              type="number"
              min="30"
              max="180"
              step="15"
              value={formData.duracao_minutos}
              onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Tipo de Reunião</label>
            <select
              value={formData.tipo_reuniao}
              onChange={(e) => setFormData({ ...formData, tipo_reuniao: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="inicial">Reunião Inicial</option>
              <option value="seguimento">Seguimento</option>
              <option value="planejamento">Planejamento</option>
              <option value="revisao">Revisão</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Assunto *</label>
            <Input
              placeholder="Ex: Revisão de proposta"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Descrição</label>
            <Textarea
              placeholder="Detalhes sobre o que será discutido..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="h-20"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Agendar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}