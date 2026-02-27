import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Send, Eye, EyeOff, Link2, CheckCircle, Upload, FileText } from "lucide-react";
import PropostaCard from "./PropostaCard";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function ConsultorTab({ projeto, user }) {
  const [busca, setBusca] = useState(projeto.busca_consultor || "nenhum");
  const [consultorEmail, setConsultorEmail] = useState(projeto.consultor_solicitado_email || "");
  const [propostaValor, setPropostaValor] = useState("");
  const [propostaDesc, setPropostaDesc] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [platUrl, setPlatUrl] = useState(projeto.plataforma_url || "");
  const [platLogin, setPlatLogin] = useState(projeto.plataforma_login || "");
  const [platSenha, setPlatSenha] = useState(projeto.plataforma_senha || "");
  const [editCreds, setEditCreds] = useState(false);
  const queryClient = useQueryClient();

  const isEmpreendedor = user?.role !== "consultor";
  const meuEmail = user?.email;
  const minhaProposta = projeto.propostas_consultor?.find(p => p.consultor_email === meuEmail);
  const consultorAprovado = projeto.consultor_status === "aprovado";
  const soyConsultorAprovado = consultorAprovado && projeto.consultor_email === meuEmail;

  const update = useMutation({
    mutationFn: (data) => base44.entities.AcompanhamentoProjeto.update(projeto.id, data),
    onSuccess: () => queryClient.invalidateQueries(["acompanhamentos"]),
  });

  const handleSaveBusca = () => {
    update.mutate({
      busca_consultor: busca,
      consultor_solicitado_email: busca === "direto" ? consultorEmail : null,
      consultor_status: busca !== "nenhum" ? "aguardando" : "sem_consultor",
    });
  };

  const handleEnviarProposta = () => {
    const propostas = [...(projeto.propostas_consultor || [])];
    propostas.push({
      id: Date.now().toString(),
      consultor_email: meuEmail,
      consultor_nome: user.full_name,
      valor: parseFloat(propostaValor),
      descricao: propostaDesc,
      status: "aguardando",
      contrapropostas: [],
    });
    update.mutate({ propostas_consultor: propostas, consultor_status: "em_negociacao" });
    setPropostaValor(""); setPropostaDesc("");
  };

  const handleAceitar = (propostaId) => {
    const propostas = (projeto.propostas_consultor || []).map(p =>
      p.id === propostaId ? { ...p, status: "aceita" } : p
    );
    const aceita = propostas.find(p => p.id === propostaId);
    update.mutate({
      propostas_consultor: propostas,
      consultor_email: aceita.consultor_email,
      consultor_nome: aceita.consultor_nome,
      consultor_status: "aprovado",
    });
  };

  const handleRejeitar = (propostaId) => {
    const propostas = (projeto.propostas_consultor || []).map(p =>
      p.id === propostaId ? { ...p, status: "rejeitada" } : p
    );
    update.mutate({ propostas_consultor: propostas });
  };

  const handleContraproposta = (propostaId, val, msg, autor) => {
    const propostas = (projeto.propostas_consultor || []).map(p => {
      if (p.id !== propostaId) return p;
      const cps = [...(p.contrapropostas || [])];
      cps.push({ autor, valor: parseFloat(val), mensagem: msg, data: new Date().toISOString() });
      return { ...p, contrapropostas: cps };
    });
    update.mutate({ propostas_consultor: propostas });
  };

  const handleSaveCreds = () => {
    update.mutate({ plataforma_url: platUrl, plataforma_login: platLogin, plataforma_senha: platSenha });
    setEditCreds(false);
  };

  const handleUploadTemplate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update.mutate({ template_relatorio_url: file_url });
  };

  /* ─── CONSULTOR VIEW ─── */
  if (!isEmpreendedor) {
    if (soyConsultorAprovado) {
      return (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Você é o consultor responsável por este projeto</p>
          </div>

          {(projeto.plataforma_url || projeto.plataforma_login) && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-indigo-600" /> Acesso à Plataforma</h3>
                <div className="space-y-2 text-sm">
                  {projeto.plataforma_url && <p><span className="text-gray-500">URL: </span><a href={projeto.plataforma_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">{projeto.plataforma_url}</a></p>}
                  {projeto.plataforma_login && <p><span className="text-gray-500">Login: </span><span className="font-mono">{projeto.plataforma_login}</span></p>}
                  {projeto.plataforma_senha && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Senha: </span>
                      <span className="font-mono">{showSenha ? projeto.plataforma_senha : "••••••••"}</span>
                      <button onClick={() => setShowSenha(!showSenha)} className="text-gray-400 hover:text-gray-600">
                        {showSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {projeto.template_relatorio_url && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Template de Relatório</h3>
                <a href={projeto.template_relatorio_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-sm underline">Baixar modelo de relatório</a>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {minhaProposta ? (
          <div>
            <p className="text-sm text-gray-500 mb-3">Sua proposta para este projeto:</p>
            <PropostaCard
              proposta={minhaProposta}
              role="consultor"
              onContraproposta={(val, msg) => handleContraproposta(minhaProposta.id, val, msg, "consultor")}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Send className="w-4 h-4 text-indigo-600" /> Enviar Proposta de Acompanhamento</h3>
              <div className="space-y-3">
                <div><Label>Valor mensal / total (R$) *</Label><Input type="number" step="0.01" value={propostaValor} onChange={e => setPropostaValor(e.target.value)} placeholder="0,00" /></div>
                <div><Label>Descrição da Proposta *</Label><Textarea value={propostaDesc} onChange={e => setPropostaDesc(e.target.value)} placeholder="Descreva como você acompanhará o projeto..." rows={4} /></div>
                <Button onClick={handleEnviarProposta} disabled={!propostaValor || !propostaDesc || update.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                  <Send className="w-4 h-4 mr-2" /> Enviar Proposta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  /* ─── EMPREENDEDOR VIEW ─── */
  return (
    <div className="space-y-6">
      {/* Status atual */}
      {consultorAprovado && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-green-800 font-semibold">Consultor aprovado: {projeto.consultor_nome}</p>
            <p className="text-green-700 text-xs">{projeto.consultor_email}</p>
          </div>
        </div>
      )}

      {/* Configurar busca */}
      {!consultorAprovado && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" /> Buscar Consultor</h3>
            <div className="space-y-3">
              <div>
                <Label>Tipo de busca</Label>
                <Select value={busca} onValueChange={setBusca}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Sem consultor</SelectItem>
                    <SelectItem value="direto">Solicitar consultor específico</SelectItem>
                    <SelectItem value="aberto">Abrir para propostas de consultores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {busca === "direto" && (
                <div>
                  <Label>E-mail do consultor</Label>
                  <Input value={consultorEmail} onChange={e => setConsultorEmail(e.target.value)} placeholder="consultor@email.com" />
                </div>
              )}
              <Button onClick={handleSaveBusca} disabled={update.isPending} className="bg-indigo-600 hover:bg-indigo-700">Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Propostas recebidas */}
      {(projeto.propostas_consultor?.length > 0) && (
        <div>
          <h3 className="font-semibold mb-3">
            Propostas Recebidas
            <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{projeto.propostas_consultor.filter(p => p.status === "aguardando").length} aguardando</span>
          </h3>
          <div className="space-y-3">
            {projeto.propostas_consultor.map(p => (
              <PropostaCard
                key={p.id}
                proposta={p}
                role="empreendedor"
                onAceitar={() => handleAceitar(p.id)}
                onRejeitar={() => handleRejeitar(p.id)}
                onContraproposta={(val, msg) => handleContraproposta(p.id, val, msg, "empreendedor")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Credenciais e template (só se há consultor aprovado) */}
      {consultorAprovado && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Link2 className="w-4 h-4 text-indigo-600" /> Acesso à Plataforma</h3>
              <Button size="sm" variant="outline" onClick={() => setEditCreds(!editCreds)}>
                {editCreds ? "Cancelar" : "Editar"}
              </Button>
            </div>
            {editCreds ? (
              <div className="space-y-3">
                <div><Label>URL da plataforma</Label><Input value={platUrl} onChange={e => setPlatUrl(e.target.value)} placeholder="https://..." /></div>
                <div><Label>Login</Label><Input value={platLogin} onChange={e => setPlatLogin(e.target.value)} /></div>
                <div><Label>Senha</Label>
                  <div className="relative">
                    <Input type={showSenha ? "text" : "password"} value={platSenha} onChange={e => setPlatSenha(e.target.value)} className="pr-10" />
                    <button onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleSaveCreds} className="bg-indigo-600 hover:bg-indigo-700">Salvar Credenciais</Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {projeto.plataforma_url ? (
                  <a href={projeto.plataforma_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">{projeto.plataforma_url}</a>
                ) : "Nenhuma credencial cadastrada. O consultor precisará do acesso para gerenciar o projeto."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template de relatório */}
      {consultorAprovado && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Template de Relatório</h3>
            {projeto.template_relatorio_url ? (
              <div className="flex items-center gap-3">
                <a href={projeto.template_relatorio_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-sm underline">Baixar template atual</a>
                <Label htmlFor="tpl-upload" className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 border rounded px-2 py-1">Substituir</Label>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">Faça upload do modelo de relatório para que o consultor possa preencher e baixar.</p>
                <Label htmlFor="tpl-upload" className="cursor-pointer inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg">
                  <Upload className="w-4 h-4" /> Upload do Template
                </Label>
              </div>
            )}
            <input id="tpl-upload" type="file" className="hidden" onChange={handleUploadTemplate} accept=".pdf,.doc,.docx,.xlsx" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}