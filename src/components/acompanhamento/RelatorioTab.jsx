import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Upload, Loader2, FileText, ChevronDown, ChevronRight,
  Plus, Trash2, CheckCircle2, Lock, Unlock, Sparkles, X
} from "lucide-react";
import moment from "moment";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

function ItemTabela({ item, idx, onChange, onRemove, projetoDescricao }) {
  const [gerando, setGerando] = useState(false);

  const gerarJustificativa = async () => {
    setGerando(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Escreva uma justificativa formal e sucinta (1-2 frases) para a aquisição do item abaixo, alinhada com o projeto descrito.
Projeto: ${projetoDescricao || "projeto de inovação e empreendedorismo"}
Item adquirido: ${item.descricao}
Valor: ${fmt((item.quantidade || 1) * (item.valor_unitario || 0))}
A justificativa deve explicar a necessidade do item para o projeto de forma objetiva.`
    });
    onChange({ ...item, justificativa: r });
    setGerando(false);
  };

  const valorTotal = (item.quantidade || 1) * (item.valor_unitario || 0);

  return (
    <div className="border rounded-lg p-3 bg-white space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-1">
          <Label className="text-xs">Descrição do item *</Label>
          <Input
            value={item.descricao || ""}
            onChange={e => onChange({ ...item, descricao: e.target.value })}
            placeholder="Ex.: iPhone 16"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Qtd</Label>
          <Input
            type="number" min="1" step="1"
            value={item.quantidade || ""}
            onChange={e => onChange({ ...item, quantidade: parseFloat(e.target.value) || 1, valor_total: (parseFloat(e.target.value) || 1) * (item.valor_unitario || 0) })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Valor Unitário (R$)</Label>
          <Input
            type="number" step="0.01"
            value={item.valor_unitario || ""}
            onChange={e => onChange({ ...item, valor_unitario: parseFloat(e.target.value) || 0, valor_total: (item.quantidade || 1) * (parseFloat(e.target.value) || 0) })}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-700">Total: {fmt(valorTotal)}</span>
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Justificativa da aquisição</Label>
          <Button type="button" size="sm" variant="ghost" className="h-6 text-xs text-indigo-600 hover:text-indigo-800 px-2" onClick={gerarJustificativa} disabled={gerando || !item.descricao}>
            {gerando ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {gerando ? "Gerando..." : "Gerar com IA"}
          </Button>
        </div>
        <Textarea
          value={item.justificativa || ""}
          onChange={e => onChange({ ...item, justificativa: e.target.value })}
          placeholder="Ex.: Foi adquirido um iPhone 16 para gestão de dados, marketing e comunicação do projeto..."
          className="text-sm min-h-[60px] resize-none"
        />
      </div>
    </div>
  );
}

function CampoRelatorio({ campo, onChange }) {
  const [aberto, setAberto] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const concluir = () => { onChange({ ...campo, concluido: true }); setAberto(false); };
  const desbloquear = () => { onChange({ ...campo, concluido: false }); setConfirmDialog(false); };

  const addItem = () => {
    const novoItem = { id: `${Date.now()}`, descricao: "", quantidade: 1, valor_unitario: 0, valor_total: 0, justificativa: "" };
    onChange({ ...campo, itens_tabela: [...(campo.itens_tabela || []), novoItem] });
    setAberto(true);
  };

  const updateItem = (idx, novoItem) => {
    const novos = [...(campo.itens_tabela || [])];
    novos[idx] = novoItem;
    onChange({ ...campo, itens_tabela: novos });
  };

  const removeItem = (idx) => {
    onChange({ ...campo, itens_tabela: (campo.itens_tabela || []).filter((_, i) => i !== idx) });
  };

  const totalTabela = (campo.itens_tabela || []).reduce((s, it) => s + ((it.quantidade || 1) * (it.valor_unitario || 0)), 0);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${campo.concluido ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => !campo.concluido && setAberto(v => !v)}
      >
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          {campo.tipo_resposta === "tabela_itens" && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">{(campo.itens_tabela || []).length} item(s)</span>
              {totalTabela > 0 && <span className="text-xs font-bold text-indigo-600">Total: {fmt(totalTabela)}</span>}
            </div>
          )}
          {campo.concluido && campo.tipo_resposta !== "tabela_itens" && campo.resposta && (
            <p className="text-xs text-gray-500 mt-1 truncate">{campo.resposta}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campo.concluido
            ? <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Concluído</Badge>
            : <Badge className="bg-gray-100 text-gray-500 text-xs">Pendente</Badge>}
          {!campo.concluido && (aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
          {campo.concluido && (
            <button type="button" onClick={e => { e.stopPropagation(); setConfirmDialog(true); }} className="text-gray-400 hover:text-amber-500 transition-colors">
              <Unlock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {aberto && !campo.concluido && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {campo.tipo_resposta === "tabela_itens" ? (
            <div className="space-y-2">
              {(campo.itens_tabela || []).map((it, idx) => (
                <ItemTabela
                  key={it.id}
                  item={it}
                  idx={idx}
                  onChange={(novoItem) => updateItem(idx, novoItem)}
                  onRemove={() => removeItem(idx)}
                  projetoDescricao={campo._projetoDescricao}
                />
              ))}
              {totalTabela > 0 && (
                <div className="text-right text-sm font-bold text-indigo-700 pt-1">
                  Soma total: {fmt(totalTabela)}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-1" /> Adicionar item
              </Button>
            </div>
          ) : campo.tipo_resposta === "numero" ? (
            <Input
              type="number" step="0.01"
              value={campo.resposta || ""}
              onChange={e => onChange({ ...campo, resposta: e.target.value })}
              placeholder="Valor numérico"
            />
          ) : campo.tipo_resposta === "data" ? (
            <Input
              type="date"
              value={campo.resposta || ""}
              onChange={e => onChange({ ...campo, resposta: e.target.value })}
            />
          ) : campo.tipo_resposta === "texto_curto" ? (
            <Input
              value={campo.resposta || ""}
              onChange={e => onChange({ ...campo, resposta: e.target.value })}
              placeholder="Resposta curta..."
            />
          ) : (
            <Textarea
              value={campo.resposta || ""}
              onChange={e => onChange({ ...campo, resposta: e.target.value })}
              placeholder="Descreva detalhadamente..."
              className="min-h-[100px]"
            />
          )}
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={concluir} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir campo
            </Button>
          </div>
        </div>
      )}

      {/* Dialog desbloquear */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Desbloquear campo?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Tem certeza que deseja editar este campo já concluído?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Cancelar</Button>
            <Button onClick={desbloquear} className="bg-amber-600 hover:bg-amber-700">Desbloquear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RelatorioTab({ projeto, gastos, onSave }) {
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [extraindo, setExtraindo] = useState(false);
  const [campos, setCampos] = useState(projeto.relatorio_campos || []);
  const [saving, setSaving] = useState(false);

  // Debounce para salvar
  React.useEffect(() => {
    setCampos(projeto.relatorio_campos || []);
  }, [projeto.id]);

  const salvar = async (novosCampos) => {
    setCampos(novosCampos);
    setSaving(true);
    await onSave({ relatorio_campos: novosCampos });
    setSaving(false);
  };

  const updateCampo = (idx, novoCampo) => {
    const novos = [...campos];
    novos[idx] = novoCampo;
    salvar(novos);
  };

  const uploadTemplate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPdf(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await onSave({ relatorio_template_url: file_url });
    setUploadingPdf(false);

    // Extrair campos automaticamente
    setExtraindo(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise este documento PDF modelo de prestação de contas/relatório. Identifique todos os campos/seções que precisam ser preenchidos.
Para cada campo, retorne: secao (título da seção do documento), pergunta (o que precisa ser preenchido), tipo_resposta ("texto_longo", "texto_curto", "numero", "data", ou "tabela_itens" se for uma tabela de itens/aquisições com colunas como descrição, quantidade, valor).
Ordene pelos campos na ordem que aparecem no documento.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          campos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                secao: { type: "string" },
                pergunta: { type: "string" },
                tipo_resposta: { type: "string" }
              }
            }
          }
        }
      }
    });

    if (r.campos) {
      const novos = r.campos.map((c, i) => ({
        id: `campo-${Date.now()}-${i}`,
        secao: c.secao || "",
        pergunta: c.pergunta || `Campo ${i + 1}`,
        tipo_resposta: c.tipo_resposta || "texto_longo",
        resposta: "",
        itens_tabela: [],
        concluido: false,
      }));
      salvar(novos);
    }
    setExtraindo(false);
  };

  const concluidos = campos.filter(c => c.concluido).length;
  const pct = campos.length > 0 ? (concluidos / campos.length) * 100 : 0;

  // Injeta o contexto do projeto nos campos de tabela para a IA de justificativa
  const camposComContexto = campos.map(c => ({
    ...c,
    _projetoDescricao: projeto.descricao_projeto || projeto.titulo,
  }));

  return (
    <div className="space-y-5">
      {/* Upload do template */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Modelo de Prestação de Contas</h3>
              <p className="text-xs text-gray-500 mt-0.5">Faça upload do PDF modelo para a IA extrair os campos automaticamente</p>
            </div>
            <label className="cursor-pointer">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
                {uploadingPdf || extraindo
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Upload className="w-4 h-4" />}
                {uploadingPdf ? "Enviando..." : extraindo ? "Extraindo campos..." : "Upload do Modelo (PDF)"}
              </div>
              <input type="file" className="hidden" accept=".pdf" onChange={uploadTemplate} disabled={uploadingPdf || extraindo} />
            </label>
          </div>
          {projeto.relatorio_template_url && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded p-2">
              <FileText className="w-4 h-4" />
              <a href={projeto.relatorio_template_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Modelo carregado — clique para visualizar</a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progresso */}
      {campos.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Progresso do Formulário</span>
            <span className="text-sm text-indigo-600 font-bold">{concluidos}/{campos.length}</span>
          </div>
          <Progress value={pct} className="h-2" />
          {saving && <p className="text-xs text-gray-400 mt-1">Salvando...</p>}
        </div>
      )}

      {/* Campos */}
      {campos.length === 0 && !extraindo && (
        <Card>
          <CardContent className="text-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum campo ainda</p>
            <p className="text-xs mt-1">Faça upload do PDF modelo para gerar o formulário automaticamente</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {camposComContexto.map((campo, idx) => (
          <CampoRelatorio
            key={campo.id}
            campo={campo}
            onChange={(novo) => updateCampo(idx, novo)}
          />
        ))}
      </div>
    </div>
  );
}