import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// SVG simples de corvo em voo
function CorvoSVG({ flap }) {
  return (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-12">
      {/* Corpo */}
      <ellipse cx="60" cy="38" rx="22" ry="11" fill="#1e1b4b" />
      {/* Cabeça */}
      <ellipse cx="82" cy="32" rx="10" ry="9" fill="#1e1b4b" />
      {/* Bico */}
      <path d="M91 31 L100 33 L91 35 Z" fill="#374151" />
      {/* Olho */}
      <circle cx="86" cy="30" r="2" fill="#6366f1" />
      <circle cx="86.5" cy="29.5" r="0.8" fill="white" />
      {/* Asa esquerda */}
      <motion.path
        d="M55 38 Q30 20 10 30 Q30 42 55 40 Z"
        fill="#312e81"
        animate={flap ? { d: ["M55 38 Q30 20 10 30 Q30 42 55 40 Z", "M55 38 Q30 50 10 42 Q30 36 55 40 Z", "M55 38 Q30 20 10 30 Q30 42 55 40 Z"] } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Asa direita / superior */}
      <motion.path
        d="M58 35 Q75 10 95 18 Q80 30 60 37 Z"
        fill="#4338ca"
        animate={flap ? { d: ["M58 35 Q75 10 95 18 Q80 30 60 37 Z", "M58 35 Q75 48 95 40 Q80 34 60 37 Z", "M58 35 Q75 10 95 18 Q80 30 60 37 Z"] } : {}}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Cauda */}
      <path d="M38 40 Q25 50 18 56 Q30 48 42 44 Z" fill="#1e1b4b" />
    </svg>
  );
}

function Pena({ x, delay, onDone }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none text-2xl"
      style={{ left: x, top: "40%" }}
      initial={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 0.8, 0.4, 0],
        y: [0, 40, 90, 150],
        rotate: [0, 25, -15, 30],
        scale: [1, 0.9, 0.7, 0.4],
      }}
      transition={{ duration: 1.8, delay, ease: "easeIn" }}
      onAnimationComplete={onDone}
    >
      🪶
    </motion.div>
  );
}

/**
 * CorvoLoading — animação de carvo voando durante carregamentos.
 *
 * Props:
 *   loading: boolean — quando true mostra o corvo voando; quando vira false, o corvo voa para fora e penas caem
 *   label: string — texto opcional (ex: "Enviando arquivo...")
 *   onDone: () => void — chamado após a animação de saída terminar
 */
export default function CorvoLoading({ loading, label = "Carregando...", onDone }) {
  const [phase, setPhase] = useState("idle"); // idle | flying | leaving | feathers
  const [penas, setPenas] = useState([]);
  const audioRef = useRef(null);
  const penaTimerRef = useRef(null);

  // Tocar som de corvo ao entrar
  useEffect(() => {
    if (loading && phase === "idle") {
      setPhase("flying");
      // Som de corvo via AudioContext (síntese simples)
      playCrowSound();
    }
    if (!loading && phase === "flying") {
      setPhase("leaving");
      // Depois de 0.6s da saída, emitir penas
      penaTimerRef.current = setTimeout(() => {
        const newPenas = Array.from({ length: 6 }, (_, i) => ({
          id: Date.now() + i,
          x: `${20 + i * 12}%`,
          delay: i * 0.12,
        }));
        setPenas(newPenas);
        setPhase("feathers");
        playCrowSoundExit();
      }, 500);
    }
    return () => clearTimeout(penaTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Quando todas as penas sumirem
  useEffect(() => {
    if (phase === "feathers" && penas.length === 0) {
      setPhase("idle");
      onDone?.();
    }
  }, [phase, penas.length, onDone]);

  const removePena = (id) => setPenas(p => p.filter(x => x.id !== id));

  function playCrowSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Caw sound: fundamental ~350Hz + FM modulation
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 8;
      lfoGain.gain.value = 60;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.25);
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      lfo.start();
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      lfo.stop(ctx.currentTime + 0.5);
    } catch {}
  }

  function playCrowSoundExit() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  }

  if (phase === "idle") return null;

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center pointer-events-none">
      {/* Fundo suave */}
      <AnimatePresence>
        {(phase === "flying" || phase === "leaving") && (
          <motion.div
            key="overlay"
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Corvo */}
      <AnimatePresence>
        {phase === "flying" && (
          <motion.div
            key="corvo-flying"
            className="relative flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -8, 0, -8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }}
          >
            <CorvoSVG flap={true} />
            {label && (
              <motion.p
                className="text-sm font-semibold text-indigo-200 bg-slate-900/80 px-4 py-1.5 rounded-full backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {label}
              </motion.p>
            )}
            {/* pontos piscando */}
            <div className="flex gap-1.5 mt-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.9, delay: i * 0.25, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === "leaving" && (
          <motion.div
            key="corvo-leaving"
            className="relative"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: 300, y: -200, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeIn" }}
          >
            <CorvoSVG flap={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Penas caindo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {penas.map(p => (
          <Pena key={p.id} x={p.x} delay={p.delay} onDone={() => removePena(p.id)} />
        ))}
      </div>
    </div>
  );
}