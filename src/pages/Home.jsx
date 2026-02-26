import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, ChevronRight } from "lucide-react";
import BrazilMap from "../components/home/BrazilMap";
import CategoryCards from "../components/home/CategoryCards";
import EditalCard from "../components/home/EditalCard";
import EditalDetailModal from "../components/home/EditalDetailModal";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

export default function Home() {
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEdital, setSelectedEdital] = useState(null);

  const { data: editais = [] } = useQuery({
    queryKey: ["editais"],
    queryFn: () => base44.entities.Edital.list("-created_date", 200),
    initialData: [],
  });

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
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0f172a 0%, #1a1040 40%, #0f172a 100%)" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
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
        {!selectedState && (
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
                  Editais FAPES — {STATE_NAMES[selectedState]}
                </h2>
                <p className="text-sm text-white/40">Escolha a área de interesse para filtrar os editais</p>
              </div>
            </div>
            <CategoryCards editais={stateEditais} onSelectCategory={setSelectedCategory} />
          </div>
        )}

        {/* Step 3: Editais List */}
        {selectedState && selectedCategory && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={goBack} className="text-white/40 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{CATEGORY_LABELS[selectedCategory]}</h2>
                <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
                  {categoryEditais.length} editais
                </span>
              </div>
            </div>
            {categoryEditais.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/40">Nenhum edital nesta categoria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryEditais.map((edital) => (
                  <EditalCard key={edital.id} edital={edital} onClick={setSelectedEdital} />
                ))}
              </div>
            )}
          </div>
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