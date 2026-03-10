import { base44 } from "@/api/base44Client";

export const DAILY_TASK_PONTOS = {
  daily_login: 5,
  daily_tiraduvidas: 10,
  daily_orientacao: 8,
  daily_comunidade: 8,
};

export const DAILY_TASKS = [
  { id: "daily_login", titulo: "Login diário", descricao: "Acesse a plataforma hoje", pontos: 5, icone: "🌅" },
  { id: "daily_tiraduvidas", titulo: "Usar tira-dúvidas hoje", descricao: "Faça uma pergunta ao assistente IA", pontos: 10, icone: "🤖" },
  { id: "daily_orientacao", titulo: "Abrir orientação hoje", descricao: "Explore um material de orientação", pontos: 8, icone: "📚" },
  { id: "daily_comunidade", titulo: "Participar da comunidade hoje", descricao: "Envie uma mensagem na comunidade", pontos: 8, icone: "💬" },
];

export const TRILHA_EMPREENDEDOR_PONTOS = {
  proposta_criada: 40, comunidade_participou: 20, tiraduvidas_ia: 25,
  orientacao_lida: 15, proposta_submetida: 60, projeto_criado: 60,
  gasto_registrado: 30, consultor_contratado: 50, relatorio_iniciado: 80,
};

export const TRILHA_CONSULTOR_PONTOS = {
  comunidade_participou: 20, orientacao_criada: 40, proposta_tutoria: 50,
  tutoria_aprovada: 100, projeto_acompanhando: 60, gasto_revisado: 30, relatorio_apoiado: 80,
};

export function getDailyKey(tarefaId) {
  return `${tarefaId}_${new Date().toISOString().split("T")[0]}`;
}

export function extractDailyBase(key) {
  if (!key.startsWith("daily_")) return null;
  const parts = key.split("_");
  const dateStr = parts[parts.length - 1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  return parts.slice(0, -1).join("_");
}

export async function marcarAtividade(tarefaId, isDaily = false) {
  try {
    const user = await base44.auth.me();
    if (!user) return;
    const role = user.role === "consultor" ? "consultor" : "empreendedor";
    const trilhaMap = role === "consultor" ? TRILHA_CONSULTOR_PONTOS : TRILHA_EMPREENDEDOR_PONTOS;
    const chave = isDaily ? getDailyKey(tarefaId) : tarefaId;
    const lista = await base44.entities.ProgressoTrilha.filter({ created_by: user.email });
    const meu = lista[0];
    const tarefasAtuais = meu?.tarefas_concluidas || [];
    if (tarefasAtuais.includes(chave)) return; // já feita
    const novasTarefas = [...tarefasAtuais, chave];
    const pontosTrilha = Object.entries(trilhaMap).reduce((s, [id, pts]) =>
      novasTarefas.includes(id) ? s + pts : s, 0);
    const pontosDiarios = novasTarefas.reduce((s, k) => {
      const base = extractDailyBase(k);
      return base ? s + (DAILY_TASK_PONTOS[base] || 0) : s;
    }, 0);
    const dados = {
      user_email: user.email, user_nome: user.full_name || user.email,
      role, pontos: pontosTrilha + pontosDiarios,
      tarefas_concluidas: novasTarefas, ultimo_calculo: new Date().toISOString(),
    };
    if (meu) await base44.entities.ProgressoTrilha.update(meu.id, dados);
    else await base44.entities.ProgressoTrilha.create(dados);
  } catch {}
}