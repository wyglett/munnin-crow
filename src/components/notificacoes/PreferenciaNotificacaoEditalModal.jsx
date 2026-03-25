import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

const CATEGORIAS = [
  { id: "inovacao_startups", label: "Inovação & Startups" },
  { id: "apoio_pesquisa", label: "Apoio à Pesquisa" },
  { id: "empreendedorismo", label: "Empreendedorismo" },
  { id: "bolsas_editais", label: "Bolsas & Editais" },
  { id: "outros_programas", label: "Outros Programas" },
];

const ESTADOS = ["ES", "RJ", "SP", "MG", "BA", "PR", "SC", "RS", "MG", "PE", "CE"];

export default function PreferenciaNotificacaoEditalModal({ open, onClose, user }) {
  const [formData, setFormData] = useState({
    telefone: "",
    notificacoes_ativas: true,
    canais_preferidos: ["whatsapp"],
    categorias_interesse: [],
    estados_interesse: [],
  });

  const queryClient = useQueryClient();

  const { data: preferencia } = useQuery({
    queryKey: ["notificacao-preferencia", user?.email],
    queryFn: () => user ? base44.entities.PreferenciaNotificacaoEdital.filter({ user_email: user.email }) : Promise.resolve([]),
    enabled: !!user && open,
  });

  useEffect(() => {
    if (preferencia && preferencia.length > 0) {
      setFormData(preferencia[0]);
    }
  }, [preferencia]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (preferencia && preferencia.length > 0) {
        return base44.entities.PreferenciaNotificacaoEdital.update(preferencia[0].id, data);
      }
      return base44.entities.PreferenciaNotificacaoEdital.create({ ...data, user_email: user.email, user_nome: user.full_name });
    },
    onSuccess: () => {
      toast.success("Preferências salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["notificacao-preferencia"] });
      onClose();
    },
    onError: (err) => {
      toast.error("Erro ao salvar preferências");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.telefone) {
      toast.error("Informe seu telefone");
      return;
    }
    mutation.mutate(formData);
  };

  const toggleCanal = (canal) => {
    const updated = formData.canais_preferidos.includes(canal)
      ? formData.canais_preferidos.filter(c => c !== canal)
      : [...formData.canais_preferidos, canal];
    setFormData({ ...formData, canais_preferidos: updated });
  };

  const toggleCategoria = (cat) => {
    const updated = formData.categorias_interesse.includes(cat)
      ? formData.categorias_interesse.filter(c => c !== cat)
      : [...formData.categorias_interesse, cat];
    setFormData({ ...formData, categorias_interesse: updated });
  };

  const toggleEstado = (uf) => {
    const updated = formData.estados_interesse.includes(uf)
      ? formData.estados_interesse.filter(e => e !== uf)
      : [...formData.estados_interesse, uf];
    setFormData({ ...formData, estados_interesse: updated });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações de Novos Editais
          </DialogTitle>
          <DialogDescription>
            Configure como você quer ser notificado sobre novos editais compatíveis com seu perfil
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Telefone */}
          <div>
            <label className="block text-sm font-semibold mb-2">Telefone (WhatsApp/SMS) *</label>
            <Input
              placeholder="+55 (11) 98765-4321"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
            <p className="text-xs text-slate-500 mt-1">Usar formato: +55 (XX) XXXXX-XXXX</p>
          </div>

          {/* Toggle ativo/inativo */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={formData.notificacoes_ativas}
              onCheckedChange={(checked) => setFormData({ ...formData, notificacoes_ativas: checked })}
            />
            <label className="text-sm font-medium">Ativar notificações de novos editais</label>
          </div>

          {formData.notificacoes_ativas && (
            <>
              {/* Canais */}
              <div>
                <label className="block text-sm font-semibold mb-2">Canais de Comunicação</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.canais_preferidos.includes("whatsapp")}
                      onCheckedChange={() => toggleCanal("whatsapp")}
                    />
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <label className="text-sm">WhatsApp</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.canais_preferidos.includes("sms")}
                      onCheckedChange={() => toggleCanal("sms")}
                    />
                    <Phone className="w-4 h-4 text-blue-600" />
                    <label className="text-sm">SMS</label>
                  </div>
                </div>
              </div>

              {/* Categorias */}
              <div>
                <label className="block text-sm font-semibold mb-2">Categorias de Interesse</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={formData.categorias_interesse.includes(cat.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCategoria(cat.id)}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Estados */}
              <div>
                <label className="block text-sm font-semibold mb-2">Estados de Interesse</label>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.map((uf) => (
                    <Badge
                      key={uf}
                      variant={formData.estados_interesse.includes(uf) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleEstado(uf)}
                    >
                      {uf}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !formData.telefone}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Preferências
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}