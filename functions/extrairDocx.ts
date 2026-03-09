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
    const result = await mammoth.extractRawText({ arrayBuffer });

    return Response.json({
      text: result.value,
      warnings: result.messages?.map(m => m.message) || []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});