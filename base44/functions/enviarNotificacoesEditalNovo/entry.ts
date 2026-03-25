import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { edital_id } = payload;

    if (!edital_id) {
      return Response.json({ error: 'Missing edital_id' }, { status: 400 });
    }

    // Fetch edital
    const edital = await base44.asServiceRole.entities.Edital.get(edital_id);
    if (!edital) {
      return Response.json({ error: 'Edital not found' }, { status: 404 });
    }

    // Fetch all users with notification preferences
    const preferencias = await base44.asServiceRole.entities.PreferenciaNotificacaoEdital.list('-created_date', 1000);
    
    let enviadas = 0;
    let falhas = 0;

    for (const pref of preferencias) {
      if (!pref.notificacoes_ativas || !pref.telefone) continue;

      // Check if categoria or estado match
      const categoriaMatch = !pref.categorias_interesse?.length || pref.categorias_interesse.includes(edital.categoria);
      const estadoMatch = !pref.estados_interesse?.length || pref.estados_interesse.includes(edital.estado);

      if (!categoriaMatch && !estadoMatch) continue;

      // Create notification record
      try {
        const canais = pref.canais_preferidos || ['whatsapp'];
        
        for (const canal of canais) {
          const notification = await base44.asServiceRole.entities.NotificacaoEditalUsuario.create({
            user_email: pref.user_email,
            user_nome: pref.user_nome,
            edital_id: edital.id,
            edital_titulo: edital.titulo,
            edital_orgao: edital.orgao,
            tipo_notificacao: canal,
            telefone: pref.telefone,
            status: 'pendente',
            categoria_compativel: edital.categoria,
          });

          // TODO: Integrate with WhatsApp/SMS provider (e.g., Twilio)
          // For now, just mark as sent
          await base44.asServiceRole.entities.NotificacaoEditalUsuario.update(notification.id, {
            status: 'enviada',
            enviada_em: new Date().toISOString(),
          });

          enviadas++;
        }
      } catch (err) {
        console.error(`Erro ao enviar notificação para ${pref.user_email}:`, err);
        falhas++;
      }
    }

    return Response.json({
      success: true,
      edital_id,
      edital_titulo: edital.titulo,
      notificacoes_enviadas: enviadas,
      falhas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});