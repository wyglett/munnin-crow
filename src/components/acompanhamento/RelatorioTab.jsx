import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, Loader2, FileText, ChevronDown, ChevronRight,
  CheckCircle2, Unlock, Sparkles, RefreshCw, BookOpen, Plus, Trash2, Image
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

const PERCENTAGENS = [
  { value: "0", label: "0% — Não iniciado" },
  { value: "1", label: "1% — Iniciado" },
  { value: "50", label: "50% — Parcialmente concluído" },
  { value: "100", label: "100% — Concluído" },
];

// ─── Detectores de tipo de campo ─────────────────────────────────────────────
function detectarCategoriaDocampo(campo) {
  const texto = ((campo.pergunta || "") + " " + (campo.secao || "")).toLowerCase();
  if (texto.includes("permanente")) return "material_permanente";
  if (texto.includes("consumo")) return "material_consumo";
  if (texto.includes("passagem") && !texto.includes("terceiro")) return "passagens";
  if ((texto.includes("diária") || texto.includes("diaria")) && !texto.includes("terceiro")) return "diarias";
  if (texto.includes("terceiro") || texto.match(/servi[çc]o(s)? de/)) return "terceiros";
  if (texto.includes("passagem")) return "passagens";
  if (texto.includes("diária") || texto.includes("diaria")) return "diarias";
  if (texto.includes("contrapartida") || texto.includes("outras despesas")) return "contrapartida";
  if (texto.includes("doaci")) return "doaci";
  return null;
}

function isSecao8(campo) {
  const s = (campo.secao || "").toLowerCase();
  return /^8(\s|$|-|\.|\s*[-–])/.test(campo.secao || "") &&
    (s.includes("recurso") || s.includes("financ") || s.includes("execução"));
}

function isItem81(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  if (p.includes("8.1") || s.includes("8.1")) return true;
  if (isSecao8(campo) && p.includes("justif")) return true;
  return false;
}

function isExecucaoFinanceira(campo) {
  if (isItem81(campo)) return false;
  const s = (campo.secao || "").toLowerCase();
  const p = (campo.pergunta || "").toLowerCase();
  const ehSecao8 = isSecao8(campo);
  const ehTabelaItens = campo.tipo_resposta === "tabela_itens" &&
    (s.includes("financ") || s.includes("recurso") || p.includes("financ"));
  return ehSecao8 || ehTabelaItens;
}

function isEquipe(campo) {
  const s = (campo.secao || "").toLowerCase();
  const p = (campo.pergunta || "").toLowerCase();
  return (s.includes("2") || p.includes("equipe") || p.includes("bolsista")) &&
    (p.includes("equipe") || s.includes("equipe") || p.includes("bolsista") || s.includes("bolsist"));
}

function isAtividades(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  // item 4 — atividades (mas não 4.1)
  const numMatch = s.match(/^(\d+)/);
  const num = numMatch ? numMatch[1] : "";
  if (num === "4" && !s.includes("4.1") && !p.includes("mudança") && !p.includes("alteração")) return true;
  return (p.includes("atividade") || s.includes("atividade")) &&
    !p.includes("mudança") && !p.includes("alteração") && !p.includes("cronograma");
}

function isJustificativaMudancaObjetivos(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return s.includes("4.1") || p.includes("4.1") || 
    ((p.includes("mudança") || p.includes("alteração") || p.includes("justif")) && 
     (p.includes("objetivo") || s.includes("4")));
}

function isEntregas(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  const numMatch = s.match(/^(\d+)/);
  const num = numMatch ? numMatch[1] : "";
  if (num === "5" && !s.includes("5.1")) return true;
  return (p.includes("entrega") || s.includes("entrega")) && !s.includes("5.1");
}

function isDescricaoEntregas(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return s.includes("5.1") || p.includes("5.1") ||
    ((p.includes("descri") || p.includes("detalhamento")) && (p.includes("entrega") || s.includes("5")));
}

function isResultadosAlcancados(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  const numMatch = s.match(/^(\d+)/);
  const num = numMatch ? numMatch[1] : "";
  if (num === "6") return true;
  return p.includes("resultado") && (p.includes("alcançado") || p.includes("impacto") || p.includes("venda") || p.includes("marketing"));
}

function isObjetivos(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return (p.includes("objetivo") || s.includes("objetivo")) && !isAtividades(campo);
}

function isCronograma(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return p.includes("cronograma") || s.includes("cronograma");
}

// ─── Botão de IA para melhorar texto ─────────────────────────────────────────
function BotaoMelhorarIA({ texto, onMelhorado, instrucao }) {
  const [loading, setLoading] = useState(false);
  const melhorar = async () => {
    if (!texto?.trim()) return;
    setLoading(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `${instrucao || "Melhore o texto a seguir para deixá-lo mais técnico, claro, formal, direto e objetivo, sem alterar o sentido:"}

"${texto}"

Retorne apenas o texto melhorado, sem comentários adicionais.`
    });
    onMelhorado(typeof r === "string" ? r : texto);
    setLoading(false);
  };
  return (
    <Button type="button" size="sm" variant="outline" onClick={melhorar} disabled={loading || !texto?.trim()} className="text-purple-700 border-purple-300 hover:bg-purple-50">
      {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
      {loading ? "Melhorando..." : "Melhorar com IA"}
    </Button>
  );
}

// ─── Campo simples ────────────────────────────────────────────────────────────
function CampoRelatorio({ campo, onChange }) {
  const [aberto, setAberto] = useState(false);

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
            <button type="button" onClick={e => { e.stopPropagation(); onChange({ ...campo, concluido: false }); }} className="text-gray-400 hover:text-amber-500">
              <Unlock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {aberto && !campo.concluido && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {campo.tipo_resposta === "numero" ? (
            <Input type="number" value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} />
          ) : campo.tipo_resposta === "data" ? (
            <Input type="date" value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} />
          ) : campo.tipo_resposta === "texto_curto" ? (
            <Input value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder="Resposta curta..." />
          ) : (
            <Textarea value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder="Descreva detalhadamente..." className="min-h-[100px]" />
          )}
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => { onChange({ ...campo, concluido: true }); setAberto(false); }} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir campo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Item 2 — Equipe do Projeto ───────────────────────────────────────────────
function TabelaEquipe({ campo, onChange }) {
  const [aberto, setAberto] = useState(true);
  const linhas = campo.itens_tabela || [];

  const addLinha = () => {
    onChange({ ...campo, itens_tabela: [...linhas, { id: `eq-${Date.now()}`, nome: "", responsabilidade: "", formacao: "" }] });
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
          <p className="text-xs text-gray-400 mt-0.5">Nome Completo · Responsabilidade na Execução · Formação Acadêmica e Experiência</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gray-100 text-gray-600 text-xs">{linhas.length} membro(s)</Badge>
          {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <div className="space-y-3">
            {linhas.map((l, i) => (
              <div key={l.id || i} className="border border-gray-200 rounded-lg p-3 space-y-2 relative">
                <button onClick={() => removeLinha(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Nome Completo</label>
                  <Input value={l.nome || ""} onChange={e => updateLinha(i, "nome", e.target.value)} className="mt-0.5 text-sm" placeholder="Nome completo do membro" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Responsabilidade na Execução</label>
                  <Input value={l.responsabilidade || ""} onChange={e => updateLinha(i, "responsabilidade", e.target.value)} className="mt-0.5 text-sm" placeholder="Ex: Coordenador técnico, Desenvolvedor..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Formação Acadêmica e Experiência</label>
                  <Textarea value={l.formacao || ""} onChange={e => updateLinha(i, "formacao", e.target.value)} className="mt-0.5 text-sm min-h-[60px]" placeholder="Ex: Graduado em Ciência da Computação, 5 anos de experiência em desenvolvimento..." />
                </div>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addLinha}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Membro
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Item 3 — Texto descritivo (item 2.5 do anexo) ───────────────────────────
// Usa CampoRelatorio padrão (campo de texto)

// ─── Item 4 — Lista de atividades (apenas título) ────────────────────────────
function ListaAtividades({ campo, onChange }) {
  const [aberto, setAberto] = useState(true);
  const linhas = campo.itens_tabela || [];

  const addLinha = () => {
    onChange({ ...campo, itens_tabela: [...linhas, { id: `atv-${Date.now()}`, titulo: "" }] });
  };
  const updateLinha = (i, val) => {
    onChange({ ...campo, itens_tabela: linhas.map((l, idx) => idx === i ? { ...l, titulo: val } : l) });
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
          <Badge className="bg-gray-100 text-gray-600 text-xs">{linhas.length} atividade(s)</Badge>
          {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
          {linhas.map((l, i) => (
            <div key={l.id || i} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono w-5 flex-shrink-0">{i + 1}.</span>
              <Input value={l.titulo || ""} onChange={e => updateLinha(i, e.target.value)} className="text-sm flex-1" placeholder="Título da atividade" />
              <button onClick={() => removeLinha(i)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addLinha} className="mt-1">
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Atividade
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Item 4.1 — Justificativa de mudança de objetivos ────────────────────────
function CampoJustificativaMudanca({ campo, onChange }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${campo.concluido ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => !campo.concluido && setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          {!aberto && campo.resposta && <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">{campo.resposta}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campo.concluido
            ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" />Concluído</Badge>
            : <Badge className="bg-gray-100 text-gray-500 text-xs">Pendente</Badge>}
          {campo.concluido && <button type="button" onClick={e => { e.stopPropagation(); onChange({ ...campo, concluido: false }); }} className="text-gray-400 hover:text-amber-500"><Unlock className="w-4 h-4" /></button>}
          {!campo.concluido && (aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
        </div>
      </div>
      {aberto && !campo.concluido && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <Textarea
            value={campo.resposta || ""}
            onChange={e => onChange({ ...campo, resposta: e.target.value })}
            placeholder="Descreva as razões da mudança de objetivo(s)..."
            className="min-h-[120px] text-sm"
          />
          <div className="flex items-center justify-between">
            <BotaoMelhorarIA
              texto={campo.resposta}
              onMelhorado={txt => onChange({ ...campo, resposta: txt })}
              instrucao="Melhore o texto a seguir para justificar de forma técnica, clara, formal, direta e objetiva a razão da mudança de objetivos em um relatório de projeto financiado por órgão público:"
            />
            <Button type="button" size="sm" onClick={() => { onChange({ ...campo, concluido: true }); setAberto(false); }} className="bg-green-600 hover:bg-green-700" disabled={!campo.resposta}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Item 5 — Entregas por objetivo com % de execução ─────────────────────────
function TabelaEntregas({ campo, onChange, camposAtividades }) {
  const [aberto, setAberto] = useState(true);

  // Pega atividades do item 4 para montar as linhas de objetivo
  const atividadesRef = camposAtividades?.flatMap(c => c.itens_tabela || []) || [];
  const linhas = campo.itens_tabela || [];

  // Sincroniza linhas com objetivos (adiciona novas, mantém existentes)
  const sincronizarLinhas = () => {
    const novas = atividadesRef.map((atv, i) => {
      const existente = linhas.find(l => l.objetivo_ref === atv.id || l.objetivo_num === i + 1);
      return existente || {
        id: `ent-${Date.now()}-${i}`,
        objetivo_num: i + 1,
        objetivo_ref: atv.id,
        objetivo_titulo: atv.titulo || `Objetivo ${i + 1}`,
        entregas_sub: [],
        percentagem: "0",
      };
    });
    onChange({ ...campo, itens_tabela: novas });
  };

  const updateLinha = (i, key, val) => {
    onChange({ ...campo, itens_tabela: linhas.map((l, idx) => idx === i ? { ...l, [key]: val } : l) });
  };

  const addSubEntrega = (i) => {
    const linha = linhas[i];
    const subs = linha.entregas_sub || [];
    updateLinha(i, "entregas_sub", [...subs, { id: `sub-${Date.now()}`, descricao: "", percentagem: "0" }]);
  };

  const updateSub = (i, si, key, val) => {
    const linha = linhas[i];
    const subs = (linha.entregas_sub || []).map((s, idx) => idx === si ? { ...s, [key]: val } : s);
    updateLinha(i, "entregas_sub", subs);
  };

  const removeSub = (i, si) => {
    const linha = linhas[i];
    updateLinha(i, "entregas_sub", (linha.entregas_sub || []).filter((_, idx) => idx !== si));
  };

  // Calcula média aritmética das % de execução de todas as linhas principais
  const todasLinhas = linhas.filter(l => !isNaN(Number(l.percentagem)));
  const media = todasLinhas.length > 0
    ? (todasLinhas.reduce((s, l) => s + Number(l.percentagem || 0), 0) / todasLinhas.length).toFixed(1)
    : "0";

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700 text-xs font-bold">{media}% execução</Badge>
          {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {aberto && (
        <div className="border-t border-gray-100 pt-3 pb-4 px-4 space-y-3">
          {atividadesRef.length > 0 && linhas.length === 0 && (
            <Button type="button" size="sm" variant="outline" onClick={sincronizarLinhas} className="text-indigo-700 border-indigo-300">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Importar objetivos do Item 4
            </Button>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <th className="text-center p-2 border border-gray-200 w-10">Nº</th>
                  <th className="text-left p-2 border border-gray-200">Entrega Pactuada para Atingir os Objetivos Específicos (Item 4)</th>
                  <th className="text-center p-2 border border-gray-200 w-48">% Execução</th>
                  <th className="p-2 border border-gray-200 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <React.Fragment key={l.id || i}>
                    <tr className="hover:bg-gray-50">
                      <td className="p-2 border border-gray-200 text-center font-bold text-gray-600">{l.objetivo_num || i + 1}</td>
                      <td className="p-2 border border-gray-200">
                        <Input value={l.objetivo_titulo || ""} onChange={e => updateLinha(i, "objetivo_titulo", e.target.value)} className="border-0 text-sm h-8" placeholder="Descreva a entrega..." />
                      </td>
                      <td className="p-2 border border-gray-200">
                        <Select value={l.percentagem || "0"} onValueChange={val => updateLinha(i, "percentagem", val)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PERCENTAGENS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 border border-gray-200 text-center">
                        <button type="button" onClick={() => addSubEntrega(i)} title="Adicionar subentrega" className="text-indigo-400 hover:text-indigo-600 mr-1"><Plus className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                    {/* Sub-entregas */}
                    {(l.entregas_sub || []).map((sub, si) => (
                      <tr key={sub.id || si} className="bg-indigo-50/30">
                        <td className="p-1.5 border border-gray-200 text-center text-xs text-gray-400">{l.objetivo_num || i + 1}.{si + 1}</td>
                        <td className="p-1.5 border border-gray-200">
                          <Input value={sub.descricao || ""} onChange={e => updateSub(i, si, "descricao", e.target.value)} className="border-0 text-xs h-7 bg-transparent" placeholder="Detalhe da entrega..." />
                        </td>
                        <td className="p-1.5 border border-gray-200">
                          <Select value={sub.percentagem || "0"} onValueChange={val => updateSub(i, si, "percentagem", val)}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERCENTAGENS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-1.5 border border-gray-200 text-center">
                          <button onClick={() => removeSub(i, si)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {/* Linha de total */}
                {linhas.length > 0 && (
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan={2} className="p-2 border border-gray-200 text-sm text-right text-blue-800 text-xs">
                      Percentagem Total de Execução do Projeto (Média Aritmética das Percentagens de Execução)
                    </td>
                    <td className="p-2 border border-gray-200 text-center font-bold text-blue-800">{media}%</td>
                    <td className="p-2 border border-gray-200"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {linhas.length === 0 && atividadesRef.length === 0 && (
            <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...campo, itens_tabela: [...linhas, { id: `ent-${Date.now()}`, objetivo_num: 1, objetivo_titulo: "", entregas_sub: [], percentagem: "0" }] })}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Entrega
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Item 5.1 / Item 6 — Texto com imagem + IA ─────────────────────────────
function CampoTextoComImagem({ campo, onChange, instrucaoIA }) {
  const [aberto, setAberto] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const imagens = campo.imagens || [];

  const uploadImagem = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...campo, imagens: [...imagens, { url: file_url, legenda: "" }] });
    setUploadingImg(false);
    e.target.value = "";
  };

  const updateLegenda = (i, val) => {
    onChange({ ...campo, imagens: imagens.map((img, idx) => idx === i ? { ...img, legenda: val } : img) });
  };

  const removeImagem = (i) => {
    onChange({ ...campo, imagens: imagens.filter((_, idx) => idx !== i) });
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${campo.concluido ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => !campo.concluido && setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          {!aberto && campo.resposta && <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">{campo.resposta}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {imagens.length > 0 && <Badge className="bg-blue-100 text-blue-700 text-xs">{imagens.length} imagem(ns)</Badge>}
          {campo.concluido
            ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" />Concluído</Badge>
            : <Badge className="bg-gray-100 text-gray-500 text-xs">Pendente</Badge>}
          {campo.concluido && <button type="button" onClick={e => { e.stopPropagation(); onChange({ ...campo, concluido: false }); }} className="text-gray-400 hover:text-amber-500"><Unlock className="w-4 h-4" /></button>}
          {!campo.concluido && (aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
        </div>
      </div>
      {aberto && !campo.concluido && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <Textarea
            value={campo.resposta || ""}
            onChange={e => onChange({ ...campo, resposta: e.target.value })}
            placeholder="Descreva detalhadamente..."
            className="min-h-[120px] text-sm"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <BotaoMelhorarIA
              texto={campo.resposta}
              onMelhorado={txt => onChange({ ...campo, resposta: txt })}
              instrucao={instrucaoIA}
            />
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
              {uploadingImg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
              {uploadingImg ? "Enviando..." : "Adicionar Imagem"}
              <input type="file" className="hidden" accept="image/*" onChange={uploadImagem} disabled={uploadingImg} />
            </label>
          </div>
          {imagens.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {imagens.map((img, i) => (
                <div key={i} className="relative border rounded-lg overflow-hidden">
                  <img src={img.url} alt="" className="w-full h-32 object-cover" />
                  <button onClick={() => removeImagem(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                  <Input value={img.legenda || ""} onChange={e => updateLegenda(i, e.target.value)} className="border-0 border-t rounded-none text-xs" placeholder="Legenda da imagem..." />
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => { onChange({ ...campo, concluido: true }); setAberto(false); }} className="bg-green-600 hover:bg-green-700" disabled={!campo.resposta}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tabela de Cronograma ─────────────────────────────────────────────────────
function TabelaCronograma({ campo, onChange, campos }) {
  const [aberto, setAberto] = useState(true);
  const mesesSelecionados = campo.meses_selecionados || [];
  const linhas = campo.itens_tabela || [];

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
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Meses do cronograma:</p>
            <div className="flex flex-wrap gap-1.5">
              {MESES.map((m, i) => (
                <button key={i} type="button" onClick={() => toggleMes(i)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${mesesSelecionados.includes(i) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          {mesesSelecionados.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase">
                    <th className="text-left p-2 border border-gray-200 min-w-[160px]">Atividade</th>
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

// ─── Tabela Execução Financeira (seção 8) ────────────────────────────────────
function TabelaExecucaoFinanceira({ gastos, campo }) {
  const [aberto, setAberto] = useState(true);
  const categoriaFiltro = detectarCategoriaDocampo(campo);
  const itensFiltrados = categoriaFiltro ? gastos.filter(g => g.categoria === categoriaFiltro) : gastos;
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

// ─── Campo 8.1 — Justificativa narrativa ─────────────────────────────────────
function CampoDescricaoFinanceira({ gastos, campo, onChange, projetoDescricao }) {
  const [gerando, setGerando] = useState(false);
  const [aberto, setAberto] = useState(false);

  const gerarTexto = useCallback(async () => {
    if (gastos.length === 0) return;
    setGerando(true);
    const grupos = Object.entries(CATEGORIAS_LABEL)
      .map(([key, label]) => ({ key, label, items: gastos.filter(g => g.categoria === key) }))
      .filter(g => g.items.length > 0);
    const resumo = grupos.map(g => {
      const itens = g.items.map(x => `  - ${x.descricao}${x.fornecedor ? ` (${x.fornecedor})` : ""}: ${fmt(x.valor)}${x.observacao ? ` — ${x.observacao}` : ""}`).join("\n");
      return `### ${g.label}\n${itens}`;
    }).join("\n\n");
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Redija a seção 8.1 de um relatório de prestação de contas de projeto de inovação financiado por órgão público.

MODELO:
Materiais Permanentes:
Foi adquirida uma Smart TV da marca Philips, 50 polegadas, sistema Google TV, utilizada como recurso audiovisual em capacitações e eventos do Programa.

Terceiros:
Nos serviços de terceiros, foi contratada a empresa XYZ para impressão de materiais, utilizados como apoio em evento, garantindo a comunicação institucional.

REGRAS:
- Categoria em linha separada com dois pontos
- Um parágrafo curto por item (1-3 linhas), iniciando com "Foi adquirido/contratado..."
- Mencione fornecedor/marca e valor
- Explique a finalidade no projeto
- Parágrafos separados por linha em branco
- Sem bullets, sem numeração, sem markdown
- Tom formal e objetivo

Projeto: ${projetoDescricao}
Itens por categoria:\n${resumo}`
    });
    onChange({ ...campo, resposta: typeof r === "string" ? r : JSON.stringify(r) });
    setGerando(false);
    setAberto(true);
  }, [gastos, campo, onChange, projetoDescricao]);

  const preview = campo.resposta ? campo.resposta.slice(0, 120) + (campo.resposta.length > 120 ? "..." : "") : null;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${campo.concluido ? "border-green-200 bg-green-50/30" : "border-amber-200 bg-amber-50/20"}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-50/30" onClick={() => !campo.concluido && setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          <p className="text-xs text-amber-700 mt-0.5">Gerada automaticamente pela IA a partir dos itens financeiros</p>
          {!aberto && preview && <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">{preview}</p>}
          {!aberto && !preview && <p className="text-xs text-gray-400 mt-1 italic">Clique para expandir...</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campo.concluido
            ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" />Concluído</Badge>
            : <Badge className="bg-amber-100 text-amber-700 text-xs"><RefreshCw className="w-3 h-3 inline mr-1" />Auto</Badge>}
          {!campo.concluido && (aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
          {campo.concluido && (
            <button type="button" onClick={e => { e.stopPropagation(); onChange({ ...campo, concluido: false }); }} className="text-gray-400 hover:text-amber-500">
              <Unlock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {aberto && !campo.concluido && (
        <div className="px-4 pb-4 border-t border-amber-100 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{gastos.length} item(s) no financeiro</span>
            <Button type="button" size="sm" variant="outline" onClick={gerarTexto} disabled={gerando || gastos.length === 0} className="text-amber-700 border-amber-300 hover:bg-amber-50">
              {gerando ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
              {gerando ? "Gerando..." : "Gerar / Atualizar com IA"}
            </Button>
          </div>
          <Textarea value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder="Clique em 'Gerar com IA'..." className="min-h-[200px] text-sm leading-relaxed" />
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => { onChange({ ...campo, concluido: true }); setAberto(false); }} className="bg-green-600 hover:bg-green-700" disabled={!campo.resposta}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir campo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Import de projeto aprovado ───────────────────────────────────────────────
function ImportProjetoAprovado({ projeto, onSave, campos, onSalvarCampos }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(projeto.template_relatorio_url || "");
  const [uploading, setUploading] = useState(false);
  const [extraindo, setExtraindo] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [aplicandoRelatorio, setAplicandoRelatorio] = useState(false);
  const [aplicadoRelatorio, setAplicadoRelatorio] = useState(false);

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
      prompt: `Analise este documento de projeto aprovado. Extraia detalhadamente: 
1) objetivos (texto descritivo)
2) atividades do item 5.2 (lista completa dos títulos das atividades, na ordem em que aparecem)
3) equipe (nome completo, função/responsabilidade, formação/experiência de cada membro)
4) cronograma por fase/etapa
5) linhas de orçamento
6) entregas/resultados esperados`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          objetivos: { type: "string" },
          atividades: { type: "array", items: { type: "string" } },
          entregas: { type: "array", items: { type: "string" } },
          equipe: { type: "array", items: { type: "object", properties: { nome: { type: "string" }, funcao: { type: "string" }, formacao: { type: "string" } } } },
          cronograma: { type: "array", items: { type: "object", properties: { atividade: { type: "string" }, inicio: { type: "string" }, fim: { type: "string" } } } },
          linhas_orcamento: { type: "array", items: { type: "object", properties: { categoria: { type: "string" }, descricao: { type: "string" }, valor_aprovado: { type: "number" } } } },
        }
      }
    });
    setResultado(r);
    setAplicadoRelatorio(false);
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
  };

  const aplicarNoRelatorio = async () => {
    if (!resultado || !campos?.length) return;
    setAplicandoRelatorio(true);
    const novosCampos = campos.map(campo => {
      if (campo.concluido) return campo;
      const p = (campo.pergunta || "").toLowerCase();
      const s = (campo.secao || "").toLowerCase();

      // Equipe (Item 2)
      if (isEquipe(campo) && resultado.equipe?.length) {
        return {
          ...campo,
          itens_tabela: resultado.equipe.map((m, i) => ({
            id: `eq-import-${Date.now()}-${i}`,
            nome: m.nome || "",
            responsabilidade: m.funcao || "",
            formacao: m.formacao || ""
          }))
        };
      }

      // Objetivos (texto, item 3)
      if ((p.includes("objetivo") || s.includes("objetivo")) && resultado.objetivos && !isAtividades(campo)) {
        return { ...campo, resposta: resultado.objetivos };
      }

      // Atividades (Item 4)
      if (isAtividades(campo) && resultado.atividades?.length) {
        return {
          ...campo,
          itens_tabela: resultado.atividades.map((a, i) => ({
            id: `atv-import-${Date.now()}-${i}`,
            titulo: a
          }))
        };
      }

      // Entregas (Item 5)
      if (isEntregas(campo) && resultado.entregas?.length) {
        return {
          ...campo,
          itens_tabela: resultado.entregas.map((e, i) => ({
            id: `ent-import-${Date.now()}-${i}`,
            objetivo_num: i + 1,
            objetivo_titulo: e,
            entregas_sub: [],
            percentagem: "0"
          }))
        };
      }

      // Cronograma
      if (isCronograma(campo) && resultado.cronograma?.length) {
        return {
          ...campo,
          itens_tabela: resultado.cronograma.map((c, i) => ({
            id: `crono-import-${Date.now()}-${i}`,
            descricao: c.atividade || "",
            meses: []
          }))
        };
      }

      return campo;
    });

    await onSalvarCampos(novosCampos);
    setAplicandoRelatorio(false);
    setAplicadoRelatorio(true);
  };

  const temDados = resultado && (resultado.objetivos || resultado.atividades?.length || resultado.equipe?.length || resultado.cronograma?.length || resultado.entregas?.length);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="border-purple-300 text-purple-700 hover:bg-purple-50">
        <BookOpen className="w-4 h-4 mr-2" /> Importar Projeto Aprovado
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-600" /> Importar do Projeto Aprovado</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Faça upload do PDF do projeto aprovado. A IA extrai atividades, cronograma, equipe e orçamento automaticamente.</p>
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
                {resultado.equipe?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-600 mb-1">EQUIPE ({resultado.equipe.length})</p>
                    {resultado.equipe.map((m, i) => <div key={i} className="text-xs text-gray-700"><span className="font-medium">{m.nome}</span> — {m.funcao}</div>)}
                  </div>
                )}
                {resultado.atividades?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-600 mb-1">ATIVIDADES (Item 4) — {resultado.atividades.length}</p>
                    {resultado.atividades.slice(0, 5).map((a, i) => <div key={i} className="text-xs">• {a}</div>)}
                    {resultado.atividades.length > 5 && <div className="text-xs text-gray-400">...e mais {resultado.atividades.length - 5}</div>}
                  </div>
                )}
                {resultado.entregas?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-600 mb-1">ENTREGAS (Item 5) — {resultado.entregas.length}</p>
                    {resultado.entregas.slice(0, 4).map((e, i) => <div key={i} className="text-xs">• {e}</div>)}
                    {resultado.entregas.length > 4 && <div className="text-xs text-gray-400">...e mais {resultado.entregas.length - 4}</div>}
                  </div>
                )}
                <div className="border-t pt-3 space-y-2">
                  {temDados && (
                    <Button size="sm" onClick={aplicarNoRelatorio} disabled={aplicandoRelatorio || aplicadoRelatorio || !campos?.length} className="w-full bg-purple-600 hover:bg-purple-700">
                      {aplicandoRelatorio ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aplicando...</> :
                       aplicadoRelatorio ? <><CheckCircle2 className="w-4 h-4 mr-2" />Aplicado no Relatório!</> :
                       <><Sparkles className="w-4 h-4 mr-2" />Aplicar no Relatório (equipe, atividades, entregas, cronograma)</>}
                    </Button>
                  )}
                  {!campos?.length && temDados && <p className="text-xs text-amber-600 text-center">⚠️ Faça upload do modelo de relatório primeiro.</p>}
                  {resultado.linhas_orcamento?.length > 0 && (
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-indigo-700 mb-2">LINHAS DE ORÇAMENTO ({resultado.linhas_orcamento.length})</p>
                      {resultado.linhas_orcamento.map((l, i) => <div key={i} className="flex justify-between text-xs text-gray-700"><span>{l.categoria} — {l.descricao}</span><span className="font-bold">{fmt(l.valor_aprovado)}</span></div>)}
                      <Button size="sm" onClick={aplicarNoOrcamento} className="mt-3 bg-indigo-600 hover:bg-indigo-700 w-full">Aplicar no Orçamento do Projeto</Button>
                    </div>
                  )}
                </div>
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
      prompt: `Analise este PDF modelo de relatório/prestação de contas. Identifique todos os campos/seções que precisam ser preenchidos.
Para cada campo, retorne: secao (título da seção com número), pergunta (o que precisa ser preenchido), tipo_resposta ("texto_longo", "texto_curto", "numero", "data", ou "tabela_itens" se for tabela).
Ordene pelos campos na ordem do documento.`,
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
      const grupos = Object.entries(CATEGORIAS_LABEL)
        .map(([key, label]) => ({ key, label, items: gastos.filter(g => g.categoria === key) }))
        .filter(g => g.items.length > 0);
      const resumo = grupos.map(g => {
        const itens = g.items.map(x => `  - ${x.descricao}${x.fornecedor ? ` (${x.fornecedor})` : ""}: ${fmt(x.valor)}`).join("\n");
        return `### ${g.label}\n${itens}`;
      }).join("\n\n");
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Redija a seção 8.1 de um relatório de prestação de contas de projeto de inovação financiado por órgão público. Tom formal, sem bullets, sem markdown. Projeto: ${projeto.descricao_projeto || projeto.titulo}\nItens:\n${resumo}`
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
  const camposAtividades = campos.filter(c => isAtividades(c));

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
        <ImportProjetoAprovado projeto={projeto} onSave={onSave} campos={campos} onSalvarCampos={salvar} />
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
          if (isEquipe(campo)) {
            return <TabelaEquipe key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} />;
          }
          if (isAtividades(campo)) {
            return <ListaAtividades key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} />;
          }
          if (isJustificativaMudancaObjetivos(campo)) {
            return <CampoJustificativaMudanca key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} />;
          }
          if (isEntregas(campo)) {
            return <TabelaEntregas key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} camposAtividades={camposAtividades} />;
          }
          if (isDescricaoEntregas(campo)) {
            return <CampoTextoComImagem key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} instrucaoIA="Melhore o texto a seguir para descrever de forma técnica, clara e objetiva as entregas realizadas no projeto:" />;
          }
          if (isResultadosAlcancados(campo)) {
            return <CampoTextoComImagem key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} instrucaoIA="Melhore o texto a seguir para descrever de forma técnica e objetiva os resultados e impactos alcançados pelo projeto:" />;
          }
          return <CampoRelatorio key={campo.id} campo={campo} onChange={(novo) => updateCampo(idx, novo)} />;
        })}
      </div>
    </div>
  );
}