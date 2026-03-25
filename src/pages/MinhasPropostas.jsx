import React, { useState, useEffect } from "react";
import { getAppearance } from "@/hooks/useAppearance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Plus, ArrowLeft, Trash2, Loader2, Pencil } from "lucide-react";

const STATUS_MAP = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
  em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800" },
  aprovada: { label: "Aprovada", color: "bg-green-100 text-green-800" },
  rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
  submetida: { label: "Submetida", color: "bg-blue-100 text-blue-800" },
};

export default function MinhasPropostas() {
  const [user, setUser] = React.useState(null);
  const [isLight, setIsLight] = useState(() => getAppearance().tema === "light");
  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  useEffect(() => {
    const iv = setInterval(() => setIsLight(getAppearance().tema === "light"), 300);
    return () => clearInterval(iv);
  }, []);
  const queryClient = useQueryClient();
  const { data: todasPropostas = [], isLoading } = useQuery({
    queryKey: ["propostas", user?.email],
    queryFn: () => base44.entities.Proposta.list("-created_date", 50),
    enabled: !!user,
  });
  // Filtrar apenas propostas do usuário (exceto admin que vê tudo)
  const propostas = user?.role === "admin"
    ? todasPropostas
    : todasPropostas.filter(p => p.created_by === user?.email);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Proposta.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["propostas"] }),
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Editais
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Minhas Propostas</h1>
        <p className="text-gray-500 text-sm mb-6">Gerencie todas as suas propostas em um só lugar</p>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : propostas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma proposta ainda</p>
              <p className="text-sm text-gray-400 mt-1">Comece criando uma proposta para um edital aberto</p>
              <Link to={createPageUrl("Home")}>
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> Ver Editais Disponíveis
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {propostas.map((p) => {
              const status = STATUS_MAP[p.status] || STATUS_MAP.rascunho;
              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-200">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{p.titulo}</h3>
                        <Badge className={status.color}>{status.label}</Badge>
                        {p.consultor_status === "em_apoio" && <Badge className="bg-purple-100 text-purple-700 text-xs">Com Consultor</Badge>}
                      </div>
                      {p.edital_titulo && <p className="text-sm text-indigo-600 mt-0.5">Edital: {p.edital_titulo}</p>}
                      {p.campos_formulario?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.campos_formulario.filter(c => c.concluido).length}/{p.campos_formulario.length} campos concluídos
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link to={createPageUrl(`PropostaDetalhe?id=${p.id}`)}>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita. A proposta "{p.titulo}" será removida permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}