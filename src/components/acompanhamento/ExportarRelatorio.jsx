import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

function renderValorCampo(campo) {
  if (!campo) return "";

  // Item 1 - dados gerais
  if (campo.dados_item1) {
    const d = campo.dados_item1;
    return [
      d.edital && `Edital: ${d.edital}`,
      d.termo_outorga && `Nº Termo de Outorga: ${d.termo_outorga}`,
      d.titulo_projeto && `Título: ${d.titulo_projeto}`,
      d.coordenador && `Coordenador: ${d.coordenador}`,
      d.razao_social && `Instituição: ${d.razao_social}`,
      d.nome_fantasia && `Nome Fantasia: ${d.nome_fantasia}`,
      d.cnpj && `CNPJ: ${d.cnpj}`,
      d.modelo_analise && `Modelo de Análise: ${d.modelo_analise}`,
    ].filter(Boolean).join("\n");
  }

  // Tabela equipe
  if (campo.itens_tabela && campo.itens_tabela[0]?.nome !== undefined) {
    return campo.itens_tabela.map((m, i) =>
      `${i + 1}. ${m.nome} — ${m.responsabilidade || ""}\n   ${m.formacao || ""}`
    ).join("\n");
  }

  // Tabela atividades
  if (campo.itens_tabela && campo.itens_tabela[0]?.titulo !== undefined) {
    return campo.itens_tabela.map((a, i) => `${i + 1}. ${a.titulo}`).join("\n");
  }

  // Tabela entregas (Item 5)
  if (campo.itens_tabela && campo.itens_tabela[0]?.entregas !== undefined) {
    return campo.itens_tabela.map(obj =>
      `OE ${obj.objetivo_num || ""}:\n` +
      (obj.entregas || []).map((e, ei) => `  Entrega ${ei + 1}: ${e.descricao} — ${e.percentagem || 0}%`).join("\n")
    ).join("\n");
  }

  // Cronograma Item 7
  if (campo.cronograma_oes) {
    return campo.cronograma_oes.map(obj =>
      `OE ${obj.objetivo_num || ""}:\n` +
      (obj.acoes || []).map(a =>
        `  ${a.descricao}: ${(a.meses || []).join(", ") || "—"}`
      ).join("\n")
    ).join("\n");
  }

  return campo.resposta || "";
}

export default function ExportarRelatorio({ projeto, campos }) {
  const [loading, setLoading] = useState(false);

  const exportar = async () => {
    if (!campos?.length) return;
    setLoading(true);

    // Monta o conteúdo do relatório como HTML estilizado
    const linhas = campos
      .filter(c => !c._suprimido)
      .map(c => {
        const valor = renderValorCampo(c);
        if (!valor) return "";
        return `
          <div style="margin-bottom:24px; page-break-inside:avoid;">
            ${c.secao ? `<p style="font-size:10px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px">${c.secao}</p>` : ""}
            <p style="font-size:13px;font-weight:600;color:#1e293b;margin:0 0 6px">${c.pergunta || ""}</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;font-size:12px;color:#334155;white-space:pre-wrap;line-height:1.6">${valor}</div>
          </div>`;
      }).filter(Boolean).join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relatório — ${projeto.titulo}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    h1 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
    h2 { font-size: 13px; color: #64748b; font-weight: 400; margin-bottom: 32px; }
    hr { border: none; border-top: 2px solid #e2e8f0; margin: 20px 0; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Relatório de Prestação de Contas</h1>
  <h2>${projeto.titulo}${projeto.orgao_financiador ? " · " + projeto.orgao_financiador : ""}</h2>
  <hr/>
  ${linhas}
</body>
</html>`;

    // Upload e download
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${projeto.titulo?.replace(/\s+/g, "_") || "projeto"}.html`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();

    setLoading(false);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={exportar}
      disabled={loading || !campos?.length}
      className="border-green-300 text-green-700 hover:bg-green-50"
    >
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
      {loading ? "Exportando..." : "Exportar Relatório"}
    </Button>
  );
}