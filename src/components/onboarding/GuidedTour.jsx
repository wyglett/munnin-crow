import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    title: "Editais & Propostas 📝",
    description:
      "Aqui você encontra editais abertos de fomento por estado e categoria. Ao se interessar por um, crie sua proposta com ajuda da nossa IA — ela analisa o edital e sugere como melhorar suas chances.",
    highlight: "nav-propostas",
    page: "MinhasPropostas",
    cta: "Ver Propostas",
    color: "from-indigo-600 to-indigo-800",
  },
  {
    title: "Acompanhamento de Projetos 📊",
    description:
      "Projetos aprovados? Gerencie gastos, documentos e relatórios de prestação de contas em um só lugar. Você também pode solicitar um consultor especializado para te auxiliar.",
    highlight: "nav-acompanhamento",
    page: "Acompanhamento",
    cta: "Ver Projetos",
    color: "from-emerald-600 to-emerald-800",
  },
  {
    title: "Tira-Dúvidas com IA 🤖",
    description:
      "Tem dúvidas sobre editais, regras de fomento ou prestação de contas? Nosso assistente de IA especializado responde em segundos, com base nas regras reais dos órgãos financiadores.",
    highlight: "nav-tiraduvidas",
    page: "TiraDuvidas",
    cta: "Perguntar à IA",
    color: "from-purple-600 to-purple-800",
  },
  {
    title: "Comunidade 💬",
    description:
      "Conecte-se com outros empreendedores e consultores. Tire dúvidas, compartilhe experiências e fique por dentro das novidades sobre editais e fomento no Brasil.",
    highlight: "nav-comunidade",
    page: "Comunidade",
    cta: "Entrar na Comunidade",
    color: "from-amber-600 to-orange-700",
  },
];

export default function GuidedTour({ onFinish }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = () => {
    localStorage.setItem("guided_tour_done", "1");
    onFinish();
  };

  const handleGoTo = () => {
    localStorage.setItem("guided_tour_done", "1");
    navigate(createPageUrl(current.page));
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-none">
      {/* Overlay semi-transparente */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={handleFinish} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          className="relative pointer-events-auto w-full max-w-md mx-4 mb-6 md:mb-0 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header colorido */}
          <div className={`bg-gradient-to-r ${current.color} p-6 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">
                  Passo {step + 1} de {STEPS.length}
                </p>
                <h2 className="text-2xl font-black">{current.title}</h2>
              </div>
              <button onClick={handleFinish} className="text-white/60 hover:text-white transition-colors mt-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mt-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "bg-white w-6" : "bg-white/30 w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="bg-white p-6">
            <p className="text-gray-600 leading-relaxed mb-6">{current.description}</p>

            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={handlePrev} className="flex-shrink-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleGoTo}
                className="flex-1 text-gray-700"
              >
                {current.cta}
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {step < STEPS.length - 1 ? (
                  <>
                    Próximo <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  "Começar! 🚀"
                )}
              </Button>
            </div>

            <button
              onClick={handleFinish}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors"
            >
              Pular apresentação
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}