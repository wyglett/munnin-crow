import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bell, Send, Users, Loader2, Mail, Eye, Edit2, CheckCheck, X, User, Users2 } from "lucide-react";

const TIPO_OPTIONS = [
  { value: "aviso", label: "⚠️ Aviso" },
  { value: "novo_recurso", label: "✨ Novo Recurso" },
  { value: "correcao", label: "🔧 Correção" },
  { value: "admin_modificou", label: "🛡️ Modificação Admin" },
  { value: "sistema", label: "ℹ️ Sistema" },
];

const PUBLICO_OPTIONS = [
  { value: "todos", label: "Todos os usuários" },
  { value: "empreendedores", label: "Apenas Empreendedores" },
  { value: "consultores", label: "Apenas Consultores" },
  { value: "especifico", label: "Usuário específico" },
];

export default function NotificacoesAdminPanel() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({
    titulo: "", mensagem: "", tipo: "aviso",
    publico: "todos", destinatario_email: "",
    enviar_email: false,
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios-admin"],
    queryFn: () => base44.entities.User.list("-created_date", 200),
  });

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ["notificacoes-admin"],
    queryFn: () => base44.entities.NotificacaoPlataforma.list("-created_date", 50),
  });

  const reset = () => {
    setForm({ titulo: "", mensagem: "", tipo: "aviso", publico: "todos", destinatario_email: "", enviar_email: false });
    setPreviewEmail(false);
  };

  const enviarMutation = useMutation({
    mutationFn: async (data) => {
      setEnviando(true);

      // Determina destinatários
      let destinatarios = [];
      if (data.publico === "todos") {
        destinatarios = usuarios.filter(u => u.email);
      } else if (data.publico === "empreendedores") {
        destinatarios = usuarios.filter(u => u.tipo_usuario === "empreendedor" || (u.role !== "admin" && u.role !== "consultor"));
      } else if (data.publico === "consultores") {
        destinatarios = usuarios.filter(u => u.tipo_usuario === "consultor" || u.role === "consultor");
      } else if (data.publico === "especifico") {
        const u = usuarios.find(x => x.email === data.destinatario_email);
        if (u) destinatarios = [u];
      }

      for (const u of destinatarios) {
        await base44.entities.NotificacaoPlataforma.create({
          user_email: u.email,
          titulo: data.titulo,
          mensagem: data.mensagem,
          tipo: data.tipo,
          lida: false,
          para_todos: data.publico === "todos",
        });

        // Envio por e-mail via integração Core
        if (data.enviar_email) {
          await base44.integrations.Core.SendEmail({
            to: u.email,
            subject: `[Munnin Crow] ${data.titulo}`,
            body: `
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
  <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
    <h1 style="color: white; font-size: 20px; margin: 0;">Munnin Crow</h1>
  </div>
  <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">${data.titulo}</h2>
    <p style="color: #475569; line-height: 1.6; white-space: pre-wrap;">${data.mensagem}</p>
  </div>
  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
    Você recebeu esta mensagem como usuário da plataforma Munnin Crow.
  </p>
</div>`,
          });
        }
      }
    },
    onSuccess: () => {
      setEnviando(false);
      queryClient.invalidateQueries({ queryKey: ["notificacoes-admin"] });
      setOpen(false);
      reset();
    },
    onError: () => setEnviando(false),
  });

  const nUnread = notifs.filter(n => !n.lida).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Central de Notificações</h3>
          <p className="text-xs text-gray-500">Notifique usuários via plataforma e/ou e-mail</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Bell className="w-4 h-4 mr-2" /> Nova Notificação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{notifs.length}</p>
          <p className="text-xs text-gray-500">Total enviadas</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-indigo-600">{nUnread}</p>
          <p className="text-xs text-gray-500">Não lidas</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{notifs.filter(n => n.lida).length}</p>
          <p className="text-xs text-gray-500">Lidas</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{usuarios.length}</p>
          <p className="text-xs text-gray-500">Usuários</p>
        </CardContent></Card>
      </div>

      {/* Histórico */}
      <p className="text-sm font-medium text-gray-700 mb-2">Notificações Recentes</p>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="space-y-2">
          {notifs.slice(0, 20).map(n => (
            <div key={n.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:border-indigo-200 transition-colors">
              <Bell className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                  <Badge variant="outline" className="text-xs">{n.tipo}</Badge>
                  {n.lida && <Badge className="bg-green-100 text-green-700 text-xs">Lida</Badge>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Para: {n.user_email || (n.para_todos ? "Todos" : "-")}</p>
                <p className="text-xs text-gray-400 truncate">{n.mensagem}</p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">{new Date(n.created_date).toLocaleDateString("pt-BR")}</p>
            </div>
          ))}
          {notifs.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhuma notificação enviada ainda</div>
          )}
        </div>
      )}

      {/* Modal de nova notificação */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Nova Notificação
            </DialogTitle>
          </DialogHeader>

          {previewEmail ? (
            // Preview do e-mail
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-700">Preview do E-mail</p>
                <Button size="sm" variant="outline" onClick={() => setPreviewEmail(false)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </div>
              <div className="border rounded-xl overflow-hidden bg-slate-50 text-sm">
                <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "16px", textAlign: "center" }}>
                  <p style={{ color: "white", fontWeight: "bold", margin: 0 }}>Munnin Crow</p>
                </div>
                <div className="p-4 bg-white m-2 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-800 mb-2">{form.titulo || "(sem título)"}</p>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{form.mensagem || "(sem mensagem)"}</p>
                </div>
                <p className="text-center text-xs text-slate-400 pb-3">Você recebeu esta mensagem como usuário da plataforma Munnin Crow.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tipo */}
              <div>
                <Label>Tipo de Notificação</Label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                  {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Público-alvo */}
              <div>
                <Label>Público-alvo</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {PUBLICO_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, publico: o.value }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                        form.publico === o.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {o.value === "todos" && <Users2 className="w-3 h-3 inline mr-1" />}
                      {o.value === "especifico" && <User className="w-3 h-3 inline mr-1" />}
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Usuário específico */}
              {form.publico === "especifico" && (
                <div>
                  <Label>Selecionar Usuário</Label>
                  <select value={form.destinatario_email} onChange={e => setForm(f => ({ ...f, destinatario_email: e.target.value }))}
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                    <option value="">Selecione...</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.email}>{u.full_name || u.email} ({u.tipo_usuario || u.role || "user"})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Nova funcionalidade disponível" />
              </div>

              <div>
                <Label>Mensagem *</Label>
                <Textarea value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} rows={4} placeholder="Descreva detalhadamente..." />
              </div>

              {/* Opção de e-mail */}
              <div className="border border-indigo-100 rounded-xl p-3 bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enviar_email"
                    checked={form.enviar_email}
                    onChange={e => setForm(f => ({ ...f, enviar_email: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="enviar_email" className="cursor-pointer flex items-center gap-2 mb-0">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">Também enviar por e-mail</span>
                  </Label>
                </div>
                {form.enviar_email && (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-xs text-indigo-600 flex-1">
                      Um e-mail HTML será enviado para cada destinatário com o conteúdo acima.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setPreviewEmail(true)} className="text-xs border-indigo-300 text-indigo-700">
                      <Eye className="w-3 h-3 mr-1" /> Preview
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
            {!previewEmail && (
              <Button
                disabled={!form.titulo || !form.mensagem || (form.publico === "especifico" && !form.destinatario_email) || enviando || enviarMutation.isPending}
                onClick={() => enviarMutation.mutate(form)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {enviando || enviarMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Enviar</>
                )}
              </Button>
            )}
            {previewEmail && (
              <Button onClick={() => enviarMutation.mutate(form)} disabled={enviando} className="bg-indigo-600 hover:bg-indigo-700">
                <Mail className="w-4 h-4 mr-2" /> Confirmar e Enviar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}