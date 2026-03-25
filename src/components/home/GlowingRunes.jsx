import React, { useState } from "react";

export default function GlowingRunes({ isLight = false, intensity = "normal" }) {
  const [hoveredRune, setHoveredRune] = useState(null);

  const baseOp = isLight
    ? (intensity === "subtle" ? 0.18 : 0.28)
    : (intensity === "subtle" ? 0.45 : 0.65);

  const color = isLight ? "#6d28d9" : "#818cf8";
  const color2 = isLight ? "#7c3aed" : "#e879f9";

  // Paleta de cores para brilho de cada runa
  const runeGlows = {
    left: [
      { name: "Tyr", color: "#ff6b6b", hue: 0 },      // Vermelho
      { name: "Algiz", color: "#4ecdc4", hue: 45 },    // Ciano
      { name: "Othala", color: "#95e1d3", hue: 90 },   // Verde menta
      { name: "Ingwaz", color: "#ffa502", hue: 135 },  // Laranja
      { name: "Ehwaz", color: "#7b68ee", hue: 180 },   // Roxo
      { name: "Sowulo", color: "#f39c12", hue: 225 },  // Ouro
    ],
    right: [
      { name: "Fehu", color: "#ff1744", hue: 270 },    // Rosa quente
      { name: "Raidho", color: "#00e676", hue: 315 },  // Verde neon
      { name: "Mannaz", color: "#00bcd4", hue: 0 },    // Ciano vibrante
      { name: "Valknut", color: "#e91e63", hue: 45 },  // Rosa
      { name: "Isa+Nauthiz", color: "#3f51b5", hue: 90 }, // Índigo
      { name: "Hagalaz", color: "#00acc1", hue: 135 }, // Teal
    ],
  };

  const createRuneGroup = (index, side) => {
    const positions = [40, 105, 172, 240, 308, 375];
    const y = positions[index];
    const runes = side === "left" ? runeGlows.left : runeGlows.right;
    const rune = runes[index];
    const isHovered = hoveredRune === `${side}-${index}`;

    return (
      <g
        key={`${side}-${index}`}
        transform={`translate(18,${y})`}
        onMouseEnter={() => setHoveredRune(`${side}-${index}`)}
        onMouseLeave={() => setHoveredRune(null)}
        style={{ cursor: "pointer", transition: "filter 0.3s ease" }}
        filter={isHovered ? `drop-shadow(0 0 12px ${rune.color}) drop-shadow(0 0 24px ${rune.color}80)` : "none"}
      >
        {/* Glow circle background when hovered */}
        {isHovered && (
          <circle cx="0" cy="0" r="22" fill="none" stroke={rune.color} strokeWidth="1" opacity="0.3" />
        )}
      </g>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {/* Left rune column */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-auto"
        width="36"
        height="420"
        viewBox="0 0 36 420"
        style={{ opacity: baseOp }}
      >
        {/* Tyr */}
         <g
           transform="translate(18,40)"
           onMouseEnter={() => setHoveredRune("left-0")}
           onMouseLeave={() => setHoveredRune(null)}
           style={{
             cursor: "pointer",
             filter: hoveredRune === "left-0"
               ? `drop-shadow(0 0 8px #ff6b6b) drop-shadow(0 0 16px #ff6b6b) drop-shadow(0 0 24px #ff6b6b)`
               : "none",
             transition: "filter 0.2s ease"
           }}
         >
           {hoveredRune === "left-0" && (
             <circle cx="0" cy="0" r="22" fill="none" stroke="#ff6b6b" strokeWidth="1" opacity="0.4" />
           )}
           <line x1="0" y1="14" x2="0" y2="-12" stroke={hoveredRune === "left-0" ? "#ff6b6b" : color} strokeWidth={hoveredRune === "left-0" ? "2.2" : "1.8"} />
           <line x1="-9" y1="-2" x2="9" y2="-12" stroke={hoveredRune === "left-0" ? "#ff6b6b" : color} strokeWidth={hoveredRune === "left-0" ? "2.2" : "1.8"} />
           <line x1="9" y1="-2" x2="-9" y2="-12" stroke={hoveredRune === "left-0" ? "#ff6b6b" : color} strokeWidth={hoveredRune === "left-0" ? "2.2" : "1.8"} />
         </g>

        {/* Algiz */}
        <g
          transform="translate(18,105)"
          onMouseEnter={() => setHoveredRune("left-1")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "left-1"
              ? `drop-shadow(0 0 12px #4ecdc4) drop-shadow(0 0 24px #4ecdc480)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "left-1" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#4ecdc4" strokeWidth="1" opacity="0.3" />
          )}
          <line x1="0" y1="14" x2="0" y2="-14" stroke={color2} strokeWidth="1.8" />
          <line x1="0" y1="-2" x2="-9" y2="-14" stroke={color2} strokeWidth="1.8" />
          <line x1="0" y1="-2" x2="9" y2="-14" stroke={color2} strokeWidth="1.8" />
        </g>

        {/* Othala */}
        <g
          transform="translate(18,172)"
          onMouseEnter={() => setHoveredRune("left-2")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "left-2"
              ? `drop-shadow(0 0 12px #95e1d3) drop-shadow(0 0 24px #95e1d380)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "left-2" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#95e1d3" strokeWidth="1" opacity="0.3" />
          )}
          <line x1="0" y1="14" x2="0" y2="4" stroke={color} strokeWidth="1.8" />
          <line x1="-7" y1="4" x2="7" y2="4" stroke={color} strokeWidth="1.8" />
          <path d="M-7 4 L-11 -7 L0 -14 L11 -7 L7 4" stroke={color} strokeWidth="1.8" fill="none" />
        </g>

        {/* Ingwaz */}
        <g
          transform="translate(18,240)"
          onMouseEnter={() => setHoveredRune("left-3")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "left-3"
              ? `drop-shadow(0 0 12px #ffa502) drop-shadow(0 0 24px #ffa50280)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "left-3" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#ffa502" strokeWidth="1" opacity="0.3" />
          )}
          <path d="M0 13 L11 0 L0 -13 L-11 0 Z" stroke={color2} strokeWidth="1.8" fill="none" />
          <line x1="-11" y1="0" x2="11" y2="0" stroke={color2} strokeWidth="1.3" />
        </g>

        {/* Ehwaz */}
        <g
          transform="translate(18,308)"
          onMouseEnter={() => setHoveredRune("left-4")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "left-4"
              ? `drop-shadow(0 0 12px #7b68ee) drop-shadow(0 0 24px #7b68ee80)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "left-4" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#7b68ee" strokeWidth="1" opacity="0.3" />
          )}
          <line x1="-7" y1="-13" x2="-7" y2="13" stroke={color} strokeWidth="1.8" />
          <line x1="7" y1="-13" x2="7" y2="13" stroke={color} strokeWidth="1.8" />
          <line x1="-7" y1="0" x2="7" y2="0" stroke={color} strokeWidth="1.8" />
        </g>

        {/* Sowulo */}
        <g
          transform="translate(18,375)"
          onMouseEnter={() => setHoveredRune("left-5")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "left-5"
              ? `drop-shadow(0 0 12px #f39c12) drop-shadow(0 0 24px #f39c1280)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "left-5" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#f39c12" strokeWidth="1" opacity="0.3" />
          )}
          <path d="M7 -13 L-7 -4 L7 4 L-7 13" stroke={color2} strokeWidth="1.8" fill="none" />
        </g>
      </svg>

      {/* Right rune column */}
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-auto"
        width="36"
        height="420"
        viewBox="0 0 36 420"
        style={{ opacity: baseOp }}
      >
        {/* Fehu */}
        <g
          transform="translate(18,40)"
          onMouseEnter={() => setHoveredRune("right-0")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "right-0"
              ? `drop-shadow(0 0 12px #ff1744) drop-shadow(0 0 24px #ff174480)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "right-0" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#ff1744" strokeWidth="1" opacity="0.3" />
          )}
          <line x1="0" y1="14" x2="0" y2="-14" stroke={color} strokeWidth="1.8" />
          <line x1="0" y1="-7" x2="11" y2="-14" stroke={color} strokeWidth="1.8" />
          <line x1="0" y1="0" x2="11" y2="-7" stroke={color} strokeWidth="1.8" />
        </g>

        {/* Raidho */}
        <g
          transform="translate(18,105)"
          onMouseEnter={() => setHoveredRune("right-1")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "right-1"
              ? `drop-shadow(0 0 12px #00e676) drop-shadow(0 0 24px #00e67680)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "right-1" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#00e676" strokeWidth="1" opacity="0.3" />
          )}
          <line x1="-2" y1="-14" x2="-2" y2="14" stroke={color2} strokeWidth="1.8" />
          <path d="M-2 -14 L9 -7 L-2 0" stroke={color2} strokeWidth="1.8" fill="none" />
          <line x1="-2" y1="0" x2="9" y2="14" stroke={color2} strokeWidth="1.8" />
        </g>

        {/* Mannaz */}
        <g
          transform="translate(18,172)"
          onMouseEnter={() => setHoveredRune("right-2")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "right-2"
              ? `drop-shadow(0 0 12px #00bcd4) drop-shadow(0 0 24px #00bcd480)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "right-2" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#00bcd4" strokeWidth="1" opacity="0.3" />
          )}
          <line x1="-9" y1="-14" x2="-9" y2="14" stroke={color} strokeWidth="1.8" />
          <line x1="9" y1="-14" x2="9" y2="14" stroke={color} strokeWidth="1.8" />
          <line x1="-9" y1="-14" x2="0" y2="0" stroke={color} strokeWidth="1.8" />
          <line x1="9" y1="-14" x2="0" y2="0" stroke={color} strokeWidth="1.8" />
        </g>

        {/* Valknut */}
        <g
          transform="translate(18,240)"
          onMouseEnter={() => setHoveredRune("right-3")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "right-3"
              ? `drop-shadow(0 0 12px #e91e63) drop-shadow(0 0 24px #e91e6380)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "right-3" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#e91e63" strokeWidth="1" opacity="0.3" />
          )}
          <path d="M0 -13 L-6 -1 L6 -1 Z" stroke={color2} strokeWidth="1.4" fill="none" />
          <path d="M-7 -1 L-13 11 L-1 11 Z" stroke={color2} strokeWidth="1.4" fill="none" />
          <path d="M7 -1 L1 11 L13 11 Z" stroke={color2} strokeWidth="1.4" fill="none" />
        </g>

        {/* Isa + Nauthiz */}
        <g
          transform="translate(18,308)"
          onMouseEnter={() => setHoveredRune("right-4")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "right-4"
              ? `drop-shadow(0 0 12px #3f51b5) drop-shadow(0 0 24px #3f51b580)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "right-4" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#3f51b5" strokeWidth="1" opacity="0.3" />
          )}
          <line x1="0" y1="-14" x2="0" y2="14" stroke={color} strokeWidth="1.8" />
          <line x1="-8" y1="-6" x2="8" y2="6" stroke={color} strokeWidth="1.3" />
        </g>

        {/* Hagalaz */}
        <g
          transform="translate(18,375)"
          onMouseEnter={() => setHoveredRune("right-5")}
          onMouseLeave={() => setHoveredRune(null)}
          style={{
            cursor: "pointer",
            filter: hoveredRune === "right-5"
              ? `drop-shadow(0 0 12px #00acc1) drop-shadow(0 0 24px #00acc180)`
              : "none",
            transition: "filter 0.3s ease"
          }}
        >
          {hoveredRune === "right-5" && (
            <circle cx="0" cy="0" r="22" fill="none" stroke="#00acc1" strokeWidth="1" opacity="0.3" />
          )}
          <line x1="-8" y1="-13" x2="-8" y2="13" stroke={color2} strokeWidth="1.8" />
          <line x1="8" y1="-13" x2="8" y2="13" stroke={color2} strokeWidth="1.8" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke={color2} strokeWidth="1.8" />
        </g>
      </svg>
    </div>
  );
}