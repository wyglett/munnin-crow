import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CAT_LABEL = {
  material_permanente: "Material Permanente",
  material_consumo: "Material de Consumo",
  terceiros: "Terceiros",
  diarias: "Diárias",
  passagens: "Passagens",
  contrapartida: "Contrapartida",
};

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
  if (!res.ok) throw new Error(`Erro ao criar pasta: ${JSON.stringify(data)}`);
  return data.id;
}

async function criarArquivoTexto(nome, conteudo, parentId, accessToken, fileId = null) {
  const blob = new Blob([conteudo], { type: "text/plain" });
  const metadata = {
    name: nome,
    mimeType: "text/plain",
    parents: fileId ? undefined : (parentId ? [parentId] : []),
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const res = await fetch(url, {
    method: fileId ? "PATCH" : "POST",
    headers: { "Authorization": `Bearer ${accessToken}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Erro ao criar arquivo: ${JSON.stringify(data)}`);
  return data.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { gasto, categoriaFolderId } = await req.json();
    if (!gasto || !categoriaFolderId) return Response.json({ error: "gasto e categoriaFolderId são obrigatórios" }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");

    // Nome da subpasta: AAAA-MM-DD_FORNECEDOR - DESCRICAO
    const data = gasto.data || new Date().toISOString().slice(0, 10);
    const fornecedor = (gasto.fornecedor || "SEM_FORNECEDOR").replace(/[/\\:*?"<>|]/g, "_").substring(0, 40);
    const desc = (gasto.descricao || "item").replace(/[/\\:*?"<>|]/g, "_").substring(0, 40);
    const nomePasta = `${data}_${fornecedor} - ${desc}`;

    // Cria subpasta do item dentro da pasta da categoria
    const itemFolderId = await criarPasta(nomePasta, categoriaFolderId, accessToken);

    // Cria arquivo resumo.txt com os dados do item
    const conteudo = [
      `Descrição: ${gasto.descricao}`,
      `Categoria: ${CAT_LABEL[gasto.categoria] || gasto.categoria}`,
      `Fornecedor: ${gasto.fornecedor || ""}`,
      `Valor: R$ ${Number(gasto.valor || 0).toFixed(2).replace(".", ",")}`,
      `Data: ${gasto.data || ""}`,
      `Observação: ${gasto.observacao || ""}`,
      `Exportado em: ${new Date().toLocaleString("pt-BR")}`,
    ].join("\n");

    const resumoId = await criarArquivoTexto(
      "resumo.txt",
      conteudo,
      itemFolderId,
      accessToken,
      gasto.drive_resumo_id || null
    );

    return Response.json({ success: true, itemFolderId, resumoId, nomePasta });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});