import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Função automática que verifica editais compatíveis com preferências de alerta
 * e envia notificações por e-mail aos usuários interessados.
 * 
 * Executada quando um novo edital é criado (automação de entidade).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Se for automação de entidade, vem o evento
    if (payload.event?.type === 'create' && payload.event?.entity_name === 'Edital') {
      const novoEdital = payload.data;

      if (!novoEdital) {
        return Response.json({ error: 'Edital data not found' }, { status: 400 });
      }

      // Buscar todos os usuários com alertas ativos
      const todosAlertas = await base44.asServiceRole.entities.AlertaEdital.list('', 1000);
      const alertasAtivos = todosAlertas.filter(a => a.ativo !== false);

      let notificados = 0;
      let erros = 0;

      // Para cada alerta ativo, verificar compatibilidade
      for (const alerta of alertasAtivos) {
        try {
          const compativel = verificarCompatibilidade(novoEdital, alerta);

          if (compativel) {
            // Enviar e-mail se incluído nas preferências
            if ((alerta.tipos || ['email']).includes('email')) {
              await enviarEmailAlerta(base44, alerta, novoEdital);
            }

            // Poderia enviar notificação push aqui também
            notificados++;
          }
        } catch (e) {
          erros++;
          console.error(`Erro ao processar alerta para ${alerta.user_email}:`, e.message);
        }
      }

      return Response.json({
        success: true,
        edital: novoEdital.titulo,
        notificados,
        erros,
      });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Erro na verificação de editais compatíveis:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function verificarCompatibilidade(edital, alerta) {
  // Verificar se categoria está nos interesses
  if (alerta.categorias_interesse?.length > 0) {
    const editalCategoria = edital.categoria;
    if (!alerta.categorias_interesse.includes(editalCategoria)) {
      return false;
    }
  }

  // Verificar se estado está nos interesses
  if (alerta.estados_interesse?.length > 0) {
    const editalEstado = edital.estado;
    if (!alerta.estados_interesse.includes(editalEstado)) {
      return false;
    }
  }

  // Verificar valor mínimo
  if (alerta.valor_minimo) {
    const editalValor = parseFloat(edital.valor_total?.replace(/\D/g, '')) || 0;
    if (editalValor < alerta.valor_minimo) {
      return false;
    }
  }

  return true;
}

async function enviarEmailAlerta(base44, alerta, edital) {
  const assunto = `🎯 Novo Edital Compatível: ${edital.titulo}`;
  const corpo = `
Olá ${alerta.user_nome},

Um novo edital foi publicado que corresponde aos seus critérios de interesse!

**${edital.titulo}**
Órgão: ${edital.orgao}
Categoria: ${edital.categoria}
Valor: ${edital.valor_total || 'N/A'}
Data de Encerramento: ${edital.data_encerramento || 'N/A'}

Acesse a plataforma para conhecer mais detalhes e criar sua proposta.

Atenciosamente,
Munnin Crow
`;

  try {
    await base44.integrations.Core.SendEmail({
      to: alerta.user_email,
      subject: assunto,
      body: corpo,
      from_name: 'Munnin Crow - Alertas',
    });
  } catch (e) {
    console.error(`Falha ao enviar email para ${alerta.user_email}:`, e.message);
    throw e;
  }
}