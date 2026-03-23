import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import mammoth from 'npm:mammoth@1.8.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();

    const response = await fetch(file_url);
    if (!response.ok) throw new Error(`Falha ao buscar arquivo: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();

    // Extrai HTML para preservar headings, tabelas e estrutura visual do DOCX
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    // Também extrai texto puro como fallback
    const textResult = await mammoth.extractRawText({ arrayBuffer });

    return Response.json({
      text: textResult.value,
      html: htmlResult.value,
      warnings: [...(htmlResult.messages || []), ...(textResult.messages || [])].map(m => m.message)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});