import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const usuarios = await base44.asServiceRole.entities.User.list();

    const pendentes = usuarios.filter(u =>
      u.role !== "admin" &&
      u.tipo_usuario &&
      u.role !== u.tipo_usuario
    );

    let sincronizados = 0;
    for (const u of pendentes) {
      await base44.asServiceRole.entities.User.update(u.id, {
        acesso_liberado: true
      });
      sincronizados++;
    }

    return Response.json({ success: true, sincronizados, total_verificados: usuarios.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});