import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Loader2, Upload, ExternalLink, FolderOpen, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Pencil, X, Sparkles, Zap, Package } from "lucide-react";
import LoteNFDialog from "./LoteNFDialog";
import { marcarAtividade } from "@/components/gamification/gamificacao";
import { Switch } from "@/components/ui/switch";
import moment from "moment";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CATEGORIAS = [
  { key: "material_permanente", label: "Material Permanente" },
  { key: "material_consumo", label: "Material de Consumo" },
  { key: "terceiros", label: "Terceiros" },
  { key: "diarias", label: "Diárias" },
  { key: "passagens", label: "Passagens" },
  { key: "contrapartida", label: "Contrapartida" },
  { key: "doaci", label: "DOACI" },
];

const FORM_EMPTY = { descricao: "", categoria: "terceiros", subcategoria_id: "", valor: "", quantidade: 1, data: "", fornecedor: "", observacao: "", anexos: [] };

function hashGasto(g) {
  return [g.descricao, g.categoria, g.valor, g.data, g.fornecedor, g.observacao, JSON.stringify(g.anexos || [])].join("|");
}

export default function GastosFinanceiro({ projeto, gastos, isConsultor, projetoId }) {
  const queryClient = useQueryClient();
  const [gastoDialog, setGastoDialog] = useState(false);
  const [editingId, setEditingId] = useState(null); // id do item sendo editado
  const [gastoForm, setGastoForm] = useState(FORM_EMPTY);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const [exportandoTodos, setExportandoTodos] = useState(false);
  const [exportandoIds, setExportandoIds] = useState(new Set());
  const [categoriasAbertas, setCategoriasAbertas] = useState({});
  const [alertaEstouro, setAlertaEstouro] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const [selecionados, setSelecionados] = useState(new Set()); // IDs selecionados
  const [modoSelecao, setModoSelecao] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // null | "single" | "bulk"
  const [deletingId, setDeletingId] = useState(null);
  const [leituraAutoOpen, setLeituraAutoOpen] = useState(false);
  // Exportação automática: lê do localStorage por projeto para persistir preferência
  const autoExportKey = `autoExportDrive_${projetoId}`;
  const [autoExportDrive, setAutoExportDrive] = useState(() => {
    try { return localStorage.getItem(autoExportKey) === "true"; } catch { return false; }
  });
  const toggleAutoExport = (val) => {
    setAutoExportDrive(val);
    try { localStorage.setItem(autoExportKey, String(val)); } catch {}
  };

  // Auto-export reativo: quando autoExportDrive está ativo, exporta itens pendentes ao montar e quando gastos mudam
  const prevGastosRef = useRef([]);
  useEffect(() => {
    if (!autoExportDrive || !projeto.drive_categoria_ids) return;
    const prevIds = new Set(prevGastosRef.current.map(g => g.id));
    const gastosPendentes = gastos.filter(g => {
      const catId = projeto.drive_categoria_ids?.[g.categoria];
      if (!catId) return false;
      const hash = hashGasto(g);
      // Exportar se: novo item OU modificado OU nunca exportado
      return !g.drive_exportado || g.drive_hash !== hash || !prevIds.has(g.id);
    });
    if (gastosPendentes.length > 0) {
      (async () => {
        for (const g of gastosPendentes) {
          await exportarItem(g, true);
        }
      })();
    }
    prevGastosRef.current = gastos;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gastos, autoExportDrive]);

  const orcamentoLinhas = projeto.orcamento_linhas || [];
  const valorContratado = projeto.valor_contratado || 0;
  const totalGasto = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const saldo = valorContratado - totalGasto;
  const subcategoriasDaCat = orcamentoLinhas.filter(l => l.categoria === gastoForm.categoria && l.subcategoria);

  const toggleCategoria = (key) => setCategoriasAbertas(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleSelecionado = (id) => {
    setSelecionados(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleTodos = () => {
    if (selecionados.size === gastos.length) setSelecionados(new Set());
    else setSelecionados(new Set(gastos.map(g => g.id)));
  };

  const handleAnexoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingAnexo(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setGastoForm(f => ({ ...f, anexos: [...(f.anexos || []), { nome: file.name, url: file_url }] }));
    }
    setUploadingAnexo(false);
    e.target.value = "";
  };

  const removerAnexo = (idx) => {
    setGastoForm(f => ({ ...f, anexos: f.anexos.filter((_, i) => i !== idx) }));
  };

  const abrirEditar = (g) => {
    setEditingId(g.id);
    setGastoForm({
      descricao: g.descricao || "",
      categoria: g.categoria || "terceiros",
      subcategoria_id: g.subcategoria_id || "",
      valor: g.valor || "",
      quantidade: g.quantidade || 1,
      data: g.data || "",
      fornecedor: g.fornecedor || "",
      observacao: g.observacao || "",
      anexos: g.anexos || [],
    });
    setGastoDialog(true);
  };

  const fecharDialog = () => {
    setGastoDialog(false);
    setEditingId(null);
    setGastoForm(FORM_EMPTY);
  };

  const verificarESubmeter = (e) => {
    e.preventDefault();
    const novoValor = parseFloat(gastoForm.valor) || 0;
    const valorAnterior = editingId ? (gastos.find(g => g.id === editingId)?.valor || 0) : 0;
    const novoTotal = totalGasto - valorAnterior + novoValor;
    if (!editingId && valorContratado > 0 && novoTotal > valorContratado) {
      setPendingSubmit(gastoForm);
      setAlertaEstouro(true);
    } else {
      submitGasto(gastoForm);
    }
  };

  const submitGasto = async (form) => {
    const payload = {
      ...form,
      valor: parseFloat(form.valor) || 0,
      quantidade: parseFloat(form.quantidade) || 1,
      anexos: form.anexos || [],
    };
    let savedId = editingId;
    if (editingId) {
      await base44.entities.GastoProjeto.update(editingId, { ...payload, drive_exportado: false });
    } else {
      const criado = await base44.entities.GastoProjeto.create({
        ...payload,
        acompanhamento_id: projetoId,
        adicionado_por: isConsultor ? "consultor" : "empreendedor",
        status_revisao: isConsultor ? "pendente_revisao" : "normal",
        drive_exportado: false,
      });
      savedId = criado.id;
      if (!isConsultor) marcarAtividade("gasto_registrado", false);
    }
    queryClient.invalidateQueries({ queryKey: ["gastos", projetoId] });
    fecharDialog();
    setAlertaEstouro(false);
    setPendingSubmit(null);
    // Auto-export se habilitado e Drive configurado
    if (autoExportDrive && projeto.drive_categoria_ids?.[payload.categoria] && savedId) {
      const gastoParaExportar = { ...payload, id: savedId, drive_exportado: false, drive_hash: undefined };
      await exportarItem(gastoParaExportar, true);
    }
  };

  const deleteGasto = async (gid) => {
    const g = gastos.find(x => x.id === gid);
    if (g?.drive_item_folder_id && projeto.drive_categoria_ids) {
      await base44.functions.invoke("excluirItemDrive", { folderId: g.drive_item_folder_id });
    }
    await base44.entities.GastoProjeto.delete(gid);
    queryClient.invalidateQueries({ queryKey: ["gastos", projetoId] });
  };

  const deleteBulk = async () => {
    for (const id of selecionados) {
      await deleteGasto(id);
    }
    setSelecionados(new Set());
    setModoSelecao(false);
  };

  const exportarItem = async (gasto, forceExport = false) => {
    const catId = projeto.drive_categoria_ids?.[gasto.categoria];
    if (!catId) { if (!forceExport) alert("Configure o Drive primeiro."); return; }
    if (!gasto.id) { console.warn("exportarItem: gasto sem id", gasto); return; }
    const currentHash = hashGasto(gasto);
    if (!forceExport && gasto.drive_exportado && gasto.drive_hash === currentHash) { alert("Já exportado e sem modificações."); return; }

    setExportandoIds(prev => new Set([...prev, gasto.id]));
    const res = await base44.functions.invoke("exportarItemDrive", {
      gasto: { ...gasto, created_date: gasto.created_date, updated_date: gasto.updated_date },
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
    setExportandoIds(prev => { const n = new Set(prev); n.delete(gasto.id); return n; });
  };

  const exportarSelecionados = async () => {
    setExportandoTodos(true);
    for (const id of selecionados) {
      const g = gastos.find(x => x.id === id);
      if (g) await exportarItem(g);
    }
    setExportandoTodos(false);
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

  const gastosPorCat = CATEGORIAS.map(cat => ({
    ...cat,
    items: gastos.filter(g => g.categoria === cat.key),
    total: gastos.filter(g => g.categoria === cat.key).reduce((s, g) => s + Number(g.valor || 0), 0),
  })).filter(c => c.items.length > 0);

  const exportPendentes = gastos.filter(g => {
    const h = hashGasto(g);
    return !g.drive_exportado || g.drive_hash !== h;
  }).length;

  const selecionadosExportaveis = [...selecionados].filter(id => {
    const g = gastos.find(x => x.id === id);
    if (!g) return false;
    const h = hashGasto(g);
    return !g.drive_exportado || g.drive_hash !== h;
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
            <span>{((totalGasto / valorContratado) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={Math.min((totalGasto / valorContratado) * 100, 100)} className="h-2" />
        </div>
      )}

      {/* Barra de ações em modo seleção */}
      {modoSelecao && (
        <div className="flex flex-wrap items-center gap-2 mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <Checkbox checked={selecionados.size === gastos.length && gastos.length > 0} onCheckedChange={toggleTodos} />
          <span className="text-sm text-indigo-700 font-medium">{selecionados.size} selecionados</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            {projeto.drive_categoria_ids && selecionados.size > 0 && (
              <Button size="sm" variant="outline" onClick={exportarSelecionados} disabled={exportandoTodos || selecionadosExportaveis === 0}>
                {exportandoTodos ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5 mr-1" />}
                Exportar selecionados ({selecionadosExportaveis})
              </Button>
            )}
            {selecionados.size > 0 && (
              <Button size="sm" variant="destructive" onClick={() => setConfirmDelete("bulk")}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir selecionados ({selecionados.size})
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => { setModoSelecao(false); setSelecionados(new Set()); }}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Toggle exportação automática */}
      {projeto.drive_categoria_ids && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white border rounded-lg w-fit ml-auto">
          <Zap className={`w-3.5 h-3.5 ${autoExportDrive ? "text-green-600" : "text-gray-400"}`} />
          <span className="text-xs text-gray-600">Exportar para Drive automaticamente</span>
          <Switch checked={autoExportDrive} onCheckedChange={toggleAutoExport} />
        </div>
      )}

      {/* Ações principais */}
      <div className="flex flex-wrap gap-2 justify-end mb-4">
        {gastos.length > 0 && !modoSelecao && (
          <Button variant="outline" size="sm" onClick={() => setModoSelecao(true)}>Selecionar</Button>
        )}
        {projeto.drive_categoria_ids && exportPendentes > 0 && !modoSelecao && (
          <Button variant="outline" size="sm" onClick={exportarTodos} disabled={exportandoTodos}>
            {exportandoTodos ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-1" />}
            Exportar Todos ({exportPendentes})
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => { setLeituraAutoOpen(true); }} className="border-teal-300 text-teal-700 hover:bg-teal-50">
          <Sparkles className="w-4 h-4 mr-2" /> Leitura Automática (Experimental)
        </Button>
        <Button onClick={() => { fecharDialog(); setGastoDialog(true); }} className="bg-indigo-600 hover:bg-indigo-700" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Registrar Item
        </Button>
      </div>

      {/* Lista */}
      {gastos.length === 0 ? (
        <Card><CardContent className="text-center py-10 text-gray-400">Nenhum item registrado</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {gastosPorCat.map(cat => {
            const aberta = categoriasAbertas[cat.key] !== false;
            return (
              <Card key={cat.key}>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg" onClick={() => toggleCategoria(cat.key)}>
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
                        const isExportando = exportandoIds.has(g.id);

                        return (
                          <div key={g.id} className={`p-3 bg-white rounded-lg border flex items-start gap-3 ${g.status_revisao === "pendente_revisao" ? "border-l-4 border-l-amber-400" : ""}`}>
                            {modoSelecao && (
                              <div className="pt-0.5" onClick={e => e.stopPropagation()}>
                                <Checkbox checked={selecionados.has(g.id)} onCheckedChange={() => toggleSelecionado(g.id)} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-sm break-words">{g.descricao}</p>
                              <div className="flex flex-wrap gap-1.5 text-xs text-gray-500 mt-1">
                                {g.fornecedor && <span>{g.fornecedor}</span>}
                                {g.data && <span>· {moment(g.data).format("DD/MM/YY")}</span>}
                                {g.adicionado_por === "consultor" && <Badge className="text-xs bg-purple-100 text-purple-700">Consultor</Badge>}
                                {g.status_revisao === "pendente_revisao" && <Badge className="text-xs bg-amber-100 text-amber-700">Pendente revisão</Badge>}
                                {exportado && <span className="flex items-center gap-0.5 text-green-600"><CheckCircle2 className="w-3 h-3" /> Exportado</span>}
                                {modificado && <span className="flex items-center gap-0.5 text-orange-500"><AlertTriangle className="w-3 h-3" /> Modificado</span>}
                              </div>
                              {/* Datas de cadastro e alteração */}
                              <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mt-1">
                                {g.created_date && <span>Cadastrado: {moment(g.created_date).format("DD/MM/YY HH:mm")}</span>}
                                {g.updated_date && g.updated_date !== g.created_date && <span>· Alterado: {moment(g.updated_date).format("DD/MM/YY HH:mm")}</span>}
                              </div>
                              {g.observacao && <p className="text-xs text-indigo-600 mt-1 italic">{g.observacao}</p>}
                              {/* Anexos */}
                              {(g.anexos || []).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {g.anexos.map((a, i) => (
                                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                                      <ExternalLink className="w-3 h-3" /> {a.nome || `Anexo ${i + 1}`}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="font-bold text-sm whitespace-nowrap">{fmt(g.valor)}</span>
                              {/* Editar */}
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-gray-600" onClick={() => abrirEditar(g)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {/* Exportar Drive */}
                              {projeto.drive_categoria_ids && (!exportado || modificado) && (
                                <Button size="icon" variant="ghost"
                                  className={`h-7 w-7 ${modificado ? "text-orange-400 hover:text-orange-600" : "text-indigo-400 hover:text-indigo-600"}`}
                                  onClick={() => exportarItem(g)} disabled={isExportando} title={modificado ? "Re-exportar (modificado)" : "Exportar para Drive"}>
                                  {isExportando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                              {/* Excluir */}
                              {(!isConsultor || g.adicionado_por === "consultor") && (
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600"
                                  onClick={() => { setDeletingId(g.id); setConfirmDelete("single"); }}>
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

      {/* Dialog registrar/editar item */}
      <Dialog open={gastoDialog} onOpenChange={(v) => { if (!v) fecharDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Item" : "Registrar Item"}</DialogTitle></DialogHeader>
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
                <Label>Quantidade</Label>
                <Input type="number" min="1" step="1" value={gastoForm.quantidade} onChange={e => setGastoForm({ ...gastoForm, quantidade: e.target.value })} placeholder="1" />
              </div>
            </div>
            <div>
              <Label>Valor Total (R$) *</Label>
              <Input type="number" step="0.01" value={gastoForm.valor} onChange={e => setGastoForm({ ...gastoForm, valor: e.target.value })} required placeholder="0,00" />
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
                <Input value={gastoForm.fornecedor} onChange={e => setGastoForm({ ...gastoForm, fornecedor: e.target.value })} placeholder="Razão Social ou Nome" />
              </div>
            </div>
            <div>
              <Label>Anexos (PDF, NF, comprovantes)</Label>
              <div className="mt-1 space-y-2">
                {(gastoForm.anexos || []).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1.5">
                    <ExternalLink className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate flex-1">{a.nome || `Anexo ${i + 1}`}</a>
                    <button type="button" onClick={() => removerAnexo(i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all w-fit">
                  {uploadingAnexo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingAnexo ? "Enviando..." : "Adicionar arquivo(s)"}
                  <input type="file" multiple className="hidden" onChange={handleAnexoUpload} accept=".pdf,.jpg,.jpeg,.png,.xml" />
                </label>
              </div>
            </div>
            <div>
              <Label>Observação</Label>
              <Input value={gastoForm.observacao} onChange={e => setGastoForm({ ...gastoForm, observacao: e.target.value })} placeholder="Obs para o empreendedor..." />
            </div>
            {editingId && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">Ao salvar, o item será {autoExportDrive && projeto.drive_categoria_ids ? "re-exportado automaticamente ao Drive." : "marcado para re-exportação ao Drive."}</p>
            )}
            {!editingId && autoExportDrive && projeto.drive_categoria_ids && (
              <p className="text-xs text-green-700 bg-green-50 p-2 rounded flex items-center gap-1"><Zap className="w-3 h-3" /> Exportação automática ao Drive ativada.</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={fecharDialog}>Cancelar</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">{editingId ? "Salvar" : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alerta estouro */}
      <AlertDialog open={alertaEstouro} onOpenChange={setAlertaEstouro}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700"><AlertTriangle className="w-5 h-5" /> Estouro de Orçamento</AlertDialogTitle>
            <AlertDialogDescription>Este item fará os gastos ultrapassarem o valor contratado. É necessário um <strong>remanejamento orçamentário</strong>.<br /><br />Deseja registrar mesmo assim?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setAlertaEstouro(false); setPendingSubmit(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={() => submitGasto(pendingSubmit)}>Registrar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação excluir */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => { if (!v) { setConfirmDelete(null); setDeletingId(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete === "bulk"
                ? `Excluir ${selecionados.size} item(s) selecionado(s)? ${projeto.drive_categoria_ids ? "As pastas no Drive também serão excluídas." : ""}`
                : `Excluir este item? ${projeto.drive_categoria_ids ? "A pasta no Drive também será excluída." : ""}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (confirmDelete === "bulk") await deleteBulk();
              else if (deletingId) { await deleteGasto(deletingId); setDeletingId(null); }
              setConfirmDelete(null);
            }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leitura Automática (Experimental) */}
      <LeituraAutomaticaDialog
        open={leituraAutoOpen}
        onClose={() => setLeituraAutoOpen(false)}
        projeto={projeto}
        projetoId={projetoId}
        isConsultor={isConsultor}
        autoExportDrive={autoExportDrive}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["gastos", projetoId] });
          setLeituraAutoOpen(false);
        }}
        exportarItem={exportarItem}
      />
    </div>
  );
}

// ─── Leitura Automática (Experimental) ───────────────────────────────────────
function LeituraAutomaticaDialog({ open, onClose, projeto, projetoId, isConsultor, autoExportDrive, onSaved, exportarItem }) {
  const [step, setStep] = useState("upload"); // upload | confirmar | salvando
  const [data, setData] = useState(""); // data de pagamento
  const [categoria, setCategoria] = useState("terceiros");
  const [uploading, setUploading] = useState(false);
  const [anexos, setAnexos] = useState([]);
  const [lendo, setLendo] = useState(false);
  const [extraido, setExtraido] = useState(null); // dados extraídos pela IA
  const [salvando, setSalvando] = useState(false);

  const resetar = () => {
    setStep("upload");
    setData("");
    setCategoria("terceiros");
    setAnexos([]);
    setExtraido(null);
    setSalvando(false);
  };

  const handleAnexo = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const novos = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      novos.push({ nome: file.name, url: file_url });
    }
    setAnexos(prev => [...prev, ...novos]);
    setUploading(false);
    e.target.value = "";
  };

  const lerDocumentos = async () => {
    if (!anexos.length) return;
    setLendo(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em leitura de documentos fiscais brasileiros. Analise o(s) documento(s) anexado(s) (Nota Fiscal, Invoice, Recibo, Cupom Fiscal ou similar) e extraia as seguintes informações:
- fornecedor: Nome/Razão Social do emissor do documento
- descricao: Descrição dos itens comprados (resuma em um texto se houver vários itens)
- quantidade: Quantidade total de unidades (se for produto único ou soma geral; use 1 se for serviço)
- valor_total: Valor total da nota/documento (número, sem símbolo de moeda)
- observacao: Qualquer informação relevante adicional (número da NF, CNPJ, condições, etc.)

Se houver múltiplos documentos, retorne os dados do documento principal ou uma consolidação.`,
      file_urls: anexos.map(a => a.url),
      response_json_schema: {
        type: "object",
        properties: {
          fornecedor: { type: "string" },
          descricao: { type: "string" },
          quantidade: { type: "number" },
          valor_total: { type: "number" },
          observacao: { type: "string" }
        }
      }
    });
    setExtraido(r);
    setStep("confirmar");
    setLendo(false);
  };

  const salvar = async () => {
    if (!extraido) return;
    setSalvando(true);
    const payload = {
      descricao: extraido.descricao || "Item importado automaticamente",
      categoria,
      valor: Number(extraido.valor_total) || 0,
      quantidade: Number(extraido.quantidade) || 1,
      fornecedor: extraido.fornecedor || "",
      data,
      observacao: extraido.observacao || "",
      anexos,
      acompanhamento_id: projetoId,
      adicionado_por: isConsultor ? "consultor" : "empreendedor",
      status_revisao: "normal",
      drive_exportado: false,
    };
    const criado = await base44.entities.GastoProjeto.create(payload);
    // Exportar para Drive (sempre para leitura automática se drive configurado)
    const temDrive = projeto.drive_categoria_ids?.[categoria];
    if (temDrive && criado?.id) {
      await exportarItem({ ...payload, ...criado, id: criado.id }, true);
    }
    setSalvando(false);
    resetar();
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetar(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            Leitura Automática de Documento Fiscal
            <Badge className="bg-amber-100 text-amber-700 text-xs ml-1">Experimental</Badge>
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-800">
              Anexe a NF, Invoice ou Recibo. A IA lerá o documento e preencherá os dados automaticamente. Confirme antes de salvar.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data de Pagamento *</Label>
                <input type="date" value={data} onChange={e => setData(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <Label>Categoria</Label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label>Documentos Fiscais (NF, Invoice, Recibo...)</Label>
              <div className="mt-2 space-y-2">
                {anexos.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1.5">
                    <ExternalLink className="w-3 h-3 text-teal-400 flex-shrink-0" />
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline truncate flex-1">{a.nome}</a>
                    <button type="button" onClick={() => setAnexos(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all w-fit">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Enviando..." : "Adicionar documento(s)"}
                  <input type="file" multiple className="hidden" onChange={handleAnexo} accept=".pdf,.jpg,.jpeg,.png,.xml" />
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { resetar(); onClose(); }}>Cancelar</Button>
              <Button onClick={lerDocumentos} disabled={!anexos.length || !data || lendo} className="bg-teal-600 hover:bg-teal-700">
                {lendo ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Lendo documento...</> : <><Sparkles className="w-4 h-4 mr-2" />Ler e Extrair Dados</>}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "confirmar" && extraido && (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-800 font-medium">
              Confira os dados extraídos pela IA antes de salvar:
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Fornecedor</Label>
                <input className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" value={extraido.fornecedor || ""} onChange={e => setExtraido(x => ({ ...x, fornecedor: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Descrição dos Itens</Label>
                <textarea className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[70px] resize-none" value={extraido.descricao || ""} onChange={e => setExtraido(x => ({ ...x, descricao: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Quantidade</Label>
                  <input type="number" min="1" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" value={extraido.quantidade || 1} onChange={e => setExtraido(x => ({ ...x, quantidade: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Valor Total (R$)</Label>
                  <input type="number" step="0.01" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" value={extraido.valor_total || ""} onChange={e => setExtraido(x => ({ ...x, valor_total: e.target.value }))} />
                </div>
              </div>
              {extraido.observacao && (
                <div>
                  <Label className="text-xs">Observação</Label>
                  <input className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" value={extraido.observacao || ""} onChange={e => setExtraido(x => ({ ...x, observacao: e.target.value }))} />
                </div>
              )}
            </div>

            <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
              <span>Data: {data}</span>
              <span>· Categoria: {CATEGORIAS.find(c => c.key === categoria)?.label}</span>
              <span>· {anexos.length} documento(s)</span>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Voltar</Button>
              <Button onClick={salvar} disabled={salvando || !extraido.valor_total} className="bg-teal-600 hover:bg-teal-700">
                {salvando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Confirmar e Salvar</>}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}