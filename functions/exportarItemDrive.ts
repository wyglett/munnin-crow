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
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: nome, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Erro ao criar pasta: ${JSON.stringify(data)}`);
  return data.id;
}

async function excluirArquivo(fileId, accessToken) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
}

async function listarFilhos(folderId, accessToken) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name)`, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return data.files || [];
}

async function uploadArquivo(nome, conteudoBlob, mimeType, parentId, accessToken, existingId = null) {
  const metadata = { name: nome, mimeType, parents: existingId ? undefined : [parentId] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", conteudoBlob);

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const res = await fetch(url, {
    method: existingId ? "PATCH" : "POST",
    headers: { "Authorization": `Bearer ${accessToken}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Erro ao fazer upload: ${JSON.stringify(data)}`);
  return data.id;
}

async function baixarAnexo(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Não foi possível baixar: ${url}`);
  return await res.blob();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { gasto, categoriaFolderId } = await req.json();
    if (!gasto || !categoriaFolderId) return Response.json({ error: "gasto e categoriaFolderId são obrigatórios" }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");

    const data = gasto.data || new Date().toISOString().slice(0, 10);
    const fornecedor = (gasto.fornecedor || "SEM_FORNECEDOR").replace(/[/\\:*?"<>|]/g, "_").substring(0, 40);
    const desc = (gasto.descricao || "item").replace(/[/\\:*?"<>|]/g, "_").substring(0, 40);
    const nomePasta = `${data}_${fornecedor} - ${desc}`;

    let itemFolderId = gasto.drive_item_folder_id || null;

    if (itemFolderId) {
      // Pasta existente: limpar arquivos antigos e recriar conteúdo
      const filhos = await listarFilhos(itemFolderId, accessToken);
      for (const f of filhos) {
        await excluirArquivo(f.id, accessToken);
      }
    } else {
      // Criar nova pasta
      itemFolderId = await criarPasta(nomePasta, categoriaFolderId, accessToken);
    }

    // Upload do resumo.txt
    const conteudo = [
      `Descrição: ${gasto.descricao}`,
      `Categoria: ${CAT_LABEL[gasto.categoria] || gasto.categoria}`,
      `Fornecedor: ${gasto.fornecedor || ""}`,
      `Valor: R$ ${Number(gasto.valor || 0).toFixed(2).replace(".", ",")}`,
      `Data: ${gasto.data || ""}`,
      `Observação: ${gasto.observacao || ""}`,
      `Cadastrado em: ${gasto.created_date || ""}`,
      `Última alteração: ${gasto.updated_date || ""}`,
      `Exportado em: ${new Date().toLocaleString("pt-BR")}`,
    ].join("\n");

    const resumoId = await uploadArquivo(
      "resumo.txt",
      new Blob([conteudo], { type: "text/plain" }),
      "text/plain",
      itemFolderId,
      accessToken
    );

    // Upload dos anexos (PDFs)
    const anexos = gasto.anexos || [];
    for (let i = 0; i < anexos.length; i++) {
      const anexo = anexos[i];
      const blob = await baixarAnexo(anexo.url);
      const nomeArquivo = anexo.nome || `anexo_${i + 1}.pdf`;
      await uploadArquivo(nomeArquivo, blob, blob.type || "application/pdf", itemFolderId, accessToken);
    }

    return Response.json({ success: true, itemFolderId, resumoId, nomePasta });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});