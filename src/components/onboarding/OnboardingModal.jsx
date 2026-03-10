import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Feather, Building2, User, CheckCircle, RefreshCw } from "lucide-react";

// Captcha simples (verificação humana)
function generateChallenge() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

function formatCPF(v) {
  return v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
function formatCNPJ(v) {
  return v.replace(/\D/g, "").slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
function formatPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

export default function OnboardingModal({ user, open, onComplete }) {
  // Admin nunca deve ver o onboarding
  if (user?.role === "admin") return null;
  const [step, setStep] = useState(1); // 1=role, 2=dados, 3=pj_extra(se PJ), 4=captcha
  const [role, setRole] = useState("");
  const [pessoaJuridica, setPessoaJuridica] = useState(false);
  const [eOrganizacao, setEOrganizacao] = useState(false);
  const [form, setForm] = useState({
    telefone: "", cpf: "", data_nascimento: "",
    razao_social: "", nome_fantasia: "", cnpj: ""
  });
  const [challenge, setChallenge] = useState(generateChallenge);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (step === 1 && !role) return;
    if (step === 2) {
      if (!form.telefone || !form.cpf || !form.data_nascimento) {
        setError("Preencha todos os campos obrigatórios.");
        return;
      }
      if (role === "consultor" && pessoaJuridica) {
        if (!form.razao_social || !form.cnpj) {
          setError("Preencha a razão social e CNPJ.");
          return;
        }
      }
      setError("");
      setStep(3);
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleCaptcha = async () => {
    if (parseInt(captchaInput) !== challenge.answer) {
      setCaptchaError(true);
      setChallenge(generateChallenge());
      setCaptchaInput("");
      return;
    }
    setCaptchaError(false);
    setSaving(true);
    await base44.auth.updateMe({
      role,
      perfil_concluido: true,
      telefone: form.telefone,
      cpf: form.cpf,
      data_nascimento: form.data_nascimento,
      pessoa_juridica: role === "consultor" ? pessoaJuridica : false,
      razao_social: pessoaJuridica ? form.razao_social : undefined,
      nome_fantasia: pessoaJuridica ? form.nome_fantasia : undefined,
      cnpj: pessoaJuridica ? form.cnpj : undefined,
    });
    setSaving(false);
    onComplete(role);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" onPointerDownOutside={e => e.preventDefault()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Feather className="w-7 h-7" />
            <h2 className="text-xl font-bold">Bem-vindo à Munnin Crow</h2>
          </div>
          <p className="text-indigo-100 text-sm">
            {step === 1 && "Antes de começar, nos diga um pouco sobre você."}
            {step === 2 && "Preencha seus dados para continuar."}
            {step === 3 && "Verificação final — confirme que você é humano."}
          </p>
          <div className="flex gap-1 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1 - Tipo de usuário */}
          {step === 1 && (
            <div>
              <p className="text-gray-700 font-medium mb-4">Você vai usar a plataforma como:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole("empreendedor")}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${role === "empreendedor" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}`}
                >
                  <User className={`w-8 h-8 mb-2 ${role === "empreendedor" ? "text-indigo-600" : "text-gray-400"}`} />
                  <p className={`font-semibold ${role === "empreendedor" ? "text-indigo-700" : "text-gray-700"}`}>Empreendedor</p>
                  <p className="text-xs text-gray-500 mt-1">Busca editais, cria propostas e gerencia projetos</p>
                </button>
                <button
                  onClick={() => setRole("consultor")}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${role === "consultor" ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}
                >
                  <Building2 className={`w-8 h-8 mb-2 ${role === "consultor" ? "text-purple-600" : "text-gray-400"}`} />
                  <p className={`font-semibold ${role === "consultor" ? "text-purple-700" : "text-gray-700"}`}>Consultor</p>
                  <p className="text-xs text-gray-500 mt-1">Apoia empreendedores com projetos e prestação de contas</p>
                </button>
              </div>
              <Button onClick={handleNext} disabled={!role} className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700">
                Continuar
              </Button>
            </div>
          )}

          {/* Step 2 - Dados pessoais */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone *</Label>
                  <Input
                    value={form.telefone}
                    onChange={e => setForm(f => ({ ...f, telefone: formatPhone(e.target.value) }))}
                    placeholder="(11) 91234-5678"
                  />
                </div>
                <div>
                  <Label>Data de Nascimento *</Label>
                  <Input
                    type="date"
                    value={form.data_nascimento}
                    onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>CPF *</Label>
                <Input
                  value={form.cpf}
                  onChange={e => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                />
              </div>

              {role === "consultor" && (
                <div className="border border-purple-200 rounded-xl p-4 bg-purple-50 space-y-3">
                  <p className="text-sm font-semibold text-purple-700">Você atua como pessoa jurídica?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPessoaJuridica(false)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${!pessoaJuridica ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300"}`}
                    >
                      Não (Pessoa Física)
                    </button>
                    <button
                      onClick={() => setPessoaJuridica(true)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${pessoaJuridica ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300"}`}
                    >
                      Sim (Pessoa Jurídica)
                    </button>
                  </div>

                  {pessoaJuridica && (
                    <div className="space-y-2 pt-1">
                      <Input
                        value={form.razao_social}
                        onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))}
                        placeholder="Razão Social *"
                      />
                      <Input
                        value={form.nome_fantasia}
                        onChange={e => setForm(f => ({ ...f, nome_fantasia: e.target.value }))}
                        placeholder="Nome Fantasia (opcional)"
                      />
                      <Input
                        value={form.cnpj}
                        onChange={e => setForm(f => ({ ...f, cnpj: formatCNPJ(e.target.value) }))}
                        placeholder="CNPJ *"
                      />
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                <Button onClick={handleNext} className="flex-1 bg-indigo-600 hover:bg-indigo-700">Continuar</Button>
              </div>
            </div>
          )}

          {/* Step 3 - Captcha */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="bg-gray-50 border rounded-xl p-6">
                <p className="text-gray-600 text-sm mb-3">Resolva a operação abaixo para confirmar que você é humano:</p>
                <p className="text-3xl font-bold text-gray-900">{challenge.a} + {challenge.b} = ?</p>
                <Input
                  type="number"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  placeholder="Sua resposta"
                  className="mt-3 text-center text-lg"
                  onKeyDown={e => e.key === "Enter" && handleCaptcha()}
                />
                {captchaError && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-red-500 text-sm">
                    <p>Resposta incorreta. Tente novamente.</p>
                    <button onClick={() => { setChallenge(generateChallenge()); setCaptchaInput(""); setCaptchaError(false); }}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
                <Button
                  onClick={handleCaptcha}
                  disabled={!captchaInput || saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><CheckCircle className="w-4 h-4 mr-2" />Concluir Cadastro</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}