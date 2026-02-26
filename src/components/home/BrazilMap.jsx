import React from "react";

const STATES = [
  { uf: "RR", x: 215, y: 55 }, { uf: "AP", x: 310, y: 60 },
  { uf: "AM", x: 140, y: 130 }, { uf: "PA", x: 280, y: 120 },
  { uf: "MA", x: 350, y: 115 }, { uf: "CE", x: 410, y: 115 },
  { uf: "PI", x: 370, y: 145 }, { uf: "RN", x: 440, y: 120 },
  { uf: "PB", x: 440, y: 140 }, { uf: "PE", x: 425, y: 160 },
  { uf: "AL", x: 440, y: 175 }, { uf: "SE", x: 425, y: 190 },
  { uf: "AC", x: 80, y: 195 }, { uf: "RO", x: 155, y: 210 },
  { uf: "TO", x: 310, y: 185 }, { uf: "MT", x: 220, y: 230 },
  { uf: "GO", x: 290, y: 260 }, { uf: "DF", x: 310, y: 260 },
  { uf: "BA", x: 390, y: 220 }, { uf: "MG", x: 350, y: 290 },
  { uf: "ES", x: 410, y: 290 }, { uf: "MS", x: 230, y: 300 },
  { uf: "SP", x: 310, y: 320 }, { uf: "RJ", x: 380, y: 310 },
  { uf: "PR", x: 280, y: 350 }, { uf: "SC", x: 300, y: 380 },
  { uf: "RS", x: 270, y: 410 },
];

export default function BrazilMap({ selectedState, onSelectState }) {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <svg viewBox="0 0 500 460" className="w-full h-auto">
        {STATES.map((s) => {
          const isSelected = selectedState === s.uf;
          const isES = s.uf === "ES";
          return (
            <g key={s.uf} onClick={() => onSelectState(s.uf)} className="cursor-pointer">
              {isSelected && (
                <circle cx={s.x} cy={s.y} r="22" fill="rgba(99,102,241,0.15)" />
              )}
              <circle
                cx={s.x} cy={s.y}
                r={isSelected ? 18 : isES ? 16 : 14}
                fill={isSelected ? "#6366f1" : isES ? "#312e81" : "rgba(255,255,255,0.06)"}
                stroke={isSelected ? "#818cf8" : isES ? "#6366f1" : "rgba(255,255,255,0.1)"}
                strokeWidth={isSelected ? 2 : 1}
                className="transition-all duration-300 hover:fill-indigo-600/60 hover:stroke-indigo-400"
              />
              <text
                x={s.x} y={s.y + 4}
                textAnchor="middle"
                className="text-[10px] font-bold pointer-events-none select-none"
                fill={isSelected || isES ? "white" : "rgba(255,255,255,0.4)"}
              >
                {s.uf}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}