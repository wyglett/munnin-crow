import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Esta função detecta consultores que acabaram de ter acesso_liberado=true
// mas ainda não receberam o e-mail (email_ativacao_enviado=false)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const usuarios = await base44.asServiceRole.entities.User.list();

    const paraNotificar = usuarios.filter(u =>
      u.tipo_usuario === "consultor" &&
      u.acesso_liberado === true &&
      !u.email_ativacao_enviado &&
      u.email
    );

    let notificados = 0;
    for (const u of paraNotificar) {
      const nome = u.full_name || "usuário";

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: u.email,
        subject: `🎉 Seu perfil de Consultor foi aprovado na Munnin Crow!`,
        body: `Olá, ${nome}!

Ótimas notícias! Após análise da nossa equipe de moderação, seu perfil como **Consultor** na plataforma Munnin Crow foi aprovado.

A partir de agora, você tem acesso completo às funcionalidades de consultor:
• Visualizar e responder solicitações de tutoria de empreendedores
• Apoiar empreendedores na elaboração de propostas
• Acessar o módulo de acompanhamento de projetos
• Criar orientações e materiais educativos
• Emitir recibos e gerenciar cobranças

Acesse a plataforma e explore tudo que preparamos para você!

Equipe Munnin Crow — Sabedoria e Memória 🐦‍⬛`,
      });

      await base44.asServiceRole.entities.User.update(u.id, { email_ativacao_enviado: true });
      notificados++;
    }

    return Response.json({ success: true, notificados, total_verificados: usuarios.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});