import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  pendente: "bg-slate-100 text-slate-700",
  em_progresso: "bg-blue-100 text-blue-700",
  documento_enviado: "bg-yellow-100 text-yellow-700",
  aguardando_aprovacao: "bg-orange-100 text-orange-700",
  aprovado: "bg-green-100 text-green-700",
  pagamento_liberado: "bg-emerald-100 text-emerald-700",
  pago: "bg-green-200 text-green-800",
  cancelado: "bg-red-100 text-red-700",
};

const statusLabels = {
  pendente: "Pendente",
  em_progresso: "Em Progresso",
  documento_enviado: "Documento Enviado",
  aguardando_aprovacao: "Aguardando Aprovação",
  aprovado: "Aprovado",
  pagamento_liberado: "Pagamento Liberado",
  pago: "Pago",
  cancelado: "Cancelado",
};

function MilestoneForm({ projectId, consultor, onComplete, initialData = null }) {
  const [formData, setFormData] = useState(
    initialData || {
      titulo: "",
      descricao: "",
      valor: "",
      percentual: "",
      data_vencimento: "",
      documentos_entrega: [],
    }
  );

  const [newDoc, setNewDoc] = useState({ nome: "", descricao: "", tipo: "relatorio", obrigatorio: true });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        acompanhamento_id: projectId,
        valor: parseFloat(data.valor),
        percentual: data.percentual ? parseFloat(data.percentual) : null,
      };
      if (initialData?.id) {
        return base44.entities.MilestonePagamento.update(initialData.id, payload);
      }
      return base44.entities.MilestonePagamento.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", projectId] });
      onComplete();
    },
  });

  const handleAddDoc = () => {
    if (newDoc.nome.trim()) {
      setFormData({
        ...formData,
        documentos_entrega: [...(formData.documentos_entrega || []), { ...newDoc, id: Math.random() }],
      });
      setNewDoc({ nome: "", descricao: "", tipo: "relatorio", obrigatorio: true });
    }
  };

  const handleRemoveDoc = (docId) => {
    setFormData({
      ...formData,
      documentos_entrega: formData.documentos_entrega.filter((d) => d.id !== docId),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Título</label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            placeholder="Ex: Fase 1 - Diagnóstico"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Valor (R$)</label>
          <input
            type="number"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Descrição</label>
        <textarea
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm h-24"
          placeholder="Descreva o escopo e objetivos do milestone"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Percentual (%)</label>
          <input
            type="number"
            value={formData.percentual}
            onChange={(e) => setFormData({ ...formData, percentual: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            placeholder="30"
            max="100"
            step="1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Data Vencimento</label>
          <input
            type="date"
            value={formData.data_vencimento}
            onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Documentos de Entrega */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-2 text-sm">Documentos de Entrega</h4>
        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
          {formData.documentos_entrega?.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-sm">
              <div>
                <p className="font-medium">{doc.nome}</p>
                <p className="text-xs text-slate-500">{doc.tipo} {doc.obrigatorio ? "- Obrigatório" : "- Opcional"}</p>
              </div>
              <button onClick={() => handleRemoveDoc(doc.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
          <input
            type="text"
            value={newDoc.nome}
            onChange={(e) => setNewDoc({ ...newDoc, nome: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="Nome do documento"
          />
          <select
            value={newDoc.tipo}
            onChange={(e) => setNewDoc({ ...newDoc, tipo: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="relatorio">Relatório</option>
            <option value="documento">Documento</option>
            <option value="prototipo">Protótipo</option>
            <option value="analise">Análise</option>
            <option value="outro">Outro</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newDoc.obrigatorio}
              onChange={(e) => setNewDoc({ ...newDoc, obrigatorio: e.target.checked })}
            />
            Obrigatório
          </label>
          <Button onClick={handleAddDoc} size="sm" className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-1" /> Adicionar Documento
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button onClick={onComplete} variant="outline">
          Cancelar
        </Button>
        <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
          {initialData ? "Atualizar" : "Criar"} Milestone
        </Button>
      </div>
    </div>
  );
}

export default function MilestonePagamentoTab({ projectId, consultor }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones", projectId],
    queryFn: () => base44.entities.MilestonePagamento.filter({ acompanhamento_id: projectId }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MilestonePagamento.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["milestones", projectId] }),
  });

  const totalValor = milestones.reduce((sum, m) => sum + (m.valor || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Milestones de Pagamento</h3>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Novo Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Criar"} Milestone</DialogTitle>
            </DialogHeader>
            <MilestoneForm
              projectId={projectId}
              consultor={consultor}
              onComplete={() => {
                setOpenDialog(false);
                setEditingId(null);
              }}
              initialData={editingId ? milestones.find((m) => m.id === editingId) : null}
            />
          </DialogContent>
        </Dialog>
      </div>

      {totalValor > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-1">Valor Total em Milestones</p>
          <p className="text-2xl font-bold text-indigo-600">R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
      )}

      <div className="space-y-3">
        {milestones.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum milestone criado ainda</p>
          </div>
        ) : (
          milestones.map((milestone) => (
            <div key={milestone.id} className="border rounded-lg p-4 hover:bg-slate-50 transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{milestone.titulo}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[milestone.status] || "bg-slate-100"}`}>
                      {statusLabels[milestone.status] || milestone.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{milestone.descricao}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(milestone.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(milestone.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Valor</p>
                  <p className="font-semibold">R$ {milestone.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                {milestone.percentual && (
                  <div>
                    <p className="text-slate-500 text-xs">Percentual</p>
                    <p className="font-semibold">{milestone.percentual}%</p>
                  </div>
                )}
                {milestone.data_vencimento && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500 text-xs">Vencimento</p>
                      <p className="font-semibold text-sm">
                        {format(new Date(milestone.data_vencimento), "dd MMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {milestone.documentos_entrega?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-slate-600 mb-2">Documentos a Entregar:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {milestone.documentos_entrega.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm">
                        {doc.status === "aprovado" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{doc.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}