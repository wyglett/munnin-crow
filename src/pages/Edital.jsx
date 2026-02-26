import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Calendar, ExternalLink, Plus, Loader2 } from "lucide-react";
import moment from "moment";

export default function Edital() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const queryClient = useQueryClient();

  const { data: editais = [] } = useQuery({
    queryKey: ["editais"],
    queryFn: () => base44.entities.Edital.list("-created_date", 200),
  });
  const edital = editais.find(e => e.id === id);

  const { data: propostas = [] } = useQuery({
    queryKey: ["propostas-edital", id],
    queryFn: () => base44.entities.Proposta.filter({ edital_id: id }, "-created_date", 20),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Proposta.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas-edital", id] });
      setShowForm(false);
      setTitulo("");
      setDescricao("");
    },
  });

  if (!edital) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
    </div>
  );

  const diasRestantes = edital.data_encerramento ? moment(edital.data_encerramento).diff(moment(), "days") : null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className="mb-4 -ml-2"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Editais</Button>
        </Link>

        {/* Edital Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{edital.titulo}</h1>
                {edital.numero && <p className="text-gray-500 mt-0.5">Edital Nº {edital.numero}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  {edital.area && <Badge className="bg-indigo-100 text-indigo-800">{edital.area}</Badge>}
                  {edital.valor_total && <Badge className="bg-green-100 text-green-800">{edital.valor_total}</Badge>}
                  {diasRestantes !== null && (
                    <Badge className={diasRestantes < 0 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}>
                      {diasRestantes < 0 ? "Encerrado" : `${diasRestantes} dias restantes`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {edital.descricao && (
              <div className="mt-5 pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-1">Descrição</h3>
                <p className="text-gray-600 text-sm">{edital.descricao}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Data de Encerramento</span>
                <span className="font-medium text-gray-900">{edital.data_encerramento ? moment(edital.data_encerramento).format("DD/MM/YYYY") : "—"}</span>
              </div>
              {edital.url_fapes && (
                <a href={edital.url_fapes} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" /> Ver Edital Completo na FAPES</Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Proposal */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Criar Nova Proposta</h2>
            {!showForm ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Crie uma proposta para este edital e utilize nossa IA para análise e sugestões</p>
                <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> Iniciar Nova Proposta
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Título da Proposta *</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Desenvolvimento de Plataforma de Inovação..." />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva brevemente sua proposta..." rows={4} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button
                    onClick={() => createMutation.mutate({ titulo, descricao, edital_id: id, edital_titulo: edital.titulo, status: "rascunho" })}
                    disabled={!titulo || createMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Criar Proposta
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}