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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Upload, Loader2, FileText, ChevronDown, ChevronRight,
  CheckCircle2, Unlock, Sparkles, RefreshCw, BookOpen, Plus, Trash2, Image as ImageIcon, Calendar
} from "lucide-react";
import ExportarRelatorio from "./ExportarRelatorio";

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
  return isSecao8(campo) || (campo.tipo_resposta === "tabela_itens" && (s.includes("financ") || p.includes("financ")));
}
function isItem1(campo) {
  const s = (campo.secao || "").toLowerCase();
  // Só o item 1 principal (não sub-itens como 1.1, 1.2...)
  if (/^1\.[1-9]/.test(campo.secao || "")) return false;
  return !!s.match(/^1(\s|$|-|\.|\s*[-–])/) && (s.includes("identifica") || s.includes("dado") || s.includes("projeto") || s.includes("geral"));
}
function isSubItem1(campo) {
  // Sub-itens do item 1 (1.1, 1.2 etc.) que devem ser suprimidos — tratados pelo quadro único
  const s = campo.secao || "";
  return /^1\.[1-9]/.test(s);
}
function isEquipe(campo) {
  const s = (campo.secao || "").toLowerCase();
  const p = (campo.pergunta || "").toLowerCase();
  return (p.includes("equipe") || s.includes("equipe") || p.includes("bolsista") || s.includes("bolsist")) &&
    !s.startsWith("1");
}
function isAtividades(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  const numMatch = s.match(/^(\d+)/);
  const num = numMatch ? numMatch[1] : "";
  if (num === "4" && !s.includes("4.1") && !p.includes("mudança") && !p.includes("alteração")) return true;
  return (p.includes("atividade") || s.includes("atividade")) &&
    !p.includes("mudança") && !p.includes("alteração") && !p.includes("cronograma");
}
function isJustificativaMudancaEquipe(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return s.includes("2.1") || p.includes("2.1") ||
    ((p.includes("mudança") || p.includes("alteração") || p.includes("justif")) &&
     (p.includes("equipe") || s.includes("2.")));
}
function isJustificativaMudanca(campo) {
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
  // Só o quadro com "entregas pactuadas", não o que é apenas a linha de percentagem total
  if (num === "5" && !s.includes("5.1") && !s.includes("5.2")) {
    // Se a pergunta é APENAS sobre percentagem total, não é o quadro principal de entregas
    if (p.includes("percentagem total") && !p.includes("entrega")) return false;
    return true;
  }
  return (p.includes("entrega") || s.includes("entrega")) && !s.includes("5.1") && !s.includes("5.2") &&
    !(p.includes("percentagem total") && !p.includes("entrega"));
}
function isPercentagemTotal(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  const numMatch = s.match(/^(\d+)/);
  const num = numMatch ? numMatch[1] : "";
  return num === "5" && p.includes("percentagem total") && !p.includes("entrega");
}
function isDescricaoEntregas(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return s.includes("5.1") || p.includes("5.1") || s.includes("5.2") || p.includes("5.2") ||
    ((p.includes("descri") || p.includes("detalhamento")) && (p.includes("entrega") || s.includes("5")));
}
function isResultadosAlcancados(campo) {
  const s = (campo.secao || "").toLowerCase();
  const p = (campo.pergunta || "").toLowerCase();
  const numMatch = s.match(/^(\d+)/);
  if (numMatch && numMatch[1] === "6") return true;
  return p.includes("resultado") && (p.includes("alcançado") || p.includes("impacto"));
}
function isCronogramaItem7(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  // Só o item 7 principal (não 7.1)
  if (s.includes("7.1") || p.includes("7.1")) return false;
  // Detecta qualquer campo da seção 7 que trate de cronograma físico
  if (s.match(/^7(\s|$|-|\.|\s*[-–])/)) return true;
  return p.includes("cronograma") && (p.includes("físico") || p.includes("mês") || p.includes("execução por mês") || p.includes("atividade"));
}
function isJustificativaCronograma(campo) {
  const s = (campo.secao || "").toLowerCase();
  const p = (campo.pergunta || "").toLowerCase();
  return s.includes("7.1") || p.includes("7.1") ||
    (s.match(/^7(\s|$|-|\.|\s*[-–])/) && (p.includes("justif") || p.includes("alteração") || p.includes("mudança")));
}
function isObjetivos(campo) {
  const p = (campo.pergunta || "").toLowerCase();
  const s = (campo.secao || "").toLowerCase();
  return (p.includes("objetivo") || s.includes("objetivo")) && !isAtividades(campo);
}

// ─── Botão melhorar IA ────────────────────────────────────────────────────────
function BotaoMelhorarIA({ texto, onMelhorado, instrucao }) {
  const [loading, setLoading] = useState(false);
  const melhorar = async () => {
    if (!texto?.trim()) return;
    setLoading(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `${instrucao || "Melhore o texto a seguir para deixá-lo mais técnico, claro, formal, direto e objetivo, sem alterar o sentido:"}\n\n"${texto}"\n\nRetorne apenas o texto melhorado, sem comentários.`
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

// ─── Item 1 — Dados Gerais do Projeto (quadro único) ─────────────────────────
function Item1Identificacao({ campo, onChange }) {
  const [aberto, setAberto] = useState(true);
  const dados = campo.dados_item1 || {};
  const set = (key, val) => onChange({ ...campo, dados_item1: { ...dados, [key]: val } });

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta || "Dados Gerais do Projeto"}</p>
        </div>
        {aberto ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Projeto / Edital</label>
              <Input value={dados.edital || ""} onChange={e => set("edital", e.target.value)} className="mt-0.5 text-sm" placeholder="Ex: FAPES 003/2024" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Nº Termo de Outorga</label>
              <Input value={dados.termo_outorga || ""} onChange={e => set("termo_outorga", e.target.value)} className="mt-0.5 text-sm" placeholder="Inserir manualmente" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Título do Projeto</label>
            <Input value={dados.titulo_projeto || ""} onChange={e => set("titulo_projeto", e.target.value)} className="mt-0.5 text-sm" placeholder="Título conforme aprovado" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Coordenador</label>
            <Input value={dados.coordenador || ""} onChange={e => set("coordenador", e.target.value)} className="mt-0.5 text-sm" placeholder="Nome do coordenador" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Razão Social (Instituição Executora)</label>
              <Input value={dados.razao_social || ""} onChange={e => set("razao_social", e.target.value)} className="mt-0.5 text-sm" placeholder="Razão social" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Nome Fantasia</label>
              <Input value={dados.nome_fantasia || ""} onChange={e => set("nome_fantasia", e.target.value)} className="mt-0.5 text-sm" placeholder="Inserir manualmente" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">CNPJ</label>
              <div className="flex gap-2 mt-0.5">
                <Input value={dados.cnpj || ""} onChange={e => set("cnpj", e.target.value)} className="text-sm flex-1" placeholder="XX.XXX.XXX/XXXX-XX" />
                {dados.razao_social && (
                  <BuscarCNPJ razaoSocial={dados.razao_social} onEncontrado={v => set("cnpj", v)} />
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Modelo de Análise</label>
              <Select value={dados.modelo_analise || ""} onValueChange={val => set("modelo_analise", val)}>
                <SelectTrigger className="mt-0.5 h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BuscarCNPJ({ razaoSocial, onEncontrado }) {
  const [loading, setLoading] = useState(false);
  const buscar = async () => {
    setLoading(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Busque o CNPJ da empresa com razão social: "${razaoSocial}". Retorne apenas o número do CNPJ no formato XX.XXX.XXX/XXXX-XX. Se não encontrar, retorne "não encontrado".`,
      add_context_from_internet: true,
      response_json_schema: { type: "object", properties: { cnpj: { type: "string" } } }
    });
    setLoading(false);
    if (r?.cnpj && !r.cnpj.toLowerCase().includes("não")) onEncontrado(r.cnpj);
    else alert("CNPJ não encontrado automaticamente. Insira manualmente.");
  };
  return (
    <Button type="button" size="sm" onClick={buscar} disabled={loading} variant="outline" className="text-xs flex-shrink-0">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
    </Button>
  );
}

// ─── Campo simples ────────────────────────────────────────────────────────────
function CampoRelatorio({ campo, onChange }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${campo.concluido ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => !campo.concluido && setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          {campo.concluido && campo.resposta && <p className="text-xs text-gray-500 mt-1 truncate">{campo.resposta}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campo.concluido ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" />Concluído</Badge> : <Badge className="bg-gray-100 text-gray-500 text-xs">Pendente</Badge>}
          {!campo.concluido && (aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
          {campo.concluido && <button type="button" onClick={e => { e.stopPropagation(); onChange({ ...campo, concluido: false }); }} className="text-gray-400 hover:text-amber-500"><Unlock className="w-4 h-4" /></button>}
        </div>
      </div>
      {aberto && !campo.concluido && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {campo.tipo_resposta === "numero" ? <Input type="number" value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} />
            : campo.tipo_resposta === "data" ? <Input type="date" value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} />
            : campo.tipo_resposta === "texto_curto" ? <Input value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder="Resposta curta..." />
            : <Textarea value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder="Descreva detalhadamente..." className="min-h-[100px]" />}
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

// ─── Item 2 — Equipe ──────────────────────────────────────────────────────────
function TabelaEquipe({ campo, onChange }) {
  const [aberto, setAberto] = useState(true);
  const linhas = campo.itens_tabela || [];
  const add = () => onChange({ ...campo, itens_tabela: [...linhas, { id: `eq-${Date.now()}`, nome: "", responsabilidade: "", formacao: "" }] });
  const upd = (i, k, v) => onChange({ ...campo, itens_tabela: linhas.map((l, idx) => idx === i ? { ...l, [k]: v } : l) });
  const rem = (i) => onChange({ ...campo, itens_tabela: linhas.filter((_, idx) => idx !== i) });
  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          <p className="text-xs text-gray-400 mt-0.5">Nome Completo · Responsabilidade · Formação e Experiência</p>
        </div>
        <Badge className="bg-gray-100 text-gray-600 text-xs">{linhas.length} membro(s)</Badge>
        {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {linhas.map((l, i) => (
            <div key={l.id || i} className="border border-gray-200 rounded-lg p-3 space-y-2 relative">
              <button onClick={() => rem(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Nome Completo</label><Input value={l.nome || ""} onChange={e => upd(i, "nome", e.target.value)} className="mt-0.5 text-sm" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Responsabilidade na Execução</label><Input value={l.responsabilidade || ""} onChange={e => upd(i, "responsabilidade", e.target.value)} className="mt-0.5 text-sm" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Formação Acadêmica e Experiência</label><Textarea value={l.formacao || ""} onChange={e => upd(i, "formacao", e.target.value)} className="mt-0.5 text-sm min-h-[60px]" /></div>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Membro</Button>
        </div>
      )}
    </div>
  );
}

// ─── Item 4 — Lista de atividades ─────────────────────────────────────────────
function ListaAtividades({ campo, onChange }) {
  const [aberto, setAberto] = useState(true);
  const linhas = campo.itens_tabela || [];
  const add = () => onChange({ ...campo, itens_tabela: [...linhas, { id: `atv-${Date.now()}`, titulo: "" }] });
  const upd = (i, v) => onChange({ ...campo, itens_tabela: linhas.map((l, idx) => idx === i ? { ...l, titulo: v } : l) });
  const rem = (i) => onChange({ ...campo, itens_tabela: linhas.filter((_, idx) => idx !== i) });
  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
        </div>
        <Badge className="bg-gray-100 text-gray-600 text-xs">{linhas.length} atividade(s)</Badge>
        {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
          {linhas.map((l, i) => (
            <div key={l.id || i} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono w-6 flex-shrink-0">{i + 1}.</span>
              <Input value={l.titulo || ""} onChange={e => upd(i, e.target.value)} className="text-sm flex-1" placeholder="Título da atividade" />
              <button onClick={() => rem(i)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={add} className="mt-1"><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Atividade</Button>
        </div>
      )}
    </div>
  );
}

// ─── Campo justificativa com IA ───────────────────────────────────────────────
function CampoJustificativa({ campo, onChange, placeholder, instrucaoIA }) {
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
          {campo.concluido ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" />Concluído</Badge> : <Badge className="bg-gray-100 text-gray-500 text-xs">Pendente</Badge>}
          {campo.concluido && <button type="button" onClick={e => { e.stopPropagation(); onChange({ ...campo, concluido: false }); }} className="text-gray-400 hover:text-amber-500"><Unlock className="w-4 h-4" /></button>}
          {!campo.concluido && (aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
        </div>
      </div>
      {aberto && !campo.concluido && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <Textarea value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder={placeholder || "Descreva..."} className="min-h-[120px] text-sm" />
          <div className="flex items-center justify-between">
            <BotaoMelhorarIA texto={campo.resposta} onMelhorado={txt => onChange({ ...campo, resposta: txt })} instrucao={instrucaoIA} />
            <Button type="button" size="sm" onClick={() => { onChange({ ...campo, concluido: true }); setAberto(false); }} className="bg-green-600 hover:bg-green-700" disabled={!campo.resposta}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Item 5 — Plano de Entregas ───────────────────────────────────────────────
// Estrutura: OE (número) | Entrega 1 - % | Entrega 2 - % | ... (sublinhas ao lado)
function TabelaEntregas({ campo, onChange, camposAtividades }) {
  const [aberto, setAberto] = useState(true);
  const objetivos = campo.itens_tabela || [];
  const atividadesRef = camposAtividades?.flatMap(c => c.itens_tabela || []) || [];

  const sincronizar = () => {
    const novos = atividadesRef.map((atv, i) => {
      const exist = objetivos.find(o => o.objetivo_ref === atv.id || o.objetivo_num === i + 1);
      return exist || { id: `ent-${Date.now()}-${i}`, objetivo_num: i + 1, objetivo_ref: atv.id, objetivo_titulo: atv.titulo || `OE ${i + 1}`, entregas: [{ id: `e-${Date.now()}-${i}-0`, descricao: "", percentagem: "0" }] };
    });
    onChange({ ...campo, itens_tabela: novos });
  };

  const updObj = (oi, key, val) => onChange({ ...campo, itens_tabela: objetivos.map((o, idx) => idx === oi ? { ...o, [key]: val } : o) });
  const addEntrega = (oi) => { const obj = objetivos[oi]; updObj(oi, "entregas", [...(obj.entregas || []), { id: `e-${Date.now()}`, descricao: "", percentagem: "0" }]); };
  const updEntrega = (oi, ei, key, val) => { const obj = objetivos[oi]; updObj(oi, "entregas", (obj.entregas || []).map((e, idx) => idx === ei ? { ...e, [key]: val } : e)); };
  const remEntrega = (oi, ei) => { const obj = objetivos[oi]; updObj(oi, "entregas", (obj.entregas || []).filter((_, idx) => idx !== ei)); };
  const addObjetivo = () => onChange({ ...campo, itens_tabela: [...objetivos, { id: `ent-${Date.now()}`, objetivo_num: objetivos.length + 1, objetivo_titulo: "", entregas: [{ id: `e-${Date.now()}`, descricao: "", percentagem: "0" }] }] });
  const remObjetivo = (oi) => onChange({ ...campo, itens_tabela: objetivos.filter((_, idx) => idx !== oi) });

  const todasEntregas = objetivos.flatMap(o => o.entregas || []);
  const media = todasEntregas.length > 0 ? (todasEntregas.reduce((s, e) => s + Number(e.percentagem || 0), 0) / todasEntregas.length).toFixed(1) : "0";

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
        </div>
        <Badge className="bg-blue-100 text-blue-700 text-xs font-bold">{media}% execução</Badge>
        {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </div>
      {aberto && (
        <div className="border-t border-gray-100 pt-3 pb-4 px-4 space-y-3">
          {atividadesRef.length > 0 && objetivos.length === 0 && (
            <Button type="button" size="sm" variant="outline" onClick={sincronizar} className="text-indigo-700 border-indigo-300">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Importar objetivos do Item 4
            </Button>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-xs text-gray-700 uppercase font-bold">
                  <th className="p-2 border border-gray-300 text-center w-10">Nº OE</th>
                  <th className="p-2 border border-gray-300 text-left">Entrega Pactuada para Atingir os Objetivos Específicos do Projeto (Quadro 4)</th>
                  <th className="p-2 border border-gray-300 text-center w-44">% de Execução</th>
                  <th className="p-2 border border-gray-300 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {objetivos.map((obj, oi) => (
                  <React.Fragment key={obj.id || oi}>
                    {(obj.entregas || []).map((ent, ei) => (
                      <tr key={ent.id || ei} className="hover:bg-gray-50">
                        {ei === 0 && (
                          <td rowSpan={(obj.entregas || []).length} className="border border-gray-300 text-center font-bold text-gray-700 align-middle">
                            <div className="flex flex-col items-center gap-1 p-1">
                              <span>{obj.objetivo_num || oi + 1}</span>
                              <button type="button" onClick={() => remObjetivo(oi)} className="text-red-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </td>
                        )}
                        <td className="p-1 border border-gray-200">
                          <Input value={ent.descricao || ""} onChange={e => updEntrega(oi, ei, "descricao", e.target.value)} className="border-0 text-sm h-8 bg-transparent" placeholder={`Entrega ${ei + 1}`} />
                        </td>
                        <td className="p-1 border border-gray-200">
                          <Select value={ent.percentagem || "0"} onValueChange={val => updEntrega(oi, ei, "percentagem", val)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{PERCENTAGENS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="p-1 border border-gray-200 text-center">
                          {ei === (obj.entregas || []).length - 1
                            ? <button type="button" onClick={() => addEntrega(oi)} className="text-indigo-400 hover:text-indigo-600"><Plus className="w-3.5 h-3.5" /></button>
                            : <button type="button" onClick={() => remEntrega(oi, ei)} className="text-red-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {objetivos.length > 0 && (
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan={2} className="p-2 border border-gray-300 text-right text-xs text-blue-800 uppercase">Percentagem Total de Execução do Projeto (Média Aritmética das Percentagens de Execução)</td>
                    <td className="p-2 border border-gray-300 text-center font-bold text-blue-800">{media}%</td>
                    <td className="border border-gray-200"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addObjetivo}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Objetivo
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Item 5.1 / 6 — Texto + imagens + IA ─────────────────────────────────────
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

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${campo.concluido ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => !campo.concluido && setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          {!aberto && campo.resposta && <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">{campo.resposta}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {imagens.length > 0 && <Badge className="bg-blue-100 text-blue-700 text-xs">{imagens.length} img</Badge>}
          {campo.concluido ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" />Concluído</Badge> : <Badge className="bg-gray-100 text-gray-500 text-xs">Pendente</Badge>}
          {campo.concluido && <button type="button" onClick={e => { e.stopPropagation(); onChange({ ...campo, concluido: false }); }} className="text-gray-400 hover:text-amber-500"><Unlock className="w-4 h-4" /></button>}
          {!campo.concluido && (aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
        </div>
      </div>
      {aberto && !campo.concluido && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <Textarea value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} placeholder="Descreva detalhadamente..." className="min-h-[120px] text-sm" />
          <div className="flex items-center gap-2 flex-wrap">
            <BotaoMelhorarIA texto={campo.resposta} onMelhorado={txt => onChange({ ...campo, resposta: txt })} instrucao={instrucaoIA} />
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
              {uploadingImg ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
              {uploadingImg ? "Enviando..." : "Adicionar Imagem"}
              <input type="file" className="hidden" accept="image/*" onChange={uploadImagem} disabled={uploadingImg} />
            </label>
          </div>
          {imagens.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {imagens.map((img, i) => (
                <div key={i} className="relative border rounded-lg overflow-hidden">
                  <img src={img.url} alt="" className="w-full h-32 object-cover" />
                  <button onClick={() => onChange({ ...campo, imagens: imagens.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                  <Input value={img.legenda || ""} onChange={e => onChange({ ...campo, imagens: imagens.map((im, idx) => idx === i ? { ...im, legenda: e.target.value } : im) })} className="border-0 border-t rounded-none text-xs" placeholder="Legenda..." />
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

// ─── Seletor de meses (popover flutuante) ────────────────────────────────────
function SeletorMeses({ mesesSelecionados, todosMeses, onChange }) {
  const [open, setOpen] = useState(false);
  const selecionados = mesesSelecionados || [];
  const toggle = (m) => {
    const novos = selecionados.includes(m) ? selecionados.filter(x => x !== m) : [...selecionados, m];
    onChange(novos);
  };
  const label = selecionados.length === 0 ? "Selecionar meses" : selecionados.join(", ");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-all ${selecionados.length > 0 ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-medium" : "border-gray-300 text-gray-500 hover:border-indigo-300"}`}>
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[140px]">{label}</span>
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Meses de execução</p>
        <div className="grid grid-cols-4 gap-1.5">
          {todosMeses.map(m => (
            <button key={m} type="button" onClick={() => toggle(m)}
              className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${selecionados.includes(m) ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"}`}>
              {m}
            </button>
          ))}
        </div>
        {selecionados.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="mt-2 w-full text-xs text-red-400 hover:text-red-600 text-center">
            Limpar seleção
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Item 7 — Cronograma Físico: seleção de meses por ano ────────────────────
function CronogramaItem7({ campo, onChange, camposEntregas }) {
  const [aberto, setAberto] = useState(true);
  const duracao = campo.duracao_anos || 1;
  const cronograma = campo.cronograma_oes || [];

  // Gera lista de meses como "Ano 1 - M1" etc.
  const todosMeses = [];
  for (let ano = 1; ano <= duracao; ano++) {
    for (let mes = 1; mes <= 12; mes++) {
      todosMeses.push(`Ano ${ano} - M${mes}`);
    }
  }

  // Sincroniza com os OEs+entregas do Item 5
  const sincronizarDoItem5 = () => {
    const item5 = camposEntregas?.[0];
    const objetivosItem5 = item5?.itens_tabela || [];
    if (!objetivosItem5.length) return;
    const novos = objetivosItem5.map((obj, oi) => {
      const existOE = cronograma.find(o => o.objetivo_ref === obj.id || o.objetivo_num === (obj.objetivo_num || oi + 1));
      const entregasObj = obj.entregas || [];
      const acoes = entregasObj.map((ent, ei) => {
        const existAcao = existOE?.acoes?.find(a => a.entrega_ref === ent.id || a.descricao === ent.descricao);
        return existAcao || { id: `c7a-${Date.now()}-${oi}-${ei}`, entrega_ref: ent.id, descricao: ent.descricao || "", meses: [] };
      });
      return existOE ? { ...existOE, acoes } : {
        id: `c7oe-${Date.now()}-${oi}`,
        objetivo_num: obj.objetivo_num || oi + 1,
        objetivo_ref: obj.id,
        objetivo_titulo: obj.objetivo_titulo || `OE ${oi + 1}`,
        acoes
      };
    });
    onChange({ ...campo, cronograma_oes: novos });
  };

  const updAcaoMeses = (oi, ai, novos) => {
    const novo = cronograma.map((o, idx) => idx === oi ? {
      ...o, acoes: (o.acoes || []).map((a, aidx) => aidx === ai ? { ...a, meses: novos } : a)
    } : o);
    onChange({ ...campo, cronograma_oes: novo });
  };

  const item5Tem = (camposEntregas?.[0]?.itens_tabela || []).length > 0;

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(n => (
              <button key={n} type="button" onClick={e => { e.stopPropagation(); onChange({ ...campo, duracao_anos: n }); }}
                className={`px-2 py-0.5 rounded text-xs border ${duracao === n ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}>
                {n}A
              </button>
            ))}
          </div>
          {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {aberto && (
        <div className="border-t border-gray-100 pt-3 pb-4 px-4 space-y-3">
          {item5Tem && (
            <Button type="button" size="sm" variant="outline" onClick={sincronizarDoItem5} className="text-indigo-700 border-indigo-300">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sincronizar com Item 5
            </Button>
          )}
          {!item5Tem && cronograma.length === 0 && (
            <p className="text-xs text-gray-400 italic">Preencha o Item 5 (Plano de Entregas) primeiro e clique em "Sincronizar com Item 5".</p>
          )}
          {cronograma.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-xs text-gray-700 uppercase font-bold">
                    <th className="p-2 border border-gray-300 text-center w-10">Nº OE</th>
                    <th className="p-2 border border-gray-300 text-left">Entrega Pactuada (Quadro 5)</th>
                    <th className="p-2 border border-gray-300 text-center w-52">Meses de Execução</th>
                  </tr>
                </thead>
                <tbody>
                  {cronograma.map((obj, oi) => (
                    <React.Fragment key={obj.id || oi}>
                      {(obj.acoes || []).map((acao, ai) => (
                        <tr key={acao.id || ai} className="hover:bg-gray-50">
                          {ai === 0 && (
                            <td rowSpan={(obj.acoes || []).length} className="border border-gray-300 text-center font-bold text-gray-700 align-middle p-2">
                              {obj.objetivo_num || oi + 1}
                            </td>
                          )}
                          <td className="p-2 border border-gray-200 text-sm text-gray-700">
                            {acao.descricao || <span className="text-gray-400 italic">Entrega {ai + 1}</span>}
                          </td>
                          <td className="p-2 border border-gray-200">
                            <SeletorMeses mesesSelecionados={acao.meses || []} todosMeses={todosMeses} onChange={novos => updAcaoMeses(oi, ai, novos)} />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            <p className="text-xs text-gray-400 mt-1 italic">Nenhum item nesta categoria.</p>
          </div>
          <Badge className="bg-indigo-100 text-indigo-700 text-xs"><RefreshCw className="w-3 h-3 inline mr-1" />Auto</Badge>
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
        </div>
        <Badge className="bg-indigo-100 text-indigo-700 text-xs"><RefreshCw className="w-3 h-3 inline mr-1" />Auto ({itensFiltrados.length})</Badge>
        {aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-gray-50 text-xs text-gray-600 uppercase">
              <th className="text-left p-2 border border-gray-200">Nome / Tipo</th>
              <th className="text-left p-2 border border-gray-200">Descrição</th>
              <th className="text-center p-2 border border-gray-200">Qtd</th>
              <th className="text-right p-2 border border-gray-200">Total</th>
            </tr></thead>
            <tbody>
              {itensFiltrados.map((g, i) => (
                <tr key={g.id || i} className="hover:bg-gray-50">
                  <td className="p-2 border border-gray-200 font-medium">{g.fornecedor || g.descricao}</td>
                  <td className="p-2 border border-gray-200 text-gray-600">{g.fornecedor ? g.descricao : "—"}</td>
                  <td className="p-2 border border-gray-200 text-center">{g.quantidade || 1}</td>
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
      )}
    </div>
  );
}

// ─── Campo 8.1 — Justificativa financeira ────────────────────────────────────
function CampoDescricaoFinanceira({ gastos, campo, onChange, projetoDescricao }) {
  const [gerando, setGerando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const gerarTexto = useCallback(async () => {
    if (gastos.length === 0) return;
    setGerando(true);
    const grupos = Object.entries(CATEGORIAS_LABEL).map(([key, label]) => ({ key, label, items: gastos.filter(g => g.categoria === key) })).filter(g => g.items.length > 0);
    const resumo = grupos.map(g => `### ${g.label}\n${g.items.map(x => `  - ${x.descricao}${x.fornecedor ? ` (${x.fornecedor})` : ""}: ${fmt(x.valor)}`).join("\n")}`).join("\n\n");
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Redija a seção 8.1 de relatório de prestação de contas. Tom formal, sem bullets, sem markdown. Projeto: ${projetoDescricao}\nItens:\n${resumo}`
    });
    onChange({ ...campo, resposta: typeof r === "string" ? r : JSON.stringify(r) });
    setGerando(false);
    setAberto(true);
  }, [gastos, campo, onChange, projetoDescricao]);
  const preview = campo.resposta ? campo.resposta.slice(0, 100) + "..." : null;
  return (
    <div className={`border rounded-xl overflow-hidden ${campo.concluido ? "border-green-200 bg-green-50/30" : "border-amber-200 bg-amber-50/20"}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-50/30" onClick={() => !campo.concluido && setAberto(v => !v)}>
        <div className="flex-1 min-w-0">
          {campo.secao && <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">{campo.secao}</p>}
          <p className="text-sm font-semibold text-gray-800">{campo.pergunta}</p>
          {!aberto && preview && <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">{preview}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campo.concluido ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" />Concluído</Badge> : <Badge className="bg-amber-100 text-amber-700 text-xs"><RefreshCw className="w-3 h-3 inline mr-1" />Auto</Badge>}
          {!campo.concluido && (aberto ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
          {campo.concluido && <button type="button" onClick={e => { e.stopPropagation(); onChange({ ...campo, concluido: false }); }} className="text-gray-400 hover:text-amber-500"><Unlock className="w-4 h-4" /></button>}
        </div>
      </div>
      {aberto && !campo.concluido && (
        <div className="px-4 pb-4 border-t border-amber-100 pt-3 space-y-3">
          <div className="flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={gerarTexto} disabled={gerando || gastos.length === 0} className="text-amber-700 border-amber-300">
              {gerando ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}{gerando ? "Gerando..." : "Gerar com IA"}
            </Button>
          </div>
          <Textarea value={campo.resposta || ""} onChange={e => onChange({ ...campo, resposta: e.target.value })} className="min-h-[200px] text-sm" />
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

// ─── Importar do Projeto Aprovado ─────────────────────────────────────────────
function ImportProjetoAprovado({ projeto, onSave, campos, onSalvarCampos }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(projeto.template_relatorio_url || "");
  const [uploading, setUploading] = useState(false);
  const [extraindo, setExtraindo] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [aplicando, setAplicando] = useState(false);
  const [aplicado, setAplicado] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUrl(file_url);
    await onSave({ template_relatorio_url: file_url });
    setUploading(false);
  };

  const extrair = async () => {
    const fileUrl = url || projeto.template_relatorio_url;
    if (!fileUrl) return;
    setExtraindo(true);
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise este documento de projeto aprovado (Anexo). Extraia:
1) Da área/seção 1 (identificação): edital (campo "Edital"), titulo_projeto (campo "Título"), coordenador (campo "Coordenador"), razao_social (campo "Instituição executora" ou similar), numero_termo_outorga (campo "Termo de Outorga" ou similar)
2) objetivos_especificos: texto descritivo dos objetivos específicos (item 2.5 ou similar)
3) atividades: lista completa de títulos das atividades do item 5.2 (na ordem)
4) equipe: lista com nome completo, função/responsabilidade, formação/experiência de cada membro
5) entregas: lista de entregas (cada entrega como texto simples) agrupadas por objetivo específico (OE). Retornar como array de objetos {objetivo_num, objetivo_titulo, entregas: [string]}
6) linhas_orcamento: categoria, descrição, valor
7) cronograma: array de {atividade, inicio, fim}`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          edital: { type: "string" },
          titulo_projeto: { type: "string" },
          coordenador: { type: "string" },
          razao_social: { type: "string" },
          numero_termo_outorga: { type: "string" },
          objetivos_especificos: { type: "string" },
          atividades: { type: "array", items: { type: "string" } },
          equipe: { type: "array", items: { type: "object", properties: { nome: { type: "string" }, funcao: { type: "string" }, formacao: { type: "string" } } } },
          entregas_por_objetivo: { type: "array", items: { type: "object", properties: { objetivo_num: { type: "number" }, objetivo_titulo: { type: "string" }, entregas: { type: "array", items: { type: "string" } } } } },
          linhas_orcamento: { type: "array", items: { type: "object", properties: { categoria: { type: "string" }, descricao: { type: "string" }, valor_aprovado: { type: "number" } } } },
          cronograma: { type: "array", items: { type: "object", properties: { atividade: { type: "string" }, inicio: { type: "string" }, fim: { type: "string" } } } },
        }
      }
    });
    setResultado(r);
    setAplicado(false);
    setExtraindo(false);
  };

  const aplicarNoOrcamento = async () => {
    if (!resultado?.linhas_orcamento?.length) return;
    const catMap = { "material permanente": "material_permanente", "material de consumo": "material_consumo", "terceiros": "terceiros", "diárias": "diarias", "diarias": "diarias", "passagens": "passagens", "contrapartida": "contrapartida", "doaci": "doaci" };
    const novas = resultado.linhas_orcamento.map((l, i) => ({ id: `imp-${Date.now()}-${i}`, categoria: catMap[l.categoria?.toLowerCase()] || "terceiros", subcategoria: l.descricao || "", descricao: l.descricao || "", valor_aprovado: Number(l.valor_aprovado) || 0 }));
    await onSave({ orcamento_linhas: [...(projeto.orcamento_linhas || []), ...novas] });
  };

  const aplicarNoRelatorio = async () => {
    if (!resultado || !campos?.length) return;
    setAplicando(true);
    const novosCampos = campos.map(campo => {
      if (campo.concluido) return campo;

      // Item 1 — Identificação
      if (isItem1(campo)) {
        return {
          ...campo,
          dados_item1: {
            ...(campo.dados_item1 || {}),
            edital: resultado.edital || "",
            titulo_projeto: resultado.titulo_projeto || "",
            coordenador: resultado.coordenador || "",
            razao_social: resultado.razao_social || "",
            termo_outorga: resultado.numero_termo_outorga || "",
          }
        };
      }
      // Equipe (Item 2)
      if (isEquipe(campo) && resultado.equipe?.length) {
        return { ...campo, itens_tabela: resultado.equipe.map((m, i) => ({ id: `eq-${Date.now()}-${i}`, nome: m.nome || "", responsabilidade: m.funcao || "", formacao: m.formacao || "" })) };
      }
      // Objetivos específicos (Item 3 — texto)
      if (isObjetivos(campo) && resultado.objetivos_especificos) {
        return { ...campo, resposta: resultado.objetivos_especificos };
      }
      // Atividades (Item 4)
      if (isAtividades(campo) && resultado.atividades?.length) {
        return { ...campo, itens_tabela: resultado.atividades.map((a, i) => ({ id: `atv-${Date.now()}-${i}`, titulo: a })) };
      }
      // Entregas (Item 5)
      if (isEntregas(campo) && resultado.entregas_por_objetivo?.length) {
        return {
          ...campo,
          itens_tabela: resultado.entregas_por_objetivo.map((obj, oi) => ({
            id: `ent-${Date.now()}-${oi}`,
            objetivo_num: obj.objetivo_num || oi + 1,
            objetivo_titulo: obj.objetivo_titulo || "",
            entregas: (obj.entregas || []).map((e, ei) => ({ id: `e-${Date.now()}-${oi}-${ei}`, descricao: e, percentagem: "0" }))
          }))
        };
      }

      return campo;
    });
    await onSalvarCampos(novosCampos);
    setAplicando(false);
    setAplicado(true);
  };

  const temDados = resultado && (resultado.titulo_projeto || resultado.atividades?.length || resultado.equipe?.length || resultado.entregas_por_objetivo?.length);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="border-purple-300 text-purple-700 hover:bg-purple-50">
        <BookOpen className="w-4 h-4 mr-2" /> Importar Projeto Aprovado
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-600" /> Importar do Projeto Aprovado</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Faça upload do PDF do projeto aprovado. A IA extrai identificação, equipe, atividades, entregas e orçamento automaticamente.</p>
          <div className="space-y-4">
            <label className="cursor-pointer">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : "Upload do PDF do Projeto Aprovado"}
              </div>
              <input type="file" className="hidden" accept=".pdf" onChange={handleUpload} disabled={uploading} />
            </label>
            {(url || projeto.template_relatorio_url) && (
              <>
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded p-2">
                  <FileText className="w-4 h-4" />
                  <a href={url || projeto.template_relatorio_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Arquivo carregado</a>
                </div>
                <Button onClick={extrair} disabled={extraindo} className="bg-purple-600 hover:bg-purple-700">
                  {extraindo ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extraindo...</> : <><Sparkles className="w-4 h-4 mr-2" />Extrair Informações com IA</>}
                </Button>
              </>
            )}
            {resultado && (
              <div className="space-y-3">
                {(resultado.edital || resultado.titulo_projeto) && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-bold text-gray-600">IDENTIFICAÇÃO (ITEM 1)</p>
                    {resultado.edital && <p className="text-xs text-gray-700"><span className="font-medium">Edital:</span> {resultado.edital}</p>}
                    {resultado.titulo_projeto && <p className="text-xs text-gray-700"><span className="font-medium">Título:</span> {resultado.titulo_projeto}</p>}
                    {resultado.coordenador && <p className="text-xs text-gray-700"><span className="font-medium">Coordenador:</span> {resultado.coordenador}</p>}
                    {resultado.razao_social && <p className="text-xs text-gray-700"><span className="font-medium">Instituição:</span> {resultado.razao_social}</p>}
                  </div>
                )}
                {resultado.equipe?.length > 0 && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs font-bold text-gray-600 mb-1">EQUIPE ({resultado.equipe.length})</p>{resultado.equipe.map((m, i) => <div key={i} className="text-xs text-gray-700"><span className="font-medium">{m.nome}</span> — {m.funcao}</div>)}</div>}
                {resultado.atividades?.length > 0 && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs font-bold text-gray-600 mb-1">ATIVIDADES ({resultado.atividades.length})</p>{resultado.atividades.slice(0, 5).map((a, i) => <div key={i} className="text-xs">• {a}</div>)}{resultado.atividades.length > 5 && <div className="text-xs text-gray-400">...e mais {resultado.atividades.length - 5}</div>}</div>}
                {resultado.entregas_por_objetivo?.length > 0 && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs font-bold text-gray-600 mb-1">ENTREGAS POR OBJETIVO ({resultado.entregas_por_objetivo.length} OEs)</p>{resultado.entregas_por_objetivo.slice(0, 3).map((obj, i) => <div key={i} className="text-xs text-gray-700">OE {obj.objetivo_num}: {obj.entregas?.length || 0} entrega(s)</div>)}</div>}
                <div className="border-t pt-3 space-y-2">
                  {temDados && (
                    <Button size="sm" onClick={aplicarNoRelatorio} disabled={aplicando || aplicado || !campos?.length} className="w-full bg-purple-600 hover:bg-purple-700">
                      {aplicando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aplicando...</> : aplicado ? <><CheckCircle2 className="w-4 h-4 mr-2" />Aplicado!</> : <><Sparkles className="w-4 h-4 mr-2" />Aplicar no Relatório</>}
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

  useEffect(() => { setCampos(projeto.relatorio_campos || []); }, [projeto.id]);

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
      prompt: `Analise este PDF modelo de relatório. Identifique todos os campos/seções. Para cada campo: secao (título com número), pergunta, tipo_resposta ("texto_longo", "texto_curto", "numero", "data", "tabela_itens"). Ordene pela ordem do documento.`,
      file_urls: [file_url],
      response_json_schema: { type: "object", properties: { campos: { type: "array", items: { type: "object", properties: { secao: { type: "string" }, pergunta: { type: "string" }, tipo_resposta: { type: "string" } } } } } }
    });
    if (r.campos) salvar(r.campos.map((c, i) => ({ id: `campo-${Date.now()}-${i}`, secao: c.secao || "", pergunta: c.pergunta || `Campo ${i + 1}`, tipo_resposta: c.tipo_resposta || "texto_longo", resposta: "", concluido: false })));
    setExtraindo(false);
  };

  // Regera 8.1 ao adicionar gasto
  const prevGastosCount = useRef(gastos.length);
  useEffect(() => {
    const novoCount = gastos.length;
    if (novoCount <= prevGastosCount.current) { prevGastosCount.current = novoCount; return; }
    prevGastosCount.current = novoCount;
    if (!gastos.length || !campos.length) return;
    const idx81 = campos.findIndex(c => isItem81(c));
    if (idx81 === -1 || campos[idx81].concluido) return;
    (async () => {
      const grupos = Object.entries(CATEGORIAS_LABEL).map(([k, l]) => ({ label: l, items: gastos.filter(g => g.categoria === k) })).filter(g => g.items.length > 0);
      const resumo = grupos.map(g => `### ${g.label}\n${g.items.map(x => `  - ${x.descricao}: ${fmt(x.valor)}`).join("\n")}`).join("\n\n");
      const r = await base44.integrations.Core.InvokeLLM({ prompt: `Redija seção 8.1 do relatório de prestação de contas. Tom formal, sem markdown. Projeto: ${projeto.descricao_projeto || projeto.titulo}\nItens:\n${resumo}` });
      const novos = [...campos];
      novos[idx81] = { ...campos[idx81], resposta: typeof r === "string" ? r : JSON.stringify(r) };
      salvar(novos);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gastos.length]);

  const concluidos = campos.filter(c => c.concluido).length;
  const pct = campos.length > 0 ? (concluidos / campos.length) * 100 : 0;
  const orcamentoLinhas = projeto.orcamento_linhas || [];
  const camposAtividades = campos.filter(c => isAtividades(c));
  const camposEntregas = campos.filter(c => isEntregas(c));
  // Rastrear se já renderizamos o quadro único do item 1
  let item1Renderizado = false;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <label className="cursor-pointer">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
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
            <span className="text-sm font-semibold text-gray-700">Progresso</span>
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
          // Item 1 — quadro único, suprimir duplicatas e sub-itens
          if (isItem1(campo)) {
            if (item1Renderizado) return null;
            item1Renderizado = true;
            return <Item1Identificacao key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} />;
          }
          if (isSubItem1(campo)) return null; // suprimir sub-quadros repetidos do item 1
          if (isItem81(campo)) return <CampoDescricaoFinanceira key={campo.id} gastos={gastos} campo={campo} onChange={novo => updateCampo(idx, novo)} projetoDescricao={projeto.descricao_projeto || projeto.titulo} />;
          if (isExecucaoFinanceira(campo)) return <TabelaExecucaoFinanceira key={campo.id} gastos={gastos} orcamentoLinhas={orcamentoLinhas} campo={campo} />;
          // Sub-itens específicos ANTES dos itens pai para evitar captura errada
          if (isJustificativaMudancaEquipe(campo)) return <CampoJustificativa key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} placeholder="Justifique as mudanças na equipe do projeto..." instrucaoIA="Melhore o texto para justificar de forma técnica e objetiva as alterações na equipe do projeto:" />;
          if (isEquipe(campo)) return <TabelaEquipe key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} />;
          if (isJustificativaMudanca(campo)) return <CampoJustificativa key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} placeholder="Descreva as razões da mudança..." instrucaoIA="Melhore o texto para justificar de forma técnica e objetiva a razão da mudança de objetivos:" />;
          if (isAtividades(campo)) return <ListaAtividades key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} />;
          if (isPercentagemTotal(campo)) return null;
          // 7.1 e Item 7 ANTES de isEntregas/isDescricaoEntregas para não serem capturados como plano de entregas
          if (isJustificativaCronograma(campo)) return <CampoJustificativa key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} placeholder="Justifique alterações no cronograma..." instrucaoIA="Melhore o texto para justificar de forma técnica e objetiva as alterações no cronograma:" />;
          if (isCronogramaItem7(campo)) return <CronogramaItem7 key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} camposEntregas={camposEntregas} />;
          if (isDescricaoEntregas(campo)) return <CampoJustificativa key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} placeholder="Descreva detalhadamente as entregas realizadas neste período..." instrucaoIA="Melhore o texto para descrever de forma técnica e objetiva as entregas realizadas:" />;
          if (isEntregas(campo)) return <TabelaEntregas key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} camposAtividades={camposAtividades} />;
          if (isResultadosAlcancados(campo)) return <CampoTextoComImagem key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} instrucaoIA="Melhore o texto para descrever os resultados e impactos alcançados pelo projeto:" />;
          return <CampoRelatorio key={campo.id} campo={campo} onChange={novo => updateCampo(idx, novo)} />;
        })}
      </div>
    </div>
  );
}