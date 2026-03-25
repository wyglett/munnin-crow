import { createClientFromRequest } from "npm:@base44/sdk@0.8.23";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      tipo_acao,
      entidade_tipo,
      entidade_id,
      entidade_nome,
      descricao,
      dados_antes,
      dados_depois,
      status = "sucesso",
      tempo_execucao_ms,
    } = body;

    // Validação básica
    if (!tipo_acao || !entidade_tipo) {
      return Response.json(
        { error: "tipo_acao e entidade_tipo são obrigatórios" },
        { status: 400 }
      );
    }

    // Registrar log
    const log = await base44.asServiceRole.entities.LogAcao.create({
      usuario_email: user.email,
      usuario_nome: user.full_name,
      tipo_acao,
      entidade_tipo,
      entidade_id,
      entidade_nome,
      descricao,
      dados_antes,
      dados_depois,
      status,
      tempo_execucao_ms,
      ip_origem: req.headers.get("x-forwarded-for") || "desconhecido",
    });

    return Response.json({ success: true, log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});