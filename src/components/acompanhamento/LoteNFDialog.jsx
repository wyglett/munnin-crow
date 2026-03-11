import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, X, Sparkles, AlertTriangle, CheckCircle2, FileText, Package } from "lucide-react";
import { marcarAtividade } from "@/components/gamification/gamificacao";

const CATEGORIAS = [
  { key: "material_permanente", label: "Material Permanente" },
  { key: "material_consumo", label: "Material de Consumo" },
  { key: "terceiros", label: "Terceiros" },
  { key: "diarias", label: "Diárias" },
  { key: "passagens", label: "Passagens" },
  { key: "contrapartida", label: "Contrapartida" },
  { key: "doaci", label: "DOACI" },
];

const LIMITE_ORCAMENTO = 1480;

function precisaOrcamento(extraido) {
  if (!extraido) return false;
  const valor = Number(extraido.valor_total || 0);
  const qtd = Number(extraido.quantidade || 1);
  const unitario = qtd > 0 ? valor / qtd : valor;
  if (qtd === 1 && valor > LIMITE_ORCAMENTO) return true;
  if (qtd > 1 && unitario > LIMITE_ORCAMENTO) return true;
  return false;
}

function temOrcamento(arquivosApoio) {
  return arquivosApoio.some(a => /or[çc]amento/i.test(a.nome));
}

function parseGrupos(arquivos) {
  const nfs = arquivos.filter(f => /^NF[\s_]/i.test(f.nome));
  const apoios = arquivos.filter(f => !/^NF[\s_]/i.test(f.nome));

  return nfs.map(nf => {
    const nfBase = nf.nome.replace(/\.[^.]+$/, "");
    const meus = apoios.filter(a => {
      const aBase = a.nome.replace(/\.[^.]+$/, "");
      return aBase.toLowerCase().includes(nfBase.toLowerCase());
    });
    return {
      id: nfBase,
      nfArquivo: nf,
      arquivosApoio: meus,
      data: "",
      categoria: "terceiros",
      subcategoria_id: "",
      extraido: null,
      lendo: false,
    };
  });
}

export default function LoteNFDialog({ open, onClose, projeto, projetoId, isConsultor, autoExportDrive, onSaved, exportarItem }) {
  const [step, setStep] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [arquivos, setArquivos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const resetar = () => {
    setStep("upload");
    setArquivos([]);
    setGrupos([]);
    setSalvando(false);
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const novos = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      novos.push({ nome: file.name, url: file_url });
    }
    setArquivos(prev => [...prev, ...novos]);
    setUploading(false);
    e.target.value = "";
  };

  const removerArquivo = (idx) => setArquivos(prev => prev.filter((_, i) => i !== idx));

  const processarGrupos = () => {
    setGrupos(parseGrupos(arquivos));
    setStep("revisao");
  };

  const lerComIA = async (grupoId) => {
    setGrupos(prev => prev.map(g => g.id === grupoId ? { ...g, lendo: true } : g));
    const grupo = grupos.find(g => g.id === grupoId);
    const allUrls = [grupo.nfArquivo.url, ...grupo.arquivosApoio.map(a => a.url)];
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é especialista em documentos fiscais brasileiros. Analise a Nota Fiscal e extraia:
- fornecedor: Razão Social do emissor
- descricao: Descrição do(s) item(ns) (se múltiplos, resuma)
- quantidade: Quantidade de unidades (use 1 para serviço único)
- valor_total: Valor total da nota (número puro, sem símbolo)
- observacao: Número da NF, CNPJ ou outras informações relevantes`,
      file_urls: allUrls,
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
    setGrupos(prev => prev.map(g => g.id === grupoId ? { ...g, lendo: false, extraido: r } : g));
  };

  const lerTodos = async () => {
    for (const g of grupos) {
      if (!g.extraido && !g.lendo) await lerComIA(g.id);
    }
  };

  const updateGrupo = (id, field, value) => {
    setGrupos(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const updateExtraido = (id, field, value) => {
    setGrupos(prev => prev.map(g => g.id === id ? { ...g, extraido: { ...g.extraido, [field]: value } } : g));
  };

  const salvarTodos = async () => {
    setSalvando(true);
    for (const g of grupos) {
      if (!g.extraido || !g.data) continue;
      const payload = {
        descricao: g.extraido.descricao || g.id,
        categoria: g.categoria,
        subcategoria_id: g.subcategoria_id || "",
        valor: Number(g.extraido.valor_total) || 0,
        quantidade: Number(g.extraido.quantidade) || 1,
        fornecedor: g.extraido.fornecedor || "",
        data: g.data,
        observacao: g.extraido.observacao || "",
        anexos: [g.nfArquivo, ...g.arquivosApoio],
        acompanhamento_id: projetoId,
        adicionado_por: isConsultor ? "consultor" : "empreendedor",
        status_revisao: "normal",
        drive_exportado: false,
      };
      const criado = await base44.entities.GastoProjeto.create(payload);
      if (!isConsultor) marcarAtividade("gasto_registrado", false);
      if (autoExportDrive && projeto.drive_categoria_ids?.[g.categoria] && criado?.id) {
        await exportarItem({ ...payload, ...criado, id: criado.id }, true);
      }
    }
    setSalvando(false);
    resetar();
    onSaved();
  };

  const orcamentoLinhas = projeto.orcamento_linhas || [];
  const nfsDetectadas = arquivos.filter(f => /^NF[\s_]/i.test(f.nome)).length;
  const prontos = grupos.filter(g => g.extraido && g.data);
  const algumLendo = grupos.some(g => g.lendo);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetar(); onClose(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Upload em Lote de NFs
            <Badge className="bg-amber-100 text-amber-700 text-xs ml-1">Experimental</Badge>
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-800 space-y-2">
              <p className="font-semibold">Convenção de nomenclatura dos arquivos:</p>
              <div className="space-y-1 font-mono text-xs bg-white rounded p-3 border border-indigo-100">
                <p>✅ <span className="text-indigo-700">NF 123 Razao Social.pdf</span> → arquivo principal da NF</p>
                <p>📎 <span className="text-gray-600">Orçamentos - NF 123 Razao Social.pdf</span> → apoio</p>
                <p>📎 <span className="text-gray-600">Comprovantes - NF 123 Razao Social.pdf</span> → apoio</p>
              </div>
              <p className="text-xs text-indigo-600">Arquivos de apoio devem conter o nome exato da NF.</p>
            </div>

            <div>
              <Label>Arquivos (NFs e documentos de apoio)</Label>
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {arquivos.map((a, i) => {
                  const isNF = /^NF[\s_]/i.test(a.nome);
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1.5">
                      <FileText className={`w-3 h-3 flex-shrink-0 ${isNF ? "text-indigo-500" : "text-gray-400"}`} />
                      <span className="truncate flex-1 text-gray-700">{a.nome}</span>
                      <Badge className={`text-[10px] px-1 ${isNF ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                        {isNF ? "NF" : "Apoio"}
                      </Badge>
                      <button type="button" onClick={() => removerArquivo(i)} className="text-red-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <label className="cursor-pointer mt-3 flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all w-fit">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : "Selecionar arquivos"}
                <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.xml" />
              </label>
            </div>

            {arquivos.length > 0 && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-indigo-700">{nfsDetectadas} NF(s)</span> detectada(s) ·{" "}
                {arquivos.length - nfsDetectadas} arquivo(s) de apoio
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { resetar(); onClose(); }}>Cancelar</Button>
              <Button onClick={processarGrupos} disabled={uploading || nfsDetectadas === 0} className="bg-indigo-600 hover:bg-indigo-700">
                Continuar com {nfsDetectadas} NF(s)
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "revisao" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{grupos.length} NF(s) · Preencha os dados e leia com IA</p>
              <Button size="sm" onClick={lerTodos} disabled={algumLendo || grupos.every(g => g.extraido)} className="bg-teal-600 hover:bg-teal-700 text-white">
                <Sparkles className="w-4 h-4 mr-1" />
                {algumLendo ? "Lendo..." : "Ler todas com IA"}
              </Button>
            </div>

            <div className="space-y-4">
              {grupos.map((g) => {
                const subcats = orcamentoLinhas.filter(l => l.categoria === g.categoria && l.subcategoria);
                const precisa = precisaOrcamento(g.extraido);
                const alertaOrç = precisa && !temOrcamento(g.arquivosApoio);

                return (
                  <div key={g.id} className={`border rounded-xl p-4 space-y-3 ${alertaOrç ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{g.nfArquivo.nome}</p>
                        {g.arquivosApoio.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {g.arquivosApoio.map((a, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 truncate max-w-[180px]">{a.nome}</span>
                            ))}
                          </div>
                        )}
                        {g.arquivosApoio.length === 0 && (
                          <p className="text-[11px] text-gray-400 mt-0.5">Sem arquivos de apoio</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => lerComIA(g.id)} disabled={g.lendo} className="border-teal-300 text-teal-700 hover:bg-teal-50 flex-shrink-0">
                        {g.lendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span className="ml-1">{g.lendo ? "Lendo..." : g.extraido ? "Re-ler" : "Ler IA"}</span>
                      </Button>
                    </div>

                    {alertaOrç && (
                      <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-lg p-2.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>Item acima de R$ 1.480,00 — é obrigatório incluir orçamentos. Nenhum arquivo de orçamento foi encontrado para esta NF.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Data de Pagamento *</Label>
                        <input type="date" value={g.data} onChange={e => updateGrupo(g.id, "data", e.target.value)}
                          className="w-full mt-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <Label className="text-xs">Categoria</Label>
                        <select value={g.categoria} onChange={e => updateGrupo(g.id, "categoria", e.target.value)}
                          className="w-full mt-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                      </div>
                      {subcats.length > 0 && (
                        <div className="col-span-2">
                          <Label className="text-xs">Subcategoria (opcional)</Label>
                          <select value={g.subcategoria_id} onChange={e => updateGrupo(g.id, "subcategoria_id", e.target.value)}
                            className="w-full mt-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm">
                            <option value="">Sem subcategoria</option>
                            {subcats.map(l => <option key={l.id} value={l.id}>{l.subcategoria}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    {g.extraido && (
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dados extraídos pela IA
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Fornecedor</label>
                            <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs mt-0.5" value={g.extraido.fornecedor || ""} onChange={e => updateExtraido(g.id, "fornecedor", e.target.value)} />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Descrição</label>
                            <textarea className="w-full border border-gray-200 rounded px-2 py-1 text-xs mt-0.5 resize-none min-h-[44px]" value={g.extraido.descricao || ""} onChange={e => updateExtraido(g.id, "descricao", e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Quantidade</label>
                            <input type="number" min="1" className="w-full border border-gray-200 rounded px-2 py-1 text-xs mt-0.5" value={g.extraido.quantidade || 1} onChange={e => updateExtraido(g.id, "quantidade", e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Valor Total (R$)</label>
                            <input type="number" step="0.01" className="w-full border border-gray-200 rounded px-2 py-1 text-xs mt-0.5" value={g.extraido.valor_total || ""} onChange={e => updateExtraido(g.id, "valor_total", e.target.value)} />
                          </div>
                          {g.extraido.observacao && (
                            <div className="col-span-2">
                              <label className="text-[10px] text-gray-500 uppercase tracking-wide">Observação</label>
                              <input className="w-full border border-gray-200 rounded px-2 py-1 text-xs mt-0.5" value={g.extraido.observacao || ""} onChange={e => updateExtraido(g.id, "observacao", e.target.value)} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Voltar</Button>
              <Button onClick={salvarTodos} disabled={salvando || prontos.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
                {salvando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Salvar {prontos.length} NF(s)</>}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}