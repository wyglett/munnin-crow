import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CheckCircle, XCircle, Mail } from "lucide-react";
import moment from "moment";

export default function UsuariosAdmin() {
  const [abaModo, setAbaModo] = useState("usuarios");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const queryClient = useQueryClient();

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios-admin"],
    queryFn: () => base44.asServiceRole.entities.User.list("-created_date", 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.User.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] })
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.asServiceRole.entities.User.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] })
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Gerenciar Usuários</h3>
          <p className="text-sm text-slate-500 mt-1">Usuários e solicitações</p>
        </div>
        <Button className="gap-2 shadow-lg" onClick={() => setInviteOpen(true)}>
           <Plus className="w-4 h-4" /> Convidar Usuário
         </Button>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setAbaModo("usuarios")}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            abaModo === "usuarios"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Usuários Ativos
        </button>
        <button
          onClick={() => setAbaModo("solicitacoes")}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            abaModo === "solicitacoes"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Solicitações
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {abaModo === "usuarios" ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Cadastro</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {usuarios.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-slate-900">{user.full_name}</p>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {user.tipo_usuario || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={user.role || "user"}
                      onChange={(e) => updateRoleMutation.mutate({ id: user.id, role: e.target.value })}
                      className="text-xs border border-slate-300 rounded px-2 py-1"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">
                    {moment(user.created_date).format("DD/MM/YY")}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => deleteMutation.mutate(user.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Nenhuma solicitação pendente</p>
            <p className="text-sm mt-1">As solicitações de cadastro aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}