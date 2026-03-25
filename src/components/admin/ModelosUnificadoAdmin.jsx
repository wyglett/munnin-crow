import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import moment from "moment";

export default function ModelosUnificadoAdmin() {
  const [tipoFiltro, setTipoFiltro] = useState("proposta");
  const [modelOpen, setModelOpen] = useState(false);
  const [modelForm, setModelForm] = useState({ nome: "", orgao: "", file_tipo: "pdf" });
  const [creatingModel, setCreatingModel] = useState(false);
  const queryClient = useQueryClient();

  const { data: modelos = [] } = useQuery({
    queryKey: ["modelos-documento"],
    queryFn: () => base44.entities.ModeloDocumento.list("-created_date", 100),
  });

  const { data: modelosRelatorio = [] } = useQuery({
    queryKey: ["modelos-relatorio"],
    queryFn: () => base44.entities.ModeloRelatorio.list("-created_date", 100),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ tipo, id }) => {
      const entity = tipo === "proposta" ? "ModeloDocumento" : "ModeloRelatorio";
      return base44.entities[entity].delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos-documento"] });
      queryClient.invalidateQueries({ queryKey: ["modelos-relatorio"] });
    }
  });

  const dados = tipoFiltro === "proposta" ? modelos : modelosRelatorio;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Gerenciar Modelos</h3>
          <p className="text-sm text-slate-500 mt-1">Propostas e relatórios</p>
        </div>
        <Button className="gap-2 shadow-lg" onClick={() => setModelOpen(true)}>
           <Plus className="w-4 h-4" /> Novo Modelo
         </Button>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setTipoFiltro("proposta")}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            tipoFiltro === "proposta"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Propostas
        </button>
        <button
          onClick={() => setTipoFiltro("relatorio")}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            tipoFiltro === "relatorio"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Relatórios
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Órgão</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Usos</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Data</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {dados.map(modelo => (
              <tr key={modelo.id} className="hover:bg-slate-50">
                <td className="px-6 py-3">
                  <p className="font-medium text-slate-900">{modelo.nome}</p>
                </td>
                <td className="px-6 py-3 text-sm text-slate-600">{modelo.orgao}</td>
                <td className="px-6 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {tipoFiltro === "proposta" ? modelo.categoria_proposta : modelo.tipo_relatorio}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    modelo.status === "publicado"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {modelo.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-slate-600">{modelo.usos || 0}</td>
                <td className="px-6 py-3 text-sm text-slate-600">
                  {moment(modelo.created_date).format("DD/MM/YY")}
                </td>
                <td className="px-6 py-3 text-center space-x-1">
                  <button className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ tipo: tipoFiltro, id: modelo.id })}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {dados.length === 0 && (
           <div className="text-center py-8 text-slate-500">
             Nenhum modelo encontrado
           </div>
         )}
        </div>

        {/* New Model Dialog */}
        <Dialog open={modelOpen} onOpenChange={setModelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Modelo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="model-nome">Nome</Label>
              <Input
                id="model-nome"
                value={modelForm.nome}
                onChange={(e) => setModelForm({ ...modelForm, nome: e.target.value })}
                placeholder="Ex: FAPES Genesis - Proposta"
              />
            </div>
            <div>
              <Label htmlFor="model-orgao">Órgão</Label>
              <Select value={modelForm.orgao} onValueChange={(v) => setModelForm({ ...modelForm, orgao: v })}>
                <SelectTrigger id="model-orgao">
                  <SelectValue placeholder="Selecione um órgão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAPES">FAPES</SelectItem>
                  <SelectItem value="FAPERJ">FAPERJ</SelectItem>
                  <SelectItem value="FAPESP">FAPESP</SelectItem>
                  <SelectItem value="FAPEMIG">FAPEMIG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="model-tipo">Tipo de Arquivo</Label>
              <Select value={modelForm.file_tipo} onValueChange={(v) => setModelForm({ ...modelForm, file_tipo: v })}>
                <SelectTrigger id="model-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModelOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!modelForm.nome || !modelForm.orgao) return;
                setCreatingModel(true);
                try {
                  const entity = tipoFiltro === "proposta" ? "ModeloDocumento" : "ModeloRelatorio";
                  await base44.asServiceRole.entities[entity].create({
                    nome: modelForm.nome,
                    orgao: modelForm.orgao,
                    file_tipo: modelForm.file_tipo,
                    status: "rascunho",
                  });
                  queryClient.invalidateQueries({ queryKey: ["modelos-documento"] });
                  queryClient.invalidateQueries({ queryKey: ["modelos-relatorio"] });
                  setModelForm({ nome: "", orgao: "", file_tipo: "pdf" });
                  setModelOpen(false);
                } catch (error) {
                  console.error("Erro ao criar modelo:", error);
                } finally {
                  setCreatingModel(false);
                }
              }}
              disabled={creatingModel}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {creatingModel && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
        </div>
        );
        }