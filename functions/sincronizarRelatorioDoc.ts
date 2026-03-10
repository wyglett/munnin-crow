import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Cria ou atualiza um Google Doc no Drive com o conteúdo do relatório.
// Se docId for passado, atualiza (apaga o conteúdo e reescreve).
// Retorna { docId, docUrl }

async function criarDoc(titulo, folderId, accessToken) {
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: titulo,
      mimeType: "application/vnd.google-apps.document",
      parents: folderId ? [folderId] : [],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Erro ao criar Doc: ${JSON.stringify(data)}`);
  return data.id;
}

async function limparDoc(docId, accessToken) {
  // Obtém o tamanho atual do documento
  const metaRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  const meta = await metaRes.json();
  if (!metaRes.ok) throw new Error(`Erro ao ler doc: ${JSON.stringify(meta)}`);
  const endIndex = meta.body?.content?.at(-1)?.endIndex;
  if (!endIndex || endIndex <= 1) return; // documento vazio
  const deleteRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } }] }),
  });
  if (!deleteRes.ok) {
    const err = await deleteRes.json();
    throw new Error(`Erro ao limpar doc: ${JSON.stringify(err)}`);
  }
}

async function escreverDoc(docId, requests, accessToken) {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Erro ao escrever no doc: ${JSON.stringify(err)}`);
  }
}

function buildRequests(projetoTitulo, campos) {
  // Constrói requests do Docs API (insertText) de baixo para cima (índice 1)
  // Retorna lista de requests na ordem correta (do final para o início)
  const linhas = [];

  linhas.push(`RELATÓRIO — ${projetoTitulo}\n\n`);

  for (const campo of campos) {
    if (campo.secao) {
      linhas.push(`${campo.secao}\n`);
    }
    if (campo.pergunta) {
      linhas.push(`${campo.pergunta}\n`);
    }

    // Conteúdo do campo
    if (campo.tipo_resposta === "tabela_itens" && campo.itens_tabela?.length) {
      for (const item of campo.itens_tabela) {
        const linha = [item.descricao, item.quantidade, item.valor_total].filter(Boolean).join(" | ");
        if (linha) linhas.push(`  • ${linha}\n`);
      }
    } else if (campo.dados_item1) {
      const d = campo.dados_item1;
      if (d.edital) linhas.push(`  Edital: ${d.edital}\n`);
      if (d.titulo_projeto) linhas.push(`  Título: ${d.titulo_projeto}\n`);
      if (d.coordenador) linhas.push(`  Coordenador: ${d.coordenador}\n`);
      if (d.razao_social) linhas.push(`  Instituição: ${d.razao_social}\n`);
      if (d.cnpj) linhas.push(`  CNPJ: ${d.cnpj}\n`);
      if (d.termo_outorga) linhas.push(`  Termo de Outorga: ${d.termo_outorga}\n`);
    } else if (campo.resposta) {
      linhas.push(`${campo.resposta}\n`);
    } else {
      linhas.push(`(não preenchido)\n`);
    }
    linhas.push(`\n`);
  }

  const texto = linhas.join("");

  // Google Docs API: inserção em índice 1
  return [{ insertText: { location: { index: 1 }, text: texto } }];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const body = await req.json();
    const { projeto, campos, folderId, docId: docIdExistente } = body;

    if (!projeto || !campos?.length) {
      return Response.json({ error: "projeto e campos são obrigatórios" }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");

    let docId = docIdExistente;

    if (docId) {
      // Atualiza doc existente: apaga conteúdo e reescreve
      await limparDoc(docId, accessToken);
    } else {
      // Cria novo doc na pasta de relatórios (parcial por padrão)
      const titulo = `Relatório — ${projeto.titulo || "Projeto"}`;
      docId = await criarDoc(titulo, folderId || null, accessToken);
    }

    const requests = buildRequests(projeto.titulo || "Projeto", campos);
    await escreverDoc(docId, requests, accessToken);

    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

    return Response.json({ success: true, docId, docUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});