import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType
} from 'npm:docx@8.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { projeto, campos } = await req.json();
    const children = [];

    // Título
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'RELATÓRIO DE PRESTAÇÃO DE CONTAS', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: projeto.titulo || 'Projeto', bold: true, size: 26, color: '4f46e5' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    );

    if (projeto.orgao_financiador) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Órgão: ${projeto.orgao_financiador}`, size: 20, color: '64748b' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
      }));
    }

    for (const campo of campos) {
      if (!campo.pergunta) continue;
      const hasContent =
        campo.resposta ||
        campo.dados_item1 ||
        (campo.itens_tabela && campo.itens_tabela.length > 0) ||
        (campo.cronograma_oes && campo.cronograma_oes.length > 0);
      if (!hasContent) continue;

      if (campo.secao) {
        children.push(new Paragraph({
          children: [new TextRun({ text: campo.secao, bold: true, size: 22, color: '1e293b' })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 80 },
        }));
      }

      children.push(new Paragraph({
        children: [new TextRun({ text: campo.pergunta, bold: true, size: 20 })],
        spacing: { after: 80 },
      }));

      if (campo.dados_item1) {
        const d = campo.dados_item1;
        const items = [
          ['Edital/Programa', d.edital],
          ['Título do Projeto', d.titulo_projeto],
          ['Coordenador', d.coordenador],
          ['Instituição Executora', d.razao_social],
          ['Nome Fantasia', d.nome_fantasia],
          ['CNPJ', d.cnpj],
          ['Nº Termo de Outorga', d.termo_outorga],
          ['Modelo de Análise', d.modelo_analise],
        ].filter(([, v]) => v);
        for (const [k, v] of items) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${k}: `, bold: true, size: 18 }),
              new TextRun({ text: String(v), size: 18 }),
            ],
            spacing: { after: 60 },
          }));
        }
      } else if (campo.itens_tabela && campo.itens_tabela.length > 0) {
        for (const item of campo.itens_tabela) {
          const partes = [];
          if (item.nome) partes.push(item.nome);
          if (item.titulo) partes.push(item.titulo);
          if (item.responsabilidade) partes.push(item.responsabilidade);
          if (item.formacao) partes.push(item.formacao);
          if (item.objetivo_titulo) partes.push(item.objetivo_titulo);
          if (item.descricao) partes.push(item.descricao);
          children.push(new Paragraph({
            children: [new TextRun({ text: `• ${partes.join(' — ')}`, size: 18 })],
            spacing: { after: 60 },
          }));
          if (item.entregas && Array.isArray(item.entregas)) {
            for (const e of item.entregas) {
              if (e.descricao) {
                children.push(new Paragraph({
                  children: [new TextRun({ text: `    ◦ Entrega: ${e.descricao} (${e.percentagem || 0}%)`, size: 17, color: '475569' })],
                  spacing: { after: 40 },
                }));
              }
            }
          }
        }
      } else if (campo.resposta) {
        children.push(new Paragraph({
          children: [new TextRun({ text: campo.resposta, size: 20 })],
          spacing: { after: 200 },
        }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length)));
    }
    const base64 = btoa(binary);

    return Response.json({ base64, filename: `relatorio-${Date.now()}.docx` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});