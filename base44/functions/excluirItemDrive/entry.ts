import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function excluirArquivo(fileId, accessToken) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  return res.status;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { folderId } = await req.json();
    if (!folderId) return Response.json({ error: "folderId é obrigatório" }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
    const status = await excluirArquivo(folderId, accessToken);

    return Response.json({ success: true, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});