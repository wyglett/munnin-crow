import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar usuários com tipo_usuario definido, role compatível, mas acesso_liberado ainda false
    const usuarios = await base44.asServiceRole.entities.User.list();

    const rolesEquivalentes = { empreendedor: "empreendedor", consultor: "consultor" };
    const pendentes = usuarios.filter(u =>
      u.tipo_usuario &&
      u.role === rolesEquivalentes[u.tipo_usuario] &&
      !u.acesso_liberado &&
      u.email
    );

    let ativados = 0;
    for (const u of pendentes) {
      const papel = u.tipo_usuario === "consultor" ? "Consultor" : "Empreendedor";
      const nome = u.full_name || "usuário";

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: u.email,
        subject: `🎉 Seu acesso à Munnin Crow está liberado!`,
        body: `Olá, ${nome}!

Parabéns! Seu cadastro como ${papel} na plataforma Munnin Crow foi revisado e aprovado pela equipe. Seu acesso completo às ferramentas está agora totalmente liberado.

${u.tipo_usuario === "empreendedor" ? `O que você pode fazer agora:
• Explorar editais abertos por estado e categoria
• Criar e acompanhar propostas com apoio de IA
• Gerenciar gastos e prestação de contas dos projetos
• Solicitar tutoria de consultores especializados` : `O que você pode fazer agora:
• Visualizar e responder solicitações de tutoria
• Apoiar empreendedores na elaboração de propostas
• Acessar o módulo de acompanhamento de projetos
• Criar orientações e materiais educativos`}

Acesse a plataforma e explore tudo que preparamos para você!

Equipe Munnin Crow — Sabedoria e Memória 🐦‍⬛`,
      });

      await base44.asServiceRole.entities.User.update(u.id, { acesso_liberado: true });
      ativados++;
    }

    return Response.json({ success: true, ativados, total: pendentes.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});