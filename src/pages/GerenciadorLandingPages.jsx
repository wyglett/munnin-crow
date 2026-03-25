import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash2, Copy } from "lucide-react";
import moment from "moment";

export default function GerenciadorLandingPages() {
  const [user, setUser] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: pages = [] } = useQuery({
    queryKey: ["landing-pages", user?.email],
    queryFn: () => user ? base44.entities.PaginaDestino.filter({ consultor_email: user.email }, "-created_date") : Promise.resolve([]),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (name) => base44.entities.PaginaDestino.create({
      titulo: name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      consultor_email: user?.email,
      layout: {
        cor_principal: "#6366f1",
        cor_secundaria: "#ec4899",
        secoes: [
          { id: "1", tipo: "hero", titulo: "Bem-vindo", conteudo: "Sua página aqui", ordem: 1 }
        ]
      },
      formulario: {
        titulo: "Deixe seu contato",
        campos: [
          { id: "1", nome: "nome", tipo: "texto", obrigatorio: true },
          { id: "2", nome: "email", tipo: "email", obrigatorio: true }
        ],
        mensagem_sucesso: "Obrigado! Em breve entraremos em contato."
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      setNewPageName("");
      setShowNewModal(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PaginaDestino.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["landing-pages"] })
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Landing Pages</h1>
            <p className="text-slate-600 mt-1">Crie e gerencie suas páginas de captação</p>
          </div>
          <Button onClick={() => setShowNewModal(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Página
          </Button>
        </div>

        {showNewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Criar Nova Página</h2>
              <input
                type="text"
                placeholder="Nome da página"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNewModal(false)} className="flex-1">Cancelar</Button>
                <Button onClick={() => createMutation.mutate(newPageName)} disabled={!newPageName} className="flex-1">Criar</Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <div key={page.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{page.titulo}</h3>
                  <p className="text-xs text-slate-500 mt-1">/{page.slug}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${page.status === "publicada" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {page.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">{moment(page.created_date).format("DD/MM/YYYY")}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1">
                  <Eye className="w-3 h-3" /> Ver
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1">
                  <Edit className="w-3 h-3" /> Editar
                </Button>
                <button onClick={() => deleteMutation.mutate(page.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">Nenhuma página criada ainda</p>
            <Button onClick={() => setShowNewModal(true)} className="mt-4">Criar primeira página</Button>
          </div>
        )}
      </div>
    </div>
  );
}