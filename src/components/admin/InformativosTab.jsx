import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Network, Download, Presentation } from "lucide-react";
import { base44 } from "@/api/base44Client";

// ─── Divulgação a Investidores ────────────────────────────────────────────────

const TELAS = [
  {
    titulo: "Portal de Editais — Visão do Empreendedor",
    descricao: "Tela principal da plataforma para empreendedores. Exibe um mapa interativo do Brasil com os estados e seus respectivos órgãos de fomento (FAPES, FAPERJ, FAPESP, FAPEMIG), cards de categorias de oportunidades (Inovação & Startups, Apoio à Pesquisa, Empreendedorismo, Bolsas & Editais), e listagem completa dos editais com filtros por status, categoria, área e busca por texto. Permite ao empreendedor encontrar oportunidades de financiamento de forma ágil e centralizada.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Comunidade — Fórum de Discussão",
    descricao: "Espaço colaborativo onde empreendedores e consultores discutem editais, tiram dúvidas e compartilham experiências. Suporta respostas encadeadas (threads), identificação dos autores e filtros por edital. Promove networking e troca de conhecimento entre os participantes da plataforma.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Minhas Propostas — Gestão de Candidaturas",
    descricao: "Painel de controle das propostas do empreendedor. Lista todas as candidaturas em andamento com status (Rascunho, Em Análise, Aprovada, Rejeitada, Submetida). Oferece pontuação estimada por IA, acesso rápido ao formulário de submissão e histórico completo das iniciativas de captação de recursos.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Proposta — Formulário de Submissão com IA",
    descricao: "Editor inteligente para preenchimento das propostas. A IA analisa o edital e sugere respostas contextualizadas para cada campo obrigatório. Suporte a múltiplas seções (identificação, objetivos, metodologia, equipe, orçamento), versionamento de respostas e integração com o formulário do site de submissão (ex: Sigfapes). Reduz em até 70% o tempo de elaboração de propostas.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Tira-Dúvidas IA — Assistente Especializado",
    descricao: "Chat inteligente treinado com os documentos de cada edital (edital completo, manual de uso de recursos, anexos). O empreendedor faz perguntas em linguagem natural e recebe respostas precisas baseadas no conteúdo oficial do edital. Elimina dúvidas frequentes e reduz retrabalho nos processos de submissão.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Acompanhamento — Painel de Projetos Aprovados",
    descricao: "Central de gestão para projetos que receberam financiamento. Exibe lista de projetos com status (Ativo, Concluído, Suspenso), valor contratado, período de execução e indicadores de consultoria. Permite criar e gerenciar múltiplos projetos simultaneamente, com acesso rápido às funcionalidades de cada um.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Projeto — Controle Financeiro e Gastos",
    descricao: "Módulo completo de prestação de contas financeiras. Registra gastos por categoria (Material Permanente, Material de Consumo, Terceiros/PF, Diárias, Passagens, Contrapartida, DOACI), com upload de notas fiscais e comprovantes. Exibe orçamento aprovado por linha, saldo disponível, total executado e percentual de execução. Suporte a seleção em lote para exportação ao Google Drive.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Projeto — Relatório de Prestação de Contas",
    descricao: "Formulário inteligente de relatório gerado automaticamente a partir do PDF modelo do edital. A IA extrai todos os campos e organiza em seções: Identificação, Equipe, Objetivos, Atividades, Plano de Entregas (Quadro 5 com % de execução por OE), Cronograma Físico (Item 7 com meses de execução), Execução Financeira (Item 8 com dados dos gastos registrados) e Resultados Alcançados com suporte a imagens. Exportação em HTML estruturado.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Importar Projeto Aprovado — IA Extratora",
    descricao: "Funcionalidade exclusiva que permite ao empreendedor fazer upload do PDF do projeto aprovado pela agência de fomento. A IA extrai automaticamente: dados de identificação, equipe (nome, função, formação), objetivos específicos, lista de atividades, entregas por objetivo e linhas de orçamento, preenchendo os campos do relatório sem esforço manual.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Marketplace de Consultores — Busca de Apoio Especializado",
    descricao: "Sistema de conexão entre empreendedores e consultores especializados. O empreendedor pode solicitar tutoria aberta (qualquer consultor pode oferecer proposta) ou convidar diretamente um consultor específico. Suporte a negociação de valores com contrapropostas, histórico de conversas e aprovação/rejeição de propostas. Garante suporte técnico qualificado durante a execução dos projetos.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Dashboard do Consultor — Gestão de Tutorias",
    descricao: "Painel exclusivo para consultores. Exibe solicitações de tutoria disponíveis (abertas) e convites diretos recebidos, com filtros por status (Pendente, Em Negociação, Em Atendimento, Concluída). Permite ao consultor enviar propostas com valores e descrição dos serviços, negociar condições e acompanhar todos os projetos que está apoiando.",
    secao: "Visão do Consultor",
  },
  {
    titulo: "Google Drive — Exportação Automática de Comprovantes",
    descricao: "Integração com Google Drive para organização automática de comprovantes de gastos. A plataforma cria uma estrutura de pastas por categoria de gasto (Material Permanente, Consumo, Terceiros, etc.) e exporta notas fiscais e anexos com nomenclatura padronizada. Gera também um resumo em Google Docs para cada item exportado. Facilita auditorias e prestações de contas.",
    secao: "Visão do Empreendedor",
  },
  {
    titulo: "Painel Administrativo — Gestão de Editais",
    descricao: "Interface exclusiva para administradores. Permite importar automaticamente editais abertos dos principais órgãos de fomento do Brasil (FAPES/ES, FAPERJ/RJ, FAPESP/SP, FAPEMIG/MG) com busca na internet via IA. Suporte a cadastro manual, edição e exclusão de editais, agrupados por estado. Configuração de documentos e treinamento da IA por edital.",
    secao: "Área Administrativa",
  },
  {
    titulo: "Painel Administrativo — Gestão de Usuários",
    descricao: "Controle de acesso centralizado. O administrador visualiza todos os usuários cadastrados, altera perfis (Empreendedor, Consultor, Admin) e convida novos usuários por e-mail. Implementa segregação de papéis com permissões diferenciadas: empreendedores acessam apenas seus próprios projetos, consultores visualizam tutorias disponíveis, e administradores têm visão completa da plataforma.",
    secao: "Área Administrativa",
  },
  {
    titulo: "Configuração de IA por Edital — Base de Conhecimento",
    descricao: "Módulo de treinamento da IA por edital. O administrador faz upload dos documentos (edital completo, manual de recursos, anexos de proposta, formulários do site de submissão), e a IA extrai automaticamente as perguntas dos formulários. Suporte a base de conhecimento customizada com pares pergunta-resposta, treinada via chat com o admin ou entrada manual. Garante respostas precisas e contextualizadas para cada edital.",
    secao: "Área Administrativa",
  },
];

function DivulgacaoInvestidores() {
  const [gerando, setGerando] = useState(false);

  const gerarPDF = () => {
    setGerando(true);
    setTimeout(() => {
      const secoes = {};
      TELAS.forEach(t => {
        if (!secoes[t.secao]) secoes[t.secao] = [];
        secoes[t.secao].push(t);
      });

      let imgCounter = 1;
      let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Divulgação a Investidores — Munnin Crow</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; }
  .capa { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); color: white; text-align: center; padding: 60px 40px; page-break-after: always; }
  .capa-logo { font-size: 48px; font-weight: 900; letter-spacing: -1px; margin-bottom: 16px; }
  .capa-sub { font-size: 22px; color: #a5b4fc; margin-bottom: 32px; }
  .capa-desc { font-size: 14px; color: #94a3b8; max-width: 600px; line-height: 1.7; }
  .capa-data { margin-top: 40px; font-size: 12px; color: #64748b; }
  .secao-titulo { font-size: 24px; font-weight: 800; color: #1e293b; padding: 40px 60px 20px; border-bottom: 3px solid #6366f1; margin-bottom: 0; page-break-before: always; }
  .tela { padding: 40px 60px; page-break-inside: avoid; }
  .tela + .tela { border-top: 1px solid #e2e8f0; }
  .placeholder-img { width: 100%; height: 340px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border: 2px dashed #cbd5e1; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; margin-bottom: 16px; }
  .placeholder-img span { font-size: 13px; color: #94a3b8; font-style: italic; }
  .placeholder-img .icon { font-size: 36px; }
  .legenda { text-align: center; font-size: 13px; color: #475569; font-style: italic; margin-bottom: 20px; }
  .legenda strong { font-weight: 700; color: #334155; }
  .descricao { font-size: 14px; color: #475569; line-height: 1.75; background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px 20px; border-radius: 0 8px 8px 0; }
  .rodape { text-align: center; padding: 40px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; margin-top: 40px; }
  .badge-secao { display: inline-block; background: #eef2ff; color: #6366f1; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
  @media print {
    .secao-titulo { page-break-before: always; }
    .tela { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="capa">
  <div class="capa-logo">🦅 Munnin Crow</div>
  <div class="capa-sub">Plataforma de Gestão de Editais e Projetos de Fomento</div>
  <div class="capa-desc">
    Documento de divulgação para investidores e agências de fomento.<br/>
    Apresentação das funcionalidades desenvolvidas com os recursos investidos no projeto.<br/>
    Demonstração das visões do empreendedor, consultor e administrador.
  </div>
  <div class="capa-data">Gerado em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
</div>
`;

      Object.entries(secoes).forEach(([secao, telas]) => {
        html += `<div class="secao-titulo">${secao}</div>`;
        telas.forEach(t => {
          html += `
<div class="tela">
  <div class="badge-secao">${t.secao}</div>
  <div class="placeholder-img">
    <div class="icon">🖥️</div>
    <span>[ Captura de tela: ${t.titulo} ]</span>
  </div>
  <div class="legenda"><strong>Imagem ${imgCounter++} — ${t.titulo}</strong></div>
  <div class="descricao">${t.descricao}</div>
</div>`;
        });
      });

      html += `<div class="rodape">Munnin Crow &copy; ${new Date().getFullYear()} — Documento gerado automaticamente pela plataforma</div></body></html>`;

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `munnin-crow-divulgacao-investidores-${new Date().toISOString().slice(0,10)}.html`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      setGerando(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <h2 className="text-lg font-bold text-indigo-900 mb-1">Divulgação a Investidores</h2>
        <p className="text-sm text-indigo-700 mb-4">
          Gera um documento HTML formatado para impressão/PDF com todas as funcionalidades da plataforma, 
          organizado por visão (empreendedor, consultor e administrativo). 
          Ideal para apresentação a investidores e agências de fomento, demonstrando o desenvolvimento realizado com os recursos investidos.
        </p>
        <Button onClick={gerarPDF} disabled={gerando} className="bg-indigo-600 hover:bg-indigo-700">
          {gerando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Presentation className="w-4 h-4 mr-2" />Gerar Documento de Divulgação</>}
        </Button>
        <p className="text-xs text-indigo-500 mt-2">
          O arquivo HTML gerado pode ser aberto no navegador e impresso como PDF (Ctrl+P → Salvar como PDF).
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conteúdo incluído ({TELAS.length} telas)</p>
        {["Visão do Empreendedor", "Visão do Consultor", "Área Administrativa"].map(secao => (
          <div key={secao} className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <p className="text-sm font-semibold text-gray-700">{secao}</p>
            </div>
            <div className="divide-y">
              {TELAS.filter(t => t.secao === secao).map((t, i) => (
                <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                  <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded mt-0.5 flex-shrink-0">
                    IMG {TELAS.findIndex(x => x.titulo === t.titulo) + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modelo Relacional e Requisitos ─────────────────────────────────────────

const ENTIDADES = [
  { nome: "Edital", cor: "#6366f1", campos: ["id", "titulo", "numero", "descricao", "status", "estado", "orgao", "area", "categoria", "valor_total", "data_abertura", "data_encerramento", "url_fapes", "etapas[]", "ia_treinamento[]", "requisitos[]", "criterios_avaliacao[]", "documentos_modelo[]"] },
  { nome: "Proposta", cor: "#8b5cf6", campos: ["id", "titulo", "descricao", "edital_id", "edital_titulo", "status", "pontuacao_estimada", "analise_ia", "campos_formulario[]", "sigfapes_campos_formulario[]", "consultor_email", "consultor_nome", "consultor_status", "documentos[]"] },
  { nome: "AcompanhamentoProjeto", cor: "#0ea5e9", campos: ["id", "titulo", "descricao_projeto", "orgao_financiador", "numero_edital", "valor_contratado", "data_inicio", "data_fim_prevista", "status", "orcamento_linhas[]", "relatorio_template_url", "relatorio_campos[]", "consultor_email", "consultor_status", "drive_folder_url"] },
  { nome: "GastoProjeto", cor: "#f59e0b", campos: ["id", "acompanhamento_id", "descricao", "categoria", "valor", "quantidade", "data", "fornecedor", "anexos[]", "status_revisao", "drive_exportado", "adicionado_por"] },
  { nome: "SolicitacaoTutoria", cor: "#10b981", campos: ["id", "titulo", "descricao", "area", "prioridade", "status", "tipo", "empreendedor_email", "consultor_email", "propostas[]"] },
  { nome: "MensagemChat", cor: "#f43f5e", campos: ["id", "edital_id", "conteudo", "autor_nome", "autor_email", "reply_to_id"] },
  { nome: "Orientacao", cor: "#64748b", campos: ["id", "titulo", "descricao", "tipo", "url", "categoria", "edital_id"] },
  { nome: "EstadoOrgao", cor: "#7c3aed", campos: ["id", "estado", "nome_orgao", "url_editais_abertos", "url_editais_encerrados"] },
  { nome: "User (built-in)", cor: "#334155", campos: ["id", "full_name", "email", "role (admin|empreendedor|consultor)", "created_date"] },
];

const RELACOES = [
  { de: "Proposta", para: "Edital", label: "pertence a", tipo: "N:1" },
  { de: "AcompanhamentoProjeto", para: "User", label: "criado por", tipo: "N:1" },
  { de: "GastoProjeto", para: "AcompanhamentoProjeto", label: "registrado em", tipo: "N:1" },
  { de: "SolicitacaoTutoria", para: "User", label: "empreendedor/consultor", tipo: "N:1" },
  { de: "MensagemChat", para: "Edital", label: "vinculada a", tipo: "N:1" },
  { de: "Orientacao", para: "Edital", label: "associada a", tipo: "N:1" },
];

const RF = [
  { id: "RF01", categoria: "Editais", descricao: "Importar automaticamente editais abertos dos órgãos FAPES, FAPERJ, FAPESP e FAPEMIG via IA com busca na internet." },
  { id: "RF02", categoria: "Editais", descricao: "Cadastrar, editar e excluir editais manualmente com campos de identificação, datas, links, área e categoria." },
  { id: "RF03", categoria: "Editais", descricao: "Exibir editais em mapa interativo do Brasil e cards por categoria com filtros por status, área e busca textual." },
  { id: "RF04", categoria: "Propostas", descricao: "Criar e gerenciar propostas para editais com preenchimento assistido por IA campo a campo." },
  { id: "RF05", categoria: "Propostas", descricao: "Analisar a proposta com IA e gerar pontuação estimada e sugestões de melhoria." },
  { id: "RF06", categoria: "Propostas", descricao: "Gerenciar formulários do site de submissão (ex: Sigfapes) com campos extraídos automaticamente pela IA do documento de perguntas do site." },
  { id: "RF07", categoria: "Tira-Dúvidas", descricao: "Responder perguntas dos empreendedores sobre editais via IA treinada com os documentos oficiais de cada edital." },
  { id: "RF08", categoria: "Acompanhamento", descricao: "Criar e gerenciar projetos aprovados com dados financeiros, orçamento, consultoria e integração com Drive." },
  { id: "RF09", categoria: "Acompanhamento", descricao: "Registrar gastos por categoria com upload de comprovantes, controle de saldo e exportação ao Google Drive." },
  { id: "RF10", categoria: "Acompanhamento", descricao: "Gerar formulário de relatório de prestação de contas a partir do PDF modelo do edital via IA." },
  { id: "RF11", categoria: "Acompanhamento", descricao: "Importar dados do projeto aprovado (PDF) e preencher automaticamente identificação, equipe, atividades, entregas e orçamento no relatório." },
  { id: "RF12", categoria: "Acompanhamento", descricao: "Exportar relatório preenchido em HTML estruturado, respeitando o layout do modelo PDF do edital." },
  { id: "RF13", categoria: "Consultoria", descricao: "Empreendedor solicitar tutoria aberta ou direta para consultores cadastrados, com negociação de valores." },
  { id: "RF14", categoria: "Consultoria", descricao: "Consultor visualizar solicitações disponíveis, enviar propostas e acompanhar negociações." },
  { id: "RF15", categoria: "Comunidade", descricao: "Fórum de mensagens por edital com suporte a respostas encadeadas e identificação de autores." },
  { id: "RF16", categoria: "Orientações", descricao: "Gerenciar biblioteca de materiais educacionais (vídeos, documentos, apresentações) por categoria e edital." },
  { id: "RF17", categoria: "Administração", descricao: "Administrador convidar usuários, gerenciar perfis e alterar papéis (empreendedor, consultor, admin)." },
  { id: "RF18", categoria: "Administração", descricao: "Configurar documentos e base de conhecimento da IA por edital, incluindo extração automática de campos de formulários." },
  { id: "RF19", categoria: "Drive", descricao: "Criar estrutura automática de pastas no Google Drive por projeto e categoria de gasto e exportar comprovantes com resumo em Docs." },
];

const RNF = [
  { id: "RNF01", categoria: "Segurança", descricao: "Autenticação obrigatória para acesso à plataforma. Usuários não autenticados são redirecionados ao login." },
  { id: "RNF02", categoria: "Segurança", descricao: "Segregação de papéis: empreendedores acessam apenas seus próprios projetos e propostas; consultores visualizam somente tutorias disponíveis; administradores têm visão completa." },
  { id: "RNF03", categoria: "Segurança", descricao: "Tokens OAuth do Google Drive armazenados e gerenciados via App Connectors com escopos mínimos necessários (drive.file)." },
  { id: "RNF04", categoria: "Desempenho", descricao: "Debounce de 5 segundos para geração automática de textos por IA, evitando rate limit e chamadas desnecessárias." },
  { id: "RNF05", categoria: "Desempenho", descricao: "Carregamento de dados com React Query e cache, evitando requisições redundantes ao banco de dados." },
  { id: "RNF06", categoria: "Usabilidade", descricao: "Interface responsiva compatível com dispositivos móveis e desktop." },
  { id: "RNF07", categoria: "Usabilidade", descricao: "Confirmação explícita do usuário antes de sobrescrever dados já preenchidos em campos do relatório." },
  { id: "RNF08", categoria: "Usabilidade", descricao: "Feedback visual em todas as operações assíncronas (spinners, badges de status, mensagens de progresso)." },
  { id: "RNF09", categoria: "Confiabilidade", descricao: "Dados do relatório persistidos no banco após cada alteração de campo (auto-save), sem necessidade de botão salvar manual." },
  { id: "RNF10", categoria: "Confiabilidade", descricao: "Campos marcados como 'Concluído' são protegidos contra sobrescrita por importações automáticas." },
  { id: "RNF11", categoria: "Integração", descricao: "Integração com Google Drive via OAuth sem expor tokens no frontend — todas as chamadas passam por backend functions." },
  { id: "RNF12", categoria: "Integração", descricao: "Integração com IA (LLM) para geração de textos, extração de dados de PDFs e respostas contextualizadas, com suporte a arquivos e busca na internet." },
  { id: "RNF13", categoria: "Manutenibilidade", descricao: "Arquitetura componentizada com separação de responsabilidades: páginas, componentes, entidades e funções backend independentes." },
  { id: "RNF14", categoria: "Acessibilidade", descricao: "Uso de componentes Radix UI com suporte a navegação por teclado e atributos ARIA para leitores de tela." },
];

const CORES_CAT = {
  Editais: "#6366f1", Propostas: "#8b5cf6", "Tira-Dúvidas": "#0ea5e9",
  Acompanhamento: "#10b981", Consultoria: "#f59e0b", Comunidade: "#f43f5e",
  Orientações: "#64748b", Administração: "#dc2626", Drive: "#16a34a",
  Segurança: "#dc2626", Desempenho: "#f59e0b", Usabilidade: "#6366f1",
  Confiabilidade: "#10b981", Integração: "#0ea5e9", Manutenibilidade: "#8b5cf6", Acessibilidade: "#64748b",
};

function LogicaPlataforma() {
  const [gerando, setGerando] = useState(false);
  const [tipo, setTipo] = useState(null);

  const gerarDocumento = (formato) => {
    setGerando(true);
    setTipo(formato);
    setTimeout(() => {
      // Gera HTML com modelo relacional + RF + RNF
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Lógica da Plataforma — Munnin Crow</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: white; padding: 40px 60px; }
  .header h1 { font-size: 32px; font-weight: 900; }
  .header p { color: #a5b4fc; margin-top: 8px; font-size: 14px; }
  .section { padding: 40px 60px; page-break-before: always; }
  .section h2 { font-size: 22px; font-weight: 800; color: #1e293b; border-bottom: 3px solid #6366f1; padding-bottom: 12px; margin-bottom: 24px; }
  .er-container { display: flex; flex-wrap: wrap; gap: 20px; }
  .entidade { border-radius: 12px; padding: 16px; min-width: 220px; flex: 1; max-width: 320px; }
  .entidade h3 { font-size: 13px; font-weight: 800; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px; }
  .entidade ul { list-style: none; font-size: 11px; color: #475569; }
  .entidade li { padding: 3px 8px; border-bottom: 1px solid #e2e8f0; }
  .entidade li:last-child { border: none; }
  .relacoes { margin-top: 24px; }
  .relacao { display: flex; align-items: center; gap-8px; padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; font-size: 12px; }
  .relacao .de { font-weight: 700; color: #6366f1; }
  .relacao .para { font-weight: 700; color: #0ea5e9; }
  .relacao .tipo { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #1e293b; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
  td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; background: white; }
  tr:nth-child(even) td { background: #f8fafc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; color: white; }
  @media print { .section { page-break-before: always; } }
</style>
</head>
<body>
<div class="header">
  <h1>🦅 Munnin Crow — Lógica da Plataforma</h1>
  <p>Modelo Relacional de Entidades · Requisitos Funcionais · Requisitos Não Funcionais</p>
  <p style="margin-top:4px;font-size:12px;color:#64748b;">Gerado em: ${new Date().toLocaleDateString("pt-BR")}</p>
</div>

<div class="section">
  <h2>Modelo Relacional de Entidades (MER)</h2>
  <div class="er-container">
    ${ENTIDADES.map(e => `
      <div class="entidade" style="background:${e.cor}10;border:2px solid ${e.cor}40;">
        <h3 style="background:${e.cor};">${e.nome}</h3>
        <ul>${e.campos.map(c => `<li>${c}</li>`).join("")}</ul>
      </div>
    `).join("")}
  </div>
  <div class="relacoes" style="margin-top:32px;">
    <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;color:#475569;">Relacionamentos</h3>
    ${RELACOES.map(r => `
      <div class="relacao">
        <span class="de">${r.de}</span>
        <span style="margin:0 8px;color:#94a3b8;">→</span>
        <span class="para">${r.para}</span>
        <span style="margin:0 8px;color:#94a3b8;">${r.label}</span>
        <span class="tipo">${r.tipo}</span>
      </div>
    `).join("")}
  </div>
</div>

<div class="section">
  <h2>Requisitos Funcionais (RF)</h2>
  <table>
    <thead><tr><th width="60">ID</th><th width="120">Categoria</th><th>Descrição</th></tr></thead>
    <tbody>
      ${RF.map(r => `<tr>
        <td><strong>${r.id}</strong></td>
        <td><span class="badge" style="background:${CORES_CAT[r.categoria] || '#64748b'};">${r.categoria}</span></td>
        <td>${r.descricao}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>

<div class="section">
  <h2>Requisitos Não Funcionais (RNF)</h2>
  <table>
    <thead><tr><th width="60">ID</th><th width="120">Categoria</th><th>Descrição</th></tr></thead>
    <tbody>
      ${RNF.map(r => `<tr>
        <td><strong>${r.id}</strong></td>
        <td><span class="badge" style="background:${CORES_CAT[r.categoria] || '#64748b'};">${r.categoria}</span></td>
        <td>${r.descricao}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>

</body>
</html>`;

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `munnin-crow-logica-${new Date().toISOString().slice(0,10)}.html`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      setGerando(false);
      setTipo(null);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Lógica da Plataforma</h2>
        <p className="text-sm text-slate-600 mb-4">
          Gera documento com o Modelo Relacional de Entidades (MER), Requisitos Funcionais (RF) e Requisitos Não Funcionais (RNF) da plataforma.
        </p>
        <Button onClick={() => gerarDocumento("html")} disabled={gerando} className="bg-slate-800 hover:bg-slate-900">
          {gerando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Download className="w-4 h-4 mr-2" />Gerar Documento de Lógica</>}
        </Button>
        <p className="text-xs text-slate-400 mt-2">Abre no navegador e pode ser salvo como PDF (Ctrl+P → Salvar como PDF).</p>
      </div>

      {/* Preview MER */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Entidades ({ENTIDADES.length})</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ENTIDADES.map(e => (
            <div key={e.nome} className="bg-white border rounded-lg p-3" style={{ borderLeftColor: e.cor, borderLeftWidth: 4 }}>
              <p className="text-sm font-bold text-gray-800">{e.nome}</p>
              <p className="text-xs text-gray-400 mt-0.5">{e.campos.length} campos</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">RF ({RF.length} requisitos)</p>
          <div className="bg-white border rounded-lg divide-y max-h-64 overflow-y-auto">
            {RF.map(r => (
              <div key={r.id} className="px-3 py-2 flex items-start gap-2">
                <span className="text-xs font-mono font-bold text-indigo-600 flex-shrink-0">{r.id}</span>
                <span className="text-xs text-gray-600 line-clamp-2">{r.descricao}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">RNF ({RNF.length} requisitos)</p>
          <div className="bg-white border rounded-lg divide-y max-h-64 overflow-y-auto">
            {RNF.map(r => (
              <div key={r.id} className="px-3 py-2 flex items-start gap-2">
                <span className="text-xs font-mono font-bold text-slate-600 flex-shrink-0">{r.id}</span>
                <span className="text-xs text-gray-600 line-clamp-2">{r.descricao}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Aba principal Informativos ──────────────────────────────────────────────

export default function InformativosTab() {
  const [sub, setSub] = useState("divulgacao");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setSub("divulgacao")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sub === "divulgacao" ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          Divulgação a Investidores
        </button>
        <button
          onClick={() => setSub("logica")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sub === "logica" ? "bg-slate-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          Lógica
        </button>
      </div>

      {sub === "divulgacao" && <DivulgacaoInvestidores />}
      {sub === "logica" && <LogicaPlataforma />}
    </div>
  );
}