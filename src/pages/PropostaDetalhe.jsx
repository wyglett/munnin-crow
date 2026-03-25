import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Upload, Sparkles, Loader2, ExternalLink, Users, CheckCircle, XCircle, Send, Trophy, Activity } from "lucide-react";
import IAChatBalloon from "@/components/ai/IAChatBalloon";
import NorseBackground from "@/components/layout/NorseBackground";
import FormularioSubmissao from "../components/proposta/FormularioSubmissao";
import SigfapesFormulario from "../components/proposta/SigfapesFormulario";
import ReactMarkdown from "react-markdown";

const STATUS_MAP = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
  em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800" },
  aprovada: { label: "Aprovada", color: "bg-green-100 text-green-800" },
  rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
  submetida: { label: "Em Julgamento", color: "bg-blue-100 text-blue-800" },
  em_julgamento: { label: "Em Julgamento", color: "bg-blue-100 text-blue-800" },
  contratada: { label: "Contratada 🎉", color: "bg-emerald-100 text-emerald-800" },
};

export default function PropostaDetalhe() {
  const id = new URLSearchParams(window.location.search).get("id");
  const [user, setUser] = useState(null);
  const [analise, setAnalise] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [sigfapesNotes, setSigfapesNotes] = useState("");
  const [consultorDialog, setConsultorDialog] = useState(false);
  const [consultorEmail, setConsultorEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [postSubmitDialog, setPostSubmitDialog] = useState(false);
  const [abrindoAcomp, setAbrindoAcomp] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: propostas = [] } = useQuery({ queryKey: ["propostas"], queryFn: () => base44.entities.Proposta.list("-created_date", 100) });
  const proposta = propostas.find(p => p.id === id);

  const { data: editais = [] } = useQuery({ queryKey: ["editais"], queryFn: () => base44.entities.Edital.list("-created_date", 200) });
  const edital = editais.find(e => e.id === proposta?.edital_id);

  const isConsultor = user?.role === "consultor";
  const isAprovado = proposta?.consultor_status === "em_apoio" && proposta?.consultor_email === user?.email;

  const update = useMutation({
    mutationFn: (data) => base44.entities.Proposta.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(["propostas"]),
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const docs = [...(proposta.documentos || []), { nome: file.name, url: file_url, tipo: file.type }];
    update.mutate({ documentos: docs });
    setUploading(false);
  };

  const analisarIA = async () => {
    setAnalisando(true);
    const campos = proposta.campos_formulario || [];
    const camposStr = campos.map(c => `${c.secao} / ${c.pergunta}: ${c.resposta || "(vazio)"}`).join("\n");
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise a proposta "${proposta.titulo}" para o edital "${proposta.edital_titulo}" (${edital?.orgao || ""}).
Campos preenchidos:
${camposStr || "(sem campos)"}
Documentos: ${proposta.documentos?.length || 0}
Análise anterior: ${proposta.analise_ia || "nenhuma"}

Faça uma análise crítica da proposta, aponte pontos fortes, lacunas e dê sugestões de melhoria. Formato Markdown. Seja objetivo e prático.`
    });
    setAnalise(r);
    update.mutate({ analise_ia: r });
    setAnalisando(false);
  };

  const solicitarConsultor = () => {
    update.mutate({
      consultor_email: consultorEmail,
      consultor_status: "solicitado"
    });
    setConsultorDialog(false);
    setConsultorEmail("");
  };

  const aceitarConvite = () => update.mutate({ consultor_status: "em_apoio" });
  const recusarConvite = () => update.mutate({ consultor_status: "recusado" });

  const marcarSubmetida = () => {
    update.mutate({ status: "em_julgamento" });
    setPostSubmitDialog(true);
  };

  const marcarContratada = async (irParaAcomp = true) => {
    setAbrindoAcomp(true);
    await base44.entities.Proposta.update(id, { status: "contratada" });
    const acomp = await base44.entities.AcompanhamentoProjeto.create({
      titulo: proposta.titulo,
      descricao_projeto: proposta.descricao || "",
      orgao_financiador: proposta.edital_orgao || "",
      status: "ativo",
      consultor_email: proposta.consultor_email || null,
      consultor_nome: proposta.consultor_nome || null,
      consultor_status: proposta.consultor_email ? "aguardando" : "sem_consultor",
    });
    if (proposta.consultor_email) {
      await base44.entities.NotificacaoPlataforma.create({
        user_email: proposta.consultor_email,
        titulo: "Proposta Contratada!",
        mensagem: `A proposta "${proposta.titulo}" foi contratada. Entre em contato com o empreendedor para oferecer seu serviço de acompanhamento.`,
        tipo: "aviso",
        entidade: "AcompanhamentoProjeto",
        entidade_id: acomp.id,
      });
    }
    setAbrindoAcomp(false);
    if (irParaAcomp) {
      window.location.href = createPageUrl(`ProjetoDetalhe?id=${acomp.id}`);
    } else {
      queryClient.invalidateQueries(["propostas"]);
      setPostSubmitDialog(false);
    }
  };

  if (!proposta) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  const status = STATUS_MAP[proposta.status] || STATUS_MAP.rascunho;

  // Coleta URLs de arquivos do edital para contexto da IA
  const editalFileUrls = (() => {
    if (!edital) return [];
    const urls = [];
    const ok = (u) => u && /\.(pdf|png|jpg|jpeg)(\?|$)/i.test(u);
    edital.documentos_modelo?.forEach(d => { if (ok(d.url)) urls.push(d.url); });
    edital.etapas?.forEach(et => et.documentos?.forEach(d => { if (ok(d.url)) urls.push(d.url); }));
    return urls;
  })();

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative">
      <NorseBackground isLight={true} intensity="subtle" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <Link to={createPageUrl("MinhasPropostas")}>
          <Button variant="ghost" className="mb-4 -ml-2"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Minhas Propostas</Button>
        </Link>

        {/* Header */}
        <Card className="mb-6 border-l-4 border-l-indigo-600">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{proposta.titulo}</h1>
                <p className="text-indigo-600 text-sm mt-0.5">Edital: {proposta.edital_titulo}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className={status.color}>{status.label}</Badge>
                  {proposta.consultor_status === "em_apoio" && (
                    <Badge className="bg-purple-100 text-purple-700">Com Consultor: {proposta.consultor_nome || proposta.consultor_email}</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {edital?.url_fapes && (
                  <a href={edital.url_fapes} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver Edital</Button>
                  </a>
                )}
                {!isConsultor && proposta.status === "rascunho" && (
                  <Button size="sm" onClick={marcarSubmetida} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-3.5 h-3.5 mr-1" /> Marcar como Submetida
                  </Button>
                )}
                {!isConsultor && (proposta.status === "em_julgamento" || proposta.status === "submetida") && (
                  <Button size="sm" onClick={() => marcarContratada(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Trophy className="w-3.5 h-3.5 mr-1" /> Fui Contratado! → Acompanhamento
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Convite ao consultor (visão consultor) */}
        {isConsultor && proposta.consultor_email === user?.email && proposta.consultor_status === "solicitado" && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-indigo-800">Convite para apoiar esta proposta</p>
              <p className="text-indigo-600 text-sm">O empreendedor solicitou seu apoio na elaboração.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={aceitarConvite} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-3.5 h-3.5 mr-1" />Aceitar</Button>
              <Button size="sm" variant="outline" onClick={recusarConvite} className="border-red-300 text-red-600"><XCircle className="w-3.5 h-3.5 mr-1" />Recusar</Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="formulario">
          <TabsList className="mb-6">
            <TabsTrigger value="formulario">📝 Formulário de Submissão</TabsTrigger>
            {edital?.orgao?.toLowerCase().includes("fapes") && (
              <TabsTrigger value="sigfapes">🏛 Sigfapes</TabsTrigger>
            )}
            <TabsTrigger value="documentos">📎 Documentos</TabsTrigger>
            <TabsTrigger value="ia"><Sparkles className="w-3.5 h-3.5 mr-1" />Análise IA</TabsTrigger>
            {(!isConsultor || isAprovado) && (
              <TabsTrigger value="consultor"><Users className="w-3.5 h-3.5 mr-1" />Consultor</TabsTrigger>
            )}
          </TabsList>

          {/* FORMULÁRIO */}
          <TabsContent value="formulario">
            <Card><CardContent className="p-6">
              <FormularioSubmissao
                proposta={proposta}
                edital={edital || { titulo: proposta.edital_titulo, orgao: proposta.edital_orgao }}
                onSave={(data) => update.mutate(data)}
              />
            </CardContent></Card>
          </TabsContent>

          {/* SIGFAPES */}
          <TabsContent value="sigfapes">
            <Card><CardContent className="p-6">
              <SigfapesFormulario
                proposta={proposta}
                edital={edital || { titulo: proposta.edital_titulo, orgao: proposta.edital_orgao }}
                onSave={(data) => update.mutate(data)}
              />
            </CardContent></Card>
          </TabsContent>

          {/* DOCUMENTOS */}
          <TabsContent value="documentos">
            <Card><CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Upload de Documentos</h2>
                <Label htmlFor="doc-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-all">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Adicionar Documentos
                  </div>
                </Label>
                <input id="doc-upload" type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.xlsx,.jpg,.png" />
              </div>

              {!proposta.documentos?.length ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhum documento adicionado ainda</p>
                  <p className="text-xs mt-1">Faça upload de PDFs ou documentos Word da sua proposta</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {proposta.documentos.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                      <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-indigo-600 hover:underline truncate">{doc.nome}</a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* ANÁLISE IA */}
          <TabsContent value="ia">
            <Card><CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg">Análise da Proposta</h2>
                  <p className="text-sm text-gray-500">A IA analisa seus campos preenchidos e documentos</p>
                </div>
                <Button onClick={analisarIA} disabled={analisando} className="bg-indigo-600 hover:bg-indigo-700">
                  {analisando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando...</> : <><Sparkles className="w-4 h-4 mr-2" />Analisar</>}
                </Button>
              </div>
              {(analise || proposta.analise_ia) ? (
                <div className="prose prose-sm max-w-none bg-white border rounded-xl p-5">
                  <ReactMarkdown>{analise || proposta.analise_ia}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Preencha o formulário e clique em "Analisar" para obter insights da IA</p>
                </div>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* CONSULTOR */}
          {(!isConsultor || isAprovado) && (
            <TabsContent value="consultor">
              <Card><CardContent className="p-6">
                {proposta.consultor_status === "sem_consultor" || proposta.consultor_status === "recusado" ? (
                  <div className="text-center py-10">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-700 mb-2">Solicitar Apoio de Consultor</h3>
                    <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">Um consultor especializado pode ajudar a fortalecer sua proposta, apontando melhorias e preenchendo lacunas.</p>
                    <Button onClick={() => setConsultorDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                      <Users className="w-4 h-4 mr-2" /> Solicitar Consultor
                    </Button>
                  </div>
                ) : proposta.consultor_status === "solicitado" ? (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                    <div>
                      <p className="font-semibold text-yellow-800">Aguardando resposta do consultor</p>
                      <p className="text-yellow-700 text-sm">{proposta.consultor_email}</p>
                    </div>
                  </div>
                ) : proposta.consultor_status === "em_apoio" ? (
                  <div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">Consultor em apoio: {proposta.consultor_nome || proposta.consultor_email}</p>
                        <p className="text-green-600 text-sm">Ele pode visualizar e comentar nos campos da proposta</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent></Card>
            </TabsContent>
          )}
        </Tabs>
      </div>{/* end relative z-10 */}

      <IAChatBalloon
        contextTitle={`Proposta: ${proposta.titulo}`}
        contextText={`Proposta: "${proposta.titulo}"\nEdital: "${proposta.edital_titulo}" (${proposta.edital_orgao || ""})\nStatus: ${proposta.status}\nCampos preenchidos: ${proposta.campos_formulario?.filter(c => c.resposta)?.length || 0}/${proposta.campos_formulario?.length || 0}\n${proposta.analise_ia ? `\nAnálise IA anterior:\n${proposta.analise_ia.substring(0,500)}` : ""}`}
        editalFileUrls={editalFileUrls}
        editalId={proposta.edital_id}
        editalTitulo={proposta.edital_titulo}
        editalOrgao={proposta.edital_orgao}
      />

      {/* Dialog pós-submissão */}
      <Dialog open={postSubmitDialog} onOpenChange={setPostSubmitDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>🎉 Proposta Submetida!</DialogTitle></DialogHeader>
          <p className="text-gray-600 text-sm">Sua proposta foi marcada como submetida. Ela foi aprovada/contratada pelo órgão financiador?</p>
          <div className="flex flex-col gap-3 mt-2">
            <Button
              onClick={() => marcarContratada(true)}
              disabled={abrindoAcomp}
              className="bg-emerald-600 hover:bg-emerald-700 w-full"
            >
              {abrindoAcomp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
              Sim, foi contratada! Abrir no Acompanhamento
            </Button>
            <Button
              variant="outline"
              onClick={() => marcarContratada(false)}
              disabled={abrindoAcomp}
              className="w-full"
            >
              Sim, foi contratada (registrar só)
            </Button>
            <Button variant="ghost" onClick={() => setPostSubmitDialog(false)} className="w-full text-gray-500">
              Ainda não, está em julgamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog solicitar consultor */}
      <Dialog open={consultorDialog} onOpenChange={setConsultorDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Solicitar Consultor</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500 mb-3">Informe o e-mail do consultor que deseja convidar para apoiar na elaboração desta proposta.</p>
          <Label>E-mail do consultor</Label>
          <Input value={consultorEmail} onChange={e => setConsultorEmail(e.target.value)} placeholder="consultor@email.com" type="email" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsultorDialog(false)}>Cancelar</Button>
            <Button onClick={solicitarConsultor} disabled={!consultorEmail} className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4 mr-2" /> Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}