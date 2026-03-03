import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, DollarSign, FolderOpen, Info, Plus, Trash2, Loader2,
  Sparkles, Receipt, Users, Upload, ExternalLink, AlertTriangle, CheckCircle2
} from "lucide-react";
import moment from "moment";
import ReactMarkdown from "react-markdown";
import ConsultorTab from "../components/acompanhamento/ConsultorTab";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const STATUS_MAP = { ativo: "bg-green-100 text-green-800", concluido: "bg-blue-100 text-blue-800", suspenso: "bg-yellow-100 text-yellow-800" };

const CATEGORIAS = [
  { key: "material_permanente", label: "Material Permanente" },
  { key: "material_consumo", label: "Material de Consumo" },
  { key: "terceiros", label: "Terceiros" },
  { key: "diarias", label: "Diárias" },
  { key: "passagens", label: "Passagens" },
  { key: "contrapartida", label: "Contrapartida" },
];
const CAT_LABEL = Object.fromEntries(CATEGORIAS.map(c => [c.key, c.label]));

const DRIVE_STRUCT = [
  "Material Permanente",
  "Material de Consumo",
  "Terceiros",
  "Diárias",
  "Passagens",
  "Contrapartida",
];

const FORM_EMPTY = { descricao: "", categoria: "terceiros", valor: "", data: "", fornecedor: "", observacao: "", anexo_url: "" };

export default function ProjetoDetalhe() {
  const id = new URLSearchParams(window.location.search).get("id");
  const [user, setUser] = useState(null);
  const [gastoDialog, setGastoDialog] = useState(false);
  const [gastoForm, setGastoForm] = useState(FORM_EMPTY);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [driveDialog, setDriveDialog] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [criandoDrive, setCriandoDrive] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: projetos = [] } = useQuery({ queryKey: ["acompanhamentos"], queryFn: () => base44.entities.AcompanhamentoProjeto.list() });
  const projeto = projetos.find(p => p.id === id);

  const { data: gastos = [] } = useQuery({
    queryKey: ["gastos", id],
    queryFn: () => base44.entities.GastoProjeto.filter({ acompanhamento_id: id }, "-data", 200),
    enabled: !!id,
  });

  const isConsultor = user?.role === "consultor";
  const isConsultorAprovado = projeto?.consultor_status === "aprovado" && projeto?.consultor_email === user?.email;

  const createGasto = useMutation({
    mutationFn: (d) => base44.entities.GastoProjeto.create({
      ...d, acompanhamento_id: id, valor: parseFloat(d.valor) || 0,
      adicionado_por: isConsultor ? "consultor" : "empreendedor",
      status_revisao: isConsultor ? "pendente_revisao" : "normal",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos", id] });
      setGastoDialog(false);
      setGastoForm(FORM_EMPTY);
    },
  });

  const deleteGasto = useMutation({
    mutationFn: (gid) => base44.entities.GastoProjeto.delete(gid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gastos", id] }),
  });

  const updateDrive = useMutation({
    mutationFn: (url) => base44.entities.AcompanhamentoProjeto.update(id, { drive_folder_url: url }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] }); setDriveDialog(false); },
  });

  const totalGasto = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const valorContratado = projeto?.valor_contratado || 0;
  const saldo = valorContratado - totalGasto;
  const percentGasto = valorContratado > 0 ? Math.min((totalGasto / valorContratado) * 100, 100) : 0;

  // Gastos por categoria
  const gastosPorCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    total: gastos.filter(g => g.categoria === cat.key).reduce((s, g) => s + (Number(g.valor) || 0), 0),
  }));

  const handleAnexoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAnexo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setGastoForm(f => ({ ...f, anexo_url: file_url }));
    setUploadingAnexo(false);
  };

  // Exportar item para o Drive (cria subpasta via IA / link)
  const exportarParaDrive = async (gasto) => {
    if (!projeto?.drive_folder_url) return;
    const nomePasta = `${gasto.data || moment().format("YYYY-MM-DD")}_${gasto.fornecedor || "SEM_FORNECEDOR"} - ${gasto.descricao}`.substring(0, 80);
    alert(`Para exportar ao Drive:\n\nCategoria: ${CAT_LABEL[gasto.categoria]}\nSubpasta: ${nomePasta}\n\nAcesse o Drive e crie a subpasta dentro de "${CAT_LABEL[gasto.categoria]}" com o nome acima.`);
  };

  const salvarDrive = async () => {
    if (!driveUrl) return;
    setCriandoDrive(true);
    // Salva o link e mostra estrutura a criar
    await updateDrive.mutateAsync(driveUrl);
    setCriandoDrive(false);
  };

  const gerarRelatorio = async () => {
    setGerando(true);
    const gastosStr = gastos.map(g => `- ${g.data || "?"}: ${g.descricao} | ${CAT_LABEL[g.categoria]} | ${fmt(g.valor)} | ${g.fornecedor || ""}`).join("\n");
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Gere um Relatório Parcial de Execução formal para:\nProjeto: ${projeto.titulo}\nÓrgão: ${projeto.orgao_financiador || "N/I"}\nValor Contratado: ${fmt(valorContratado)}\nPeríodo: ${projeto.data_inicio || "?"} a ${projeto.data_fim_prevista || "?"}\nTotal Executado: ${fmt(totalGasto)}\nSaldo: ${fmt(saldo)}\nGastos:\n${gastosStr || "Nenhum"}\nFormato Markdown, linguagem formal.`
    });
    setRelatorio(r);
    setGerando(false);
  };

  if (!projeto) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl("Acompanhamento")}><Button variant="ghost" className="mb-4 -ml-2"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button></Link>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              {projeto.titulo}
              <Badge className={STATUS_MAP[projeto.status]}>{projeto.status}</Badge>
            </h1>
            {projeto.orgao_financiador && <p className="text-indigo-600 text-sm mt-0.5">{projeto.orgao_financiador}{projeto.numero_edital ? ` · ${projeto.numero_edital}` : ""}</p>}
          </div>
          <Button variant="outline" onClick={() => { setDriveUrl(projeto.drive_folder_url || ""); setDriveDialog(true); }}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {projeto.drive_folder_url ? "Drive Configurado ✓" : "Configurar Drive"}
          </Button>
        </div>

        {!projeto.drive_folder_url && !isConsultor && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800"><strong>Pasta no Drive não configurada.</strong> Configure para vincular os documentos ao Google Drive e gerar a estrutura de pastas automaticamente.</p>
          </div>
        )}

        <Tabs defaultValue="financeiro">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="financeiro">💰 Gestão Financeira</TabsTrigger>
            <TabsTrigger value="orcamento">📊 Orçamento</TabsTrigger>
            <TabsTrigger value="consultor">
              <Users className="w-4 h-4 mr-1.5" />
              Consultor
              {projeto.consultor_status === "em_negociacao" && <span className="ml-1.5 w-2 h-2 rounded-full bg-yellow-400 inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="relatorio">Relatório</TabsTrigger>
          </TabsList>

          {/* ─── FINANCEIRO ─── */}
          <TabsContent value="financeiro">
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
              <Card className={`border-0 ${saldo >= 0 ? "bg-green-50" : "bg-red-50"}`}><CardContent className="p-4">
                <p className={`text-xs font-bold uppercase ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>Saldo</p>
                <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? "text-green-900" : "text-red-900"}`}>{fmt(saldo)}</p>
              </CardContent></Card>
            </div>

            {/* Barra de consumo */}
            {valorContratado > 0 && (
              <div className="mb-4 p-3 bg-white rounded-lg border">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Execução orçamentária</span>
                  <span>{percentGasto.toFixed(1)}%</span>
                </div>
                <Progress value={percentGasto} className="h-2" />
              </div>
            )}

            <div className="flex justify-end mb-4">
              <Button onClick={() => setGastoDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> Registrar Item
              </Button>
            </div>

            {gastos.length === 0 ? (
              <Card><CardContent className="text-center py-10">
                <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhum item registrado</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {gastos.map(g => (
                  <div key={g.id} className={`p-4 bg-white rounded-lg border flex items-start justify-between gap-3 ${g.status_revisao === "pendente_revisao" ? "border-l-4 border-l-amber-400" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 break-words">{g.descricao}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                        {g.fornecedor && <span className="truncate max-w-[160px]">{g.fornecedor}</span>}
                        {g.data && <span>{moment(g.data).format("DD/MM/YYYY")}</span>}
                        <Badge className="text-xs bg-gray-100 text-gray-700">{CAT_LABEL[g.categoria] || g.categoria}</Badge>
                        {g.adicionado_por === "consultor" && <Badge className="text-xs bg-purple-100 text-purple-700">Consultor</Badge>}
                        {g.status_revisao === "pendente_revisao" && <Badge className="text-xs bg-amber-100 text-amber-700">Pendente revisão</Badge>}
                      </div>
                      {g.observacao && <p className="text-xs text-indigo-600 mt-1 italic">Obs: {g.observacao}</p>}
                      {g.anexo_url && (
                        <a href={g.anexo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1">
                          <ExternalLink className="w-3 h-3" /> Ver Anexo
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-sm whitespace-nowrap">{fmt(g.valor)}</span>
                      {projeto.drive_folder_url && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-400" onClick={() => exportarParaDrive(g)} title="Exportar para Drive">
                          <FolderOpen className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {(!isConsultor || g.adicionado_por === "consultor") && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => deleteGasto.mutate(g.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── ORÇAMENTO ─── */}
          <TabsContent value="orcamento">
            <Card><CardContent className="p-6">
              <h2 className="font-bold text-lg mb-1">Área Orçamentária</h2>
              <p className="text-sm text-gray-500 mb-5">Distribuição dos gastos por categoria conforme regras do edital.</p>

              {/* Barra geral */}
              <div className="mb-6 p-4 rounded-xl border bg-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm text-gray-700">Execução Total</span>
                  <div className="flex items-center gap-2">
                    {saldo < 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {saldo >= 0 && percentGasto >= 100 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    <span className={`text-sm font-bold ${saldo < 0 ? "text-red-600" : "text-gray-700"}`}>{fmt(totalGasto)} / {fmt(valorContratado)}</span>
                  </div>
                </div>
                <Progress value={percentGasto} className={`h-3 ${saldo < 0 ? "[&>div]:bg-red-500" : ""}`} />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{percentGasto.toFixed(1)}% executado</span>
                  <span>Saldo: <strong className={saldo < 0 ? "text-red-600" : "text-green-600"}>{fmt(saldo)}</strong></span>
                </div>
              </div>

              {/* Por categoria */}
              <div className="space-y-3">
                {gastosPorCategoria.map(cat => {
                  const pct = valorContratado > 0 ? Math.min((cat.total / valorContratado) * 100, 100) : 0;
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-40 flex-shrink-0">{cat.label}</span>
                      <div className="flex-1">
                        <Progress value={pct} className="h-2" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-28 text-right">{fmt(cat.total)}</span>
                    </div>
                  );
                })}
              </div>

              {saldo < 0 && (
                <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span><strong>Atenção:</strong> O valor gasto excede o valor contratado em {fmt(Math.abs(saldo))}. Verifique os lançamentos.</span>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* ─── CONSULTOR ─── */}
          <TabsContent value="consultor">
            <ConsultorTab projeto={projeto} user={user} />
          </TabsContent>

          {/* ─── RELATÓRIO ─── */}
          <TabsContent value="relatorio">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-gray-500">A IA gera um relatório formal baseado nos dados e gastos do projeto</p>
              <Button onClick={gerarRelatorio} disabled={gerando} className="bg-indigo-600 hover:bg-indigo-700">
                {gerando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Sparkles className="w-4 h-4 mr-2" />Gerar Relatório</>}
              </Button>
            </div>
            {relatorio
              ? <Card><CardContent className="p-6 prose prose-sm max-w-none"><ReactMarkdown>{relatorio}</ReactMarkdown></CardContent></Card>
              : <Card><CardContent className="text-center py-14 text-gray-400">Clique em "Gerar Relatório" para criar o documento</CardContent></Card>}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Registrar Item Dialog ─── */}
      <Dialog open={gastoDialog} onOpenChange={setGastoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Item</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createGasto.mutate(gastoForm); }} className="space-y-3">
            <div>
              <Label>Descrição *</Label>
              <Input value={gastoForm.descricao} onChange={(e) => setGastoForm({ ...gastoForm, descricao: e.target.value })} required placeholder="Nome do material ou serviço" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={gastoForm.categoria} onValueChange={(v) => setGastoForm({ ...gastoForm, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={gastoForm.valor} onChange={(e) => setGastoForm({ ...gastoForm, valor: e.target.value })} required placeholder="0,00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={gastoForm.data} onChange={(e) => setGastoForm({ ...gastoForm, data: e.target.value })} />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Input value={gastoForm.fornecedor} onChange={(e) => setGastoForm({ ...gastoForm, fornecedor: e.target.value })} placeholder="Razão Social ou Nome Fantasia" />
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
                {gastoForm.anexo_url && (
                  <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Anexo adicionado</span>
                )}
              </div>
            </div>
            {isConsultor && (
              <div>
                <Label>Observação</Label>
                <Input value={gastoForm.observacao} onChange={(e) => setGastoForm({ ...gastoForm, observacao: e.target.value })} placeholder="Obs para o empreendedor..." />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGastoDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={createGasto.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {createGasto.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Drive Dialog ─── */}
      <Dialog open={driveDialog} onOpenChange={setDriveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Pasta no Google Drive</DialogTitle></DialogHeader>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-3">
            <p className="text-sm font-semibold text-indigo-800 mb-2">Estrutura que será criada automaticamente:</p>
            <div className="text-xs text-indigo-700 font-mono space-y-1">
              <p>📁 {projeto.titulo}</p>
              {DRIVE_STRUCT.map(s => <p key={s} className="ml-4">├── 📁 {s}</p>)}
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Cada item registrado cria uma subpasta no formato:</p>
          <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mb-3">AAAA-MM-DD_FORNECEDOR - NOME DO MATERIAL</p>
          <p className="text-sm text-indigo-700 mb-1">Cole o link da pasta principal no Drive (com permissão de editor):</p>
          <Input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." />
          <p className="text-xs text-gray-400 mt-1">A estrutura de pastas será criada automaticamente ao salvar.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriveDialog(false)}>Cancelar</Button>
            <Button onClick={salvarDrive} disabled={!driveUrl || criandoDrive || updateDrive.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {(criandoDrive || updateDrive.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar e Criar Estrutura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}