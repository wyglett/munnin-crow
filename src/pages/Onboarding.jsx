import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, Briefcase, Building2, CheckCircle } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_699eeda5be72b683e3bedcf3/7507bc7bf_e6e55591-30ba-4237-91e5-2d46775150cf.png";

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ cpf: "", data_nascimento: "", telefone: "" });
  const [tipoPessoa, setTipoPessoa] = useState("pf");
  const [pjForm, setPjForm] = useState({ razao_social: "", nome_fantasia: "", cnpj: "" });
  const [captcha] = useState(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, answer: a + b };
  });
  const [captchaInput, setCaptchaInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.onboarding_completo) {
        window.location.href = createPageUrl("Home");
      }
    }).catch(() => {
      base44.auth.redirectToLogin(createPageUrl("Onboarding"));
    });
  }, []);

  const formatCPF = (v) => v.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);
  const formatTel = (v) => v.replace(/\D/g, "").replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").slice(0, 15);
  const formatCNPJ = (v) => v.replace(/\D/g, "").replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").slice(0, 18);

  const captchaOk = parseInt(captchaInput) === captcha.answer;

  const handleFinish = async () => {
    if (!captchaOk) { setErro("Resposta do desafio incorreta."); return; }
    setSaving(true);
    setErro("");
    const data = {
      role,
      cpf: form.cpf,
      data_nascimento: form.data_nascimento,
      telefone: form.telefone,
      onboarding_completo: true,
    };
    if (role === "consultor") {
      data.tipo_pessoa = tipoPessoa;
      if (tipoPessoa === "pj") {
        data.razao_social = pjForm.razao_social;
        data.nome_fantasia = pjForm.nome_fantasia;
        data.cnpj = pjForm.cnpj;
      }
    }
    await base44.auth.updateMe(data);
    window.location.href = createPageUrl("Home");
  };

  const totalSteps = role === "consultor" ? 4 : 3;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}>
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}>
      <img src={LOGO_URL} alt="Logo" className="h-16 mb-6 object-contain" style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" }} />
      <Card className="w-full max-w-lg shadow-2xl">
        <CardContent className="p-8">
          {/* Progress */}
          <div className="flex items-center gap-1 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? "bg-indigo-600" : "bg-gray-200"}`} />
            ))}
          </div>

          {/* Step 1: Tipo de usuário */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo à plataforma!</h2>
              <p className="text-gray-500 text-sm mb-6">Como você vai utilizar a plataforma?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole("empreendedor")}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${role === "empreendedor" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}`}
                >
                  <User className="w-8 h-8 text-indigo-600 mb-3" />
                  <p className="font-semibold text-gray-900">Empreendedor</p>
                  <p className="text-xs text-gray-500 mt-1">Busco financiamento e apoio para meu projeto</p>
                </button>
                <button
                  onClick={() => setRole("consultor")}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${role === "consultor" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}`}
                >
                  <Briefcase className="w-8 h-8 text-indigo-600 mb-3" />
                  <p className="font-semibold text-gray-900">Consultor</p>
                  <p className="text-xs text-gray-500 mt-1">Ofereço apoio a empreendedores em editais</p>
                </button>
              </div>
              <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700" disabled={!role} onClick={() => setStep(2)}>
                Continuar
              </Button>
            </div>
          )}

          {/* Step 2: Dados pessoais */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Seus dados pessoais</h2>
              <p className="text-gray-500 text-sm mb-6">Essas informações são necessárias para uso da plataforma.</p>
              <div className="space-y-4">
                <div>
                  <Label>CPF *</Label>
                  <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>Data de Nascimento *</Label>
                  <Input type="date" value={form.data_nascimento} onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))} />
                </div>
                <div>
                  <Label>Telefone / WhatsApp *</Label>
                  <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: formatTel(e.target.value) }))} placeholder="(27) 99999-9999" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={!form.cpf || !form.data_nascimento || !form.telefone}
                  onClick={() => setStep(role === "consultor" ? 3 : totalSteps)}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Dados PJ (consultor) */}
          {step === 3 && role === "consultor" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Dados do Consultor</h2>
              <p className="text-gray-500 text-sm mb-5">Você atua como pessoa jurídica?</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setTipoPessoa("pf")}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${tipoPessoa === "pf" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}`}
                >
                  <User className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                  <p className="font-semibold text-sm text-gray-900">Pessoa Física</p>
                </button>
                <button
                  onClick={() => setTipoPessoa("pj")}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${tipoPessoa === "pj" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}`}
                >
                  <Building2 className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                  <p className="font-semibold text-sm text-gray-900">Pessoa Jurídica</p>
                </button>
              </div>
              {tipoPessoa === "pj" && (
                <div className="space-y-3">
                  <div><Label>Razão Social *</Label><Input value={pjForm.razao_social} onChange={e => setPjForm(f => ({ ...f, razao_social: e.target.value }))} placeholder="Nome oficial da empresa" /></div>
                  <div><Label>Nome Fantasia</Label><Input value={pjForm.nome_fantasia} onChange={e => setPjForm(f => ({ ...f, nome_fantasia: e.target.value }))} placeholder="Nome comercial" /></div>
                  <div><Label>CNPJ *</Label><Input value={pjForm.cnpj} onChange={e => setPjForm(f => ({ ...f, cnpj: formatCNPJ(e.target.value) }))} placeholder="00.000.000/0001-00" /></div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={tipoPessoa === "pj" && (!pjForm.razao_social || !pjForm.cnpj)}
                  onClick={() => setStep(4)}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step final: Captcha */}
          {step === totalSteps && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Confirmação de segurança</h2>
              <p className="text-gray-500 text-sm mb-6">Para confirmar que você é humano, resolva o desafio abaixo.</p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center mb-6">
                <p className="text-3xl font-bold text-indigo-800">{captcha.a} + {captcha.b} = ?</p>
              </div>
              <div>
                <Label>Sua resposta *</Label>
                <Input
                  type="number"
                  value={captchaInput}
                  onChange={e => { setCaptchaInput(e.target.value); setErro(""); }}
                  placeholder="Digite o resultado"
                  className={captchaInput && (captchaOk ? "border-green-500" : "border-red-400")}
                />
                {captchaInput && captchaOk && <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Correto!</p>}
                {captchaInput && !captchaOk && <p className="text-red-500 text-xs mt-1">Resposta incorreta, tente novamente.</p>}
              </div>
              {erro && <p className="text-red-500 text-sm mt-3">{erro}</p>}
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setStep(role === "consultor" ? 3 : 2)}>Voltar</Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={!captchaOk || saving} onClick={handleFinish}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Concluir Cadastro"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-slate-500 text-xs mt-4">Seus dados estão protegidos e não serão compartilhados.</p>
    </div>
  );
}