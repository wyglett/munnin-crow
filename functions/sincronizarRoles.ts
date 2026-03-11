import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Roda a cada 15 minutos.
// Detecta consultores cujo role já foi atualizado pelo admin (role === tipo_usuario === "consultor")
// mas acesso_liberado ainda é false — e libera o acesso.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const usuarios = await base44.asServiceRole.entities.User.list();

    // Consultores aprovados pelo admin (role=consultor) mas ainda sem acesso liberado
    const pendentes = usuarios.filter(u =>
      u.role === "consultor" &&
      u.tipo_usuario === "consultor" &&
      !u.acesso_liberado
    );

    let sincronizados = 0;
    for (const u of pendentes) {
      await base44.asServiceRole.entities.User.update(u.id, {
        acesso_liberado: true,
      });
      sincronizados++;
    }

    // Empreendedores com perfil_concluido mas sem acesso_liberado também devem ser liberados
    const empPendentes = usuarios.filter(u =>
      u.tipo_usuario === "empreendedor" &&
      u.perfil_concluido &&
      !u.acesso_liberado
    );
    for (const u of empPendentes) {
      await base44.asServiceRole.entities.User.update(u.id, { acesso_liberado: true });
      sincronizados++;
    }

    return Response.json({ success: true, sincronizados, total_verificados: usuarios.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});