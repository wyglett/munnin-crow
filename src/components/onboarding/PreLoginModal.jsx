import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Feather, User, Building2, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PreLoginModal({ open, onClose }) {
  const [role, setRole] = useState("");

  const handleContinue = () => {
    if (!role) return;
    localStorage.setItem("pending_tipo_usuario", role);
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Feather className="w-7 h-7" />
            <h2 className="text-xl font-bold">Bem-vindo à Munnin Crow</h2>
          </div>
          <p className="text-indigo-100 text-sm">
            Antes de começar, nos diga como você vai usar a plataforma.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-700 font-medium">Você é:</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole("empreendedor")}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                role === "empreendedor"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <User className={`w-8 h-8 mb-2 ${role === "empreendedor" ? "text-indigo-600" : "text-gray-400"}`} />
              <p className={`font-semibold text-sm ${role === "empreendedor" ? "text-indigo-700" : "text-gray-700"}`}>
                Empreendedor
              </p>
              <p className="text-xs text-gray-500 mt-1">Busca editais, cria propostas e gerencia projetos</p>
            </button>
            <button
              onClick={() => setRole("consultor")}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                role === "consultor"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <Building2 className={`w-8 h-8 mb-2 ${role === "consultor" ? "text-purple-600" : "text-gray-400"}`} />
              <p className={`font-semibold text-sm ${role === "consultor" ? "text-purple-700" : "text-gray-700"}`}>
                Consultor
              </p>
              <p className="text-xs text-gray-500 mt-1">Apoia empreendedores com projetos e prestação de contas</p>
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!role}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              Criar conta <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <p className="text-xs text-center text-gray-400">
            Já tem conta?{" "}
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="text-indigo-600 hover:underline"
            >
              Entrar
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}