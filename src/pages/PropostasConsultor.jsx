import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Plus, ArrowLeft, Trash2, Loader2, Pencil, Users, Users2 } from "lucide-react";

const STATUS_MAP = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
  em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800" },
  aprovada: { label: "Aprovada", color: "bg-green-100 text-green-800" },
  rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
  em_julgamento: { label: "Em Julgamento", color: "bg-blue-100 text-blue-800" },
  contratada: { label: "Contratada", color: "bg-emerald-100 text-emerald-800" },
  submetida: { label: "Submetida", color: "bg-blue-100 text-blue-800" },
};

function PropostaCard({ p, onDelete, isOwn }) {
  const status = STATUS_MAP[p.status] || STATUS_MAP.rascunho;
  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-200">
      <CardContent className="p-5 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{p.titulo}</h3>
            <Badge className={status.color}>{status.label}</Badge>
            {!isOwn && <Badge className="bg-purple-100 text-purple-700 text-xs">Apoio</Badge>}
          </div>
          {p.edital_titulo && <p className="text-sm text-indigo-600 mt-0.5">Edital: {p.edital_titulo}</p>}
          {!isOwn && p.created_by && <p className="text-xs text-gray-400 mt-0.5">Empreendedor: {p.created_by}</p>}
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
          {isOwn && (
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
                  <AlertDialogAction onClick={() => onDelete(p.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropostasConsultor() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: todasPropostas = [], isLoading } = useQuery({
    queryKey: ["propostas-consultor", user?.email],
    queryFn: () => base44.entities.Proposta.list("-created_date", 200),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Proposta.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["propostas-consultor"] }),
  });

  const minhasPropostas = todasPropostas.filter(p => p.created_by === user?.email);
  const propostasApoio = todasPropostas.filter(p =>
    p.created_by !== user?.email &&
    p.consultor_email === user?.email &&
    p.consultor_status === "em_apoio"
  );

  const handleCriar = async () => {
    const nova = await base44.entities.Proposta.create({
      titulo: "Nova Proposta",
      status: "rascunho",
      consultor_status: "sem_consultor",
    });
    window.location.href = createPageUrl(`PropostaDetalhe?id=${nova.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("ConsultorDashboard")}>
          <Button variant="ghost" className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Propostas</h1>
            <p className="text-gray-500 text-sm">Gerencie suas propostas e apoie empreendedores</p>
          </div>
          <Button onClick={handleCriar} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Nova Proposta
          </Button>
        </div>

        <Tabs defaultValue="minhas">
          <TabsList className="mb-6">
            <TabsTrigger value="minhas">
              <FileText className="w-4 h-4 mr-2" />
              Minhas Propostas ({minhasPropostas.length})
            </TabsTrigger>
            <TabsTrigger value="terceiros">
              <Users className="w-4 h-4 mr-2" />
              Propostas de Terceiros ({propostasApoio.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="minhas">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
            ) : minhasPropostas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Nenhuma proposta própria ainda</p>
                  <Button onClick={handleCriar} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> Criar Proposta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {minhasPropostas.map(p => (
                  <PropostaCard key={p.id} p={p} onDelete={deleteMutation.mutate} isOwn={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="terceiros">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
            ) : propostasApoio.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Nenhuma proposta de terceiros ainda</p>
                  <p className="text-sm text-gray-400 mt-1">Quando um empreendedor aceitar seu apoio, a proposta aparecerá aqui.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {propostasApoio.map(p => (
                  <PropostaCard key={p.id} p={p} onDelete={null} isOwn={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}