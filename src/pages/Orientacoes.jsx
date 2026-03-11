import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Search } from "lucide-react";

import OrientacaoCard from "../components/orientacoes/OrientacaoCard";
import OrientacaoViewer from "../components/orientacoes/OrientacaoViewer";
import OrientacaoFormModal from "../components/orientacoes/OrientacaoFormModal";

const CATEGORIAS = [
  { value: "all", label: "Todos" },
  { value: "submissao_proposta", label: "Submissão" },
  { value: "escrita_material", label: "Escrita" },
  { value: "gestao_projeto", label: "Gestão" },
  { value: "elaboracao_relatorio", label: "Relatório" },
  { value: "captacao_recursos", label: "Captação" },
];

export default function Orientacoes() {
  const [user, setUser] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isConsultor = user?.tipo_usuario === "consultor" || user?.role === "admin";

  const { data: orientacoes = [] } = useQuery({
    queryKey: ["orientacoes"],
    queryFn: () => base44.entities.Orientacao.list("-created_date", 100),
  });

  // Filtrar por acesso: se acesso_livre=false, só exibe se o email do user estiver em clientes_liberados ou é o dono/admin
  const visibleOrientacoes = orientacoes.filter((o) => {
    if (!user) return o.acesso_livre !== false;
    if (user.role === "admin") return true;
    if (o.consultor_email === user.email) return true;
    if (o.acesso_livre !== false) return true;
    return (o.clientes_liberados || []).includes(user.email);
  });

  const filtered = visibleOrientacoes.filter((o) => {
    const matchSearch = !search || o.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      o.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      o.direcionado_orgao?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || o.categoria === catFilter;
    return matchSearch && matchCat;
  });

  const handleDelete = async (o) => {
    if (!confirm(`Remover "${o.titulo}"?`)) return;
    await base44.entities.Orientacao.delete(o.id);
    queryClient.invalidateQueries(["orientacoes"]);
  };

  const openEdit = (o) => { setEditItem(o); setFormOpen(true); };
  const openNew = () => { setEditItem(null); setFormOpen(true); };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orientações</h1>
            <p className="text-gray-500 text-sm mt-0.5">Materiais de apoio: vídeos, apresentações e PDFs</p>
          </div>
          {isConsultor && (
            <Button onClick={openNew} className="gap-2">
              <Plus className="w-4 h-4" /> Adicionar Conteúdo
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por título, órgão..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS.map(c => (
              <button
                key={c.value}
                onClick={() => setCatFilter(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  catFilter === c.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum material disponível</p>
              {isConsultor && (
                <Button variant="outline" className="mt-4 gap-2" onClick={openNew}>
                  <Plus className="w-4 h-4" /> Adicionar primeiro conteúdo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((o) => (
              <OrientacaoCard
                key={o.id}
                orientacao={o}
                onView={() => setViewing(o)}
                onEdit={() => openEdit(o)}
                onDelete={() => handleDelete(o)}
                isOwner={user?.email === o.consultor_email || user?.role === "admin"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Viewer */}
      {viewing && <OrientacaoViewer orientacao={viewing} onClose={() => setViewing(null)} />}

      {/* Form Modal */}
      <OrientacaoFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => queryClient.invalidateQueries(["orientacoes"])}
        orientacao={editItem}
      />
    </div>
  );
}