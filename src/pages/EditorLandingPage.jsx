import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Save, Plus, Trash2 } from "lucide-react";

export default function EditorLandingPage() {
  const { id } = useParams();
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: page } = useQuery({
    queryKey: ["landing-page", id],
    queryFn: () => base44.entities.PaginaDestino.list().then(pages => pages.find(p => p.id === id)),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.PaginaDestino.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["landing-page", id] })
  });

  React.useEffect(() => {
    if (page) setFormData(page);
  }, [page]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (!page) return <div className="p-6">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">{formData.titulo}</h1>
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" /> Salvar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
        {/* Painel de edição */}
        <div className="col-span-2 space-y-6">
          {/* Configurações Gerais */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Configurações Gerais</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  value={formData.titulo || ""}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug da URL</label>
                <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">/{formData.slug}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tema</label>
                <select
                  value={formData.tema || "minimalista"}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="minimalista">Minimalista</option>
                  <option value="corporativo">Corporativo</option>
                  <option value="colorido">Colorido</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seções */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-900">Seções</h2>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {formData.layout?.secoes?.map((secao, idx) => (
                <div key={secao.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{secao.tipo}</p>
                      <p className="text-xs text-slate-500">{secao.titulo}</p>
                    </div>
                    <button className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Formulário de Captação</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Formulário</label>
                <input
                  type="text"
                  value={formData.formulario?.titulo || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    formulario: { ...formData.formulario, titulo: e.target.value }
                  })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Integração de Email</label>
                <select
                  value={formData.formulario?.integracao_email?.provedor || "propria"}
                  onChange={(e) => setFormData({
                    ...formData,
                    formulario: {
                      ...formData.formulario,
                      integracao_email: { ...formData.formulario?.integracao_email, provedor: e.target.value }
                    }
                  })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="propria">Armazenar em banco de dados</option>
                  <option value="mailchimp">Mailchimp</option>
                  <option value="brevo">Brevo (Sendinblue)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-20">
            <h3 className="font-semibold text-slate-900 mb-4">Preview</h3>
            <div className="border border-slate-200 rounded-lg h-96 bg-slate-50 flex items-center justify-center">
              <p className="text-slate-400 text-center text-sm">
                Preview da página<br/>
                /{formData.slug}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}