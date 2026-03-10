import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Search, Check, Upload, Loader2, Sparkles } from "lucide-react";

const TIPO_LABELS = { parcial: "Parcial", final: "Final", prestacao_contas: "Prestação de Contas", outro: "Outro" };
const TIPO_COLORS = { parcial: "bg-blue-100 text-blue-700", final: "bg-green-100 text-green-700", prestacao_contas: "bg-amber-100 text-amber-700", outro: "bg-gray-100 text-gray-600" };

export default function SeletorModeloRelatorio({ onSelecionar, onUploadCustom, uploading, extraindo }) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");

  const { data: modelos = [] } = useQuery({
    queryKey: ["modelos_relatorio_pub"],
    queryFn: () => base44.entities.ModeloRelatorio.filter({ status: "publicado" }, "-usos", 100),
    enabled: open
  });

  const filtrados = modelos.filter(m => {
    const q = busca.toLowerCase();
    return !q || m.nome?.toLowerCase().includes(q) || m.orgao?.toLowerCase().includes(q) || m.tags?.some(t => t.toLowerCase().includes(q));
  });

  const handleSelecionar = async (modelo) => {
    // Incrementa contador de usos
    base44.entities.ModeloRelatorio.update(modelo.id, { usos: (modelo.usos || 0) + 1 }).catch(() => {});
    onSelecionar(modelo);
    setOpen(false);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
        <FileText className="w-4 h-4 mr-2" />
        Usar Modelo Pré-registrado
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Selecionar Modelo de Relatório
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, órgão ou tag..."
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-1">
            {filtrados.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum modelo encontrado</p>
                <p className="text-xs mt-1">Tente outro termo ou use a opção de upload abaixo</p>
              </div>
            )}
            {filtrados.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelecionar(m)}
                className="w-full text-left border rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{m.nome}</span>
                      <Badge className={TIPO_COLORS[m.tipo_relatorio] || "bg-gray-100 text-gray-600"}>
                        {TIPO_LABELS[m.tipo_relatorio] || m.tipo_relatorio}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{m.orgao} • {m.campos_mapeados?.length || 0} campos mapeados {m.usos > 0 && `• ${m.usos} usos`}</p>
                    {m.descricao && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.descricao}</p>}
                    {m.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {m.tags.map((t, i) => <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>)}
                      </div>
                    )}
                  </div>
                  <Check className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
                </div>
              </button>
            ))}
          </div>

          {/* Upload customizado */}
          <div className="border-t pt-3 mt-1">
            <p className="text-xs text-gray-500 mb-2">Não encontrou o modelo que precisa? Faça upload do seu arquivo:</p>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex-1">
                <div className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-lg text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  {uploading || extraindo
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{uploading ? "Enviando..." : "Extraindo campos..."}</>
                    : <><Upload className="w-4 h-4" />Upload de Modelo Próprio (PDF ou DOCX)</>
                  }
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => { onUploadCustom(e); setOpen(false); }}
                  disabled={uploading || extraindo}
                />
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Seu upload ficará disponível apenas para este projeto. Para solicitar que o admin adicione um modelo permanente, entre em contato.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}