import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Verificar se o role mudou para coincidir com tipo_usuario
    const novoRole = data?.role;
    const tipoUsuario = data?.tipo_usuario;
    const roleAnterior = old_data?.role;

    // Só disparar quando role muda e passa a igualar tipo_usuario
    if (!novoRole || !tipoUsuario || novoRole === roleAnterior) {
      return Response.json({ skipped: true });
    }

    const rolesEquivalentes = {
      empreendedor: ["empreendedor"],
      consultor: ["consultor"],
    };

    const papeis = rolesEquivalentes[tipoUsuario] || [];
    const ativado = papeis.includes(novoRole);

    if (!ativado) {
      return Response.json({ skipped: true, reason: "role não coincide com tipo_usuario" });
    }

    const email = data?.email;
    const nome = data?.full_name || "usuário";
    const papel = tipoUsuario === "consultor" ? "Consultor" : "Empreendedor";

    if (!email) return Response.json({ skipped: true, reason: "sem email" });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: `🎉 Seu acesso à Munnin Crow está liberado!`,
      body: `Olá, ${nome}!

Parabéns! Seu cadastro como ${papel} na plataforma Munnin Crow foi revisado e aprovado. Seu acesso completo às ferramentas está agora totalmente liberado.

O que você pode fazer agora:
${tipoUsuario === "empreendedor" ? `• Explorar editais abertos por estado e categoria
• Criar e acompanhar propostas com apoio de IA
• Gerenciar gastos e prestação de contas dos projetos
• Solicitar tutoria de consultores especializados` : `• Visualizar e responder solicitações de tutoria
• Apoiar empreendedores na elaboração de propostas
• Acessar o módulo de acompanhamento de projetos
• Criar orientações e materiais educativos`}

Acesse agora: ${Deno.env.get("APP_URL") || "https://app.munnincrow.com.br"}

Equipe Munnin Crow — Sabedoria e Memória 🐦‍⬛`,
    });

    return Response.json({ success: true, emailEnviado: email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});