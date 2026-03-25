import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, User, Mail, Shield, CheckCircle, Palette, Receipt, Eye, FileText, Clock, AlertCircle } from "lucide-react";
import AparenciaConfig from "@/components/layout/AparenciaConfig";

const ROLE_LABELS = { admin: "ADMINISTRADOR", empreendedor: "EMPREENDEDOR", consultor: "CONSULTOR", user: "EMPREENDEDOR" };

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const STATUS_RECIBO = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  enviado: { label: "Disponível", color: "bg-blue-100 text-blue-800", icon: FileText },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejeitado: { label: "Com Problema", color: "bg-red-100 text-red-800", icon: AlertCircle },
};
const TIPO_LABELS = { recibo: "Recibo", nf: "NF", nfse: "NF-e/NFS-e", outro: "Outro" };

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  const { data: recibos = [] } = useQuery({
    queryKey: ["recibos-perfil", user?.email],
    queryFn: () => base44.entities.ReciboPagamento.filter({ empreendedor_email: user.email }, "-created_date", 100),
    enabled: !!user?.email && user?.tipo_usuario !== "consultor" && user?.role !== "consultor",
  });

  useEffect(() => {
    base44.auth.me()
      .then((u) => { setUser(u); setAvatarUrl(u?.avatar_url || ""); })
      .catch(() => { base44.auth.redirectToLogin(); });
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAvatarUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ avatar_url: avatarUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  if (!user) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

        {/* Avatar */}
        <Card className="mb-4">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-100" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-indigo-400" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center cursor-pointer hover:bg-indigo-700 shadow-lg">
                {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
              <p className="text-gray-500">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700">
                {ROLE_LABELS[user.role] || user.role?.toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">Informações da Conta</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4" /> Nome Completo</Label>
              <Input value={user.full_name || ""} disabled className="mt-1 bg-gray-50" />
              <p className="text-xs text-gray-400 mt-1">Para alterar, entre em contato com o administrador</p>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /> E-mail</Label>
              <Input value={user.email || ""} disabled className="mt-1 bg-gray-50" />
            </div>
            <div>
              <Label className="flex items-center gap-2 text-gray-600"><Shield className="w-4 h-4" /> Senha</Label>
              <Input type="password" value="••••••••" disabled className="mt-1 bg-gray-50" />
              <p className="text-xs text-gray-400 mt-1">A senha é gerenciada pelo sistema de autenticação</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mb-8">
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : saved ? <><CheckCircle className="w-4 h-4 mr-2" />Salvo!</> : "Salvar Foto de Perfil"}
          </Button>
        </div>

        {/* Aparência */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AparenciaConfig />
          </CardContent>
        </Card>

        {/* Recibos / NFs — apenas empreendedores */}
        {user.tipo_usuario !== "consultor" && user.role !== "consultor" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-500" />
                Recibos e Notas Fiscais
                {recibos.length > 0 && <Badge className="ml-auto bg-indigo-100 text-indigo-700 font-semibold">{recibos.length}</Badge>}
              </CardTitle>
              <p className="text-xs text-gray-400">Documentos enviados pelos consultores que trabalham com você</p>
            </CardHeader>
            <CardContent>
              {recibos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum recibo disponível ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recibos.map(r => {
                    const s = STATUS_RECIBO[r.status] || STATUS_RECIBO.enviado;
                    const Icon = s.icon;
                    return (
                      <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="font-medium text-gray-900 text-sm truncate">{r.descricao_servico}</p>
                            <Badge className={`text-xs ${s.color}`}><Icon className="w-3 h-3 mr-1" />{s.label}</Badge>
                            <Badge variant="outline" className="text-xs">{TIPO_LABELS[r.tipo]}</Badge>
                          </div>
                          <p className="text-xs text-indigo-600">Consultor: {r.consultor_nome || r.consultor_email}</p>
                          {r.data_emissao && <p className="text-xs text-gray-400">Emissão: {r.data_emissao}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 text-sm mb-1">{fmt(r.valor)}</p>
                          {r.arquivo_url ? (
                            <a href={r.arquivo_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="text-xs h-7 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                <Eye className="w-3 h-3 mr-1" /> Ver
                              </Button>
                            </a>
                          ) : (
                            <p className="text-xs text-gray-400">Pendente</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}