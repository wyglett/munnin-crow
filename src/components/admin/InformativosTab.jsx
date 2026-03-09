import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Presentation, Camera, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

// ─── Dados das telas ──────────────────────────────────────────────────────────

const TELAS = [
  { id: "home", titulo: "Portal de Editais", subtitulo: "Descoberta de Oportunidades de Fomento", secao: "Visão do Empreendedor", url: createPageUrl("Home"),
    funcionalidades: ["Mapa interativo do Brasil com órgãos de fomento por estado (FAPES/ES, FAPERJ/RJ, FAPESP/SP, FAPEMIG/MG)", "Cards de categorias: Inovação & Startups, Apoio à Pesquisa, Empreendedorismo, Bolsas & Editais", "Listagem de editais com filtros por status (Aberto/Encerrado), área temática e busca textual", "Acesso direto ao edital no site oficial do órgão de fomento", "Indicação visual de prazo de encerramento e valor disponível por edital"],
    impacto: "Centraliza em um único ponto de acesso todas as oportunidades de financiamento disponíveis nos principais estados brasileiros, eliminando a necessidade de consulta manual em múltiplos portais governamentais." },

  { id: "proposta", titulo: "Editor de Propostas com IA", subtitulo: "Elaboração Assistida de Candidaturas", secao: "Visão do Empreendedor", url: createPageUrl("MinhasPropostas"),
    funcionalidades: ["Criação de proposta vinculada a um edital específico com contexto automático da IA", "Preenchimento campo a campo com sugestões geradas pela IA baseadas no edital", "Pontuação estimada de aderência aos critérios de avaliação do edital", "Formulário do site de submissão (ex: Sigfapes) com campos extraídos automaticamente do PDF", "Gestão de status: Rascunho → Em Análise → Submetida → Aprovada/Rejeitada", "Exportação dos campos preenchidos para revisão e submissão"],
    impacto: "Reduz em até 70% o tempo de elaboração de propostas ao automatizar a interpretação do edital e sugerir conteúdo técnico adequado para cada campo exigido." },

  { id: "tiraduvidas", titulo: "Tira-Dúvidas por IA", subtitulo: "Assistente Especializado por Edital", secao: "Visão do Empreendedor", url: createPageUrl("TiraDuvidas"),
    funcionalidades: ["Chat conversacional treinado com os documentos oficiais de cada edital (PDF completo, manual de recursos)", "Respostas baseadas exclusivamente no conteúdo do edital — sem alucinações", "Histórico de conversa por sessão", "Indicação da fonte do edital nas respostas", "Disponível 24/7, sem necessidade de contato com a agência de fomento"],
    impacto: "Elimina a dependência de canais oficiais para esclarecimento de dúvidas e reduz erros de interpretação nas submissões, aumentando a taxa de aprovação das propostas." },

  { id: "comunidade", titulo: "Comunidade e Fórum", subtitulo: "Rede Colaborativa de Empreendedores", secao: "Visão do Empreendedor", url: createPageUrl("Comunidade"),
    funcionalidades: ["Fórum de discussão organizado por edital", "Respostas encadeadas (threads) com identificação dos autores", "Compartilhamento de experiências e dúvidas entre participantes", "Filtros por edital e busca por conteúdo", "Notificação de respostas em mensagens citadas"],
    impacto: "Fomenta o ecossistema de inovação ao conectar empreendedores com experiências semelhantes, criando uma base de conhecimento coletiva sobre os processos de submissão." },

  { id: "orientacoes", titulo: "Biblioteca de Orientações", subtitulo: "Materiais Educacionais e Capacitação", secao: "Visão do Empreendedor", url: createPageUrl("Orientacoes"),
    funcionalidades: ["Biblioteca de vídeos, apresentações, documentos e artigos", "Organização por categoria e edital específico", "Acesso direto via link externo ou embed", "Criação e edição de orientações pela equipe gestora", "Filtros por tipo de material e área temática"],
    impacto: "Capacita os empreendedores antes e durante o processo de submissão, aumentando a qualidade das propostas e a compreensão dos requisitos técnicos e formais dos editais." },

  { id: "acompanhamento", titulo: "Painel de Projetos Aprovados", subtitulo: "Gestão Central de Projetos Financiados", secao: "Visão do Empreendedor", url: createPageUrl("Acompanhamento"),
    funcionalidades: ["Listagem de todos os projetos com status (Ativo, Concluído, Suspenso)", "Valor contratado, período de execução e indicadores de consultoria por projeto", "Importação automática de dados do projeto aprovado via upload do PDF da agência", "Vínculo com consultor responsável e status da negociação", "Acesso direto ao módulo financeiro e de relatório por projeto"],
    impacto: "Transforma a gestão de projetos financiados de um processo manual e disperso em um fluxo centralizado, rastreável e auditável, reduzindo riscos de inadimplência nas prestações de contas." },

  { id: "gastos", titulo: "Controle Financeiro e Gastos", subtitulo: "Prestação de Contas Financeira Automatizada", secao: "Visão do Empreendedor", url: createPageUrl("Acompanhamento"),
    funcionalidades: ["Registro de gastos por categoria: Material Permanente, Consumo, Terceiros/PF, Diárias, Passagens, Contrapartida, DOACI", "Upload de notas fiscais e comprovantes diretamente ao registro do gasto", "Comparativo em tempo real entre orçamento aprovado e executado por categoria", "Exportação em lote ao Google Drive com criação automática de estrutura de pastas e resumo em Docs", "Leitura automática de documentos fiscais via IA para extração de dados (valor, fornecedor, data)"],
    impacto: "Elimina planilhas manuais e garante rastreabilidade total dos gastos, com vinculação direta de comprovantes organizados no Google Drive para facilitar auditorias da agência financiadora." },

  { id: "relatorio", titulo: "Relatório de Prestação de Contas", subtitulo: "Geração Inteligente de Relatório Técnico", secao: "Visão do Empreendedor", url: createPageUrl("Acompanhamento"),
    funcionalidades: ["Upload do PDF modelo do relatório — a IA extrai todos os campos e seções automaticamente", "Item 1 (Identificação): quadro único com CNPJ, coordenador, instituição, modelo de análise", "Item 2 (Equipe): tabela com nome, responsabilidade e formação de cada membro", "Item 4 (Atividades): lista editável das atividades executadas", "Item 5 (Plano de Entregas): quadro por OE com % de execução e cálculo automático da média", "Item 7 (Cronograma Físico): seletor de meses por entrega sincronizado com Item 5", "Item 8 (Execução Financeira): preenchido automaticamente com os gastos registrados", "Exportação em HTML estruturado fiel ao layout do relatório oficial"],
    impacto: "Converte um processo de semanas em horas: o relatório é gerado automaticamente a partir dos dados já inseridos no sistema, eliminando retrabalho e reduzindo erros de preenchimento." },

  { id: "consultor_connect", titulo: "Marketplace de Consultores", subtitulo: "Conexão entre Empreendedores e Especialistas", secao: "Visão do Empreendedor", url: createPageUrl("Acompanhamento"),
    funcionalidades: ["Solicitação de tutoria aberta (qualquer consultor pode ofertar) ou direta (convite por e-mail)", "Sistema de propostas e contrapropostas de valores entre empreendedor e consultor", "Status rastreável: Sem Consultor → Aguardando → Em Negociação → Aprovado", "Histórico completo de negociação por projeto", "Notificação ao consultor de novos convites e solicitações abertas"],
    impacto: "Cria um mercado organizado de consultoria especializada em fomento, conectando quem precisa de apoio técnico com profissionais qualificados de forma transparente e negociável." },

  { id: "consultor_dash", titulo: "Dashboard do Consultor", subtitulo: "Gestão de Tutorias e Oportunidades", secao: "Visão do Consultor", url: createPageUrl("ConsultorDashboard"),
    funcionalidades: ["Painel exclusivo com listagem de solicitações abertas (qualquer consultor pode se candidatar)", "Convites diretos recebidos de empreendedores específicos", "Envio de proposta com descrição dos serviços e valor", "Gestão de todas as tutorias ativas e concluídas", "Acesso ao módulo de acompanhamento dos projetos que está assessorando"],
    impacto: "Oferece ao consultor uma visão consolidada de oportunidades e projetos ativos, profissionalizando sua atuação e ampliando seu alcance no ecossistema de fomento." },

  { id: "admin_editais", titulo: "Gestão de Editais (Admin)", subtitulo: "Curadoria e Atualização do Portfólio de Oportunidades", secao: "Área Administrativa", url: createPageUrl("AdminEditais"),
    funcionalidades: ["Importação automática de editais abertos via IA com busca em tempo real nos portais dos órgãos (FAPES, FAPERJ, FAPESP, FAPEMIG)", "Cadastro manual de editais com todos os campos técnicos e administrativos", "Agrupamento por estado e agência de fomento", "Edição e exclusão com confirmação de segurança", "Upload de documentos por etapa: edital completo, manual de recursos, anexo de proposta, formulário do site"],
    impacto: "Garante que a base de editais esteja sempre atualizada com intervenção mínima da equipe gestora, graças à importação automatizada via IA." },

  { id: "admin_ia", titulo: "Treinamento da IA por Edital", subtitulo: "Personalização do Assistente por Contexto", secao: "Área Administrativa", url: createPageUrl("AdminEditais"),
    funcionalidades: ["Upload de documentos do edital (PDF completo, manual, anexos) para treinamento da IA", "Extração automática de campos de formulários a partir do PDF de perguntas do site de submissão", "Base de conhecimento customizada com pares pergunta-resposta por edital", "Treinamento via chat direto com o admin — a IA aprende com as conversas", "Entrada manual de conhecimento específico com categorização"],
    impacto: "Permite que o assistente de IA forneça respostas precisas e contextualizadas para cada edital, substituindo FAQs estáticas por um sistema dinâmico de conhecimento atualizado." },

  { id: "admin_usuarios", titulo: "Gestão de Usuários (Admin)", subtitulo: "Controle de Acesso e Perfis", secao: "Área Administrativa", url: createPageUrl("AdminEditais"),
    funcionalidades: ["Listagem de todos os usuários com nome, e-mail e perfil atual", "Alteração de perfil em tempo real: Empreendedor, Consultor, Admin", "Convite de novos usuários por e-mail com definição do papel na plataforma", "Proteção contra remoção acidental de privilégios do próprio admin", "Segregação de acesso: empreendedores veem apenas seus dados, consultores veem tutorias disponíveis"],
    impacto: "Garante a integridade do modelo de acesso por papel, assegurando que dados sensíveis de projetos financiados sejam acessíveis apenas pelos participantes autorizados." },
];

// ─── Diagrama SVG de Entidades ────────────────────────────────────────────────

const NOS = [
  { id: "User",                    x: 400, y: 40,  cor: "#334155", label: "User" },
  { id: "Edital",                  x: 80,  y: 160, cor: "#6366f1", label: "Edital" },
  { id: "Proposta",                x: 280, y: 260, cor: "#8b5cf6", label: "Proposta" },
  { id: "AcompanhamentoProjeto",   x: 600, y: 180, cor: "#0ea5e9", label: "Acompanha-\nmentoProjeto" },
  { id: "GastoProjeto",            x: 760, y: 320, cor: "#f59e0b", label: "GastoProjeto" },
  { id: "SolicitacaoTutoria",      x: 580, y: 380, cor: "#10b981", label: "Solicitacao\nTutoria" },
  { id: "MensagemChat",            x: 60,  y: 340, cor: "#f43f5e", label: "MensagemChat" },
  { id: "Orientacao",              x: 250, y: 400, cor: "#64748b", label: "Orientacao" },
  { id: "EstadoOrgao",             x: 80,  y: 480, cor: "#7c3aed", label: "EstadoOrgao" },
];

const ARESTAS = [
  { de: "Proposta",              para: "Edital",                 label: "pertence a (N:1)" },
  { de: "MensagemChat",         para: "Edital",                 label: "vinculada a (N:1)" },
  { de: "Orientacao",           para: "Edital",                 label: "associada a (N:1)" },
  { de: "AcompanhamentoProjeto",para: "User",                   label: "criado por (N:1)" },
  { de: "GastoProjeto",         para: "AcompanhamentoProjeto",  label: "registrado em (N:1)" },
  { de: "SolicitacaoTutoria",   para: "User",                   label: "empreendedor/consultor (N:1)" },
  { de: "Proposta",             para: "User",                   label: "criado por (N:1)" },
];

function getNo(id) { return NOS.find(n => n.id === id); }

function DiagramaMER() {
  const W = 900, H = 560;
  return (
    <div className="w-full overflow-x-auto bg-white border rounded-xl">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 600, display: "block" }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
          </marker>
        </defs>
        {/* Arestas */}
        {ARESTAS.map((a, i) => {
          const de = getNo(a.de), para = getNo(a.para);
          if (!de || !para) return null;
          const mx = (de.x + para.x) / 2;
          const my = (de.y + para.y) / 2;
          return (
            <g key={i}>
              <line
                x1={de.x} y1={de.y + 18} x2={para.x} y2={para.y + 18}
                stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3"
                markerEnd="url(#arrow)"
              />
              <rect x={mx - 52} y={my - 9} width={104} height={16} rx={4} fill="white" opacity={0.85} />
              <text x={mx} y={my + 3} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="monospace">{a.label}</text>
            </g>
          );
        })}
        {/* Nós */}
        {NOS.map(n => {
          const linhas = n.label.split("\n");
          return (
            <g key={n.id}>
              <rect x={n.x - 60} y={n.y} width={120} height={36} rx={8} fill={n.cor} />
              {linhas.map((l, li) => (
                <text key={li} x={n.x} y={n.y + 14 + li * 13} textAnchor="middle" fontSize={10} fontWeight="700" fill="white" fontFamily="'Segoe UI', sans-serif">{l}</text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Dados lógica ─────────────────────────────────────────────────────────────

const ENTIDADES = [
  { nome: "Edital", cor: "#6366f1", campos: ["id", "titulo", "numero", "status", "estado", "orgao", "area", "categoria", "valor_total", "data_abertura", "data_encerramento", "url_fapes", "etapas[]", "ia_treinamento[]", "documentos_modelo[]"] },
  { nome: "Proposta", cor: "#8b5cf6", campos: ["id", "titulo", "edital_id", "status", "pontuacao_estimada", "analise_ia", "campos_formulario[]", "sigfapes_campos_formulario[]", "consultor_email", "consultor_status"] },
  { nome: "AcompanhamentoProjeto", cor: "#0ea5e9", campos: ["id", "titulo", "orgao_financiador", "valor_contratado", "data_inicio", "data_fim_prevista", "status", "orcamento_linhas[]", "relatorio_template_url", "relatorio_campos[]", "consultor_email", "consultor_status", "drive_folder_url"] },
  { nome: "GastoProjeto", cor: "#f59e0b", campos: ["id", "acompanhamento_id", "descricao", "categoria", "valor", "quantidade", "data", "fornecedor", "anexos[]", "status_revisao", "drive_exportado"] },
  { nome: "SolicitacaoTutoria", cor: "#10b981", campos: ["id", "titulo", "descricao", "prioridade", "status", "tipo", "empreendedor_email", "consultor_email", "propostas[]"] },
  { nome: "MensagemChat", cor: "#f43f5e", campos: ["id", "edital_id", "conteudo", "autor_nome", "autor_email", "reply_to_id"] },
  { nome: "Orientacao", cor: "#64748b", campos: ["id", "titulo", "tipo", "url", "categoria", "edital_id"] },
  { nome: "EstadoOrgao", cor: "#7c3aed", campos: ["id", "estado", "nome_orgao", "url_editais_abertos", "url_editais_encerrados"] },
  { nome: "User (built-in)", cor: "#334155", campos: ["id", "full_name", "email", "role (admin|empreendedor|consultor)", "created_date"] },
];

const RF = [
  { id: "RF01", categoria: "Editais", descricao: "Importar automaticamente editais abertos dos órgãos FAPES, FAPERJ, FAPESP e FAPEMIG via IA com busca na internet em tempo real." },
  { id: "RF02", categoria: "Editais", descricao: "Cadastrar, editar e excluir editais manualmente com campos de identificação, datas, links, área temática e categoria." },
  { id: "RF03", categoria: "Editais", descricao: "Exibir editais em mapa interativo do Brasil e cards por categoria com filtros por status, área e busca textual." },
  { id: "RF04", categoria: "Propostas", descricao: "Criar e gerenciar propostas para editais com preenchimento assistido por IA campo a campo, baseado no conteúdo do edital." },
  { id: "RF05", categoria: "Propostas", descricao: "Analisar a proposta com IA e gerar pontuação estimada de aderência e sugestões de melhoria por campo." },
  { id: "RF06", categoria: "Propostas", descricao: "Gerenciar formulários do site de submissão (ex: Sigfapes) com campos extraídos automaticamente pela IA do PDF de perguntas do site." },
  { id: "RF07", categoria: "Tira-Dúvidas", descricao: "Responder perguntas dos usuários sobre editais via IA treinada com os documentos oficiais de cada edital, sem alucinações." },
  { id: "RF08", categoria: "Acompanhamento", descricao: "Criar e gerenciar projetos aprovados com dados financeiros, orçamento por linha, consultoria e integração com Google Drive." },
  { id: "RF09", categoria: "Acompanhamento", descricao: "Registrar gastos por categoria com upload de comprovantes, controle de saldo por linha de orçamento e exportação ao Google Drive." },
  { id: "RF10", categoria: "Acompanhamento", descricao: "Gerar formulário de relatório de prestação de contas a partir do PDF modelo do edital via IA, com extração automática de todos os campos." },
  { id: "RF11", categoria: "Acompanhamento", descricao: "Importar dados do projeto aprovado (PDF) e preencher automaticamente identificação, equipe, atividades, entregas e orçamento no relatório." },
  { id: "RF12", categoria: "Acompanhamento", descricao: "Exportar relatório preenchido em HTML estruturado, com layout fiel ao modelo oficial do edital e suporte a imagens nos campos de resultados." },
  { id: "RF13", categoria: "Consultoria", descricao: "Empreendedor solicitar tutoria aberta (qualquer consultor se candidata) ou direta (convite por e-mail), com negociação de valores e contrapropostas." },
  { id: "RF14", categoria: "Consultoria", descricao: "Consultor visualizar solicitações disponíveis, enviar propostas com valor e descrição, e acompanhar negociações em andamento." },
  { id: "RF15", categoria: "Comunidade", descricao: "Fórum de mensagens organizado por edital, com suporte a respostas encadeadas e identificação dos autores." },
  { id: "RF16", categoria: "Orientações", descricao: "Gerenciar biblioteca de materiais educacionais (vídeos, documentos, apresentações, artigos) por categoria e edital." },
  { id: "RF17", categoria: "Administração", descricao: "Administrador convidar usuários por e-mail, gerenciar perfis cadastrados e alterar papéis (empreendedor, consultor, admin)." },
  { id: "RF18", categoria: "Administração", descricao: "Configurar documentos e base de conhecimento da IA por edital, incluindo extração automática de campos e treinamento via chat." },
  { id: "RF19", categoria: "Drive", descricao: "Criar estrutura automática de pastas no Google Drive por projeto e categoria de gasto, e exportar comprovantes com resumo em Google Docs." },
];

const RNF = [
  { id: "RNF01", categoria: "Segurança", descricao: "Autenticação obrigatória para acesso à plataforma. Usuários não autenticados são redirecionados ao login automaticamente." },
  { id: "RNF02", categoria: "Segurança", descricao: "Segregação de papéis: empreendedores acessam apenas seus dados; consultores visualizam tutorias disponíveis; administradores têm visão completa." },
  { id: "RNF03", categoria: "Segurança", descricao: "Tokens OAuth do Google Drive gerenciados via App Connectors com escopos mínimos necessários (drive.file) — sem exposição no frontend." },
  { id: "RNF04", categoria: "Desempenho", descricao: "Debounce de 5 segundos para geração automática de textos por IA, prevenindo rate limit e chamadas redundantes à API." },
  { id: "RNF05", categoria: "Desempenho", descricao: "Carregamento de dados com React Query e cache local, evitando requisições redundantes ao banco de dados durante a navegação." },
  { id: "RNF06", categoria: "Usabilidade", descricao: "Interface responsiva compatível com dispositivos móveis e desktops, com sidebar colapsável e layout adaptativo." },
  { id: "RNF07", categoria: "Usabilidade", descricao: "Confirmação explícita antes de sobrescrever dados preenchidos — campos marcados como 'Concluído' são protegidos de sobrescrita automática." },
  { id: "RNF08", categoria: "Usabilidade", descricao: "Feedback visual em todas as operações assíncronas: spinners, badges de status, mensagens de progresso e confirmações de sucesso." },
  { id: "RNF09", categoria: "Confiabilidade", descricao: "Dados do relatório persistidos no banco após cada edição (auto-save por campo), sem necessidade de botão salvar manual." },
  { id: "RNF10", categoria: "Confiabilidade", descricao: "Importações automáticas preservam dados já preenchidos manualmente — sobrescrita exige confirmação explícita do usuário." },
  { id: "RNF11", categoria: "Integração", descricao: "Integração com Google Drive via OAuth — todas as chamadas à API do Drive passam por backend functions Deno, sem expor tokens no cliente." },
  { id: "RNF12", categoria: "Integração", descricao: "Integração com LLM para geração de textos, extração de dados de PDFs e respostas contextualizadas, com suporte a arquivos e busca na internet." },
  { id: "RNF13", categoria: "Manutenibilidade", descricao: "Arquitetura componentizada com separação clara de responsabilidades: páginas, componentes, entidades JSON e funções backend independentes." },
  { id: "RNF14", categoria: "Acessibilidade", descricao: "Componentes Radix UI com suporte a navegação por teclado e atributos ARIA nativos para leitores de tela." },
];

const CORES_CAT = {
  Editais: "#6366f1", Propostas: "#8b5cf6", "Tira-Dúvidas": "#0ea5e9",
  Acompanhamento: "#10b981", Consultoria: "#f59e0b", Comunidade: "#f43f5e",
  Orientações: "#64748b", Administração: "#dc2626", Drive: "#16a34a",
  Segurança: "#dc2626", Desempenho: "#f59e0b", Usabilidade: "#6366f1",
  Confiabilidade: "#10b981", Integração: "#0ea5e9", Manutenibilidade: "#8b5cf6", Acessibilidade: "#64748b",
};

// ─── SVG do MER para exportação HTML ─────────────────────────────────────────

function gerarSvgMER() {
  const W = 900, H = 560;
  let linhas = ARESTAS.map((a, i) => {
    const de = NOS.find(n => n.id === a.de), para = NOS.find(n => n.id === a.para);
    if (!de || !para) return "";
    const mx = (de.x + para.x) / 2, my = (de.y + para.y) / 2;
    return `<line x1="${de.x}" y1="${de.y+18}" x2="${para.x}" y2="${para.y+18}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#arrow)" />
<rect x="${mx-52}" y="${my-9}" width="104" height="16" rx="4" fill="white" opacity="0.85"/>
<text x="${mx}" y="${my+3}" text-anchor="middle" font-size="9" fill="#64748b" font-family="monospace">${a.label}</text>`;
  }).join("");
  let nos = NOS.map(n => {
    const linhasLabel = n.label.split("\n");
    return `<rect x="${n.x-60}" y="${n.y}" width="120" height="36" rx="8" fill="${n.cor}"/>
${linhasLabel.map((l, li) => `<text x="${n.x}" y="${n.y+14+li*13}" text-anchor="middle" font-size="10" font-weight="700" fill="white" font-family="Segoe UI, sans-serif">${l}</text>`).join("")}`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="background:#f8fafc;border-radius:12px;">
<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94a3b8"/></marker></defs>
${linhas}${nos}
</svg>`;
}

// ─── Captura de tela via html2canvas da própria página atual ──────────────────

async function capturarTelaAtual() {
  try {
    const html2canvas = (await import("html2canvas")).default;
    // Captura a área principal de conteúdo (main)
    const main = document.querySelector("main") || document.body;
    const canvas = await html2canvas(main, {
      width: 1280,
      height: Math.max(main.scrollHeight, 800),
      windowWidth: 1280,
      windowHeight: 900,
      scale: 0.6,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#f8fafc",
      logging: false,
      scrollY: 0,
      scrollX: 0,
    });
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch (e) {
    return null;
  }
}

// ─── Divulgação a Investidores ────────────────────────────────────────────────

function DivulgacaoInvestidores() {
  const [estado, setEstado] = useState("idle"); // idle | capturando | gerando | pronto
  const [progresso, setProgresso] = useState({ atual: 0, total: TELAS.length, label: "" });
  const [capturas, setCapturas] = useState({});

  const gerarDocumento = async () => {
    setEstado("capturando");
    const novasCapturas = {};

    // Navega para cada página, aguarda render, captura
    const baseUrl = window.location.origin;
    const paginasUnicas = [...new Map(TELAS.map(t => [t.url, t])).values()];

    for (let i = 0; i < paginasUnicas.length; i++) {
      const tela = paginasUnicas[i];
      setProgresso({ atual: i + 1, total: paginasUnicas.length, label: `Capturando: ${tela.titulo}` });

      await new Promise(resolve => {
        const win = window.open(tela.url, "_blank", "width=1280,height=900,toolbar=no,menubar=no,scrollbars=no");
        if (!win) { resolve(); return; }
        let tentativas = 0;
        const interval = setInterval(async () => {
          tentativas++;
          try {
            if (win.closed || tentativas > 40) { clearInterval(interval); win.close(); resolve(); return; }
            if (win.document?.readyState === "complete") {
              clearInterval(interval);
              await new Promise(r => setTimeout(r, 2500));
              try {
                const html2canvas = (await import("html2canvas")).default;
                const main = win.document.querySelector("main") || win.document.body;
                const canvas = await html2canvas(main, {
                  width: 1280, height: 900, windowWidth: 1280, windowHeight: 900,
                  scale: 0.65, useCORS: true, allowTaint: true,
                  backgroundColor: "#f8fafc", logging: false,
                });
                const id = TELAS.find(t2 => t2.url === tela.url)?.id || tela.id;
                // Atribui a mesma captura a todas as telas com a mesma URL
                TELAS.filter(t2 => t2.url === tela.url).forEach(t2 => { novasCapturas[t2.id] = canvas.toDataURL("image/jpeg", 0.82); });
              } catch(e) { /* sem captura, usa placeholder */ }
              win.close();
              resolve();
            }
          } catch(e) { /* página ainda carregando */ }
        }, 300);
      });
    }

    // Fallback: captura tela atual para telas sem captura
    const semCaptura = TELAS.filter(t => !novasCapturas[t.id]);
    if (semCaptura.length > 0) {
      setProgresso({ atual: paginasUnicas.length, total: paginasUnicas.length, label: "Captura de fallback..." });
      const capturaAtual = await capturarTelaAtual();
      if (capturaAtual) semCaptura.forEach(t => { novasCapturas[t.id] = capturaAtual; });
    }

    setCapturas(novasCapturas);
    setEstado("gerando");

    // Monta o HTML do documento
    const secoes = {};
    TELAS.forEach(t => { if (!secoes[t.secao]) secoes[t.secao] = []; secoes[t.secao].push(t); });

    const secaoCores = {
      "Visão do Empreendedor": "#6366f1",
      "Visão do Consultor": "#10b981",
      "Área Administrativa": "#dc2626",
    };

    let imgCounter = 1;
    let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Divulgação a Investidores — Munnin Crow</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e293b;}
  .capa{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%);color:white;text-align:center;padding:60px 40px;page-break-after:always;}
  .capa h1{font-size:52px;font-weight:900;letter-spacing:-2px;margin-bottom:12px;}
  .capa h2{font-size:20px;color:#a5b4fc;margin-bottom:32px;font-weight:400;}
  .capa p{font-size:14px;color:#94a3b8;max-width:620px;line-height:1.8;}
  .capa .meta{margin-top:48px;font-size:12px;color:#475569;}
  .capa .chips{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px;}
  .chip{padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,0.2);}
  .secao-capa{min-height:30vh;display:flex;align-items:center;padding:40px 60px;page-break-before:always;page-break-after:always;}
  .secao-capa h2{font-size:32px;font-weight:900;color:white;}
  .secao-capa p{font-size:14px;color:rgba(255,255,255,0.7);margin-top:8px;max-width:500px;}
  .tela{padding:40px 60px;page-break-inside:avoid;page-break-before:always;}
  .tela-header{margin-bottom:20px;}
  .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;}
  .tela-titulo{font-size:20px;font-weight:800;color:#0f172a;}
  .tela-subtitulo{font-size:13px;color:#6366f1;font-weight:600;margin-top:2px;}
  .screenshot{width:100%;max-height:420px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;display:block;box-shadow:0 4px 24px rgba(0,0,0,0.1);}
  .placeholder-img{width:100%;height:380px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);border:2px dashed #cbd5e1;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;}
  .placeholder-img span{font-size:13px;color:#94a3b8;font-style:italic;}
  .legenda{text-align:center;font-size:12px;color:#64748b;font-style:italic;margin:12px 0 20px;}
  .legenda strong{color:#334155;font-weight:700;}
  .funcionalidades{margin-top:16px;}
  .funcionalidades h4{font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;}
  .funcionalidades ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:6px;}
  .funcionalidades li{font-size:12px;color:#475569;padding:6px 10px;background:#f8fafc;border-left:3px solid #6366f1;border-radius:0 6px 6px 0;}
  .impacto{margin-top:14px;padding:12px 16px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;}
  .impacto h4{font-size:10px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;}
  .impacto p{font-size:12px;color:#15803d;line-height:1.6;}
  .rodape{text-align:center;padding:40px;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;margin-top:40px;}
  @media print{.tela,.secao-capa{page-break-before:always;} .tela{page-break-inside:avoid;}}
</style>
</head>
<body>
<div class="capa">
  <h1>🦅 Munnin Crow</h1>
  <h2>Plataforma de Gestão de Editais e Projetos de Fomento</h2>
  <p>Documento de divulgação para investidores e agências de fomento.<br/>Apresentação das funcionalidades desenvolvidas com os recursos investidos no projeto.<br/>Demonstração completa das visões do empreendedor, consultor e administrador.</p>
  <div class="chips">
    <div class="chip" style="background:#6366f150;border-color:#6366f1;">📋 ${TELAS.filter(t=>t.secao==="Visão do Empreendedor").length} Funcionalidades — Empreendedor</div>
    <div class="chip" style="background:#10b98150;border-color:#10b981;">🤝 ${TELAS.filter(t=>t.secao==="Visão do Consultor").length} Funcionalidades — Consultor</div>
    <div class="chip" style="background:#dc262650;border-color:#dc2626;">⚙️ ${TELAS.filter(t=>t.secao==="Área Administrativa").length} Funcionalidades — Administrativo</div>
  </div>
  <div class="meta">Gerado em ${new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })} · Munnin Crow &copy; ${new Date().getFullYear()}</div>
</div>
`;

    Object.entries(secoes).forEach(([secao, telas]) => {
      const cor = secaoCores[secao] || "#6366f1";
      html += `<div class="secao-capa" style="background:linear-gradient(135deg,${cor}22,${cor}11);">
  <div>
    <div class="badge" style="background:${cor};">${secao}</div>
    <h2 style="color:${cor};">${secao}</h2>
    <p>${telas.length} módulo${telas.length > 1 ? "s" : ""} demonstrado${telas.length > 1 ? "s" : ""} a seguir</p>
  </div>
</div>`;

      telas.forEach(t => {
        const img = novasCapturas[t.id];
        const imgTag = img
          ? `<img src="${img}" class="screenshot" alt="${t.titulo}" />`
          : `<div class="placeholder-img"><span style="font-size:32px;">🖥️</span><span>[ Captura de tela: ${t.titulo} ]</span></div>`;

        const gridFunc = t.funcionalidades.map(f => `<li>${f}</li>`).join("");

        html += `<div class="tela">
  <div class="tela-header">
    <div class="badge" style="background:${cor};">${t.secao}</div>
    <div class="tela-titulo">${t.titulo}</div>
    <div class="tela-subtitulo">${t.subtitulo}</div>
  </div>
  ${imgTag}
  <div class="legenda"><strong>Imagem ${imgCounter++} — ${t.titulo}</strong></div>
  <div class="funcionalidades">
    <h4>Funcionalidades demonstradas</h4>
    <ul>${gridFunc}</ul>
  </div>
  <div class="impacto">
    <h4>Impacto e valor gerado</h4>
    <p>${t.impacto}</p>
  </div>
</div>`;
      });
    });

    html += `<div class="rodape">Munnin Crow &copy; ${new Date().getFullYear()} — Documento gerado automaticamente pela plataforma · ${new Date().toLocaleString("pt-BR")}</div></body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url2 = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url2;
    a.download = `munnin-crow-divulgacao-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url2);
    a.remove();
    setEstado("pronto");
  };

  const pct = progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <h2 className="text-lg font-bold text-indigo-900 mb-1">Divulgação a Investidores</h2>
        <p className="text-sm text-indigo-700 mb-4">
          Gera um documento HTML completo com capturas automáticas das telas da plataforma, descrição técnica de cada funcionalidade e indicadores de impacto. Abre no navegador para impressão em PDF.
        </p>

        {estado === "idle" || estado === "pronto" ? (
          <div className="flex items-center gap-3">
            <Button onClick={gerarDocumento} className="bg-indigo-600 hover:bg-indigo-700">
              <Camera className="w-4 h-4 mr-2" />
              {estado === "pronto" ? "Gerar Novamente" : "Capturar Telas e Gerar Documento"}
            </Button>
            {estado === "pronto" && <span className="text-sm text-green-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Download concluído!</span>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              {estado === "capturando" ? `Capturando telas... (${progresso.atual}/${progresso.total})` : "Gerando documento..."}
            </div>
            {estado === "capturando" && (
              <>
                <div className="w-full bg-indigo-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-indigo-500">{progresso.label}</p>
              </>
            )}
          </div>
        )}
        <p className="text-xs text-indigo-400 mt-3">
          O documento HTML gerado pode ser aberto no navegador e salvo como PDF (Ctrl+P → Salvar como PDF). As capturas de tela são geradas automaticamente.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Conteúdo incluído ({TELAS.length} módulos)</p>
        {["Visão do Empreendedor", "Visão do Consultor", "Área Administrativa"].map(secao => (
          <div key={secao} className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">{secao}</p>
              <span className="text-xs text-gray-400">{TELAS.filter(t => t.secao === secao).length} módulos</span>
            </div>
            <div className="divide-y">
              {TELAS.filter(t => t.secao === secao).map((t, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded mt-0.5 flex-shrink-0">
                    IMG {TELAS.findIndex(x => x.id === t.id) + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{t.titulo}</p>
                    <p className="text-xs text-indigo-600 font-medium">{t.subtitulo}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.funcionalidades.length} funcionalidades documentadas</p>
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

// ─── Lógica da Plataforma ─────────────────────────────────────────────────────

function LogicaPlataforma() {
  const [gerando, setGerando] = useState(false);

  const gerarDocumento = () => {
    setGerando(true);
    setTimeout(() => {
      const svgMer = gerarSvgMER();
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Lógica da Plataforma — Munnin Crow</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#1e293b;}
  .header{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);color:white;padding:40px 60px;}
  .header h1{font-size:32px;font-weight:900;}
  .header p{color:#a5b4fc;margin-top:8px;font-size:14px;}
  .section{padding:40px 60px;page-break-before:always;}
  .section h2{font-size:22px;font-weight:800;color:#1e293b;border-bottom:3px solid #6366f1;padding-bottom:12px;margin-bottom:24px;}
  .mer-svg-wrap{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:32px;}
  .legenda-mer{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}
  .legenda-item{display:flex;align-items:center;gap:6px;font-size:11px;color:#475569;}
  .legenda-dot{width:12px;height:12px;border-radius:3px;flex-shrink:0;}
  .relacoes h3{font-size:14px;font-weight:700;margin-bottom:12px;color:#475569;}
  .relacao{display:flex;align-items:center;gap:8px;padding:8px 12px;background:white;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px;font-size:12px;}
  .de{font-weight:700;color:#6366f1;} .para{font-weight:700;color:#0ea5e9;} .tipo{background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:#1e293b;color:white;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;}
  td{padding:10px 12px;border-bottom:1px solid #e2e8f0;background:white;vertical-align:top;}
  tr:nth-child(even) td{background:#f8fafc;}
  .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;color:white;}
  @media print{.section{page-break-before:always;}}
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
  <div class="mer-svg-wrap">
    ${svgMer}
    <div class="legenda-mer">
      ${ENTIDADES.map(e => `<div class="legenda-item"><div class="legenda-dot" style="background:${e.cor};"></div><span>${e.nome}</span></div>`).join("")}
    </div>
  </div>
  <div class="relacoes">
    <h3>Relacionamentos</h3>
    ${ARESTAS.map(r => `<div class="relacao">
      <span class="de">${r.de}</span>
      <span style="color:#94a3b8;">→</span>
      <span class="para">${r.para}</span>
      <span style="color:#94a3b8;flex:1;">${r.label.split("(")[0].trim()}</span>
      <span class="tipo">${r.label.match(/\(([^)]+)\)/)?.[1] || ""}</span>
    </div>`).join("")}
  </div>
</div>

<div class="section">
  <h2>Requisitos Funcionais (RF)</h2>
  <table>
    <thead><tr><th width="60">ID</th><th width="130">Categoria</th><th>Descrição</th></tr></thead>
    <tbody>${RF.map(r => `<tr>
      <td><strong>${r.id}</strong></td>
      <td><span class="badge" style="background:${CORES_CAT[r.categoria]||'#64748b'};">${r.categoria}</span></td>
      <td>${r.descricao}</td>
    </tr>`).join("")}</tbody>
  </table>
</div>

<div class="section">
  <h2>Requisitos Não Funcionais (RNF)</h2>
  <table>
    <thead><tr><th width="60">ID</th><th width="130">Categoria</th><th>Descrição</th></tr></thead>
    <tbody>${RNF.map(r => `<tr>
      <td><strong>${r.id}</strong></td>
      <td><span class="badge" style="background:${CORES_CAT[r.categoria]||'#64748b'};">${r.categoria}</span></td>
      <td>${r.descricao}</td>
    </tr>`).join("")}</tbody>
  </table>
</div>
</body></html>`;

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
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Lógica da Plataforma</h2>
        <p className="text-sm text-slate-600 mb-4">
          Gera documento com diagrama visual do Modelo Relacional de Entidades (MER), Requisitos Funcionais e Não Funcionais.
        </p>
        <Button onClick={gerarDocumento} disabled={gerando} className="bg-slate-800 hover:bg-slate-900">
          {gerando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Download className="w-4 h-4 mr-2" />Gerar Documento de Lógica</>}
        </Button>
        <p className="text-xs text-slate-400 mt-2">Abre no navegador e pode ser salvo como PDF (Ctrl+P → Salvar como PDF).</p>
      </div>

      {/* Diagrama visual interativo */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Diagrama MER — Visualização Interativa</p>
        <DiagramaMER />
        <div className="flex flex-wrap gap-2 mt-3">
          {ENTIDADES.map(e => (
            <span key={e.nome} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full text-white font-medium" style={{ background: e.cor }}>
              {e.nome}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">RF — {RF.length} Requisitos Funcionais</p>
          <div className="bg-white border rounded-lg divide-y max-h-72 overflow-y-auto">
            {RF.map(r => (
              <div key={r.id} className="px-3 py-2 flex items-start gap-2">
                <span className="text-xs font-mono font-bold text-indigo-600 flex-shrink-0 mt-0.5">{r.id}</span>
                <div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white mr-1" style={{ background: CORES_CAT[r.categoria] || "#64748b" }}>{r.categoria}</span>
                  <span className="text-xs text-gray-600">{r.descricao}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">RNF — {RNF.length} Requisitos Não Funcionais</p>
          <div className="bg-white border rounded-lg divide-y max-h-72 overflow-y-auto">
            {RNF.map(r => (
              <div key={r.id} className="px-3 py-2 flex items-start gap-2">
                <span className="text-xs font-mono font-bold text-slate-600 flex-shrink-0 mt-0.5">{r.id}</span>
                <div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white mr-1" style={{ background: CORES_CAT[r.categoria] || "#64748b" }}>{r.categoria}</span>
                  <span className="text-xs text-gray-600">{r.descricao}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Aba principal ────────────────────────────────────────────────────────────

export default function InformativosTab() {
  const [sub, setSub] = useState("divulgacao");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setSub("divulgacao")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sub === "divulgacao" ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          Divulgação a Investidores
        </button>
        <button onClick={() => setSub("logica")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sub === "logica" ? "bg-slate-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          Lógica
        </button>
      </div>
      {sub === "divulgacao" && <DivulgacaoInvestidores />}
      {sub === "logica" && <LogicaPlataforma />}
    </div>
  );
}