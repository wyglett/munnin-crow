import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_COLORS = {
  aguardando: "bg-yellow-100 text-yellow-800",
  aceita: "bg-green-100 text-green-800",
  rejeitada: "bg-red-100 text-red-800",
};

export default function PropostaCard({ proposta, role, onAceitar, onRejeitar, onContraproposta }) {
  const [showNeg, setShowNeg] = useState(false);
  const [cVal, setCVal] = useState("");
  const [cMsg, setCMsg] = useState("");

  const lastCounter = proposta.contrapropostas?.[proposta.contrapropostas.length - 1];
  const aguardaResposta = lastCounter?.autor !== role && proposta.status === "aguardando";

  const handleCounter = () => {
    onContraproposta(cVal, cMsg);
    setCVal(""); setCMsg(""); setShowNeg(false);
  };

  return (
    <Card className={`border ${proposta.status === "aceita" ? "border-green-300 bg-green-50" : proposta.status === "rejeitada" ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900">{proposta.consultor_nome || proposta.consultor_email}</p>
              <Badge className={STATUS_COLORS[proposta.status] || "bg-gray-100 text-gray-700"}>
                {proposta.status === "aguardando" ? "Aguardando" : proposta.status === "aceita" ? "Aceita" : "Rejeitada"}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{fmt(proposta.valor)}</p>
            <p className="text-sm text-gray-600 mt-1">{proposta.descricao}</p>
          </div>
        </div>

        {/* Histórico de contrapropostas */}
        {proposta.contrapropostas?.length > 0 && (
          <div className="mt-3 border-t pt-3 space-y-2">
            <button onClick={() => setShowNeg(!showNeg)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
              <MessageSquare className="w-3 h-3" />
              {proposta.contrapropostas.length} negociação(ões)
              {showNeg ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showNeg && proposta.contrapropostas.map((cp, i) => (
              <div key={i} className={`p-2 rounded-lg text-xs ${cp.autor === "empreendedor" ? "bg-blue-50 ml-4" : "bg-gray-50"}`}>
                <p className="font-semibold capitalize">{cp.autor}: {fmt(cp.valor)}</p>
                <p className="text-gray-600">{cp.mensagem}</p>
              </div>
            ))}
          </div>
        )}

        {/* Ações */}
        {proposta.status === "aguardando" && (
          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
            {role === "empreendedor" && (
              <>
                <Button size="sm" onClick={onAceitar} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aceitar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowNeg(true); }} className="border-red-300 text-red-600 hover:bg-red-50">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeitar
                </Button>
              </>
            )}
            {aguardaResposta && (
              <Button size="sm" variant="outline" onClick={() => setShowNeg(!showNeg)}>
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> Negociar
              </Button>
            )}
          </div>
        )}

        {/* Formulário negociação / rejeição */}
        {showNeg && proposta.status === "aguardando" && (
          <div className="mt-3 border-t pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Seu valor (R$)</Label><Input type="number" step="0.01" value={cVal} onChange={e => setCVal(e.target.value)} placeholder="0,00" /></div>
              <div><Label className="text-xs">Mensagem</Label><Input value={cMsg} onChange={e => setCMsg(e.target.value)} placeholder="Justificativa..." /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCounter} disabled={!cVal} className="bg-indigo-600 hover:bg-indigo-700">Enviar Contraproposta</Button>
              {role === "empreendedor" && <Button size="sm" variant="outline" className="border-red-300 text-red-600" onClick={onRejeitar}>Rejeitar</Button>}
              <Button size="sm" variant="ghost" onClick={() => setShowNeg(false)}>Cancelar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}