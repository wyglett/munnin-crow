import React, { useState, useEffect } from "react";
import { getAppearance } from "@/hooks/useAppearance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Plus, ArrowLeft, Trash2, Loader2, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import IAChatBalloon from "@/components/ai/IAChatBalloon";
import NorseBackground from "@/components/layout/NorseBackground";

const STATUS_MAP = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
  em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800" },
  aprovada: { label: "Aprovada", color: "bg-green-100 text-green-800" },
  rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
  submetida: { label: "Submetida", color: "bg-blue-100 text-blue-800" },
};

export default function MinhasPropostas() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLight, setIsLight] = useState(() => getAppearance().tema === "light");
  const [expandedEditais, setExpandedEditais] = useState({});
  const [criandoProposta, setCriandoProposta] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  useEffect(() => {
    const iv = setInterval(() => setIsLight(getAppearance().tema === "light"), 300);
    return () => clearInterval(iv);
  }, []);

  const queryClient = useQueryClient();

  const { data: todasPropostas = [], isLoading } = useQuery({
    queryKey: ["propostas", user?.email],
    queryFn: () => base44.entities.Proposta.list("-created_date", 100),
    enabled: !!user,
  });

  const propostas = user?.role === "admin"
    ? todasPropostas
    : todasPropostas.filter(p => p.created_by === user?.email);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Proposta.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["propostas"] }),
  });

  const criarNovaProposta = async (editalId, editalTitulo, editalOrgao) => {
    setCriandoProposta(editalId);
    try {
      const nova = await base44.entities.Proposta.create({
        titulo: `Nova Proposta - ${editalTitulo}`,
        edital_id: editalId,
        edital_titulo: editalTitulo,
        edital_orgao: editalOrgao,
        status: "rascunho",
      });
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      navigate(createPageUrl(`PropostaDetalhe?id=${nova.id}`));
    } finally {
      setCriandoProposta(null);
    }
  };

  // Agrupar propostas por edital
  const porEdital = propostas.reduce((acc, p) => {
    const key = p.edital_id || "__sem_edital__";
    const label = p.edital_titulo || "Sem edital vinculado";
    if (!acc[key]) acc[key] = { label, orgao: p.edital_orgao, propostas: [] };
    acc[key].propostas.push(p);
    return acc;
  }, {});

  // Expandir todos por padrão quando carregado
  useEffect(() => {
    if (Object.keys(porEdital).length > 0) {
      const all = {};
      Object.keys(porEdital).forEach(k => { all[k] = true; });
      setExpandedEditais(all);
    }
  }, [propostas.length]);

  const toggleEdital = (key) => {
    setExpandedEditais(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Styles
  const pageBg = isLight ? "bg-slate-50" : "bg-[#0f172a]";
  const textH = isLight ? "text-gray-900" : "text-white";
  const textS = isLight ? "text-gray-500" : "text-slate-400";
  const cardBg = isLight ? "bg-white border-gray-200" : "bg-white/5 border-white/10";
  const groupBg = isLight ? "bg-indigo-50 border-indigo-200" : "bg-indigo-900/20 border-indigo-500/30";

  return (
    <div className={`min-h-screen ${pageBg} p-6 relative`}>
      <NorseBackground isLight={isLight} intensity="subtle" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className={`mb-4 -ml-2 ${isLight ? "" : "text-slate-300 hover:text-white hover:bg-white/10"}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Editais
          </Button>
        </Link>
        <h1 className={`text-2xl font-bold mb-1 ${textH}`}>Minhas Propostas</h1>
        <p className={`text-sm mb-6 ${textS}`}>Gerencie todas as suas propostas em um só lugar</p>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : propostas.length === 0 ? (
          <Card className={cardBg}>
            <CardContent className="text-center py-16">
              <FileText className={`w-12 h-12 mx-auto mb-3 ${isLight ? "text-gray-300" : "text-slate-600"}`} />
              <p className={`font-medium ${textS}`}>Nenhuma proposta ainda</p>
              <p className={`text-sm mt-1 ${isLight ? "text-gray-400" : "text-slate-500"}`}>
                Comece criando uma proposta para um edital aberto
              </p>
              <Link to={createPageUrl("Home")}>
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> Ver Editais Disponíveis
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(porEdital).map(([editalKey, grupo]) => {
              const isExpanded = expandedEditais[editalKey] !== false;
              const isSemEdital = editalKey === "__sem_edital__";
              return (
                <div key={editalKey} className={`rounded-xl border ${groupBg} overflow-hidden`}>
                  {/* Header do Edital */}
                  <div
                    className="flex items-center justify-between px-5 py-3 cursor-pointer"
                    onClick={() => toggleEdital(editalKey)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded
                        ? <ChevronDown className={`w-4 h-4 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />
                        : <ChevronRight className={`w-4 h-4 ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />}
                      <div>
                        <p className={`font-semibold text-sm ${isLight ? "text-indigo-800" : "text-indigo-300"}`}>
                          {grupo.label}
                        </p>
                        {grupo.orgao && (
                          <p className={`text-xs ${isLight ? "text-indigo-500" : "text-indigo-400/70"}`}>
                            {grupo.orgao}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isLight ? "bg-indigo-100 text-indigo-600" : "bg-indigo-500/20 text-indigo-300"}`}>
                        {grupo.propostas.length} proposta{grupo.propostas.length > 1 ? "s" : ""}
                      </span>
                      {!isSemEdital && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            criarNovaProposta(editalKey, grupo.label, grupo.orgao);
                          }}
                          disabled={criandoProposta === editalKey}
                          className={`text-xs gap-1 ${isLight ? "text-indigo-700 hover:bg-indigo-100" : "text-indigo-300 hover:bg-indigo-500/20"}`}
                        >
                          {criandoProposta === editalKey
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Plus className="w-3.5 h-3.5" />}
                          Criar outra proposta
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Lista de propostas */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {grupo.propostas.map((p) => {
                        const status = STATUS_MAP[p.status] || STATUS_MAP.rascunho;
                        return (
                          <Card key={p.id} className={`hover:shadow-md transition-shadow border-l-4 border-l-indigo-400 ${cardBg}`}>
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={`font-semibold truncate ${textH}`}>{p.titulo}</h3>
                                  <Badge className={status.color}>{status.label}</Badge>
                                  {p.consultor_status === "em_apoio" && (
                                    <Badge className="bg-purple-100 text-purple-700 text-xs">Com Consultor</Badge>
                                  )}
                                </div>
                                {p.campos_formulario?.length > 0 && (
                                  <p className={`text-xs mt-0.5 ${isLight ? "text-gray-400" : "text-slate-500"}`}>
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
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. A proposta "{p.titulo}" será removida permanentemente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteMutation.mutate(p.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
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
              );
            })}
          </div>
        )}
      </div>{/* end z-10 */}
      <IAChatBalloon
        contextTitle="Minhas Propostas"
        contextText={`O usuário está gerenciando suas propostas de editais de fomento.\n\nPropostas cadastradas:\n${propostas.map(p => `- "${p.titulo}" (${p.edital_titulo || "sem edital"}, status: ${p.status})`).join("\n")}`}
      />
    </div>
  );
}