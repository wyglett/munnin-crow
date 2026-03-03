import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Loader2, Upload, ExternalLink, FolderOpen, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import moment from "moment";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CATEGORIAS = [
  { key: "material_permanente", label: "Material Permanente" },
  { key: "material_consumo", label: "Material de Consumo" },
  { key: "terceiros", label: "Terceiros" },
  { key: "diarias", label: "Diárias" },
  { key: "passagens", label: "Passagens" },
  { key: "contrapartida", label: "Contrapartida" },
];
const CAT_LABEL = Object.fromEntries(CATEGORIAS.map(c => [c.key, c.label]));
const FORM_EMPTY = { descricao: "", categoria: "terceiros", subcategoria_id: "", valor: "", data: "", fornecedor: "", observacao: "", anexo_url: "" };

function hashGasto(g) {
  return [g.descricao, g.categoria, g.valor, g.data, g.fornecedor, g.observacao].join("|");
}

export default function GastosFinanceiro({ projeto, gastos, isConsultor, projetoId }) {
  const queryClient = useQueryClient();
  const [gastoDialog, setGastoDialog] = useState(false);
  const [gastoForm, setGastoForm] = useState(FORM_EMPTY);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const [exportandoTodos, setExportandoTodos] = useState(false);
  const [exportandoId, setExportandoId] = useState(null);
  const [categoriasAbertas, setCategoriasAbertas] = useState({});
  const [alertaEstouro, setAlertaEstouro] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  const orcamentoLinhas = projeto.orcamento_linhas || [];
  const valorContratado = projeto.valor_contratado || 0;
  const totalGasto = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const saldo = valorContratado - totalGasto;

  // Subcategorias da categoria selecionada
  const subcategoriasDaCat = orcamentoLinhas.filter(l => l.categoria === gastoForm.categoria && l.subcategoria);

  const toggleCategoria = (key) => setCategoriasAbertas(prev => ({ ...prev, [key]: !prev[key] }));

  const handleAnexoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAnexo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setGastoForm(f => ({ ...f, anexo_url: file_url }));
    setUploadingAnexo(false);
  };

  const verificarESubmeter = (e) => {
    e.preventDefault();
    const novoValor = parseFloat(gastoForm.valor) || 0;
    const novoTotal = totalGasto + novoValor;
    if (valorContratado > 0 && novoTotal > valorContratado) {
      setPendingSubmit(gastoForm);
      setAlertaEstouro(true);
    } else {
      submitGasto(gastoForm);
    }
  };

  const submitGasto = async (form) => {
    await base44.entities.GastoProjeto.create({
      ...form,
      acompanhamento_id: projetoId,
      valor: parseFloat(form.valor) || 0,
      adicionado_por: isConsultor ? "consultor" : "empreendedor",
      status_revisao: isConsultor ? "pendente_revisao" : "normal",
      drive_exportado: false,
    });
    queryClient.invalidateQueries({ queryKey: ["gastos", projetoId] });
    setGastoDialog(false);
    setGastoForm(FORM_EMPTY);
    setAlertaEstouro(false);
    setPendingSubmit(null);
  };

  const deleteGasto = async (gid) => {
    await base44.entities.GastoProjeto.delete(gid);
    queryClient.invalidateQueries({ queryKey: ["gastos", projetoId] });
  };

  const exportarItem = async (gasto) => {
    const catId = projeto.drive_categoria_ids?.[gasto.categoria];
    if (!catId) {
      alert("Configure o Drive primeiro para criar a estrutura de pastas.");
      return;
    }
    const currentHash = hashGasto(gasto);
    if (gasto.drive_exportado && gasto.drive_hash === currentHash) {
      alert("Este item já foi exportado e não foi modificado.");
      return;
    }
    setExportandoId(gasto.id);
    const res = await base44.functions.invoke("exportarItemDrive", {
      gasto: { ...gasto, drive_resumo_id: gasto.drive_resumo_id || null },
      categoriaFolderId: catId,
    });
    if (res.data?.success) {
      await base44.entities.GastoProjeto.update(gasto.id, {
        drive_exportado: true,
        drive_item_folder_id: res.data.itemFolderId,
        drive_resumo_id: res.data.resumoId,
        drive_exportado_em: new Date().toISOString(),
        drive_hash: currentHash,
      });
      queryClient.invalidateQueries({ queryKey: ["gastos", projetoId] });
    }
    setExportandoId(null);
  };

  const exportarTodos = async () => {
    setExportandoTodos(true);
    for (const g of gastos) {
      const catId = projeto.drive_categoria_ids?.[g.categoria];
      if (!catId) continue;
      const currentHash = hashGasto(g);
      if (g.drive_exportado && g.drive_hash === currentHash) continue;
      await exportarItem(g);
    }
    setExportandoTodos(false);
  };

  // Agrupa gastos por categoria
  const gastosPorCat = CATEGORIAS.map(cat => ({
    ...cat,
    items: gastos.filter(g => g.categoria === cat.key),
    total: gastos.filter(g => g.categoria === cat.key).reduce((s, g) => s + Number(g.valor || 0), 0),
  })).filter(c => c.items.length > 0);

  const exportPendentes = gastos.filter(g => {
    const currentHash = hashGasto(g);
    return !g.drive_exportado || g.drive_hash !== currentHash;
  }).length;

  return (
    <div>
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="bg-indigo-50 border-0"><CardContent className="p-4">
          <p className="text-xs text-indigo-600 font-bold uppercase">Total Gasto</p>
          <p className="text-xl font-bold text-indigo-900 mt-1">{fmt(totalGasto)}</p>
        </CardContent></Card>
        <Card className="bg-slate-50 border-0"><CardContent className="p-4">
          <p className="text-xs text-gray-600 font-bold uppercase">Contratado</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{fmt(valorContratado)}</p>
        </CardContent></Card>
        <Card className={`border-0 ${saldo < 0 ? "bg-red-50" : "bg-green-50"}`}><CardContent className="p-4">
          <p className={`text-xs font-bold uppercase ${saldo < 0 ? "text-red-600" : "text-green-600"}`}>Saldo</p>
          <p className={`text-xl font-bold mt-1 ${saldo < 0 ? "text-red-900" : "text-green-900"}`}>{fmt(saldo)}</p>
        </CardContent></Card>
      </div>

      {valorContratado > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Execução orçamentária</span>
            <span>{valorContratado > 0 ? ((totalGasto / valorContratado) * 100).toFixed(1) : 0}%</span>
          </div>
          <Progress value={valorContratado > 0 ? Math.min((totalGasto / valorContratado) * 100, 100) : 0} className="h-2" />
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-2 justify-end mb-4">
        {projeto.drive_categoria_ids && exportPendentes > 0 && (
          <Button variant="outline" size="sm" onClick={exportarTodos} disabled={exportandoTodos}>
            {exportandoTodos ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-1" />}
            Exportar Todos ({exportPendentes} pendentes)
          </Button>
        )}
        <Button onClick={() => setGastoDialog(true)} className="bg-indigo-600 hover:bg-indigo-700" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Registrar Item
        </Button>
      </div>

      {/* Lista por categoria com collapse */}
      {gastos.length === 0 ? (
        <Card><CardContent className="text-center py-10 text-gray-400">Nenhum item registrado</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {gastosPorCat.map(cat => {
            const aberta = categoriasAbertas[cat.key] !== false; // aberta por padrão
            return (
              <Card key={cat.key}>
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg"
                  onClick={() => toggleCategoria(cat.key)}
                >
                  <div className="flex items-center gap-2">
                    {aberta ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <span className="font-semibold text-gray-800 text-sm">{cat.label}</span>
                    <Badge className="bg-gray-100 text-gray-600 text-xs">{cat.items.length} itens</Badge>
                  </div>
                  <span className="font-bold text-sm text-gray-700">{fmt(cat.total)}</span>
                </div>
                {aberta && (
                  <CardContent className="pt-0 pb-3 px-4">
                    <div className="space-y-2 border-t pt-3">
                      {cat.items.map(g => {
                        const currentHash = hashGasto(g);
                        const exportado = g.drive_exportado && g.drive_hash === currentHash;
                        const modificado = g.drive_exportado && g.drive_hash !== currentHash;
                        return (
                          <div key={g.id} className={`p-3 bg-white rounded-lg border flex items-start justify-between gap-3 ${g.status_revisao === "pendente_revisao" ? "border-l-4 border-l-amber-400" : ""}`}>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-sm break-words">{g.descricao}</p>
                              <div className="flex flex-wrap gap-1.5 text-xs text-gray-500 mt-1">
                                {g.fornecedor && <span className="truncate max-w-[140px]">{g.fornecedor}</span>}
                                {g.data && <span>{moment(g.data).format("DD/MM/YY")}</span>}
                                {g.adicionado_por === "consultor" && <Badge className="text-xs bg-purple-100 text-purple-700">Consultor</Badge>}
                                {g.status_revisao === "pendente_revisao" && <Badge className="text-xs bg-amber-100 text-amber-700">Pendente revisão</Badge>}
                                {exportado && <span className="flex items-center gap-0.5 text-green-600"><CheckCircle2 className="w-3 h-3" /> Exportado</span>}
                                {modificado && <span className="flex items-center gap-0.5 text-orange-500"><AlertTriangle className="w-3 h-3" /> Modificado</span>}
                              </div>
                              {g.observacao && <p className="text-xs text-indigo-600 mt-1 italic">{g.observacao}</p>}
                              {g.anexo_url && (
                                <a href={g.anexo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1">
                                  <ExternalLink className="w-3 h-3" /> Anexo
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="font-bold text-sm whitespace-nowrap">{fmt(g.valor)}</span>
                              {projeto.drive_categoria_ids && !exportado && (
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-400 hover:text-indigo-600" onClick={() => exportarItem(g)} disabled={exportandoId === g.id}>
                                  {exportandoId === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                              {projeto.drive_categoria_ids && modificado && (
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-orange-400 hover:text-orange-600" onClick={() => exportarItem(g)} disabled={exportandoId === g.id} title="Re-exportar (item modificado)">
                                  {exportandoId === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                              {(!isConsultor || g.adicionado_por === "consultor") && (
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => deleteGasto(g.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog registrar item */}
      <Dialog open={gastoDialog} onOpenChange={setGastoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Item</DialogTitle></DialogHeader>
          <form onSubmit={verificarESubmeter} className="space-y-3">
            <div>
              <Label>Descrição *</Label>
              <Input value={gastoForm.descricao} onChange={e => setGastoForm({ ...gastoForm, descricao: e.target.value })} required placeholder="Nome do material ou serviço" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={gastoForm.categoria} onValueChange={v => setGastoForm({ ...gastoForm, categoria: v, subcategoria_id: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={gastoForm.valor} onChange={e => setGastoForm({ ...gastoForm, valor: e.target.value })} required placeholder="0,00" />
              </div>
            </div>
            {subcategoriasDaCat.length > 0 && (
              <div>
                <Label>Subcategoria (opcional)</Label>
                <Select value={gastoForm.subcategoria_id} onValueChange={v => setGastoForm({ ...gastoForm, subcategoria_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar subcategoria..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Sem subcategoria</SelectItem>
                    {subcategoriasDaCat.map(l => <SelectItem key={l.id} value={l.id}>{l.subcategoria} — {fmt(l.valor_aprovado)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={gastoForm.data} onChange={e => setGastoForm({ ...gastoForm, data: e.target.value })} />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Input value={gastoForm.fornecedor} onChange={e => setGastoForm({ ...gastoForm, fornecedor: e.target.value })} placeholder="Razão Social ou Nome Fantasia" />
              </div>
            </div>
            <div>
              <Label>Anexo (NF, comprovante, etc.)</Label>
              <div className="flex items-center gap-2 mt-1">
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all">
                  {uploadingAnexo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingAnexo ? "Enviando..." : "Selecionar arquivo"}
                  <input type="file" className="hidden" onChange={handleAnexoUpload} accept=".pdf,.jpg,.jpeg,.png,.xml" />
                </label>
                {gastoForm.anexo_url && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Adicionado</span>}
              </div>
            </div>
            {isConsultor && (
              <div>
                <Label>Observação</Label>
                <Input value={gastoForm.observacao} onChange={e => setGastoForm({ ...gastoForm, observacao: e.target.value })} placeholder="Obs para o empreendedor..." />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGastoDialog(false)}>Cancelar</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alerta estouro orçamento */}
      <AlertDialog open={alertaEstouro} onOpenChange={setAlertaEstouro}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" /> Atenção: Estouro de Orçamento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este item fará os gastos ultrapassarem o valor contratado. É necessário um <strong>remanejamento orçamentário</strong> aprovado pelo órgão financiador antes de continuar.
              <br /><br />
              Deseja registrar o item mesmo assim? Após a aprovação do remanejamento, atualize os valores na aba Orçamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setAlertaEstouro(false); setPendingSubmit(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={() => submitGasto(pendingSubmit)}>
              Registrar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}