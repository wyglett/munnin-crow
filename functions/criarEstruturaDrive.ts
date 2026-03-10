import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function criarPasta(nome, parentId, accessToken) {
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: nome,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : [],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Erro ao criar pasta "${nome}": ${JSON.stringify(data)}`);
  return data.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { projetoTitulo, parentFolderId } = await req.json();
    if (!parentFolderId) return Response.json({ error: "parentFolderId é obrigatório" }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");

    // Cria pasta raiz do projeto
    const rootId = await criarPasta(projetoTitulo || "Projeto", parentFolderId, accessToken);

    // --- Financeiro ---
    const financeiroId = await criarPasta("Financeiro", rootId, accessToken);
    const subcatsFinanceiro = [
      ["Material Permanente", "material_permanente"],
      ["Material de Consumo", "material_consumo"],
      ["Terceiros", "terceiros"],
      ["Diárias", "diarias"],
      ["Passagens", "passagens"],
      ["Contrapartida", "contrapartida"],
      ["Doaci", "doaci"],
    ];
    const pastasFinanceiro = {};
    for (const [nome, chave] of subcatsFinanceiro) {
      pastasFinanceiro[chave] = await criarPasta(nome, financeiroId, accessToken);
    }

    // --- Relatórios ---
    const relatoriosId = await criarPasta("Relatórios", rootId, accessToken);
    const parcialId = await criarPasta("Parcial", relatoriosId, accessToken);
    const finalId = await criarPasta("Final", relatoriosId, accessToken);

    // Objeto unificado de pastas (compatível com drive_categoria_ids)
    const pastas = {
      ...pastasFinanceiro,
      relatorios_parcial: parcialId,
      relatorios_final: finalId,
    };

    return Response.json({
      success: true,
      rootFolderId: rootId,
      financeiroFolderId: financeiroId,
      relatoriosFolderId: relatoriosId,
      pastas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});