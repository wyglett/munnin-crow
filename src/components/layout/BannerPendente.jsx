import React from "react";
import { Clock } from "lucide-react";

export default function BannerPendente({ tipoUsuario }) {
  const papel = tipoUsuario === "consultor" ? "Consultor" : "Empreendedor";
  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2.5 flex items-center gap-3 text-sm">
      <Clock className="w-4 h-4 flex-shrink-0" />
      <span>
        <strong>Cadastro em análise:</strong> Seu perfil como <strong>{papel}</strong> está sendo revisado pela nossa equipe.
        Em até <strong>24 horas</strong> seu acesso completo às ferramentas será liberado. Você receberá um e-mail de confirmação.
      </span>
    </div>
  );
}