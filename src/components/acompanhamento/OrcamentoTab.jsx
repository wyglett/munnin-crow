import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Trash2, Upload, Loader2, CheckCircle2 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CATEGORIAS = [
  { key: "material_permanente", label: "Material Permanente" },
  { key: "material_consumo", label: "Material de Consumo" },
  { key: "terceiros", label: "Terceiros" },
  { key: "diarias", label: "Diárias" },
  { key: "passagens", label: "Passagens" },
  { key: "contrapartida", label: "Contrapartida" },
];

export default function OrcamentoTab({ projeto, gastos, onSave }) {
  const [linhas, setLinhas] = useState(projeto.orcamento_linhas || []);
  const [addDialog, setAddDialog] = useState(false);
  const [novaLinha, setNovaLinha] = useState({ categoria: "terceiros", subcategoria: "", descricao: "", valor_aprovado: "" });
  const [extraindo, setExtraindo] = useState(false);

  const salvar = (novas) => {
    setLinhas(novas);
    onSave({ orcamento_linhas: novas });
  };

  const addLinha = () => {
    const nova = { ...novaLinha, id: `${Date.now()}`, valor_aprovado: parseFloat(novaLinha.valor_aprovado) || 0 };
    salvar([...linhas, nova]);
    setAddDialog(false);
    setNovaLinha({ categoria: "terceiros", subcategoria: "", descricao: "", valor_aprovado: "" });
  };

  const removeLinha = (id) => salvar(linhas.filter(l => l.id !== id));

  const extrairDeDocumento = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExtraindo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Extraia as linhas orçamentárias do documento. Para cada linha, identifique: categoria (uma de: material_permanente, material_consumo, terceiros, diarias, passagens, contrapartida), subcategoria (se houver), descricao e valor_aprovado (número). Retorne JSON com "linhas": array de objetos.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          linhas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                categoria: { type: "string" },
                subcategoria: { type: "string" },
                descricao: { type: "string" },
                valor_aprovado: { type: "number" }
              }
            }
          }
        }
      }
    });
    if (r.linhas) {
      salvar(r.linhas.map((l, i) => ({ ...l, id: `ext-${Date.now()}-${i}` })));
    }
    setExtraindo(false);
  };

  const valorContratado = projeto.valor_contratado || 0;
  const totalGasto = gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0);
  const saldo = valorContratado - totalGasto;
  const pct = valorContratado > 0 ? Math.min((totalGasto / valorContratado) * 100, 100) : 0;

  // Agrupa linhas por categoria
  const porCategoria = CATEGORIAS.map(cat => {
    const catLinhas = linhas.filter(l => l.categoria === cat.key);
    const orcadoLinhas = catLinhas.reduce((s, l) => s + (l.valor_aprovado || 0), 0);
    const gastosCat = gastos.filter(g => g.categoria === cat.key);
    const gastoCat = gastosCat.reduce((s, g) => s + (Number(g.valor) || 0), 0);
    return { ...cat, linhas: catLinhas, orcado: orcadoLinhas, gasto: gastoCat };
  }).filter(c => c.linhas.length > 0 || c.gasto > 0);

  const totalOrcado = linhas.reduce((s, l) => s + (l.valor_aprovado || 0), 0);

  return (
    <div className="space-y-6">
      {/* Resumo geral */}
      <Card><CardContent className="p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-bold text-gray-800">Execução Total</h3>
          <span className={`text-sm font-bold ${saldo < 0 ? "text-red-600" : "text-green-700"}`}>
            Saldo: {fmt(saldo)}
          </span>
        </div>
        <Progress value={pct} className={`h-3 mb-1 ${saldo < 0 ? "[&>div]:bg-red-500" : ""}`} />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{fmt(totalGasto)} executado</span>
          <span>{fmt(valorContratado)} contratado · {pct.toFixed(1)}%</span>
        </div>
        {saldo < 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>Atenção:</strong> Gastos excedem o contratado em {fmt(Math.abs(saldo))}. É necessário um remanejamento orçamentário. Após aprovação, atualize os valores aqui.</span>
          </div>
        )}
      </CardContent></Card>

      {/* Ações */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={() => setAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Adicionar Linha
        </Button>
        <label className="cursor-pointer">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-all">
            {extraindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {extraindo ? "Extraindo..." : "Importar de Documento"}
          </div>
          <input type="file" className="hidden" accept=".pdf,.xlsx,.xls,.csv,.jpg,.png" onChange={extrairDeDocumento} />
        </label>
        {linhas.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">Total orçado: <strong>{fmt(totalOrcado)}</strong></span>
        )}
      </div>

      {/* Por categoria */}
      {porCategoria.length === 0 && (
        <Card><CardContent className="text-center py-10 text-gray-400">
          <p>Nenhuma linha orçamentária cadastrada.</p>
          <p className="text-xs mt-1">Adicione linhas manualmente ou importe um documento.</p>
        </CardContent></Card>
      )}

      {porCategoria.map(cat => {
        const pctCat = cat.orcado > 0 ? Math.min((cat.gasto / cat.orcado) * 100, 100) : 0;
        const saldoCat = cat.orcado - cat.gasto;
        return (
          <Card key={cat.key}><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 text-sm">{cat.label}</h4>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {saldoCat < 0 && <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Estourado</span>}
                <span>Gasto: <strong>{fmt(cat.gasto)}</strong></span>
                {cat.orcado > 0 && <span>Orçado: {fmt(cat.orcado)}</span>}
              </div>
            </div>
            {cat.orcado > 0 && (
              <Progress value={pctCat} className={`h-2 mb-3 ${saldoCat < 0 ? "[&>div]:bg-red-500" : ""}`} />
            )}
            {cat.linhas.length > 0 && (
              <div className="space-y-1 mt-2">
                {cat.linhas.map(l => (
                  <div key={l.id} className="flex items-center justify-between text-xs text-gray-600 py-1 border-b last:border-0">
                    <div>
                      <span className="font-medium">{l.descricao}</span>
                      {l.subcategoria && <span className="ml-2 text-gray-400">({l.subcategoria})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{fmt(l.valor_aprovado)}</span>
                      <button onClick={() => removeLinha(l.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        );
      })}

      {/* Dialog adicionar linha */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Linha Orçamentária</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Categoria</Label>
              <Select value={novaLinha.categoria} onValueChange={v => setNovaLinha(f => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategoria (opcional)</Label>
              <Input value={novaLinha.subcategoria} onChange={e => setNovaLinha(f => ({ ...f, subcategoria: e.target.value }))} placeholder="Ex: Consultoria de Software" />
            </div>
            <div>
              <Label>Descrição *</Label>
              <Input value={novaLinha.descricao} onChange={e => setNovaLinha(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição do item orçado" />
            </div>
            <div>
              <Label>Valor Aprovado (R$) *</Label>
              <Input type="number" step="0.01" value={novaLinha.valor_aprovado} onChange={e => setNovaLinha(f => ({ ...f, valor_aprovado: e.target.value }))} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancelar</Button>
            <Button onClick={addLinha} disabled={!novaLinha.descricao || !novaLinha.valor_aprovado} className="bg-indigo-600 hover:bg-indigo-700">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}