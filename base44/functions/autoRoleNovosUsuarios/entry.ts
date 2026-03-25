import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Automação de entidade: dispara quando um novo User é criado.
// Define automaticamente o role com base no tipo_usuario preenchido no onboarding.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    // Aceita chamada direta (teste) ou via automação de entidade
    const userId = data?.id || body.user_id;
    const tipoUsuario = data?.tipo_usuario || body.tipo_usuario;

    if (!userId) {
      return Response.json({ error: 'user_id obrigatório' }, { status: 400 });
    }

    // Se o tipo_usuario já está definido, sincroniza o role imediatamente
    if (tipoUsuario) {
      let novoRole = tipoUsuario; // "empreendedor" | "consultor"
      // Garante que role seja um valor válido (evita strings desconhecidas)
      if (!["empreendedor", "consultor", "admin"].includes(novoRole)) {
        novoRole = "empreendedor";
      }

      await base44.asServiceRole.entities.User.update(userId, {
        role: novoRole,
        acesso_liberado: novoRole === "empreendedor" ? true : false,
      });

      return Response.json({ success: true, userId, role_definido: novoRole });
    }

    // Se tipo_usuario ainda não está preenchido (usuário recém-criado antes do onboarding),
    // aguarda — a automação também roda no update, então quando o onboarding for concluído
    // o tipo_usuario será preenchido e disparará novamente.
    return Response.json({ success: true, userId, message: 'tipo_usuario ainda não definido, aguardando onboarding' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});