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
import { Bell, Send, Users, Loader2, CheckCircle } from "lucide-react";

const TIPO_LABELS = {
  modificacao_admin: "Modificação",
  novo_recurso: "Novo Recurso",
  correcao: "Correção",
  info: "Informação",
};

export default function NotificarUsuariosAdmin() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [enviados, setEnviados] = useState(0);
  const [form, setForm] = useState({
    titulo: "", mensagem: "", tipo: "info", destinatario_email: "",
    para_todos: false, mudancas: "", entidade_titulo: "",
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios-admin"],
    queryFn: () => base44.entities.User.list("-created_date", 200),
  });

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ["notificacoes-admin"],
    queryFn: () => base44.entities.NotificacaoPlataforma.list("-created_date", 50),
  });

  const enviarMutation = useMutation({
    mutationFn: async (data) => {
      if (data.para_todos) {
        const ativos = usuarios.filter(u => u.email);
        setEnviados(0);
        for (const u of ativos) {
          await base44.entities.NotificacaoPlataforma.create({
            destinatario_email: u.email,
            titulo: data.titulo,
            mensagem: data.mensagem,
            tipo: data.tipo,
            mudancas: data.mudancas,
            entidade_titulo: data.entidade_titulo,
            lida: false,
          });
          setEnviados(prev => prev + 1);
        }
      } else {
        await base44.entities.NotificacaoPlataforma.create({
          destinatario_email: data.destinatario_email,
          titulo: data.titulo,
          mensagem: data.mensagem,
          tipo: data.tipo,
          mudancas: data.mudancas,
          entidade_titulo: data.entidade_titulo,
          lida: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notificacoes-admin"]);
      setOpen(false);
      setForm({ titulo: "", mensagem: "", tipo: "info", destinatario_email: "", para_todos: false, mudancas: "", entidade_titulo: "" });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Central de Notificações</h3>
          <p className="text-xs text-gray-500">Notifique usuários sobre mudanças, melhorias e correções</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Bell className="w-4 h-4 mr-2" /> Nova Notificação
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(TIPO_LABELS).map(([tipo, label]) => {
          const count = notifs.filter(n => n.tipo === tipo).length;
          return (
            <Card key={tipo}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Histórico */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-2">Notificações Recentes</p>
          {notifs.slice(0, 20).map(n => (
            <div key={n.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:border-indigo-200 transition-colors">
              <Bell className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                  <Badge variant="outline" className="text-xs">{TIPO_LABELS[n.tipo] || n.tipo}</Badge>
                  {n.lida && <Badge className="bg-green-100 text-green-700 text-xs">Lida</Badge>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Para: {n.destinatario_email}</p>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Notificação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm">
                {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="para_todos" checked={form.para_todos} onChange={e => setForm(f => ({ ...f, para_todos: e.target.checked }))} className="rounded" />
              <Label htmlFor="para_todos" className="cursor-pointer flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Enviar para todos os usuários
              </Label>
            </div>
            {!form.para_todos && (
              <div>
                <Label>E-mail do Destinatário</Label>
                <select value={form.destinatario_email} onChange={e => setForm(f => ({ ...f, destinatario_email: e.target.value }))}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">Selecione um usuário</option>
                  {usuarios.map(u => <option key={u.id} value={u.email}>{u.full_name || u.email} ({u.role || "user"})</option>)}
                </select>
              </div>
            )}
            <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Correção no módulo de gastos" /></div>
            <div><Label>Mensagem *</Label><Textarea value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} rows={3} placeholder="Descreva a notificação..." /></div>
            <div><Label>Item / Recurso afetado (opcional)</Label><Input value={form.entidade_titulo} onChange={e => setForm(f => ({ ...f, entidade_titulo: e.target.value }))} placeholder="Ex: Módulo de Acompanhamento" /></div>
            <div><Label>O que mudou (opcional)</Label><Textarea value={form.mudancas} onChange={e => setForm(f => ({ ...f, mudancas: e.target.value }))} rows={2} placeholder="Descreva o que foi alterado/melhorado..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              disabled={!form.titulo || !form.mensagem || (!form.para_todos && !form.destinatario_email) || enviarMutation.isPending}
              onClick={() => enviarMutation.mutate(form)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {enviarMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando {form.para_todos && enviados > 0 ? `(${enviados})` : ""}...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Enviar Notificação</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}