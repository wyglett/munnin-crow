import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, ChevronRight, Sparkles, TrendingUp, Target } from "lucide-react";
import BrazilMap from "../components/home/BrazilMap";
import CategoryCards from "../components/home/CategoryCards";
import EditalCard from "../components/home/EditalCard";
import EditalDetailModal from "../components/home/EditalDetailModal";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import moment from "moment";

const CATEGORY_LABELS = {
  inovacao_startups: "Inovação & Startups",
  apoio_pesquisa: "Apoio à Pesquisa",
  empreendedorismo: "Empreendedorismo",
  bolsas_editais: "Bolsas & Editais",
  outros_programas: "Outros Programas",
};

const STATE_NAMES = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia",
  RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

function EditaisLista({ editais, category, onBack, onSelect }) {
  const [mostrarAntigos, setMostrarAntigos] = useState(false);
  const abertos = editais.filter(e => {
    if (e.status === "encerrado") return false;
    if (e.data_encerramento && moment(e.data_encerramento).isBefore(moment(), "day")) return false;
    return true;
  });
  const encerrados = editais.filter(e => !abertos.includes(e));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{CATEGORY_LABELS[category]}</h2>
          <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
            {abertos.length} abertos
          </span>
        </div>
      </div>

      {abertos.length === 0 && (
        <div className="text-center py-10">
          <p className="text-white/40">Nenhum edital aberto nesta categoria</p>
        </div>
      )}

      <div className="space-y-3">
        {abertos.map((edital) => (
          <EditalCard key={edital.id} edital={edital} onClick={onSelect} />
        ))}
      </div>

      {encerrados.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setMostrarAntigos(v => !v)}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors py-2"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${mostrarAntigos ? "rotate-90" : ""}`} />
            Editais Antigos ({encerrados.length})
          </button>
          {mostrarAntigos && (
            <div className="space-y-2 mt-2 opacity-60">
              {encerrados.map((edital) => (
                <EditalCard key={edital.id} edital={edital} onClick={onSelect} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEdital, setSelectedEdital] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const { data: editais = [] } = useQuery({
    queryKey: ["editais"],
    queryFn: () => base44.entities.Edital.list("-created_date", 200),
    initialData: [],
  });

  const quotes = [
    { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
    { text: "Não espere por oportunidades extraordinárias. Agarre ocasiões comuns e faça-as grandes.", author: "Orison Swett Marden" },
    { text: "O empreendedor sempre busca mudanças, reage a elas e as explora como oportunidade.", author: "Peter Drucker" }
  ];
  
  const facts = [
    "Você sabia? A Magazine Luiza começou como uma pequena loja em Franca (SP) em 1957 e hoje é uma das maiores varejistas do Brasil.",
    "Você sabia? O Nubank foi fundado em 2013 e hoje é o maior banco digital independente do mundo, com mais de 80 milhões de clientes.",
    "Você sabia? A 99 nasceu no Brasil em 2012 e revolucionou o transporte urbano, sendo adquirida pela Didi em 2018."
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const randomFact = facts[Math.floor(Math.random() * facts.length)];

  const stateEditais = selectedState ? editais.filter(e => (e.estado || "ES") === selectedState) : editais;
  const categoryEditais = selectedCategory ? stateEditais.filter(e => e.categoria === selectedCategory) : stateEditais;

  const handleSelectState = (uf) => {
    setSelectedState(uf);
    setSelectedCategory(null);
  };

  const goBack = () => {
    if (selectedCategory) setSelectedCategory(null);
    else setSelectedState(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0f172a 0%, #1a1040 40%, #0f172a 100%)" }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
          animate={{ x: [0, -80, 0], y: [0, -60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        {!showMap && !selectedState && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-3 flex items-center gap-2"
            >
              <Sparkles className="w-3 h-3" /> Plataforma Munnin Crow
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl font-black text-white leading-tight mb-6"
            >
              Encontre o edital<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">certo para você.</span>
            </motion.h1>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-4 gap-3 mb-8"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-indigo-400 mb-0.5">{editais.length}</div>
                <div className="text-[10px] text-white/50">Editais Ativos</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-purple-400 mb-0.5">27</div>
                <div className="text-[10px] text-white/50">Estados</div>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-green-400 mb-0.5">R$ 2B+</div>
                <div className="text-xs text-green-300/70 font-medium">em Fomento Disponível</div>
                <div className="text-[10px] text-white/30 mt-1">Oportunidades abertas de financiamento público</div>
              </div>
            </motion.div>
            
            {/* Quote */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-6 mb-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
              <p className="text-white/90 text-lg italic leading-relaxed mb-2 relative z-10">"{randomQuote.text}"</p>
              <p className="text-indigo-300 text-sm relative z-10">— {randomQuote.author}</p>
            </motion.div>

            {/* Fact */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 mb-8 flex items-start gap-3"
            >
              <Target className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-white/70 text-sm leading-relaxed">{randomFact}</p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button 
                onClick={() => setShowMap(true)} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-indigo-600/30 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  🚀 Vamos submeter uma proposta?
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Header Condensed */}
        {(showMap || selectedState) && (
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-3">Plataforma Munnin Crow</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Encontre o edital<br />
              <span className="text-indigo-400">certo para você.</span>
            </h1>
            <p className="text-white/40 mt-4 max-w-xl text-lg">
              Selecione seu estado, escolha a área de interesse e descubra oportunidades abertas de fomento.
            </p>
          </div>
        )}

        {/* Breadcrumb */}
        {selectedState && (
          <div className="flex items-center gap-2 mb-6 text-sm">
            <button onClick={() => { setSelectedState(null); setSelectedCategory(null); }} className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors">
              <MapPin className="w-3.5 h-3.5" /> Estado
            </button>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <span className="text-white font-medium">{STATE_NAMES[selectedState]}</span>
            {selectedCategory && (
              <>
                <ChevronRight className="w-3 h-3 text-white/20" />
                <span className="text-indigo-400 font-medium">{CATEGORY_LABELS[selectedCategory]}</span>
              </>
            )}
          </div>
        )}

        {/* Step 1: Select State */}
        {(showMap || selectedState) && !selectedState && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Selecione seu estado no mapa</h2>
            <BrazilMap selectedState={selectedState} onSelectState={handleSelectState} />
          </div>
        )}

        {/* Step 2: Select Category */}
        {selectedState && !selectedCategory && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={goBack} className="text-white/40 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Editais — {STATE_NAMES[selectedState]}
                </h2>
                <p className="text-sm text-white/40">Escolha a área de interesse para filtrar os editais</p>
              </div>
            </div>
            <CategoryCards editais={stateEditais} onSelectCategory={setSelectedCategory} />
          </div>
        )}

        {/* Step 3: Editais List */}
        {selectedState && selectedCategory && (
          <EditaisLista editais={categoryEditais} category={selectedCategory} onBack={goBack} onSelect={setSelectedEdital} />
        )}
      </div>

      <EditalDetailModal
        edital={selectedEdital}
        open={!!selectedEdital}
        onClose={() => setSelectedEdital(null)}
      />
    </div>
  );
}