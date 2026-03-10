import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Receipt, Upload, CheckCircle, Clock, AlertCircle, DollarSign,
  FileText, Loader2, Plus, Eye, Building2, User
} from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_RECIBO = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  enviado: { label: "Enviado", color: "bg-blue-100 text-blue-800", icon: FileText },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

const TIPO_LABELS = { recibo: "Recibo", nf: "NF", nfse: "NF-e/NFS-e", outro: "Outro" };

export default function ConsultorGestao() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRecibo, setViewRecibo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    empreendedor_email: "", projeto_titulo: "", projeto_id: "",
    descricao_servico: "", valor: "", data_emissao: "", tipo: "recibo", observacao: ""
  });
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: recibos = [], isLoading } = useQuery({
    queryKey: ["recibos-consultor", user?.email],
    queryFn: () => base44.entities.ReciboPagamento.filter({ consultor_email: user.email }, "-created_date", 100),
    enabled: !!user?.email,
  });

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["solicitacoes-minhas", user?.email],
    queryFn: () => base44.entities.SolicitacaoTutoria.filter({ consultor_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: projetos = [] } = useQuery({
    queryKey: ["projetos-consultor", user?.email],
    queryFn: () => base44.entities.AcompanhamentoProjeto.filter({ consultor_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: todosEmpreendedores = [] } = useQuery({
    queryKey: ["usuarios-empreendedores"],
    queryFn: () => base44.entities.User.filter({ tipo_usuario: "empreendedor" }, "full_name", 100),
    enabled: !!user?.email,
  });

  const criarRecibo = useMutation({
    mutationFn: async (data) => {
      return base44.entities.ReciboPagamento.create({
        ...data,
        consultor_email: user.email,
        consultor_nome: user.full_name,
        valor: parseFloat(data.valor),
        arquivo_url: fileUrl || undefined,
        arquivo_nome: fileName || undefined,
        status: fileUrl ? "enviado" : "pendente",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recibos-consultor"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({ empreendedor_email: "", projeto_titulo: "", projeto_id: "", descricao_servico: "", valor: "", data_emissao: "", tipo: "recibo", observacao: "" });
    setFileUrl("");
    setFileName("");
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);
    setFileName(file.name);
    setUploading(false);
  };

  const totais = {
    total: recibos.reduce((s, r) => s + (r.valor || 0), 0),
    confirmados: recibos.filter(r => r.status === "confirmado").reduce((s, r) => s + (r.valor || 0), 0),
    pendentes: recibos.filter(r => r.status !== "confirmado").length,
  };

  const emAtendimento = solicitacoes.filter(s => s.status === "em_atendimento").length;
  const concluidas = solicitacoes.filter(s => s.status === "concluida").length;

  if (!user) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Consultor</h1>
            <p className="text-gray-500 text-sm mt-1">Controle seus projetos, tarefas e documentos financeiros</p>
          </div>
          {user.pessoa_juridica && (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs font-semibold text-purple-700">{user.nome_fantasia || user.razao_social}</p>
                <p className="text-xs text-purple-500">CNPJ: {user.cnpj}</p>
              </div>
            </div>
          )}
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Faturado", value: fmt(totais.total), sub: "todos recibos", icon: DollarSign, color: "text-green-600" },
            { label: "Confirmados", value: fmt(totais.confirmados), sub: "recebidos", icon: CheckCircle, color: "text-blue-600" },
            { label: "Em Atendimento", value: emAtendimento, sub: "consultorias ativas", icon: Clock, color: "text-yellow-600" },
            { label: "Concluídas", value: concluidas, sub: "consultorias", icon: Receipt, color: "text-indigo-600" },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <c.icon className={`w-4 h-4 ${c.color}`} />
                </div>
                <p className="text-xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-400">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="recibos">
          <TabsList>
            <TabsTrigger value="recibos">Recibos / NFs</TabsTrigger>
            <TabsTrigger value="tarefas">Tarefas por Projeto</TabsTrigger>
            <TabsTrigger value="projetos">Projetos Ativos</TabsTrigger>
          </TabsList>

          {/* ABA RECIBOS */}
          <TabsContent value="recibos" className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800">Documentos Financeiros</h2>
              <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> Novo Recibo / NF
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
            ) : recibos.length === 0 ? (
              <Card><CardContent className="text-center py-10 text-gray-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                Nenhum recibo cadastrado ainda
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {recibos.map(r => {
                  const s = STATUS_RECIBO[r.status] || STATUS_RECIBO.pendente;
                  const Icon = s.icon;
                  return (
                    <Card key={r.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-gray-900 truncate">{r.descricao_servico}</p>
                            <Badge className={`text-xs ${s.color}`}>
                              <Icon className="w-3 h-3 mr-1" />{s.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{TIPO_LABELS[r.tipo]}</Badge>
                          </div>
                          <p className="text-sm text-indigo-600">{r.projeto_titulo || r.empreendedor_email}</p>
                          <p className="text-xs text-gray-400">Para: {r.empreendedor_email} · {r.data_emissao}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900">{fmt(r.valor)}</p>
                          <div className="flex gap-1 mt-1 justify-end">
                            {r.arquivo_url && (
                              <a href={r.arquivo_url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="text-xs h-7">
                                  <Eye className="w-3 h-3 mr-1" /> Ver arquivo
                                </Button>
                              </a>
                            )}
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setViewRecibo(r)}>Detalhes</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ABA TAREFAS */}
          <TabsContent value="tarefas" className="mt-4">
            <div className="space-y-3">
              {solicitacoes.length === 0 ? (
                <Card><CardContent className="text-center py-10 text-gray-400">Nenhuma consultoria registrada</CardContent></Card>
              ) : solicitacoes.map(s => (
                <Card key={s.id} className="border-l-4 border-l-indigo-400">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{s.titulo}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{s.descricao}</p>
                        <p className="text-xs text-indigo-600 mt-1">Empreendedor: {s.empreendedor_nome || s.empreendedor_email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={{
                          pendente: "bg-yellow-100 text-yellow-800",
                          em_negociacao: "bg-blue-100 text-blue-800",
                          em_atendimento: "bg-green-100 text-green-800",
                          concluida: "bg-gray-100 text-gray-700",
                        }[s.status]}>
                          {s.status?.replace("_", " ")}
                        </Badge>
                        {s.status === "em_atendimento" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs h-7"
                            onClick={() => {
                              setForm(f => ({
                                ...f,
                                empreendedor_email: s.empreendedor_email,
                                projeto_titulo: s.titulo,
                                solicitacao_id: s.id,
                                descricao_servico: `Consultoria: ${s.titulo}`,
                              }));
                              setDialogOpen(true);
                            }}
                          >
                            <Receipt className="w-3 h-3 mr-1" /> Emitir Recibo
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ABA PROJETOS */}
          <TabsContent value="projetos" className="mt-4">
            <div className="space-y-3">
              {projetos.length === 0 ? (
                <Card><CardContent className="text-center py-10 text-gray-400">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Nenhum projeto associado
                </CardContent></Card>
              ) : projetos.map(p => (
                <Card key={p.id} className="border-l-4 border-l-purple-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{p.titulo}</h3>
                        <p className="text-sm text-gray-500">{p.orgao_financiador}</p>
                        <p className="text-xs text-gray-400 mt-1">Empreendedor: {p.created_by}</p>
                      </div>
                      <div className="text-right">
                        {p.valor_contratado && <p className="font-bold text-green-700">{fmt(p.valor_contratado)}</p>}
                        <Button
                          size="sm"
                          className="mt-1 bg-purple-600 hover:bg-purple-700 text-xs h-7"
                          onClick={() => {
                            setForm(f => ({
                              ...f,
                              empreendedor_email: p.created_by,
                              projeto_titulo: p.titulo,
                              projeto_id: p.id,
                              descricao_servico: `Consultoria no projeto: ${p.titulo}`,
                            }));
                            setDialogOpen(true);
                          }}
                        >
                          <Receipt className="w-3 h-3 mr-1" /> Emitir Recibo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog novo recibo */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Recibo / NF</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Documento *</Label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="recibo">Recibo</option>
                  <option value="nf">NF</option>
                  <option value="nfse">NF-e / NFS-e</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <Label>Data de Emissão *</Label>
                <Input type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Empreendedor *</Label>
              <select
                value={form.empreendedor_email}
                onChange={e => {
                  const emp = todosEmpreendedores.find(u => u.email === e.target.value);
                  setForm(f => ({ ...f, empreendedor_email: e.target.value, empreendedor_nome: emp?.full_name || "" }));
                }}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione um empreendedor...</option>
                {todosEmpreendedores.map(u => (
                  <option key={u.id} value={u.email}>{u.full_name} ({u.email})</option>
                ))}
              </select>
              {form.empreendedor_email && !todosEmpreendedores.find(u => u.email === form.empreendedor_email) && (
                <Input className="mt-1" value={form.empreendedor_email} onChange={e => setForm(f => ({ ...f, empreendedor_email: e.target.value }))} placeholder="Ou digite o e-mail manualmente" />
              )}
            </div>
            <div>
              <Label>Projeto</Label>
              <select
                value={form.projeto_id || ""}
                onChange={e => {
                  const p = projetos.find(proj => proj.id === e.target.value);
                  setForm(f => ({ ...f, projeto_id: e.target.value, projeto_titulo: p?.titulo || "" }));
                }}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione um projeto (opcional)</option>
                {projetos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
              {!form.projeto_id && (
                <Input className="mt-1" value={form.projeto_titulo} onChange={e => setForm(f => ({ ...f, projeto_titulo: e.target.value }))} placeholder="Ou informe o nome da consultoria" />
              )}
            </div>
            <div>
              <Label>Descrição do Serviço *</Label>
              <Textarea value={form.descricao_servico} onChange={e => setForm(f => ({ ...f, descricao_servico: e.target.value }))} rows={2} placeholder="Descreva o serviço prestado" />
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" />
            </div>

            {/* Upload do arquivo */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <Label className="text-indigo-700 font-semibold">Anexar Recibo / NF (PDF)</Label>
              <p className="text-xs text-indigo-600 mb-2">Faça upload do documento para disponibilizar ao empreendedor</p>
              {fileUrl ? (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded p-2">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{fileName}</a>
                  <button type="button" onClick={() => { setFileUrl(""); setFileName(""); }} className="ml-auto text-red-400">✕</button>
                </div>
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? "Enviando..." : "Upload do Arquivo (PDF)"}
                  <input type="file" className="hidden" accept=".pdf,.png,.jpg" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} placeholder="Observações adicionais..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Cancelar</Button>
            <Button
              onClick={() => criarRecibo.mutate(form)}
              disabled={criarRecibo.isPending || !form.empreendedor_email || !form.descricao_servico || !form.valor}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {criarRecibo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cadastrar {TIPO_LABELS[form.tipo]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ver detalhes */}
      <Dialog open={!!viewRecibo} onOpenChange={() => setViewRecibo(null)}>
        {viewRecibo && (
          <DialogContent>
            <DialogHeader><DialogTitle>Detalhes do Documento</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Tipo</p><p className="font-medium">{TIPO_LABELS[viewRecibo.tipo]}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><Badge className={STATUS_RECIBO[viewRecibo.status]?.color}>{STATUS_RECIBO[viewRecibo.status]?.label}</Badge></div>
                <div><p className="text-xs text-gray-500">Valor</p><p className="font-bold text-green-700">{fmt(viewRecibo.valor)}</p></div>
                <div><p className="text-xs text-gray-500">Data</p><p>{viewRecibo.data_emissao}</p></div>
              </div>
              <div><p className="text-xs text-gray-500">Empreendedor</p><p>{viewRecibo.empreendedor_email}</p></div>
              <div><p className="text-xs text-gray-500">Projeto</p><p>{viewRecibo.projeto_titulo || "—"}</p></div>
              <div><p className="text-xs text-gray-500">Descrição do Serviço</p><p>{viewRecibo.descricao_servico}</p></div>
              {viewRecibo.observacao && <div><p className="text-xs text-gray-500">Observações</p><p>{viewRecibo.observacao}</p></div>}
              {viewRecibo.arquivo_url && (
                <a href={viewRecibo.arquivo_url} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2">
                    <Eye className="w-4 h-4 mr-2" /> Visualizar Arquivo
                  </Button>
                </a>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}