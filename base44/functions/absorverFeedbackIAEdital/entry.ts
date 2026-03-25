import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Função que processa feedback de IA para treinar e melhorar
 * a compreensão da plataforma sobre editais.
 * 
 * Coleta feedbacks úteis e os integra à base de conhecimento do edital.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    if (!payload.event?.entity_id) {
      return Response.json({ error: 'Feedback ID required' }, { status: 400 });
    }

    const feedbackId = payload.event.entity_id;
    const feedback = payload.data;

    // Buscar o edital associado
    const edital = await base44.asServiceRole.entities.Edital.list().then(
      (editais) => editais.find(e => e.id === feedback.edital_id)
    );

    if (!edital) {
      return Response.json({ error: 'Edital not found' }, { status: 404 });
    }

    // Se feedback foi útil ou parcialmente útil, adicionar à base de conhecimento da IA
    if (['útil', 'parcialmente_útil'].includes(feedback.feedback)) {
      const iaTrainamento = edital.ia_treinamento || [];

      // Verificar se já existe essa Q&A
      const jaExiste = iaTrainamento.some(
        t => t.pergunta === feedback.pergunta && t.resposta === feedback.resposta_ia
      );

      if (!jaExiste) {
        const novaEntrada = {
          id: Math.random().toString(36).substr(2, 9),
          pergunta: feedback.pergunta,
          resposta: feedback.resposta_ia,
          categoria: feedback.categoria || 'geral',
          origem: 'feedback_usuario',
          created_at: new Date().toISOString(),
        };

        // Aplicar correção sugerida se disponível
        if (feedback.correcao_sugerida) {
          novaEntrada.resposta = feedback.correcao_sugerida;
          novaEntrada.origem = 'feedback_usuario_corrigido';
        }

        iaTrainamento.push(novaEntrada);

        // Atualizar o edital com a nova entrada
        await base44.asServiceRole.entities.Edital.update(edital.id, {
          ia_treinamento: iaTrainamento,
        });

        // Marcar feedback como integrado
        await base44.asServiceRole.entities.FeedbackIAEdital.update(feedbackId, {
          integrado_treino: true,
        });

        return Response.json({
          success: true,
          message: 'Feedback integrado com sucesso à base de conhecimento',
          novaEntrada,
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Feedback registrado mas não foi integrado ao treino',
    });
  } catch (error) {
    console.error('Erro ao absorver feedback IA:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});