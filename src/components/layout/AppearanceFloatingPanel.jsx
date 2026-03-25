import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LayoutGrid, LayoutList, X, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AppearanceFloatingPanel({ isLight, onThemeChange, onLayoutChange, currentLayout }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`mb-4 rounded-2xl shadow-2xl border p-4 space-y-3 w-64 ${
              isLight
                ? "bg-white border-slate-200"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            {/* Header */}
            <div className={`text-sm font-semibold flex items-center justify-between ${
              isLight ? "text-slate-900" : "text-white"
            }`}>
              <span>Aparência</span>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 hover:bg-slate-200 rounded transition-colors ${
                  isLight ? "hover:bg-slate-100" : "hover:bg-slate-700"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div className={`h-px ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />

            {/* Theme Selection */}
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                isLight ? "text-slate-500" : "text-slate-400"
              }`}>
                Tema
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onThemeChange("dark")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    !isLight
                      ? `border-indigo-500 ${isLight ? "bg-indigo-50" : "bg-indigo-600/20"} text-indigo-600`
                      : `border-slate-300 ${isLight ? "bg-white hover:bg-slate-50" : "bg-slate-700 hover:bg-slate-600"}`
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-xs font-medium">Escuro</span>
                </button>
                <button
                  onClick={() => onThemeChange("light")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isLight
                      ? `border-indigo-500 ${isLight ? "bg-indigo-100" : "bg-indigo-600/20"} text-indigo-600`
                      : `border-slate-500 ${isLight ? "bg-white hover:bg-slate-50" : "bg-slate-700 hover:bg-slate-600"}`
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-xs font-medium">Claro</span>
                </button>
              </div>
            </div>



            {/* Info */}
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} italic`}>
              Estas preferências são salvas no seu perfil.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-medium transition-all ${
          isLight
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
        }`}
      >
        {isOpen ? (
          <>
            <ChevronUp className="w-5 h-5" />
            <span className="text-sm">Fechar</span>
          </>
        ) : (
          <>
            {isLight ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-sm">Aparência</span>
          </>
        )}
      </motion.button>
    </div>
  );
}