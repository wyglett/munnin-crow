// Utilitário para gerenciar meta tags de SEO dinamicamente
export const setSeoMeta = (config = {}) => {
  const defaults = {
    title: "Munnin Crow - Plataforma de Consultoria e Gestão de Editais",
    description: "Plataforma completa para consultores e empreendedores gerenciarem projetos, propostas e acompanhamento de editais. Encontre oportunidades de financiamento com IA.",
    keywords: "edital, consultoria, financiamento, empreendedorismo, FAPES, pesquisa, inovação",
    ogImage: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_699eeda5be72b683e3bedcf3/7507bc7bf_e6e55591-30ba-4237-91e5-2d46775150cf.png"
  };

  const settings = { ...defaults, ...config };

  // Atualizar title
  document.title = settings.title;

  // Atualizar ou criar meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', settings.description);

  // Atualizar ou criar meta keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', settings.keywords);

  // OG tags para compartilhamento
  const ogMetas = [
    ['og:title', settings.title],
    ['og:description', settings.description],
    ['og:image', settings.ogImage],
  ];

  ogMetas.forEach(([prop, content]) => {
    let meta = document.querySelector(`meta[property="${prop}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', prop);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  });

  // Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical && settings.canonicalUrl) {
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = settings.canonicalUrl;
    document.head.appendChild(link);
  }
};

// Presets para diferentes páginas
export const seoPresets = {
  home: {
    title: "Munnin Crow - Consultoria e Gestão de Editais",
    description: "Transforme seus projetos em realidade. Consultoria especializada e IA para gestão de propostas e editais."
  },
  editais: {
    title: "Buscar Editais | Munnin Crow",
    description: "Encontre oportunidades de financiamento em FAPES, FAPERJ, FAPESP e FAPEMIG. Busca inteligente com filtros por estado, categoria e valor."
  },
  minhasPropostas: {
    title: "Minhas Propostas | Munnin Crow",
    description: "Gerencie suas propostas de pesquisa e inovação. Acompanhe status, análise de IA e sugestões de melhoria."
  },
  acompanhamento: {
    title: "Acompanhamento de Projetos | Munnin Crow",
    description: "Gerencie orçamento, cronograma e documentação de projetos financiados. Prestação de contas integrada."
  },
  comunidade: {
    title: "Comunidade | Munnin Crow",
    description: "Conecte-se com outros consultores e empreendedores. Compartilhe experiências e tire dúvidas sobre editais."
  },
  landing: {
    title: "Landing Pages | Munnin Crow",
    description: "Crie páginas de captação personalizadas para suas campanhas de marketing. Integração com e-mail marketing."
  }
};