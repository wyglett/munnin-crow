import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, User, Mail, Shield, CheckCircle } from "lucide-react";

const ROLE_LABELS = { admin: "ADMINISTRADOR", empreendedor: "EMPREENDEDOR", consultor: "CONSULTOR", user: "EMPREENDEDOR" };

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

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

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : saved ? <><CheckCircle className="w-4 h-4 mr-2" />Salvo!</> : "Salvar Foto de Perfil"}
          </Button>
        </div>
      </div>
    </div>
  );
}