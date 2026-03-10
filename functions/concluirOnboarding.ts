import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      role, telefone, cpf, data_nascimento,
      pessoa_juridica, e_organizacao,
      razao_social, nome_fantasia, cnpj
    } = body;

    if (!["empreendedor", "consultor"].includes(role)) {
      return Response.json({ error: 'Role inválido' }, { status: 400 });
    }

    // Usa service role para conseguir alterar o campo `role`
    await base44.asServiceRole.entities.User.update(user.id, {
      role,
      perfil_concluido: true,
      telefone,
      cpf,
      data_nascimento,
      pessoa_juridica: role === "consultor" ? pessoa_juridica : false,
      e_organizacao: (role === "consultor" && pessoa_juridica) ? e_organizacao : false,
      razao_social: pessoa_juridica ? razao_social : undefined,
      nome_fantasia: pessoa_juridica ? nome_fantasia : undefined,
      cnpj: pessoa_juridica ? cnpj : undefined,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});