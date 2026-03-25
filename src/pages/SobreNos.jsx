import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { Target, Shield, Mail, Github, Twitter, Star, Zap, BookOpen, Users } from "lucide-react";
import { getAppearance } from "@/hooks/useAppearance";
import NorseBackground from "@/components/layout/NorseBackground";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_699eeda5be72b683e3bedcf3/7507bc7bf_e6e55591-30ba-4237-91e5-2d46775150cf.png";

function FadeIn({ children, delay = 0, direction = "up", className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: direction === "up" ? 40 : direction === "down" ? -40 : 0, x: direction === "left" ? 40 : direction === "right" ? -40 : 0 }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const STATS = [
  { value: "300+", label: "Editais mapeados", icon: BookOpen },
  { value: "12", label: "Estados cobertos", icon: Target },
  { value: "IA", label: "Análise inteligente", icon: Zap },
  { value: "100%", label: "Sigilo garantido", icon: Shield },
];

const FEATURES = [
  {
    icon: Target,
    title: "Nossa Missão",
    color: "from-indigo-500 to-indigo-700",
    glow: "shadow-indigo-500/20",
    text: "Democratizar o acesso a editais de fomento. Tornar o processo de criação, análise e submissão de propostas acessível e eficiente para empreendedores de todos os perfis.",
  },
  {
    icon: Shield,
    title: "Confidencialidade",
    color: "from-purple-500 to-purple-700",
    glow: "shadow-purple-500/20",
    text: "Todos os dados — propostas, documentos e informações pessoais — são protegidos com o mais alto nível de sigilo, em conformidade com a LGPD. Suas ideias estão seguras.",
  },
  {
    icon: Users,
    title: "Comunidade",
    color: "from-emerald-500 to-emerald-700",
    glow: "shadow-emerald-500/20",
    text: "Conectamos empreendedores a consultores especializados, criando uma rede de conhecimento colaborativo para maximizar as chances de aprovação.",
  },
  {
    icon: Zap,
    title: "IA a seu lado",
    color: "from-amber-500 to-amber-700",
    glow: "shadow-amber-500/20",
    text: "Nossa inteligência artificial analisa editais, sugere melhorias, extrai campos de formulários e orienta cada etapa da sua proposta com precisão.",
  },
];

export default function SobreNos() {
  return (
    <div className="min-h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "10%", left: "5%" }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-purple-600/10 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: "20%", right: "10%" }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-emerald-600/8 blur-3xl"
          animate={{ x: [0, 40, -20, 0], y: [0, 30, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "50%", left: "40%" }}
        />
      </div>

      {/* Hero */}
      <div className="relative">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* Crow Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative inline-flex items-center justify-center mb-8"
          >
            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150" />
            <motion.img
              src={LOGO_URL}
              alt="Munnin Crow"
              className="relative w-28 h-28 object-contain"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: "drop-shadow(0 0 20px rgba(99,102,241,0.8)) drop-shadow(0 0 40px rgba(99,102,241,0.4))" }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-none tracking-tight">
              Munnin Crow
            </h1>
            <motion.p
              className="text-2xl md:text-3xl font-light mb-6"
              style={{ background: "linear-gradient(90deg, #818cf8, #c084fc, #818cf8)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", backgroundSize: "200% auto" }}
              animate={{ backgroundPosition: ["0% center", "200% center"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              Sabedoria & Memória
            </motion.p>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Conectamos empreendedores a oportunidades de fomento, transformando ideias em projetos reais através de inteligência e orientação especializada.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14"
          >
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center"
                >
                  <Icon className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="relative max-w-5xl mx-auto px-6 pb-16">
        <FadeIn className="grid md:grid-cols-2 gap-5 mb-14">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.2 }}
                className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 group shadow-2xl ${f.glow}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{f.text}</p>
              </motion.div>
            );
          })}
        </FadeIn>

        {/* Origin Story */}
        <FadeIn delay={0.1}>
          <div className="relative rounded-3xl overflow-hidden mb-14">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-indigo-500/20 rounded-3xl" />
            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent)", backgroundSize: "200% 100%" }}
              animate={{ backgroundPosition: ["-100% 0%", "200% 0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative p-8 md:p-12">
              <div className="flex items-start gap-6">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="flex-shrink-0 hidden md:block"
                >
                  <img src={LOGO_URL} alt="" className="w-20 h-20 object-contain opacity-80"
                    style={{ filter: "drop-shadow(0 0 12px rgba(99,102,241,0.6))" }}
                  />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-2xl font-black text-white">A Origem do Nome</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    Na mitologia nórdica, <span className="text-white font-bold">Muninn</span> (memória) e <span className="text-white font-bold">Huginn</span> (pensamento) são os dois corvos de Odin, deus da sabedoria. Todos os dias, eles voam pelo mundo inteiro trazendo notícias e conhecimento ao seu senhor.
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    A <span className="text-white font-bold">Munnin Crow</span> nasce inspirada nesse conceito: ser a <span className="text-indigo-300">memória e a inteligência</span> que ajudam empreendedores a navegar pelo universo dos editais, transformando oportunidades em projetos reais com impacto duradouro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Contact */}
        <FadeIn delay={0.2}>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Entre em Contato</h3>
            <p className="text-slate-400 text-sm mb-6">Estamos aqui para tirar suas dúvidas e ajudar no que precisar.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <motion.a
                href="mailto:contato@munnincrow.com.br"
                whileHover={{ scale: 1.02, backgroundColor: "rgba(99,102,241,0.1)" }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors flex-shrink-0">
                  <Mail className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <p className="text-xs text-indigo-400 mb-0.5">E-mail</p>
                  <p className="text-white font-medium text-sm">contato@munnincrow.com.br</p>
                </div>
              </motion.a>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-300 text-lg">🐦</span>
                </div>
                <div>
                  <p className="text-xs text-purple-400 mb-0.5">Plataforma</p>
                  <p className="text-white font-medium text-sm">munnincrow.com.br</p>
                </div>
              </motion.div>
            </div>

            {/* Footer tagline */}
            <motion.p
              className="text-center text-slate-600 text-xs mt-8"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              ✦ Feito com propósito no Brasil ✦
            </motion.p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}