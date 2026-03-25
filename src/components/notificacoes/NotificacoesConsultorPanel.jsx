import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bell, Send, Loader2, Users, User } from "lucide-react";

export default function NotificacoesConsultorPanel({ user }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", mensagem: "", destinatario_email: "", para_todos_clientes: false });

  // Busca os empreendedores sob atendimento do consultor
  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["solicitacoes-consultor", user?.email],
    queryFn: () => base44.entities.SolicitacaoTutoria.filter({ consultor_email: user.email, status: "em_atendimento" }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: projetos = [] } = useQuery({
    queryKey: ["projetos-consultor", user?.email],
    queryFn: () => base44.entities.AcompanhamentoProjeto.filter({ consultor_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  // Empreendedores únicos sob atendimento
  const empreendedores = React.useMemo(() => {
    const map = new Map();
    solicitacoes.forEach(s => {
      if (s.empreendedor_email) map.set(s.empreendedor_email, s.empreendedor_nome || s.empreendedor_email);
    });
    projetos.forEach(p => {
      // owner do projeto (created_by)
      if (p.created_by) map.set(p.created_by, p.created_by);
    });
    return Array.from(map.entries()).map(([email, nome]) => ({ email, nome }));
  }, [solicitacoes, projetos]);

  const { data: notifEnviadas = [], isLoading } = useQuery({
    queryKey: ["notifs-consultor-enviadas", user?.email],
    queryFn: () => base44.entities.NotificacaoPlataforma.filter({ created_by: user.email }, "-created_date", 30),
    enabled: !!user?.email,
  });

  const enviarMutation = useMutation({
    mutationFn: async (data) => {
      const destinatarios = data.para_todos_clientes
        ? empreendedores
        : empreendedores.filter(e => e.email === data.destinatario_email);

      for (const dest of destinatarios) {
        await base44.entities.NotificacaoPlataforma.create({
          user_email: dest.email,
          titulo: data.titulo,
          mensagem: data.mensagem,
          tipo: "aviso",
          lida: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifs-consultor-enviadas"] });
      setOpen(false);
      setForm({ titulo: "", mensagem: "", destinatario_email: "", para_todos_clientes: false });
    },
  });

  if (!user) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Notificações para Clientes</h3>
          <p className="text-xs text-gray-500">
            Envie mensagens para os empreendedores sob seu atendimento
            {empreendedores.length > 0 && ` (${empreendedores.length} cliente${empreendedores.length !== 1 ? "s" : ""})`}
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          disabled={empreendedores.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Bell className="w-4 h-4 mr-2" /> Notificar
        </Button>
      </div>

      {empreendedores.length === 0 && (
        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">Nenhum empreendedor em atendimento ativo</p>
        </div>
      )}

      {/* Clientes em atendimento */}
      {empreendedores.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Seus Clientes</p>
          <div className="flex flex-wrap gap-2">
            {empreendedores.map(e => (
              <div key={e.email} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-700">
                <User className="w-3 h-3 text-slate-400" />
                {e.nome || e.email}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico de notificações enviadas */}
      <p className="text-sm font-medium text-gray-700 mb-2">Notificações Enviadas</p>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="space-y-2">
          {notifEnviadas.slice(0, 15).map(n => (
            <div key={n.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:border-indigo-200 transition-colors">
              <Bell className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                <p className="text-xs text-gray-500">Para: {n.user_email}</p>
                <p className="text-xs text-gray-400 truncate">{n.mensagem}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                {n.lida
                  ? <Badge className="bg-green-100 text-green-700 text-[10px]">Lida</Badge>
                  : <Badge className="bg-amber-100 text-amber-700 text-[10px]">Pendente</Badge>
                }
                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_date).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          ))}
          {notifEnviadas.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">Nenhuma notificação enviada ainda</div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Nova Notificação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Destinatário */}
            <div>
              <Label>Destinatário</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="checkbox"
                  id="para_todos_clientes"
                  checked={form.para_todos_clientes}
                  onChange={e => setForm(f => ({ ...f, para_todos_clientes: e.target.checked, destinatario_email: "" }))}
                  className="rounded"
                />
                <Label htmlFor="para_todos_clientes" className="cursor-pointer flex items-center gap-1.5 mb-0 text-sm">
                  <Users className="w-3.5 h-3.5" /> Todos os meus clientes ({empreendedores.length})
                </Label>
              </div>
              {!form.para_todos_clientes && (
                <select
                  value={form.destinatario_email}
                  onChange={e => setForm(f => ({ ...f, destinatario_email: e.target.value }))}
                  className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">Selecione um cliente...</option>
                  {empreendedores.map(e => (
                    <option key={e.email} value={e.email}>{e.nome || e.email}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Atualização no projeto" />
            </div>

            <div>
              <Label>Mensagem *</Label>
              <Textarea value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} rows={4} placeholder="Escreva sua mensagem..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              disabled={!form.titulo || !form.mensagem || (!form.para_todos_clientes && !form.destinatario_email) || enviarMutation.isPending}
              onClick={() => enviarMutation.mutate(form)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {enviarMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                : <><Send className="w-4 h-4 mr-2" /> Enviar</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}