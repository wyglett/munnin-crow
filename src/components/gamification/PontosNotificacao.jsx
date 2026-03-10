import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";

// ─── Níveis (mesmos do VooDoCorvo) ────────────────────────────────────────────
const NIVEIS = [
  { min: 0,   max: 50,       nome: "Filhote de Corvo",  icone: "🥚", cor: "#94a3b8" },
  { min: 51,  max: 130,      nome: "Corvo Aprendiz",    icone: "🐦", cor: "#6366f1" },
  { min: 131, max: 250,      nome: "Corvo Experiente",  icone: "🦅", cor: "#8b5cf6" },
  { min: 251, max: 380,      nome: "Mestre do Voo",     icone: "🪶", cor: "#f59e0b" },
  { min: 381, max: Infinity, nome: "Lenda do Corvo",    icone: "⚜️", cor: "#dc2626" },
];

function getNivel(pontos) {
  return NIVEIS.find(n => pontos >= n.min && pontos <= n.max) || NIVEIS[0];
}

// ─── Sons via Web Audio API ────────────────────────────────────────────────────
function tocarMoeda() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // Notas de moeda: sol + dó
    [[880, 0, 0.08], [1108, 0.08, 0.1], [1320, 0.16, 0.14]].forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch {}
}

function tocarFanfarre() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Arpejo ascendente festivo: dó-mi-sol-dó-mi-sol↑
    const notes = [
      [523.25, 0,    0.15],
      [659.25, 0.13, 0.15],
      [783.99, 0.26, 0.15],
      [1046.5, 0.39, 0.22],
      [1318.5, 0.58, 0.18],
      [1567.98, 0.73, 0.3],
    ];
    notes.forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch {}
}

// ─── Partículas ───────────────────────────────────────────────────────────────
function Particulas({ cor }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 250 + 80),
    rotate: Math.random() * 720 - 360,
    scale: Math.random() * 0.8 + 0.4,
    emoji: ["⭐", "✨", "🌟", "💫", "🎉", "🪙"][Math.floor(Math.random() * 6)],
  }));

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute text-xl"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotate }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Toast de pontos ──────────────────────────────────────────────────────────
function ToastPontos({ pts, tarefa, onDone }) {
  useEffect(() => {
    tocarMoeda();
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-indigo-900/40 max-w-xs"
    >
      <div className="text-2xl">🪙</div>
      <div>
        <p className="text-xs font-bold opacity-80 uppercase tracking-wider">O Voo do Corvo</p>
        <p className="text-sm font-semibold leading-tight">{tarefa}</p>
        <p className="text-lg font-black text-yellow-300">+{pts} pontos!</p>
      </div>
      <motion.div
        className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-black rounded-full w-7 h-7 flex items-center justify-center shadow"
        animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        ✓
      </motion.div>
    </motion.div>
  );
}

// ─── Overlay de subida de nível ───────────────────────────────────────────────
function LevelUpOverlay({ novoNivel, pontosAntigos, pontosNovos, onDone }) {
  useEffect(() => {
    tocarFanfarre();
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onDone}
      />

      {/* Card central */}
      <motion.div
        className="relative z-10 text-center px-10 py-12 rounded-3xl border border-white/20 shadow-2xl max-w-sm mx-4"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)" }}
        initial={{ scale: 0.5, opacity: 0, rotateY: -30 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
      >
        <Particulas cor={novoNivel.cor} />

        <motion.p
          className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Subiu de nível!
        </motion.p>

        <motion.div
          className="text-7xl mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
        >
          {novoNivel.icone}
        </motion.div>

        <motion.h2
          className="text-3xl font-black text-white mb-1"
          style={{ textShadow: `0 0 30px ${novoNivel.cor}` }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          {novoNivel.nome}
        </motion.h2>

        <motion.p
          className="text-slate-400 text-sm mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {pontosAntigos} → <span className="text-yellow-400 font-bold">{pontosNovos} pontos</span>
        </motion.p>

        {/* Barra animada */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            className="h-2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${novoNivel.cor}, ${novoNivel.cor}aa)` }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
          />
        </div>

        <motion.button
          onClick={onDone}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition-all"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          🚀 Continuar voando!
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
const TRILHA_EMPREENDEDOR = [
  { id: "proposta_criada", titulo: "Criar primeira proposta", pontos: 40 },
  { id: "comunidade_participou", titulo: "Participar da Comunidade", pontos: 20 },
  { id: "tiraduvidas_ia", titulo: "Usar o Tira-Dúvidas IA", pontos: 25 },
  { id: "orientacao_lida", titulo: "Estudar uma Orientação", pontos: 15 },
  { id: "proposta_submetida", titulo: "Submeter uma proposta", pontos: 60 },
  { id: "projeto_criado", titulo: "Criar projeto de acompanhamento", pontos: 60 },
  { id: "gasto_registrado", titulo: "Registrar um gasto no projeto", pontos: 30 },
  { id: "consultor_contratado", titulo: "Contratar um consultor", pontos: 50 },
  { id: "relatorio_iniciado", titulo: "Iniciar relatório de prestação de contas", pontos: 80 },
];

const TRILHA_CONSULTOR = [
  { id: "comunidade_participou", titulo: "Participar da Comunidade", pontos: 20 },
  { id: "orientacao_criada", titulo: "Criar uma Orientação", pontos: 40 },
  { id: "proposta_tutoria", titulo: "Enviar proposta de tutoria", pontos: 50 },
  { id: "tutoria_aprovada", titulo: "Ter tutoria aprovada", pontos: 100 },
  { id: "projeto_acompanhando", titulo: "Acompanhar projeto como consultor", pontos: 60 },
  { id: "gasto_revisado", titulo: "Revisar gastos do projeto", pontos: 30 },
  { id: "relatorio_apoiado", titulo: "Apoiar relatório de prestação de contas", pontos: 80 },
];

export default function PontosNotificacao() {
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [levelUp, setLevelUp] = useState(null); // { novoNivel, pontosAntigos, pontosNovos }
  const prevTarefasRef = useRef(null);
  const prevPontosRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const removerToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!user) return;

    const role = user.role === "consultor" ? "consultor" : "empreendedor";
    const trilha = role === "consultor" ? TRILHA_CONSULTOR : TRILHA_EMPREENDEDOR;

    const unsubscribe = base44.entities.ProgressoTrilha.subscribe((event) => {
      if (event.type !== "update" && event.type !== "create") return;
      const data = event.data;
      if (!data || data.user_email !== user.email) return;

      const novasTarefas = data.tarefas_concluidas || [];
      const velhasTarefas = prevTarefasRef.current;
      const velhosPontos = prevPontosRef.current;
      const novosPontos = data.pontos || 0;

      if (velhasTarefas !== null) {
        // Detecta tarefas novas
        const adicionadas = novasTarefas.filter(t => !velhasTarefas.includes(t));
        adicionadas.forEach(tarefaId => {
          const tarefa = trilha.find(t => t.id === tarefaId);
          if (!tarefa) return;
          const toastId = `${tarefaId}-${Date.now()}`;
          setToasts(prev => [...prev, { id: toastId, pts: tarefa.pontos, titulo: tarefa.titulo }]);
        });

        // Detecta subida de nível
        if (velhosPontos !== null && novosPontos > velhosPontos) {
          const nivelAntigo = getNivel(velhosPontos);
          const nivelNovo = getNivel(novosPontos);
          if (nivelNovo.nome !== nivelAntigo.nome) {
            setTimeout(() => {
              setLevelUp({ novoNivel: nivelNovo, pontosAntigos: velhosPontos, pontosNovos: novosPontos });
            }, 1500); // mostra após os toasts de pontos
          }
        }
      }

      prevTarefasRef.current = novasTarefas;
      prevPontosRef.current = novosPontos;
    });

    // Carrega estado inicial para comparação futura
    base44.entities.ProgressoTrilha.filter({ created_by: user.email }).then(lista => {
      const meu = lista[0];
      prevTarefasRef.current = meu?.tarefas_concluidas || [];
      prevPontosRef.current = meu?.pontos || 0;
    }).catch(() => {
      prevTarefasRef.current = [];
      prevPontosRef.current = 0;
    });

    return () => unsubscribe();
  }, [user?.email]);

  return (
    <>
      {/* Toasts de pontos (empilhados) */}
      <AnimatePresence>
        {toasts.map((t, i) => (
          <div key={t.id} style={{ bottom: `${24 + i * 90}px` }} className="fixed right-6 z-[9999]">
            <ToastPontos
              pts={t.pts}
              tarefa={t.titulo}
              onDone={() => removerToast(t.id)}
            />
          </div>
        ))}
      </AnimatePresence>

      {/* Overlay de level up */}
      <AnimatePresence>
        {levelUp && (
          <LevelUpOverlay
            key="levelup"
            novoNivel={levelUp.novoNivel}
            pontosAntigos={levelUp.pontosAntigos}
            pontosNovos={levelUp.pontosNovos}
            onDone={() => setLevelUp(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}