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
    const isConsultor = role === "consultor";
    await base44.asServiceRole.entities.User.update(user.id, {
      role: isConsultor ? "empreendedor" : role, // consultor começa como empreendedor até aprovação
      tipo_usuario: role,
      perfil_concluido: true,
      acesso_liberado: !isConsultor,
      telefone,
      cpf,
      data_nascimento,
      pessoa_juridica: isConsultor ? pessoa_juridica : false,
      e_organizacao: (isConsultor && pessoa_juridica) ? e_organizacao : false,
      razao_social: pessoa_juridica ? razao_social : undefined,
      nome_fantasia: pessoa_juridica ? nome_fantasia : undefined,
      cnpj: pessoa_juridica ? cnpj : undefined,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});