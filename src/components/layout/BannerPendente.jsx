import React from "react";
import { Clock, User } from "lucide-react";

export default function BannerPendente({ tipoUsuario }) {
  if (tipoUsuario !== "consultor") return null;

  return (
    <div className="w-full bg-amber-500/95 text-white px-4 py-2.5 flex items-start gap-3 text-sm">
      <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        <strong>Solicitação de Consultor em análise:</strong> Nossa equipe está verificando seus dados (prazo: até 48h).{" "}
        <span className="flex items-center gap-1 inline-flex">
          <User className="w-3.5 h-3.5" />
          Por ora, seu acesso é como <strong>Empreendedor</strong>. Você receberá um e-mail assim que sua conta for aprovada.
        </span>
      </span>
    </div>
  );
}