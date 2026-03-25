import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, Moon, Sun, LayoutGrid, LayoutList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FirstAccessGuide({ open, onClose, onAppearanceChange }) {
  const [step, setStep] = useState(1);
  const [selectedLayout, setSelectedLayout] = useState("v2");
  const [selectedTheme, setSelectedTheme] = useState("dark");

  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleNext = () => {
    if (step === 2) {
      // Aplicar customização
      onAppearanceChange({ layout: selectedLayout, tema: selectedTheme });
    }
    if (step < 3) setStep(step + 1);
    else handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-b from-slate-900 to-slate-800 border-slate-700 text-white">
        {/* Step 1: Welcome */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white flex items-center gap-2">
                  🚀 Bem-vindo à Munnin Crow!
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <p className="text-slate-300 text-lg leading-relaxed">
                  Estamos entusiasmados em tê-lo conosco! Esta plataforma foi projetada para ajudar você a descobrir e gerenciar editais de fomento à inovação e pesquisa no Brasil.
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                    <div>
                      <p className="font-semibold text-white">Explore os Editais</p>
                      <p className="text-sm text-slate-400">Acesse a seção Editais para filtrar por estado e categoria</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                    <div>
                      <p className="font-semibold text-white">Use o Tira-dúvidas</p>
                      <p className="text-sm text-slate-400">IA especializada para simplificar textos técnicos dos editais</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                    <div>
                      <p className="font-semibold text-white">Customize a Aparência</p>
                      <p className="text-sm text-slate-400">Escolha entre tema claro/escuro e layout conforme sua preferência</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-400 italic border-l-2 border-indigo-500 pl-3">
                  Dica: Você pode alternar entre tema claro e escuro, e mudar o layout a qualquer momento no seu Perfil.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Pular
                </Button>
                <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                  Próximo <ChevronRight className="w-4 h-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 2: Customize Appearance */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white flex items-center gap-2">
                  🎨 Customize Sua Aparência
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                {/* Layout Selection */}
                <div>
                  <p className="text-sm font-semibold text-slate-300 mb-3">Escolha o Layout:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Layout V2 */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedLayout("v2")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedLayout === "v2"
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                      }`}
                    >
                      <LayoutGrid className={`w-8 h-8 mx-auto mb-2 ${selectedLayout === "v2" ? "text-indigo-400" : "text-slate-400"}`} />
                      <p className={`font-semibold text-sm ${selectedLayout === "v2" ? "text-indigo-300" : "text-slate-300"}`}>Aparência 2</p>
                      <p className="text-xs text-slate-400 mt-1">Navegação moderna no topo</p>
                    </motion.button>

                    {/* Layout V1 */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedLayout("edgy")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedLayout === "edgy"
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                      }`}
                    >
                      <LayoutList className={`w-8 h-8 mx-auto mb-2 ${selectedLayout === "edgy" ? "text-indigo-400" : "text-slate-400"}`} />
                      <p className={`font-semibold text-sm ${selectedLayout === "edgy" ? "text-indigo-300" : "text-slate-300"}`}>Aparência 1</p>
                      <p className="text-xs text-slate-400 mt-1">Sidebar lateral clássico</p>
                    </motion.button>
                  </div>
                </div>

                {/* Theme Selection */}
                <div>
                  <p className="text-sm font-semibold text-slate-300 mb-3">Escolha o Tema:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Dark Theme */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedTheme("dark")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedTheme === "dark"
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                      }`}
                    >
                      <Moon className={`w-8 h-8 mx-auto mb-2 ${selectedTheme === "dark" ? "text-indigo-400" : "text-slate-400"}`} />
                      <p className={`font-semibold text-sm ${selectedTheme === "dark" ? "text-indigo-300" : "text-slate-300"}`}>Tema Escuro</p>
                      <p className="text-xs text-slate-400 mt-1">Melhor para noite</p>
                    </motion.button>

                    {/* Light Theme */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedTheme("light")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedTheme === "light"
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                      }`}
                    >
                      <Sun className={`w-8 h-8 mx-auto mb-2 ${selectedTheme === "light" ? "text-indigo-400" : "text-slate-400"}`} />
                      <p className={`font-semibold text-sm ${selectedTheme === "light" ? "text-indigo-300" : "text-slate-300"}`}>Tema Claro</p>
                      <p className="text-xs text-slate-400 mt-1">Melhor para dia</p>
                    </motion.button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic border-l-2 border-indigo-500 pl-3">
                  Estas configurações serão salvas no seu perfil e você poderá mudá-las a qualquer momento.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep(1)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Voltar
                </Button>
                <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                  Próximo <ChevronRight className="w-4 h-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white flex items-center gap-2">
                  ✨ Tudo Pronto!
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <p className="text-slate-300 text-lg leading-relaxed">
                  Você está todo configurado! Agora você pode explorar a plataforma livremente.
                </p>
                <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-indigo-300">Lembre-se:</p>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• Acesse seu Perfil para alterar o tema ou layout a qualquer momento</li>
                    <li>• Use o Tira-dúvidas para tirar dúvidas sobre os editais</li>
                    <li>• Explore as diferentes seções para descobrir oportunidades</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleClose} className="bg-indigo-600 hover:bg-indigo-700 w-full">
                  Começar a Explorar
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}