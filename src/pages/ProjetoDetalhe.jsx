import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, DollarSign, Calendar, FolderOpen, ExternalLink, Info, Plus, Trash2, Loader2, Sparkles, Receipt } from "lucide-react";
import moment from "moment";
import ReactMarkdown from "react-markdown";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const STATUS_MAP = { ativo: "bg-green-100 text-green-800", concluido: "bg-blue-100 text-blue-800", suspenso: "bg-yellow-100 text-yellow-800" };
const CAT_MAP = { material: "Material", servico: "Serviço", pessoal: "Pessoal", equipamento: "Equipamento", viagem: "Viagem", outros: "Outros" };

export default function ProjetoDetalhe() {
  const id = new URLSearchParams(window.location.search).get("id");
  const [gastoDialog, setGastoDialog] = useState(false);
  const [gastoForm, setGastoForm] = useState({ descricao: "", categoria: "servico", valor: "", data: "", fornecedor: "" });
  const [relatorio, setRelatorio] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const queryClient = useQueryClient();

  const { data: projetos = [] } = useQuery({ queryKey: ["acompanhamentos"], queryFn: () => base44.entities.AcompanhamentoProjeto.list() });
  const projeto = projetos.find(p => p.id === id);

  const { data: gastos = [] } = useQuery({
    queryKey: ["gastos", id],
    queryFn: () => base44.entities.GastoProjeto.filter({ acompanhamento_id: id }, "-data", 200),
    enabled: !!id,
  });

  const createGasto = useMutation({
    mutationFn: (d) => base44.entities.GastoProjeto.create({ ...d, acompanhamento_id: id, valor: parseFloat(d.valor) || 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gastos", id] }); setGastoDialog(false); setGastoForm({ descricao: "", categoria: "servico", valor: "", data: "", fornecedor: "" }); },
  });

  const deleteGasto = useMutation({
    mutationFn: (gid) => base44.entities.GastoProjeto.delete(gid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gastos", id] }),
  });

  const updateDrive = useMutation({
    mutationFn: (url) => base44.entities.AcompanhamentoProjeto.update(id, { drive_folder_url: url }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] }),
  });

  const totalGasto = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const saldo = (projeto?.valor_contratado || 0) - totalGasto;

  const gerarRelatorio = async () => {
    setGerando(true);
    const gastosStr = gastos.map(g => `- ${g.data || "?"}: ${g.descricao} | ${CAT_MAP[g.categoria]} | ${fmt(g.valor)}`).join("\n");
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Gere um Relatório Parcial de Execução formal para:\nProjeto: ${projeto.titulo}\nÓrgão: ${projeto.orgao_financiador || "N/I"}\nValor: ${fmt(projeto.valor_contratado)}\nPeríodo: ${projeto.data_inicio || "?"} a ${projeto.data_fim_prevista || "?"}\nTotal Executado: ${fmt(totalGasto)}\nSaldo: ${fmt(saldo)}\nGastos:\n${gastosStr || "Nenhum"}\nFormato Markdown, linguagem formal.`
    });
    setRelatorio(r);
    setGerando(false);
  };

  if (!projeto) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("Acompanhamento")}><Button variant="ghost" className="mb-4 -ml-2"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button></Link>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">{projeto.titulo} <Badge className={STATUS_MAP[projeto.status]}>{projeto.status}</Badge></h1>
            {projeto.orgao_financiador && <p className="text-indigo-600 text-sm mt-0.5">{projeto.orgao_financiador}{projeto.numero_edital ? ` · ${projeto.numero_edital}` : ""}</p>}
          </div>
          {projeto.drive_folder_url && (
            <a href={projeto.drive_folder_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline"><FolderOpen className="w-4 h-4 mr-2" /> Configurar Drive</Button>
            </a>
          )}
        </div>

        {!projeto.drive_folder_url && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800"><strong>Pasta no Drive não configurada.</strong> Configure para vincular os documentos do projeto ao Google Drive e manter tudo organizado.</p>
          </div>
        )}

        <Tabs defaultValue="financeiro">
          <TabsList className="mb-6">
            <TabsTrigger value="financeiro">Gestão Financeira</TabsTrigger>
            <TabsTrigger value="relatorio">Relatório Parcial</TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro">
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="bg-indigo-50 border-0"><CardContent className="p-4"><p className="text-xs text-indigo-600 font-bold uppercase">Total Gasto</p><p className="text-xl font-bold text-indigo-900 mt-1">{fmt(totalGasto)}</p></CardContent></Card>
              <Card className="bg-slate-50 border-0"><CardContent className="p-4"><p className="text-xs text-gray-600 font-bold uppercase">Contratado</p><p className="text-xl font-bold text-gray-900 mt-1">{fmt(projeto.valor_contratado)}</p></CardContent></Card>
              <Card className={`border-0 ${saldo >= 0 ? "bg-green-50" : "bg-red-50"}`}><CardContent className="p-4"><p className={`text-xs font-bold uppercase ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>Saldo</p><p className={`text-xl font-bold mt-1 ${saldo >= 0 ? "text-green-900" : "text-red-900"}`}>{fmt(saldo)}</p></CardContent></Card>
            </div>
            <div className="flex justify-end mb-4"><Button onClick={() => setGastoDialog(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" /> Registrar Gasto</Button></div>
            {gastos.length === 0 ? (
              <Card><CardContent className="text-center py-10"><Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">Nenhum gasto registrado</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {gastos.map(g => (
                  <div key={g.id} className="p-4 bg-white rounded-lg border flex items-center justify-between">
                    <div><p className="font-medium text-gray-900">{g.descricao}</p><div className="flex gap-3 text-sm text-gray-500 mt-0.5">{g.fornecedor && <span>{g.fornecedor}</span>}{g.data && <span>{moment(g.data).format("DD/MM/YYYY")}</span>}<Badge className="text-xs bg-gray-100">{CAT_MAP[g.categoria]}</Badge></div></div>
                    <div className="flex items-center gap-2"><span className="font-bold">{fmt(g.valor)}</span><Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => deleteGasto.mutate(g.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="relatorio">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-gray-500">A IA gera um relatório formal baseado nos dados e gastos do projeto</p>
              <Button onClick={gerarRelatorio} disabled={gerando} className="bg-indigo-600 hover:bg-indigo-700">{gerando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Sparkles className="w-4 h-4 mr-2" />Gerar Relatório</>}</Button>
            </div>
            {relatorio ? <Card><CardContent className="p-6 prose prose-sm max-w-none"><ReactMarkdown>{relatorio}</ReactMarkdown></CardContent></Card> : <Card><CardContent className="text-center py-14 text-gray-400">Clique em "Gerar Relatório" para criar o documento</CardContent></Card>}
          </TabsContent>
        </Tabs>
      </div>

      {/* Gasto Dialog */}
      <Dialog open={gastoDialog} onOpenChange={setGastoDialog}>
        <DialogContent><DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createGasto.mutate(gastoForm); }} className="space-y-3">
            <div><Label>Descrição *</Label><Input value={gastoForm.descricao} onChange={(e) => setGastoForm({ ...gastoForm, descricao: e.target.value })} required placeholder="Ex: Compra de material de laboratório" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Categoria</Label><Select value={gastoForm.categoria} onValueChange={(v) => setGastoForm({ ...gastoForm, categoria: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CAT_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={gastoForm.valor} onChange={(e) => setGastoForm({ ...gastoForm, valor: e.target.value })} required placeholder="0,00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={gastoForm.data} onChange={(e) => setGastoForm({ ...gastoForm, data: e.target.value })} /></div>
              <div><Label>Fornecedor</Label><Input value={gastoForm.fornecedor} onChange={(e) => setGastoForm({ ...gastoForm, fornecedor: e.target.value })} /></div>
            </div>
            <div><Label>Nota Fiscal / Recibo</Label><Input type="file" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setGastoDialog(false)}>Cancelar</Button><Button type="submit" disabled={createGasto.isPending} className="bg-indigo-600 hover:bg-indigo-700">{createGasto.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Registrar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}