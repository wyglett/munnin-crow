import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle, Clock, DollarSign, Plus, Loader2, ExternalLink } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_COLORS = {
  pendente: "bg-yellow-100 text-yellow-800",
  enviado: "bg-blue-100 text-blue-800",
  confirmado: "bg-green-100 text-green-800",
};

export default function CobrancasTab({ user }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    projeto_id: "", projeto_titulo: "", empreendedor_email: "", empreendedor_nome: "",
    descricao_servico: "", valor: "", data_emissao: "", tipo: "recibo",
    tarefas_concluidas: "", arquivo_url: "", arquivo_nome: "",
  });

  const { data: recibos = [], isLoading } = useQuery({
    queryKey: ["recibos-consultor", user?.email],
    queryFn: () => base44.entities.ReciboConsultor.filter({ consultor_email: user?.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: projetos = [] } = useQuery({
    queryKey: ["projetos-consultor-ativos", user?.email],
    queryFn: () => base44.entities.AcompanhamentoProjeto.filter({ consultor_email: user?.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const criarMutation = useMutation({
    mutationFn: (data) => base44.entities.ReciboConsultor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["recibos-consultor", user?.email]);
      setOpen(false);
      setForm({ projeto_id: "", projeto_titulo: "", empreendedor_email: "", empreendedor_nome: "", descricao_servico: "", valor: "", data_emissao: "", tipo: "recibo", tarefas_concluidas: "", arquivo_url: "", arquivo_nome: "" });
    },
  });

  const atualizarStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ReciboConsultor.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(["recibos-consultor", user?.email]),
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, arquivo_url: file_url, arquivo_nome: file.name }));
    setUploading(false);
    e.target.value = "";
  };

  const handleSelectProjeto = (projetoId) => {
    const p = projetos.find(proj => proj.id === projetoId);
    if (p) setForm(f => ({ ...f, projeto_id: p.id, projeto_titulo: p.titulo, empreendedor_email: p.created_by || "" }));
    else setForm(f => ({ ...f, projeto_id: "", projeto_titulo: "", empreendedor_email: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    criarMutation.mutate({
      consultor_email: user.email,
      consultor_nome: user.full_name,
      empreendedor_email: form.empreendedor_email,
      empreendedor_nome: form.empreendedor_nome,
      projeto_id: form.projeto_id,
      projeto_titulo: form.projeto_titulo,
      descricao_servico: form.descricao_servico,
      valor: parseFloat(form.valor),
      data_emissao: form.data_emissao,
      tipo: form.tipo,
      arquivo_url: form.arquivo_url,
      arquivo_nome: form.arquivo_nome,
      tarefas_concluidas: form.tarefas_concluidas ? form.tarefas_concluidas.split("\n").filter(Boolean) : [],
      status: "enviado",
    });
  };

  const totalEmitido = recibos.reduce((s, r) => s + (r.valor || 0), 0);
  const totalConfirmado = recibos.filter(r => r.status === "confirmado").reduce((s, r) => s + (r.valor || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Emitido</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{fmt(totalEmitido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Confirmado</p>
            <p className="text-xl font-bold text-green-700 mt-1">{fmt(totalConfirmado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Recibos Emitidos</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{recibos.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Recibos / Notas Fiscais</h3>
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Recibo/NF
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : recibos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhum recibo emitido ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recibos.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900">{r.descricao_servico}</p>
                      <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                      <Badge variant="outline" className="text-xs">{r.tipo === "nota_fiscal" ? "NF" : "Recibo"}</Badge>
                    </div>
                    {r.projeto_titulo && <p className="text-sm text-indigo-600">📁 {r.projeto_titulo}</p>}
                    <p className="text-sm text-gray-500">Para: {r.empreendedor_nome || r.empreendedor_email}</p>
                    {r.tarefas_concluidas?.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {r.tarefas_concluidas.map((t, i) => (
                          <p key={i} className="text-xs text-gray-500 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" /> {t}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{r.data_emissao ? new Date(r.data_emissao).toLocaleDateString("pt-BR") : ""}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-lg text-gray-900">{fmt(r.valor)}</p>
                    {r.arquivo_url && (
                      <a href={r.arquivo_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" /> Ver Arquivo
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    )}
                    {r.status === "enviado" && (
                      <Button size="sm" variant="outline" className="text-xs text-green-600 hover:text-green-700"
                        onClick={() => atualizarStatusMutation.mutate({ id: r.id, status: "confirmado" })}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Confirmar Recebimento
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Recibo / Nota Fiscal</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Projeto Vinculado</Label>
              <select value={form.projeto_id} onChange={e => handleSelectProjeto(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Nenhum projeto</option>
                {projetos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
            </div>
            <div>
              <Label>E-mail do Empreendedor *</Label>
              <Input value={form.empreendedor_email} onChange={e => setForm(f => ({ ...f, empreendedor_email: e.target.value }))} placeholder="email@empresa.com" required />
            </div>
            <div>
              <Label>Nome do Empreendedor</Label>
              <Input value={form.empreendedor_nome} onChange={e => setForm(f => ({ ...f, empreendedor_nome: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Descrição do Serviço *</Label>
              <Textarea value={form.descricao_servico} onChange={e => setForm(f => ({ ...f, descricao_servico: e.target.value }))} rows={2} required placeholder="Descrição dos serviços prestados" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} required placeholder="0,00" />
              </div>
              <div>
                <Label>Data de Emissão</Label>
                <Input type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="recibo">Recibo</option>
                <option value="nota_fiscal">Nota Fiscal</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <Label>Tarefas Concluídas (uma por linha)</Label>
              <Textarea value={form.tarefas_concluidas} onChange={e => setForm(f => ({ ...f, tarefas_concluidas: e.target.value }))} rows={3} placeholder="Ex:&#10;Elaboração da proposta técnica&#10;Revisão do orçamento&#10;Submissão no SIGFAPES" />
            </div>
            <div>
              <Label>Arquivo PDF (Recibo/NF)</Label>
              {form.arquivo_url ? (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded border">
                  <FileText className="w-4 h-4" />
                  <span className="truncate flex-1">{form.arquivo_nome}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, arquivo_url: "", arquivo_nome: "" }))} className="text-red-400 hover:text-red-600">✕</button>
                </div>
              ) : (
                <label className="cursor-pointer mt-1 flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors text-sm text-gray-500">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Enviando..." : "Clique para anexar PDF"}
                  <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={criarMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {criarMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Emitir Recibo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}