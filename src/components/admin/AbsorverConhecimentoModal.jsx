import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Brain, ChevronDown, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SECOES = [
  { key: "ia_treinamento", label: "Base de Conhecimento IA (pares Q&A)" },
  { key: "etapas_perguntas", label: "Perguntas do formulário das etapas" },
  { key: "criterios_avaliacao", label: "Critérios de avaliação" },
  { key: "requisitos", label: "Requisitos" },
];

export default function AbsorverConhecimentoModal({ open, onClose, editalDestino, editaisDisponiveis, onSaved }) {
  const [editalOrigem, setEditalOrigem] = useState("");
  const [secoesSelecionadas, setSecoesSelecionadas] = useState(["ia_treinamento"]);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const toggleSecao = (key) => {
    setSecoesSelecionadas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleAbsorver = async () => {
    if (!editalOrigem || secoesSelecionadas.length === 0) return;
    setSalvando(true);
    setResultado(null);

    const origem = editaisDisponiveis.find(e => e.id === editalOrigem);
    if (!origem) { setSalvando(false); return; }

    const updates = {};
    let totalItens = 0;

    // ia_treinamento: merge, evitando duplicatas por pergunta
    if (secoesSelecionadas.includes("ia_treinamento") && origem.ia_treinamento?.length) {
      const existentes = editalDestino.ia_treinamento || [];
      const existentesPerguntas = new Set(existentes.map(e => e.pergunta?.toLowerCase().trim()));
      const novos = origem.ia_treinamento.filter(item => !existentesPerguntas.has(item.pergunta?.toLowerCase().trim()));
      updates.ia_treinamento = [...existentes, ...novos];
      totalItens += novos.length;
    }

    // etapas_perguntas: absorve perguntas das etapas sem duplicar por texto
    if (secoesSelecionadas.includes("etapas_perguntas") && origem.etapas?.length) {
      const etapasDestino = JSON.parse(JSON.stringify(editalDestino.etapas || []));
      origem.etapas.forEach((etapaOrigem, idx) => {
        if (!etapaOrigem.perguntas_formulario?.length) return;
        const etapaDest = etapasDestino[idx];
        if (etapaDest) {
          const existentesTextos = new Set((etapaDest.perguntas_formulario || []).map(p => p.pergunta?.toLowerCase().trim()));
          const novas = etapaOrigem.perguntas_formulario.filter(p => !existentesTextos.has(p.pergunta?.toLowerCase().trim()));
          etapaDest.perguntas_formulario = [...(etapaDest.perguntas_formulario || []), ...novas];
          totalItens += novas.length;
        }
      });
      updates.etapas = etapasDestino;
    }

    // criterios_avaliacao: merge por criterio
    if (secoesSelecionadas.includes("criterios_avaliacao") && origem.criterios_avaliacao?.length) {
      const existentes = editalDestino.criterios_avaliacao || [];
      const existentesSet = new Set(existentes.map(c => c.criterio?.toLowerCase().trim()));
      const novos = origem.criterios_avaliacao.filter(c => !existentesSet.has(c.criterio?.toLowerCase().trim()));
      updates.criterios_avaliacao = [...existentes, ...novos];
      totalItens += novos.length;
    }

    // requisitos: merge por nome
    if (secoesSelecionadas.includes("requisitos") && origem.requisitos?.length) {
      const existentes = editalDestino.requisitos || [];
      const existentesSet = new Set(existentes.map(r => r.nome?.toLowerCase().trim()));
      const novos = origem.requisitos.filter(r => !existentesSet.has(r.nome?.toLowerCase().trim()));
      updates.requisitos = [...existentes, ...novos];
      totalItens += novos.length;
    }

    await base44.entities.Edital.update(editalDestino.id, updates);
    setSalvando(false);
    setResultado(totalItens);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            Absorver Conhecimento de Outro Edital
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Copiará dados selecionados de um edital existente para <strong>{editalDestino?.titulo}</strong>, sem sobrescrever o que já existe.
            </p>
          </div>

          {/* Origem */}
          <div>
            <Label className="mb-2 block">Edital de origem (fonte do conhecimento)</Label>
            <select
              value={editalOrigem}
              onChange={e => setEditalOrigem(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Selecione um edital...</option>
              {editaisDisponiveis
                .filter(e => e.id !== editalDestino?.id)
                .map(e => (
                  <option key={e.id} value={e.id}>
                    [{e.orgao || e.estado}] {e.titulo}
                  </option>
                ))}
            </select>
          </div>

          {/* Seções */}
          <div>
            <Label className="mb-2 block">O que absorver</Label>
            <div className="space-y-2 bg-slate-50 rounded-lg p-3 border">
              {SECOES.map(s => (
                <div key={s.key} className="flex items-center gap-3">
                  <Checkbox
                    id={`sec-${s.key}`}
                    checked={secoesSelecionadas.includes(s.key)}
                    onCheckedChange={() => toggleSecao(s.key)}
                  />
                  <label htmlFor={`sec-${s.key}`} className="text-sm text-gray-700 cursor-pointer">{s.label}</label>
                </div>
              ))}
            </div>
          </div>

          {resultado !== null && (
            <div className={`p-3 rounded-lg text-sm font-medium ${resultado > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              {resultado > 0
                ? `✅ ${resultado} item(ns) absorvido(s) com sucesso!`
                : "ℹ️ Nenhum item novo encontrado para absorver (tudo já estava presente)."}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button
            onClick={handleAbsorver}
            disabled={!editalOrigem || secoesSelecionadas.length === 0 || salvando}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {salvando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Absorvendo...</> : <><Brain className="w-4 h-4 mr-2" />Absorver</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}