import React, { useState, useEffect, useMemo } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, FolderOpen, Info, Loader2, Users, CheckCircle2, DollarSign
} from "lucide-react";
import IAChatBalloon from "@/components/ai/IAChatBalloon";
import NorseBackground from "@/components/layout/NorseBackground";
import { getAppearance } from "@/hooks/useAppearance";
import ConsultorTab from "../components/acompanhamento/ConsultorTab";
import GastosFinanceiro from "../components/acompanhamento/GastosFinanceiro";
import OrcamentoTab from "../components/acompanhamento/OrcamentoTab";
import RelatorioTab from "../components/acompanhamento/RelatorioTab";
import MilestonePagamentoTab from "../components/consultoria/MilestonePagamentoTab";

const STATUS_MAP = { ativo: "bg-green-100 text-green-800", concluido: "bg-blue-100 text-blue-800", suspenso: "bg-yellow-100 text-yellow-800" };

const FINANCEIRO_CATS = [
  "Material Permanente",
  "Material de Consumo",
  "Terceiros",
  "Diárias",
  "Passagens",
  "Contrapartida",
  "DOACI",
];
const RELATORIOS_CATS = ["Parcial", "Final"];

// Detecta o tipo de drive pelo link
function detectarTipoDrive(url) {
  if (!url) return null;
  if (/drive\.google\.com|docs\.google\.com/i.test(url)) return "googledrive";
  if (/onedrive\.live\.com|1drv\.ms|sharepoint\.com/i.test(url)) return "onedrive";
  return null;
}

// Extrai o folder ID de um link do Google Drive
function extrairFolderId(url) {
  const m = url?.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export default function ProjetoDetalhe() {
  const id = new URLSearchParams(window.location.search).get("id");
  const [user, setUser] = useState(null);
  const [isLight, setIsLight] = useState(() => getAppearance().tema === "light");
  const [driveDialog, setDriveDialog] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [criandoDrive, setCriandoDrive] = useState(false);
  const [driveStatus, setDriveStatus] = useState(null); // null | "criando" | "ok" | "erro"
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  useEffect(() => {
    const iv = setInterval(() => setIsLight(getAppearance().tema === "light"), 300);
    return () => clearInterval(iv);
  }, []);

  const { data: projetos = [] } = useQuery({ queryKey: ["acompanhamentos"], queryFn: () => base44.entities.AcompanhamentoProjeto.list() });
  const projeto = projetos.find(p => p.id === id);

  const { data: gastos = [] } = useQuery({
    queryKey: ["gastos", id],
    queryFn: () => base44.entities.GastoProjeto.filter({ acompanhamento_id: id }, "-data", 200),
    enabled: !!id,
  });

  const isConsultor = user?.role === "consultor";

  const updateProjeto = useMutation({
    mutationFn: (d) => base44.entities.AcompanhamentoProjeto.update(id, d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] }),
  });

  const tipoDrive = detectarTipoDrive(driveUrl);

  const salvarDriveECriarEstrutura = async () => {
    if (!driveUrl) return;
    setCriandoDrive(true);
    setDriveStatus("criando");

    const tipo = detectarTipoDrive(driveUrl);

    if (tipo === "onedrive") {
      // Para OneDrive, apenas salva o link sem criar estrutura automática
      await updateProjeto.mutateAsync({
        drive_folder_url: driveUrl,
        drive_root_folder_id: "onedrive_manual",
        drive_categoria_ids: {},
        drive_tipo: "onedrive",
      });
      setDriveStatus("ok_onedrive");
      setCriandoDrive(false);
      return;
    }

    // Google Drive
    const parentFolderId = extrairFolderId(driveUrl);
    if (!parentFolderId) {
      setDriveStatus("erro");
      setCriandoDrive(false);
      return;
    }

    const res = await base44.functions.invoke("criarEstruturaDrive", {
      projetoTitulo: projeto.titulo,
      parentFolderId,
    });

    if (res.data?.success) {
      await updateProjeto.mutateAsync({
        drive_folder_url: driveUrl,
        drive_root_folder_id: res.data.rootFolderId,
        drive_categoria_ids: res.data.pastas || {},
        drive_tipo: "googledrive",
      });
      setDriveStatus("ok");
      setTimeout(() => { setDriveDialog(false); setDriveStatus(null); }, 1500);
    } else {
      setDriveStatus("erro");
    }
    setCriandoDrive(false);
  };

  if (!projeto) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className={`min-h-screen p-4 md:p-6 relative ${isLight ? "bg-slate-50" : "bg-[#0f172a]"}`}>
      <NorseBackground isLight={isLight} intensity="subtle" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <Link to={createPageUrl("Acompanhamento")}><Button variant="ghost" className="mb-4 -ml-2"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button></Link>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              {projeto.titulo}
              <Badge className={STATUS_MAP[projeto.status]}>{projeto.status}</Badge>
            </h1>
            {projeto.orgao_financiador && <p className="text-indigo-600 text-sm mt-0.5">{projeto.orgao_financiador}{projeto.numero_edital ? ` · ${projeto.numero_edital}` : ""}</p>}
          </div>
          <Button variant="outline" onClick={() => { setDriveUrl(projeto.drive_folder_url || ""); setDriveDialog(true); }}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {projeto.drive_root_folder_id ? "✓ Drive Configurado" : "Configurar Drive"}
          </Button>
        </div>

        {!projeto.drive_folder_url && !isConsultor && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800"><strong>Pasta no Drive não configurada.</strong> Configure para que a plataforma crie a estrutura de pastas automaticamente.</p>
          </div>
        )}

        <Tabs defaultValue="financeiro">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="financeiro">💰 Financeiro</TabsTrigger>
            <TabsTrigger value="orcamento">📊 Orçamento</TabsTrigger>
            <TabsTrigger value="consultor">
              <Users className="w-4 h-4 mr-1.5" />
              Consultor
              {projeto.consultor_status === "em_negociacao" && <span className="ml-1.5 w-2 h-2 rounded-full bg-yellow-400 inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="relatorio">Relatório</TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro">
            <GastosFinanceiro
              projeto={projeto}
              gastos={gastos}
              isConsultor={isConsultor}
              projetoId={id}
            />
          </TabsContent>

          <TabsContent value="orcamento">
            <OrcamentoTab
              projeto={projeto}
              gastos={gastos}
              onSave={(data) => updateProjeto.mutate(data)}
            />
          </TabsContent>

          <TabsContent value="consultor">
            <ConsultorTab projeto={projeto} user={user} />
          </TabsContent>

          <TabsContent value="relatorio">
            <RelatorioTab
              projeto={projeto}
              gastos={gastos}
              onSave={(data) => updateProjeto.mutateAsync(data)}
            />
          </TabsContent>
        </Tabs>
      </div>{/* end z-10 */}

      <IAChatBalloon
        contextTitle={`Projeto: ${projeto.titulo}`}
        contextText={`Projeto: "${projeto.titulo}"\nÓrgão: ${projeto.orgao_financiador || ""}\nEdital: ${projeto.numero_edital || ""}\nStatus: ${projeto.status}\nValor contratado: R$${projeto.valor_contratado || "N/I"}\nInício: ${projeto.data_inicio || "N/I"} — Fim previsto: ${projeto.data_fim_prevista || "N/I"}\n${projeto.descricao_projeto ? `\nDescrição: ${projeto.descricao_projeto.substring(0,300)}` : ""}`}
        editalTitulo={projeto.numero_edital ? `${projeto.orgao_financiador} ${projeto.numero_edital}` : projeto.orgao_financiador}
        editalOrgao={projeto.orgao_financiador}
      />

      {/* Drive Dialog */}
      <Dialog open={driveDialog} onOpenChange={(v) => { if (!criandoDrive) { setDriveDialog(v); setDriveStatus(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Configurar Pasta no Drive</DialogTitle></DialogHeader>

          {driveStatus === "ok" ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-green-700">Estrutura criada com sucesso!</p>
              <p className="text-sm text-gray-500 mt-1">As pastas por categoria foram criadas no Google Drive.</p>
            </div>
          ) : driveStatus === "ok_onedrive" ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <p className="font-semibold text-blue-700">OneDrive vinculado com sucesso!</p>
              <p className="text-sm text-gray-500 mt-1">O link foi salvo. A gestão das pastas será feita manualmente no OneDrive.</p>
              <Button className="mt-4" onClick={() => { setDriveDialog(false); setDriveStatus(null); }}>Fechar</Button>
            </div>
          ) : (
            <>
              <Label className="mt-2 mb-1 block">Link da pasta raiz (Google Drive ou OneDrive)</Label>
              <Input
                value={driveUrl}
                onChange={e => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/... ou https://onedrive.live.com/..."
                className="mt-1"
              />

              {/* Indicador do tipo detectado */}
              {driveUrl && (
                <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${tipoDrive === "googledrive" ? "bg-green-50 text-green-700 border border-green-200" : tipoDrive === "onedrive" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                  {tipoDrive === "googledrive" && <><span>🟢</span> Google Drive detectado — a plataforma criará a estrutura de pastas automaticamente.</>}
                  {tipoDrive === "onedrive" && <><span>🔵</span> Microsoft OneDrive detectado — o link será salvo e as pastas serão gerenciadas manualmente.</>}
                  {!tipoDrive && <><span>⚠️</span> Formato de link não reconhecido. Use um link do Google Drive ou OneDrive.</>}
                </div>
              )}

              {tipoDrive === "googledrive" && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-3">
                  <p className="text-sm font-semibold text-indigo-800 mb-2">A plataforma criará automaticamente:</p>
                  <div className="text-xs text-indigo-700 font-mono space-y-0.5">
                    <p>📁 {projeto.titulo}</p>
                    <p className="ml-4">├── 📁 Financeiro</p>
                    {FINANCEIRO_CATS.map((s, i) => (
                      <p key={s} className="ml-8">{i < FINANCEIRO_CATS.length - 1 ? "├──" : "└──"} 📁 {s}</p>
                    ))}
                    <p className="ml-4">└── 📁 Relatórios</p>
                    {RELATORIOS_CATS.map((s, i) => (
                      <p key={s} className="ml-8">{i < RELATORIOS_CATS.length - 1 ? "├──" : "└──"} 📁 {s}</p>
                    ))}
                  </div>
                  <p className="text-xs text-indigo-600 mt-2">Cada item exportado cria subpasta: <code className="bg-indigo-100 px-1 rounded">AAAA-MM-DD_FORNECEDOR - DESCRIÇÃO</code></p>
                </div>
              )}

              {tipoDrive === "onedrive" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 text-sm text-blue-800">
                  <p className="font-semibold mb-1">ℹ️ Integração com OneDrive</p>
                  <p className="text-xs">O link será salvo como referência. A exportação automática de itens financeiros está disponível apenas para Google Drive. Para o OneDrive, utilize o link para acessar a pasta diretamente.</p>
                </div>
              )}

              {driveStatus === "erro" && (
                <p className="text-red-600 text-sm mt-2">Não foi possível criar a estrutura. Verifique o link e as permissões da pasta.</p>
              )}
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => { setDriveDialog(false); setDriveStatus(null); }} disabled={criandoDrive}>Cancelar</Button>
                <Button onClick={salvarDriveECriarEstrutura} disabled={!driveUrl || !tipoDrive || criandoDrive} className="bg-indigo-600 hover:bg-indigo-700">
                  {criandoDrive ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando pastas...</> : tipoDrive === "onedrive" ? "Salvar Link OneDrive" : "Salvar e Criar Estrutura"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}