import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Upload, Loader2, FileText, ChevronDown, ChevronRight,
  CheckCircle2, Unlock, Sparkles, RefreshCw, BookOpen, Plus, Trash2
} from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CATEGORIAS_LABEL = {
  material_permanente: "Material Permanente",
  material_consumo: "Material de Consumo",
  terceiros: "Terceiros/PF",
  diarias: "Diárias",
  passagens: "Passagens",
  contrapartida: "Contrapartida",
  doaci: "DOACI",
};

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// Detecta qual categoria de gasto corresponde ao título/pergunta do campo (seção 8)
function detectarCategoriaDocampo(campo) {
  const texto = ((campo.pergunta || "") + " " + (campo.secao || "")).toLowerCase();
  if (texto.includes("permanente")) return "material_permanente";
  if (texto.includes("consumo")) return "material_consumo";
  if (texto.includes("terceiro") || texto.includes("serviço") || texto.includes("servico") || texto.includes("pf")) return "terceiros";
  if (texto.includes("diária") || texto.includes("diaria")) return "diarias";
  if (texto.includes("passagem")) return "passagens";
  if (texto.includes("contrapartida")) return "contrapartida";
  if (texto.includes("doaci")) return "doaci";
  return null;
}

// Detecção de tipo de campo
function isExecucaoFinanceira(campo) {
  const s = (campo.secao || "").toLowerCase();
  const p = (campo.pergunta || "").toLowerCase();
  const ehSecao8 = /^8(\s|$|-|\.|\s*[-–])/.test(campo.secao || "") &&
    (s.includes("recurso") || s.includes("financ") || s.includes("execução"));
  const ehTabelaItens = campo.tipo_resposta === "tabela_itens" &&
    (s.includes("financ") || s.includes("recurso") || p.includes("financ"));
  return ehSecao8 || ehTabelaItens;
}

function isItem81(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  const ehSecao8 = /^8(\s|$|-|\.|\s*[-–])/.test(campo.secao || "") &&
    (s.includes("recurso") || s.includes("financ") || s.includes("execução"));
  const ehDescricaoJustif = p.includes("descriç") || p.includes("justif") || p.includes("8.1");
  return ehSecao8 && ehDescricaoJustif;
}

function isAtividades(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return (s.includes("2") || p.includes("atividade")) &&
    (p.includes("atividade") || s.includes("atividade") || p.includes("ação") || p.includes("açoes"));
}

function isObjetivos(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return p.includes("objetivo") || s.includes("objetivo") || p.includes("meta") || s.includes("meta");
}

function isCronograma(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return p.includes("cronograma") || s.includes("cronograma");
}

// ─── Campo simples ───────────────────────────────────────────────────────────
function CampoRelatorio({ campo, onChange }) {
  const [aberto, setAberto] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const concluir = () => { onChange({ ...campo, concluido: true }); setAberto(false); };
  const desbloquear = () => { onChange({ ...campo, concluido: false }); setConfirmDialog(false); };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${campo.concluido ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => !campo.concluido && setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          {campo.concluido && campo.resposta && <p className="text-xs text-gray-500 mt-1 truncate">{campo.resposta}</p>}
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
          {campo.tipo_resposta === "numero" ? (
            <Input type="number" step="0.01" value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder="Valor numérico" />
          ) : campo.tipo_resposta === "data" ? (
            <Input type="date" value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} />
          ) : campo.tipo_resposta === "texto_curto" ? (
            <Input value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder="Resposta curta..." />
          ) : (
            <Textarea value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder="Descreva detalhadamente..." className="min-h-[100px]" />
          )}
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={concluir} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir campo
            </Button>
          </div>
        </div>
      )}

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

// ─── Tabela de Atividades (item 2) ───────────────────────────────────────────
function TabelaAtividades({ campo, onChange }) {
  const [aberto, setAberto] = useState(true);
  const linhas = campo.itens_tabela || [];

  const addLinha = () => {
    const nova = { id: `atv-${Date.now()}`, descricao: "", responsavel: "", resultado: "" };
    onChange({ ...campo, itens_tabela: [...linhas, nova] });
  };

  const updateLinha = (i, key, val) => {
    const novas = linhas.map((l, idx) => idx === i ? { ...l, [key]: val } : l);
    onChange({ ...campo, itens_tabela: novas });
  };

  const removeLinha = (i) => {
    onChange({ ...campo, itens_tabela: linhas.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gray-100 text-gray-600 text-xs">{linhas.length} item(s)</Badge>
          {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <th className="text-left p-2 border border-gray-200">Atividade / Ação</th>
                  <th className="text-left p-2 border border-gray-200">Responsável</th>
                  <th className="text-left p-2 border border-gray-200">Resultado Esperado</th>
                  <th className="p-2 border border-gray-200 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={l.id || i}>
                    <td className="p-1 border border-gray-200"><Input value={l.descricao || ""} onChange={e => updateLinha(i, "descricao", e.target.value)} className="border-0 text-sm h-8" placeholder="Descrição da atividade" /></td>
                    <td className="p-1 border border-gray-200"><Input value={l.responsavel || ""} onChange={e => updateLinha(i, "responsavel", e.target.value)} className="border-0 text-sm h-8" placeholder="Nome" /></td>
                    <td className="p-1 border border-gray-200"><Input value={l.resultado || ""} onChange={e => updateLinha(i, "resultado", e.target.value)} className="border-0 text-sm h-8" placeholder="Resultado esperado" /></td>
                    <td className="p-1 border border-gray-200 text-center"><button onClick={() => removeLinha(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addLinha}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Atividade
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Tabela de Objetivos (itens 4 e 5) ───────────────────────────────────────
function TabelaObjetivos({ campo, onChange }) {
  const [aberto, setAberto] = useState(true);
  const linhas = campo.itens_tabela || [];

  const addLinha = () => {
    onChange({ ...campo, itens_tabela: [...linhas, { id: `obj-${Date.now()}`, descricao: "", indicador: "", meta: "" }] });
  };

  const updateLinha = (i, key, val) => {
    onChange({ ...campo, itens_tabela: linhas.map((l, idx) => idx === i ? { ...l, [key]: val } : l) });
  };

  const removeLinha = (i) => {
    onChange({ ...campo, itens_tabela: linhas.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gray-100 text-gray-600 text-xs">{linhas.length} item(s)</Badge>
          {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <th className="text-left p-2 border border-gray-200">Objetivo / Meta</th>
                  <th className="text-left p-2 border border-gray-200">Indicador</th>
                  <th className="text-left p-2 border border-gray-200">Valor / Quantidade</th>
                  <th className="p-2 border border-gray-200 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={l.id || i}>
                    <td className="p-1 border border-gray-200"><Input value={l.descricao || ""} onChange={e => updateLinha(i, "descricao", e.target.value)} className="border-0 text-sm h-8" placeholder="Descrição do objetivo" /></td>
                    <td className="p-1 border border-gray-200"><Input value={l.indicador || ""} onChange={e => updateLinha(i, "indicador", e.target.value)} className="border-0 text-sm h-8" placeholder="Indicador" /></td>
                    <td className="p-1 border border-gray-200"><Input value={l.meta || ""} onChange={e => updateLinha(i, "meta", e.target.value)} className="border-0 text-sm h-8" placeholder="Meta alcançada" /></td>
                    <td className="p-1 border border-gray-200 text-center"><button onClick={() => removeLinha(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addLinha}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Objetivo
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Tabela de Cronograma ────────────────────────────────────────────────────
function TabelaCronograma({ campo, onChange, campos }) {
  const [aberto, setAberto] = useState(true);
  // meses selecionados (0-11)
  const mesesSelecionados = campo.meses_selecionados || [];
  const linhas = campo.itens_tabela || [];

  // Pega objetivos do campo 4 (atividades/objetivos) para preencher as linhas automaticamente
  const camposObjetivos = campos.filter(c => isObjetivos(c) || isAtividades(c));
  const objetivosDisponiveis = camposObjetivos.flatMap(c => (c.itens_tabela || []).map(l => l.descricao).filter(Boolean));

  const toggleMes = (m) => {
    const novos = mesesSelecionados.includes(m)
      ? mesesSelecionados.filter(x => x !== m)
      : [...mesesSelecionados, m].sort((a, b) => a - b);
    onChange({ ...campo, meses_selecionados: novos });
  };

  const addLinha = (descricao = "") => {
    onChange({ ...campo, itens_tabela: [...linhas, { id: `crono-${Date.now()}`, descricao, meses: [] }] });
  };

  const updateLinha = (i, key, val) => {
    onChange({ ...campo, itens_tabela: linhas.map((l, idx) => idx === i ? { ...l, [key]: val } : l) });
  };

  const toggleMesLinha = (i, m) => {
    const l = linhas[i];
    const mesesLinha = l.meses || [];
    const novos = mesesLinha.includes(m) ? mesesLinha.filter(x => x !== m) : [...mesesLinha, m];
    updateLinha(i, "meses", novos);
  };

  const removeLinha = (i) => {
    onChange({ ...campo, itens_tabela: linhas.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gray-100 text-gray-600 text-xs">{mesesSelecionados.length} meses</Badge>
          {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
          {/* Seletor de meses */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Selecione os meses do cronograma:</p>
            <div className="flex flex-wrap gap-1.5">
              {MESES.map((m, i) => (
                <button key={i} type="button" onClick={() => toggleMes(i)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${mesesSelecionados.includes(i) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Importar objetivos */}
          {objetivosDisponiveis.length > 0 && linhas.length === 0 && (
            <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-800">
              <p className="font-medium mb-2">Importar objetivos/atividades cadastrados:</p>
              <div className="flex flex-wrap gap-2">
                {objetivosDisponiveis.map((obj, i) => (
                  <button key={i} type="button" onClick={() => addLinha(obj)}
                    className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 rounded text-xs text-indigo-700 text-left">
                    {obj.length > 40 ? obj.slice(0, 40) + "..." : obj}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mesesSelecionados.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase">
                    <th className="text-left p-2 border border-gray-200 min-w-[160px]">Atividade / Objetivo</th>
                    {mesesSelecionados.map(m => (
                      <th key={m} className="p-2 border border-gray-200 text-center w-10">{MESES[m]}</th>
                    ))}
                    <th className="p-2 border border-gray-200 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={l.id || i} className="hover:bg-gray-50">
                      <td className="p-1 border border-gray-200">
                        <Input value={l.descricao || ""} onChange={e => updateLinha(i, "descricao", e.target.value)} className="border-0 text-xs h-7" placeholder="Atividade" />
                      </td>
                      {mesesSelecionados.map(m => (
                        <td key={m} className="p-1 border border-gray-200 text-center">
                          <button type="button" onClick={() => toggleMesLinha(i, m)}
                            className={`w-5 h-5 rounded mx-auto block transition-all ${(l.meses || []).includes(m) ? "bg-indigo-600" : "border border-gray-300 hover:border-indigo-400"}`}>
                            {(l.meses || []).includes(m) && <span className="text-white text-[10px]">✓</span>}
                          </button>
                        </td>
                      ))}
                      <td className="p-1 border border-gray-200 text-center">
                        <button onClick={() => removeLinha(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button type="button" size="sm" variant="outline" onClick={() => addLinha()}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Linha
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Tabela Execução Financeira (seção 8 — por categoria) ────────────────────
// Layout único: Nome | Descrição | Qtd | Custo Total
function TabelaExecucaoFinanceira({ gastos, campo }) {
  const [aberto, setAberto] = useState(true);
  const categoriaFiltro = detectarCategoriaDocampo(campo);

  const itensFiltrados = categoriaFiltro
    ? gastos.filter(g => g.categoria === categoriaFiltro)
    : gastos;

  const totalFiltrado = itensFiltrados.reduce((s, g) => s + (Number(g.valor) || 0), 0);

  if (itensFiltrados.length === 0) {
    return (
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-1 min-w-0">
            {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
            <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
            <p className="text-xs text-gray-400 mt-1 italic">Nenhum item cadastrado nesta categoria.</p>
          </div>
          <Badge className="bg-indigo-100 text-indigo-700 text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Auto</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          <p className="text-xs text-indigo-600 mt-0.5">Preenchido automaticamente ({itensFiltrados.length} item{itensFiltrados.length > 1 ? "s" : ""})</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-100 text-indigo-700 text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Auto</Badge>
          {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <th className="text-left p-2 border border-gray-200">Nome / Tipo</th>
                  <th className="text-left p-2 border border-gray-200">Descrição</th>
                  <th className="text-center p-2 border border-gray-200">Qtd</th>
                  <th className="text-right p-2 border border-gray-200">Custo Total</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((g, i) => (
                  <tr key={g.id || i} className="hover:bg-gray-50">
                    <td className="p-2 border border-gray-200 font-medium">{g.fornecedor || g.descricao}</td>
                    <td className="p-2 border border-gray-200 text-gray-600">{g.fornecedor ? g.descricao : "—"}</td>
                    <td className="p-2 border border-gray-200 text-center text-gray-600">{g.quantidade || 1}</td>
                    <td className="p-2 border border-gray-200 text-right font-medium">{fmt(g.valor)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={3} className="p-2 border border-gray-200 text-right text-xs uppercase text-gray-600">Total</td>
                  <td className="p-2 border border-gray-200 text-right text-indigo-700">{fmt(totalFiltrado)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Campo 8.1 — Justificativa narrativa (textarea auto-crescente) ────────────
function CampoDescricaoFinanceira({ gastos, campo, onChange, projetoDescricao }) {
  const [gerando, setGerando] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [campo.resposta]);

  const gerarTexto = useCallback(async () => {
    if (gastos.length === 0) return;
    setGerando(true);
    const lista = gastos.map(g =>
      `- ${g.descricao}${g.fornecedor ? ` (${g.fornecedor})` : ""}, valor: ${fmt(g.valor)}${g.observacao ? `, obs: ${g.observacao}` : ""}`
    ).join("\n");

    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Você deve redigir um texto de prestação de contas formal, em português, justificando a aquisição de cada item abaixo em função do projeto descrito.

Para cada item, explique em uma ou duas frases: o que é o item e por que ele foi necessário para o projeto.

REGRAS:
- Texto corrido em parágrafos, SEM listas, SEM bullets, SEM numeração, SEM quebras duplas de linha
- Não use markdown, asteriscos ou traços
- Mencione o valor de cada item
- Tom formal e objetivo

Projeto: ${projetoDescricao}

Itens adquiridos:
${lista}`
    });
    onChange({ ...campo, resposta: typeof r === "string" ? r : JSON.stringify(r) });
    setGerando(false);
  }, [gastos, campo, onChange, projetoDescricao]);

  return (
    <div className={`border rounded-xl overflow-hidden ${campo.concluido ? "border-green-200 bg-green-50/30" : "border-amber-200 bg-amber-50/20"}`}>
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          <p className="text-xs text-amber-700 mt-0.5">Justificativa narrativa — gerada automaticamente pela IA a partir dos itens financeiros</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campo.concluido
            ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" />Concluído</Badge>
            : <Badge className="bg-amber-100 text-amber-700 text-xs"><RefreshCw className="w-3 h-3 inline mr-1" />Auto</Badge>}
          {campo.concluido && (
            <button type="button" onClick={() => onChange({ ...campo, concluido: false })} className="text-gray-400 hover:text-amber-500">
              <Unlock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{gastos.length} item(s) no financeiro</span>
          <Button type="button" size="sm" variant="outline" onClick={gerarTexto} disabled={gerando || gastos.length === 0} className="text-amber-700 border-amber-300 hover:bg-amber-50">
            {gerando ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {gerando ? "Gerando..." : "Gerar / Atualizar com IA"}
          </Button>
        </div>
        <textarea
          ref={textareaRef}
          value={campo.resposta || ""}
          onChange={e => onChange({ ...campo, resposta: e.target.value })}
          placeholder="A justificativa será gerada automaticamente quando novos itens forem adicionados ao financeiro, ou clique em 'Gerar com IA'..."
          disabled={campo.concluido}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none overflow-hidden min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-gray-50 disabled:text-gray-500"
          style={{ lineHeight: "1.6" }}
        />
        {!campo.concluido && (
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => onChange({ ...campo, concluido: true })} className="bg-green-600 hover:bg-green-700" disabled={!campo.resposta}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir campo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Import de projeto aprovado ──────────────────────────────────────────────
function ImportProjetoAprovado({ projeto, onSave }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(projeto.template_relatorio_url || "");
  const [uploading, setUploading] = useState(false);
  const [extraindo, setExtraindo] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUrl(file_url);
    await onSave({ template_relatorio_url: file_url });
    setUploading(false);
  };

  const extrairDoProjeto = async () => {
    const fileUrl = url || projeto.template_relatorio_url;
    if (!fileUrl) return;
    setExtraindo(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise este documento de projeto aprovado. Extraia: 1) atividades previstas, 2) cronograma, 3) equipe, 4) linhas orçamento, 5) objetivos.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          atividades: { type: "array", items: { type: "string" } },
          cronograma: { type: "array", items: { type: "object", properties: { fase: { type: "string" }, periodo: { type: "string" }, descricao: { type: "string" } } } },
          equipe: { type: "array", items: { type: "object", properties: { nome: { type: "string" }, funcao: { type: "string" } } } },
          linhas_orcamento: { type: "array", items: { type: "object", properties: { categoria: { type: "string" }, descricao: { type: "string" }, valor_aprovado: { type: "number" } } } },
          objetivos: { type: "string" }
        }
      }
    });
    setResultado(r);
    setExtraindo(false);
  };

  const aplicarNoOrcamento = async () => {
    if (!resultado?.linhas_orcamento?.length) return;
    const catMap = { "material permanente": "material_permanente", "material de consumo": "material_consumo", "terceiros": "terceiros", "diárias": "diarias", "diarias": "diarias", "passagens": "passagens", "contrapartida": "contrapartida", "doaci": "doaci" };
    const novasLinhas = resultado.linhas_orcamento.map((l, i) => ({
      id: `import-${Date.now()}-${i}`,
      categoria: catMap[l.categoria?.toLowerCase()] || "terceiros",
      subcategoria: l.descricao || "",
      descricao: l.descricao || "",
      valor_aprovado: Number(l.valor_aprovado) || 0
    }));
    await onSave({ orcamento_linhas: [...(projeto.orcamento_linhas || []), ...novasLinhas] });
    setOpen(false);
    setResultado(null);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="border-purple-300 text-purple-700 hover:bg-purple-50">
        <BookOpen className="w-4 h-4 mr-2" /> Importar Projeto Aprovado
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-600" /> Importar do Projeto Aprovado</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Faça upload do PDF do projeto aprovado. A IA extrai atividades, cronograma, equipe e linhas de orçamento automaticamente.</p>
          <div className="space-y-4">
            <label className="cursor-pointer">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : "Upload do PDF do Projeto Aprovado"}
              </div>
              <input type="file" className="hidden" accept=".pdf" onChange={handleUpload} disabled={uploading} />
            </label>
            {(url || projeto.template_relatorio_url) && (
              <>
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded p-2">
                  <FileText className="w-4 h-4" />
                  <a href={url || projeto.template_relatorio_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Arquivo carregado — clique para visualizar</a>
                </div>
                <Button onClick={extrairDoProjeto} disabled={extraindo} className="bg-purple-600 hover:bg-purple-700">
                  {extraindo ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extraindo...</> : <><Sparkles className="w-4 h-4 mr-2" />Extrair Informações com IA</>}
                </Button>
              </>
            )}
            {resultado && (
              <div className="space-y-3">
                {resultado.objetivos && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs font-bold text-gray-600 mb-1">OBJETIVOS</p><p className="text-sm text-gray-700">{resultado.objetivos}</p></div>}
                {resultado.atividades?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-600 mb-1">ATIVIDADES ({resultado.atividades.length})</p>
                    <ul className="space-y-0.5">{resultado.atividades.slice(0, 5).map((a, i) => <li key={i} className="text-xs">• {a}</li>)}{resultado.atividades.length > 5 && <li className="text-xs text-gray-400">...e mais {resultado.atividades.length - 5}</li>}</ul>
                  </div>
                )}
                {resultado.linhas_orcamento?.length > 0 && (
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-indigo-700 mb-2">LINHAS DE ORÇAMENTO ({resultado.linhas_orcamento.length})</p>
                    <div className="space-y-1">{resultado.linhas_orcamento.map((l, i) => <div key={i} className="flex justify-between text-xs text-gray-700"><span>{l.categoria} — {l.descricao}</span><span className="font-bold">{fmt(l.valor_aprovado)}</span></div>)}</div>
                    <Button size="sm" onClick={aplicarNoOrcamento} className="mt-3 bg-indigo-600 hover:bg-indigo-700 w-full">Aplicar no Orçamento do Projeto</Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RelatorioTab({ projeto, gastos, onSave }) {
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [extraindo, setExtraindo] = useState(false);
  const [campos, setCampos] = useState(projeto.relatorio_campos || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
    setExtraindo(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise este documento PDF modelo de prestação de contas/relatório. Identifique todos os campos/seções que precisam ser preenchidos.
Para cada campo, retorne: secao (título da seção), pergunta (o que precisa ser preenchido), tipo_resposta ("texto_longo", "texto_curto", "numero", "data", ou "tabela_itens" se for tabela).
Ordene pelos campos na ordem que aparecem no documento.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          campos: { type: "array", items: { type: "object", properties: { secao: { type: "string" }, pergunta: { type: "string" }, tipo_resposta: { type: "string" } } } }
        }
      }
    });
    if (r.campos) {
      salvar(r.campos.map((c, i) => ({ id: `campo-${Date.now()}-${i}`, secao: c.secao || "", pergunta: c.pergunta || `Campo ${i + 1}`, tipo_resposta: c.tipo_resposta || "texto_longo", resposta: "", concluido: false })));
    }
    setExtraindo(false);
  };

  // Regera 8.1 automaticamente quando entra novo item financeiro
  const prevGastosCount = useRef(gastos.length);
  useEffect(() => {
    const novoCount = gastos.length;
    if (novoCount <= prevGastosCount.current) { prevGastosCount.current = novoCount; return; }
    prevGastosCount.current = novoCount;
    if (gastos.length === 0 || campos.length === 0) return;
    const idx81 = campos.findIndex(c => isItem81(c));
    if (idx81 === -1) return;
    const campo81 = campos[idx81];
    if (campo81.concluido) return;
    (async () => {
      const lista = gastos.map(g => `- ${g.descricao}${g.fornecedor ? ` (${g.fornecedor})` : ""}, valor: ${fmt(g.valor)}${g.observacao ? `, obs: ${g.observacao}` : ""}`).join("\n");
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Redija um texto formal de prestação de contas justificando cada item abaixo em função do projeto. Para cada item, explique em uma ou duas frases o que é e por que foi necessário. Texto corrido, SEM listas, SEM bullets, SEM quebras duplas de linha, sem markdown. Mencione o valor de cada item.

Projeto: ${projeto.descricao_projeto || projeto.titulo}

Itens:
${lista}`
      });
      const novos = [...campos];
      novos[idx81] = { ...campo81, resposta: typeof r === "string" ? r : JSON.stringify(r) };
      salvar(novos);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gastos.length]);

  const concluidos = campos.filter(c => c.concluido).length;
  const pct = campos.length > 0 ? (concluidos / campos.length) * 100 : 0;
  const orcamentoLinhas = projeto.orcamento_linhas || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <label className="cursor-pointer">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
            {uploadingPdf || extraindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploadingPdf ? "Enviando..." : extraindo ? "Extraindo campos..." : "Upload do Modelo PDF"}
          </div>
          <input type="file" className="hidden" accept=".pdf" onChange={uploadTemplate} disabled={uploadingPdf || extraindo} />
        </label>
        <ImportProjetoAprovado projeto={projeto} onSave={onSave} />
      </div>

      {projeto.relatorio_template_url && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-3 border border-green-200">
          <FileText className="w-4 h-4" />
          <a href={projeto.relatorio_template_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Modelo carregado — clique para visualizar</a>
        </div>
      )}

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

      {campos.length === 0 && !extraindo && (
        <Card><CardContent className="text-center py-12 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum campo ainda</p>
          <p className="text-xs mt-1">Faça upload do PDF modelo para gerar o formulário automaticamente</p>
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {campos.map((campo, idx) => {
          if (isItem81(campo)) {
            return <CampoDescricaoFinanceira key={campo.id} gastos={gastos} campo={campo} onChange={(novo) => updateCampo(idx, novo)} projetoDescricao={projeto.descricao_projeto || projeto.titulo} />;
          }
          if (isExecucaoFinanceira(campo)) {
            return <TabelaExecucaoFinanceira key={campo.id} gastos={gastos} orcamentoLinhas={orcamentoLinhas} campo={campo} onChange={(novo) => updateCampo(idx, novo)} />;
          }
          if (isCronograma(campo)) {
            return <TabelaCronograma key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} campos={campos} />;
          }
          if (isObjetivos(campo)) {
            return <TabelaObjetivos key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} />;
          }
          if (isAtividades(campo)) {
            return <TabelaAtividades key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} />;
          }
          return <CampoRelatorio key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} />;
        })}
      </div>
    </div>
  );
}