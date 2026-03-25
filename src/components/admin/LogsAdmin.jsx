import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPO_ACAO_LABELS = {
  edital_criado: "📋 Edital Criado",
  edital_deletado: "🗑️ Edital Deletado",
  edital_atualizado: "✏️ Edital Atualizado",
  usuario_criado: "👤 Usuário Criado",
  usuario_deletado: "❌ Usuário Deletado",
  usuario_role_alterado: "🔑 Role Alterada",
  notificacao_disparada: "📢 Notificação Disparada",
  modelo_criado: "📄 Modelo Criado",
  modelo_deletado: "🗑️ Modelo Deletado",
  modelo_atualizado: "✏️ Modelo Atualizado",
};

const STATUS_COLORS = {
  sucesso: "bg-green-50 border-green-200/60",
  erro: "bg-red-50 border-red-200/60",
};

const STATUS_BADGE = {
  sucesso: "bg-green-100 text-green-700",
  erro: "bg-red-100 text-red-700",
};

export default function LogsAdmin() {
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroEntidade, setFiltroEntidade] = useState("");

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.LogAcao.list("-created_date", 500),
    refetchInterval: 5000,
  });

  const logsFiltered = useMemo(() => {
    return logs.filter(log => {
      const matchTipo = filtroTipo === "todos" || log.tipo_acao === filtroTipo;
      const matchUsuario = !filtroUsuario || log.usuario_email?.toLowerCase().includes(filtroUsuario.toLowerCase()) || log.usuario_nome?.toLowerCase().includes(filtroUsuario.toLowerCase());
      const matchEntidade = !filtroEntidade || log.entidade_nome?.toLowerCase().includes(filtroEntidade.toLowerCase()) || log.entidade_id?.includes(filtroEntidade);
      return matchTipo && matchUsuario && matchEntidade;
    });
  }, [logs, filtroTipo, filtroUsuario, filtroEntidade]);

  if (error) {
    return (
      <div className="bg-red-50/80 border border-red-200/60 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-900">Erro ao carregar logs</p>
          <p className="text-xs text-red-700 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="border-slate-200/60 bg-white/70 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-900 text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1.5">Tipo de Ação</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-9 text-sm border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as ações</SelectItem>
                  {Object.entries(TIPO_ACAO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1.5">Usuário</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Email ou nome..."
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                  className="pl-9 h-9 text-sm border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1.5">Entidade</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Nome ou ID..."
                  value={filtroEntidade}
                  onChange={(e) => setFiltroEntidade(e.target.value)}
                  className="pl-9 h-9 text-sm border-slate-300"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-slate-200/60 bg-white/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 text-base">
            Registros de Ações ({logsFiltered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : logsFiltered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logsFiltered.map(log => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-3.5 transition-all hover:shadow-sm ${STATUS_COLORS[log.status]}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900">
                          {TIPO_ACAO_LABELS[log.tipo_acao] || log.tipo_acao}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[log.status]}`}>
                          {log.status === "sucesso" ? "✓ Sucesso" : "✗ Erro"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{log.descricao || `Ação em ${log.entidade_tipo}`}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-slate-500">Usuário</p>
                          <p className="text-slate-900 font-medium">{log.usuario_nome || log.usuario_email}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Entidade</p>
                          <p className="text-slate-900 font-medium truncate">{log.entidade_nome || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Tipo</p>
                          <p className="text-slate-900 font-medium">{log.entidade_tipo}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Data/Hora</p>
                          <p className="text-slate-900 font-medium">
                            {log.created_date ? format(new Date(log.created_date), "dd/MM HH:mm", { locale: ptBR }) : "—"}
                          </p>
                        </div>
                      </div>
                      {log.tempo_execucao_ms && (
                        <p className="text-xs text-slate-500 mt-2">⏱️ Tempo: {log.tempo_execucao_ms}ms</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}