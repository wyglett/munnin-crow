import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

const REGIOES = {
  norte: {
    label: "Norte",
    color: "#16a34a",
    colorHover: "#15803d",
    estados: ["AC", "AM", "AP", "PA", "RO", "RR", "TO"],
  },
  nordeste: {
    label: "Nordeste",
    color: "#d97706",
    colorHover: "#b45309",
    estados: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  },
  centro_oeste: {
    label: "Centro-Oeste",
    color: "#7c3aed",
    colorHover: "#6d28d9",
    estados: ["DF", "GO", "MS", "MT"],
  },
  sudeste: {
    label: "Sudeste",
    color: "#2563eb",
    colorHover: "#1d4ed8",
    estados: ["ES", "MG", "RJ", "SP"],
  },
  sul: {
    label: "Sul",
    color: "#dc2626",
    colorHover: "#b91c1c",
    estados: ["PR", "RS", "SC"],
  },
};

// Regiões → mapa de estado → região
const ESTADO_REGIAO = {};
Object.entries(REGIOES).forEach(([reg, { estados }]) => {
  estados.forEach(uf => { ESTADO_REGIAO[uf] = reg; });
});

// Paths SVG dos estados brasileiros (simplificados, viewBox 0 0 500 460)
const STATE_PATHS = {
  AC: "M 60 195 L 100 185 L 120 200 L 105 215 L 70 210 Z",
  AM: "M 100 80 L 200 70 L 230 100 L 210 170 L 160 185 L 110 175 L 90 140 Z",
  RR: "M 195 40 L 250 35 L 260 80 L 230 100 L 195 90 Z",
  AP: "M 295 45 L 335 40 L 340 85 L 315 90 L 295 70 Z",
  PA: "M 230 80 L 340 75 L 380 100 L 370 145 L 335 155 L 295 145 L 260 170 L 210 170 L 230 130 Z",
  MA: "M 340 100 L 395 100 L 405 130 L 385 155 L 360 160 L 335 155 L 370 140 Z",
  PI: "M 385 130 L 415 130 L 420 170 L 400 185 L 375 180 L 360 160 L 385 155 Z",
  CE: "M 395 95 L 450 100 L 460 135 L 430 145 L 415 130 L 405 130 Z",
  RN: "M 435 100 L 470 110 L 470 135 L 450 140 L 430 140 L 430 145 L 460 135 L 450 100 Z",
  PB: "M 430 140 L 470 135 L 475 155 L 445 160 L 430 155 Z",
  PE: "M 390 155 L 450 150 L 475 158 L 470 175 L 415 178 L 395 170 Z",
  AL: "M 445 175 L 475 170 L 478 188 L 455 192 Z",
  SE: "M 425 185 L 455 180 L 460 195 L 435 200 Z",
  BA: "M 360 155 L 415 155 L 430 185 L 435 200 L 415 250 L 385 265 L 355 245 L 335 215 L 345 185 Z",
  TO: "M 295 145 L 335 155 L 345 185 L 335 215 L 305 220 L 285 195 L 285 165 Z",
  MT: "M 160 185 L 260 170 L 285 195 L 285 240 L 265 265 L 205 270 L 165 245 Z",
  GO: "M 285 240 L 335 215 L 355 245 L 345 280 L 320 295 L 285 275 Z",
  DF: "M 315 257 L 330 255 L 330 270 L 315 272 Z",
  MG: "M 320 265 L 385 265 L 415 285 L 420 315 L 390 335 L 345 335 L 315 310 L 315 280 Z",
  ES: "M 415 285 L 445 285 L 448 310 L 430 320 L 415 310 Z",
  RJ: "M 380 330 L 420 318 L 435 335 L 415 350 L 385 345 Z",
  SP: "M 265 295 L 345 295 L 380 330 L 380 355 L 340 365 L 280 350 L 260 330 Z",
  MS: "M 205 265 L 285 265 L 285 310 L 260 335 L 215 330 L 195 300 Z",
  PR: "M 255 350 L 335 340 L 350 360 L 325 378 L 270 375 L 248 365 Z",
  SC: "M 265 378 L 335 370 L 348 388 L 318 400 L 268 398 Z",
  RS: "M 240 400 L 320 395 L 335 420 L 315 450 L 270 455 L 238 435 Z",
  RO: "M 125 185 L 165 185 L 165 220 L 135 230 L 115 215 Z",
};

const STATE_LABELS = {
  AC: [82, 200], AM: [155, 130], RR: [225, 65], AP: [315, 65], PA: [290, 115],
  MA: [368, 130], PI: [392, 158], CE: [425, 118], RN: [452, 122], PB: [452, 148],
  PE: [435, 163], AL: [458, 183], SE: [443, 192], BA: [390, 208], TO: [310, 185],
  MT: [220, 225], GO: [318, 258], DF: [322, 263], MG: [368, 300], ES: [430, 300],
  RJ: [408, 338], SP: [320, 330], MS: [240, 300], PR: [295, 358], SC: [305, 385],
  RS: [280, 425], RO: [140, 208],
};

export default function BrazilMap({ selectedState, onSelectState, editaisAbertos = [] }) {
  const [selectedRegiao, setSelectedRegiao] = useState(null);
  const [hoveredRegiao, setHoveredRegiao] = useState(null);
  const [hoveredEstado, setHoveredEstado] = useState(null);

  // Quais estados têm editais abertos
  const estadosComEditais = new Set(editaisAbertos.map(e => e.estado).filter(Boolean));

  // Quais regiões têm ao menos 1 estado com edital
  const regioesComEditais = new Set(
    Object.entries(REGIOES)
      .filter(([, { estados }]) => estados.some(uf => estadosComEditais.has(uf)))
      .map(([reg]) => reg)
  );

  const handleRegiaoClick = (reg) => {
    if (!regioesComEditais.has(reg)) return;
    setSelectedRegiao(reg);
  };

  const handleEstadoClick = (uf) => {
    if (!estadosComEditais.has(uf)) return;
    onSelectState(uf);
  };

  const getRegiaoForEstado = (uf) => ESTADO_REGIAO[uf];

  // Colors
  const getEstadoFill = (uf) => {
    const reg = getRegiaoForEstado(uf);
    const regInfo = REGIOES[reg];
    const hasEditais = estadosComEditais.has(uf);
    const isHovered = hoveredEstado === uf;
    const isSelected = selectedState === uf;

    if (!hasEditais) return "rgba(100,116,139,0.2)";
    if (isSelected) return regInfo.color;
    if (isHovered) return regInfo.colorHover;
    return regInfo.color + "cc";
  };

  const getRegiaoFill = (reg) => {
    const regInfo = REGIOES[reg];
    const hasEditais = regioesComEditais.has(reg);
    const isHovered = hoveredRegiao === reg;
    const isSelected = selectedRegiao === reg;

    if (!hasEditais) return "rgba(100,116,139,0.2)";
    if (isSelected) return regInfo.colorHover;
    if (isHovered) return regInfo.colorHover;
    return regInfo.color + "bb";
  };

  // Estados da região selecionada com editais
  const estadosDaRegiao = selectedRegiao
    ? REGIOES[selectedRegiao].estados
    : [];

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Legenda das regiões */}
      {!selectedRegiao && (
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {Object.entries(REGIOES).map(([reg, info]) => {
            const hasEditais = regioesComEditais.has(reg);
            return (
              <button
                key={reg}
                onClick={() => handleRegiaoClick(reg)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  hasEditais
                    ? "cursor-pointer hover:scale-105 border-transparent text-white"
                    : "cursor-default opacity-40 border-slate-600 text-slate-500"
                }`}
                style={hasEditais ? { backgroundColor: info.color } : {}}
              >
                <span className="w-2 h-2 rounded-full bg-white/60 inline-block" />
                {info.label}
                {hasEditais && (
                  <span className="bg-white/25 rounded-full px-1.5 py-0.5 text-[10px]">
                    {info.estados.filter(uf => estadosComEditais.has(uf)).length} estados
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Seleção de estado após escolher região */}
      {selectedRegiao && (
        <div className="mb-4">
          <button
            onClick={() => setSelectedRegiao(null)}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar às Regiões
          </button>
          <p className="text-sm font-semibold mb-2" style={{ color: REGIOES[selectedRegiao].color }}>
            Região {REGIOES[selectedRegiao].label} — escolha um estado:
          </p>
          <div className="flex flex-wrap gap-2">
            {estadosDaRegiao.map(uf => {
              const hasEditais = estadosComEditais.has(uf);
              const count = editaisAbertos.filter(e => e.estado === uf).length;
              return (
                <button
                  key={uf}
                  onClick={() => hasEditais && onSelectState(uf)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    hasEditais
                      ? "cursor-pointer hover:scale-105 text-white border-transparent"
                      : "cursor-default opacity-30 border-slate-600 text-slate-500"
                  }`}
                  style={hasEditais ? { backgroundColor: REGIOES[selectedRegiao].color } : {}}
                >
                  {uf}
                  {hasEditais && <span className="ml-1 text-xs opacity-75">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SVG Map */}
      <svg
        viewBox="0 0 500 470"
        className="w-full h-auto drop-shadow-lg"
        style={{ maxHeight: 420 }}
      >
        {/* Fundo oceano */}
        <rect x="0" y="0" width="500" height="470" fill="rgba(15,23,42,0)" />

        {/* Estados */}
        {Object.entries(STATE_PATHS).map(([uf, path]) => {
          const reg = getRegiaoForEstado(uf);
          const hasEditais = estadosComEditais.has(uf);
          const inSelectedRegiao = !selectedRegiao || selectedRegiao === reg;
          const fill = selectedRegiao ? getEstadoFill(uf) : getRegiaoFill(reg);
          const opacity = inSelectedRegiao ? 1 : 0.15;

          return (
            <g key={uf}>
              <path
                d={path}
                fill={fill}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                opacity={opacity}
                className={hasEditais && inSelectedRegiao ? "cursor-pointer transition-all duration-200" : ""}
                onMouseEnter={() => {
                  if (selectedRegiao) setHoveredEstado(uf);
                  else setHoveredRegiao(reg);
                }}
                onMouseLeave={() => {
                  setHoveredEstado(null);
                  setHoveredRegiao(null);
                }}
                onClick={() => selectedRegiao ? handleEstadoClick(uf) : handleRegiaoClick(reg)}
              />
              {/* Label do estado */}
              {STATE_LABELS[uf] && (
                <text
                  x={STATE_LABELS[uf][0]}
                  y={STATE_LABELS[uf][1]}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="bold"
                  fill={hasEditais && inSelectedRegiao ? "white" : "rgba(255,255,255,0.25)"}
                  className="pointer-events-none select-none"
                  opacity={opacity}
                >
                  {uf}
                </text>
              )}
            </g>
          );
        })}

        {/* Indicadores de editais nos estados (pontos brilhantes) */}
        {!selectedRegiao && Object.entries(STATE_LABELS).map(([uf, [cx, cy]]) => {
          if (!estadosComEditais.has(uf)) return null;
          const reg = getRegiaoForEstado(uf);
          const color = REGIOES[reg]?.color || "#6366f1";
          return (
            <circle
              key={`dot-${uf}`}
              cx={cx}
              cy={cy - 10}
              r="3"
              fill={color}
              opacity="0.9"
              className="pointer-events-none animate-pulse"
            />
          );
        })}
      </svg>

      <p className="text-center text-xs text-slate-500 mt-1">
        {!selectedRegiao
          ? "Clique em uma região colorida para ver os estados com editais abertos"
          : "Clique em um estado para ver os editais disponíveis"}
      </p>
    </div>
  );
}