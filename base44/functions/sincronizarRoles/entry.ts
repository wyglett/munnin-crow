import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Roda a cada 5 minutos.
// 1. Novos usuários que completaram onboarding (tipo_usuario definido) mas ainda não
//    tiveram o role sincronizado — define role = tipo_usuario automaticamente.
// 2. Consultores aprovados (role=consultor) mas sem acesso_liberado — libera.
// 3. Empreendedores com perfil_concluido mas sem acesso_liberado — libera.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const usuarios = await base44.asServiceRole.entities.User.list();

    let sincronizados = 0;

    for (const u of usuarios) {
      const updates = {};

      // ── Regra 1: sincronizar role com tipo_usuario ────────────────────────
      // Se o usuário completou o onboarding (tipo_usuario definido) mas o role
      // ainda é o padrão "user" (nunca foi promovido manualmente), atualiza.
      if (
        u.tipo_usuario &&
        ["empreendedor", "consultor"].includes(u.tipo_usuario) &&
        (u.role === "user" || !u.role || u.role === u.tipo_usuario)
      ) {
        // Só sobrescreve se não for admin
        if (u.role !== "admin" && u.role !== u.tipo_usuario) {
          updates.role = u.tipo_usuario;
        }
      }

      // ── Regra 2: liberar acesso de empreendedores ─────────────────────────
      if (
        (u.tipo_usuario === "empreendedor" || u.role === "empreendedor") &&
        u.perfil_concluido &&
        !u.acesso_liberado
      ) {
        updates.acesso_liberado = true;
      }

      // ── Regra 3: liberar acesso de consultores aprovados pelo admin ───────
      if (
        u.role === "consultor" &&
        u.tipo_usuario === "consultor" &&
        !u.acesso_liberado
      ) {
        updates.acesso_liberado = true;
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.User.update(u.id, updates);
        sincronizados++;
      }
    }

    return Response.json({ success: true, sincronizados, total_verificados: usuarios.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});