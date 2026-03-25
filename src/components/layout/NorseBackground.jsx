import React from "react";

/**
 * NorseBackground — decorative SVG Norse elements overlay.
 * isLight: boolean — adapts colors for light vs dark theme.
 * intensity: "subtle" | "normal" — controls opacity.
 */
export default function NorseBackground({ isLight = false, intensity = "normal" }) {
  // Dark: cores neon vibrantes e opacidade forte; Light: cores escuras e mais opacas
  const baseOp = isLight
    ? (intensity === "subtle" ? 0.18 : 0.28)
    : (intensity === "subtle" ? 0.45 : 0.65);

  const color  = isLight ? "#3730a3" : "#818cf8";   // indigo-800 no light, indigo-400 neon no dark
  const color2 = isLight ? "#6d28d9" : "#e879f9";   // violet-700 no light, fuchsia neon no dark

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">

      {/* Dot / grid pattern */}
      <div className="absolute inset-0" style={{
        opacity: isLight ? 0.35 : 0.22,
        backgroundImage: `radial-gradient(circle, ${color}99 1px, transparent 1px)`,
        backgroundSize: "38px 38px",
      }} />

      {/* Top knotwork border */}
      <svg className="absolute top-0 left-0 w-full" height="56" viewBox="0 0 1200 56" preserveAspectRatio="none" style={{ opacity: baseOp * 1.3 }}>
        <pattern id="nk-top" x="0" y="0" width="120" height="56" patternUnits="userSpaceOnUse">
          <path d="M0 28 Q15 10 30 28 Q45 46 60 28 Q75 10 90 28 Q105 46 120 28" stroke={color} strokeWidth="1.4" fill="none"/>
          <path d="M0 18 Q15 32 30 18 Q45 4 60 18 Q75 32 90 18 Q105 4 120 18" stroke={color2} strokeWidth="0.9" fill="none" opacity="0.5"/>
          <circle cx="30" cy="28" r="2.2" fill={color}/>
          <circle cx="90" cy="28" r="2.2" fill={color}/>
        </pattern>
        <rect width="100%" height="56" fill="url(#nk-top)"/>
      </svg>

      {/* Bottom knotwork border */}
      <svg className="absolute bottom-0 left-0 w-full" height="56" viewBox="0 0 1200 56" preserveAspectRatio="none" style={{ opacity: baseOp }}>
        <pattern id="nk-bot" x="0" y="0" width="120" height="56" patternUnits="userSpaceOnUse">
          <path d="M0 28 Q15 46 30 28 Q45 10 60 28 Q75 46 90 28 Q105 10 120 28" stroke={color} strokeWidth="1.4" fill="none"/>
          <circle cx="60" cy="28" r="2.2" fill={color2}/>
        </pattern>
        <rect width="100%" height="56" fill="url(#nk-bot)"/>
      </svg>

      {/* Left rune column */}
      <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="36" height="420" viewBox="0 0 36 420" style={{ opacity: baseOp }}>
        {/* Tyr */}
        <g transform="translate(18,40)">
          <line x1="0" y1="14" x2="0" y2="-12" stroke={color} strokeWidth="1.8"/>
          <line x1="-9" y1="-2" x2="9" y2="-12" stroke={color} strokeWidth="1.8"/>
          <line x1="9" y1="-2" x2="-9" y2="-12" stroke={color} strokeWidth="1.8"/>
        </g>
        {/* Algiz */}
        <g transform="translate(18,105)">
          <line x1="0" y1="14" x2="0" y2="-14" stroke={color2} strokeWidth="1.8"/>
          <line x1="0" y1="-2" x2="-9" y2="-14" stroke={color2} strokeWidth="1.8"/>
          <line x1="0" y1="-2" x2="9" y2="-14" stroke={color2} strokeWidth="1.8"/>
        </g>
        {/* Othala */}
        <g transform="translate(18,172)">
          <line x1="0" y1="14" x2="0" y2="4" stroke={color} strokeWidth="1.8"/>
          <line x1="-7" y1="4" x2="7" y2="4" stroke={color} strokeWidth="1.8"/>
          <path d="M-7 4 L-11 -7 L0 -14 L11 -7 L7 4" stroke={color} strokeWidth="1.8" fill="none"/>
        </g>
        {/* Ingwaz */}
        <g transform="translate(18,240)">
          <path d="M0 13 L11 0 L0 -13 L-11 0 Z" stroke={color2} strokeWidth="1.8" fill="none"/>
          <line x1="-11" y1="0" x2="11" y2="0" stroke={color2} strokeWidth="1.3"/>
        </g>
        {/* Ehwaz */}
        <g transform="translate(18,308)">
          <line x1="-7" y1="-13" x2="-7" y2="13" stroke={color} strokeWidth="1.8"/>
          <line x1="7" y1="-13" x2="7" y2="13" stroke={color} strokeWidth="1.8"/>
          <line x1="-7" y1="0" x2="7" y2="0" stroke={color} strokeWidth="1.8"/>
        </g>
        {/* Sowulo */}
        <g transform="translate(18,375)">
          <path d="M7 -13 L-7 -4 L7 4 L-7 13" stroke={color2} strokeWidth="1.8" fill="none"/>
        </g>
      </svg>

      {/* Right rune column */}
      <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="36" height="420" viewBox="0 0 36 420" style={{ opacity: baseOp }}>
        {/* Fehu */}
        <g transform="translate(18,40)">
          <line x1="0" y1="14" x2="0" y2="-14" stroke={color} strokeWidth="1.8"/>
          <line x1="0" y1="-7" x2="11" y2="-14" stroke={color} strokeWidth="1.8"/>
          <line x1="0" y1="0" x2="11" y2="-7" stroke={color} strokeWidth="1.8"/>
        </g>
        {/* Raidho */}
        <g transform="translate(18,105)">
          <line x1="-2" y1="-14" x2="-2" y2="14" stroke={color2} strokeWidth="1.8"/>
          <path d="M-2 -14 L9 -7 L-2 0" stroke={color2} strokeWidth="1.8" fill="none"/>
          <line x1="-2" y1="0" x2="9" y2="14" stroke={color2} strokeWidth="1.8"/>
        </g>
        {/* Mannaz */}
        <g transform="translate(18,172)">
          <line x1="-9" y1="-14" x2="-9" y2="14" stroke={color} strokeWidth="1.8"/>
          <line x1="9" y1="-14" x2="9" y2="14" stroke={color} strokeWidth="1.8"/>
          <line x1="-9" y1="-14" x2="0" y2="0" stroke={color} strokeWidth="1.8"/>
          <line x1="9" y1="-14" x2="0" y2="0" stroke={color} strokeWidth="1.8"/>
        </g>
        {/* Valknut */}
        <g transform="translate(18,240)">
          <path d="M0 -13 L-6 -1 L6 -1 Z" stroke={color2} strokeWidth="1.4" fill="none"/>
          <path d="M-7 -1 L-13 11 L-1 11 Z" stroke={color2} strokeWidth="1.4" fill="none"/>
          <path d="M7 -1 L1 11 L13 11 Z" stroke={color2} strokeWidth="1.4" fill="none"/>
        </g>
        {/* Isa + Nauthiz */}
        <g transform="translate(18,308)">
          <line x1="0" y1="-14" x2="0" y2="14" stroke={color} strokeWidth="1.8"/>
          <line x1="-8" y1="-6" x2="8" y2="6" stroke={color} strokeWidth="1.3"/>
        </g>
        {/* Hagalaz */}
        <g transform="translate(18,375)">
          <line x1="-8" y1="-13" x2="-8" y2="13" stroke={color2} strokeWidth="1.8"/>
          <line x1="8" y1="-13" x2="8" y2="13" stroke={color2} strokeWidth="1.8"/>
          <line x1="-8" y1="0" x2="8" y2="0" stroke={color2} strokeWidth="1.8"/>
        </g>
      </svg>

      {/* Vegvisir — center top */}
      <svg className="absolute top-6 left-1/2 -translate-x-1/2" width="110" height="110" viewBox="-55 -55 110 110" style={{ opacity: baseOp * 0.85 }}>
        <circle cx="0" cy="0" r="48" stroke={color} strokeWidth="0.8" fill="none"/>
        <circle cx="0" cy="0" r="7" stroke={color} strokeWidth="1.2" fill="none"/>
        {[0,45,90,135,180,225,270,315].map((angle, i) => {
          const r = Math.PI / 180;
          const x2 = Math.cos(angle * r) * 43, y2 = Math.sin(angle * r) * 43;
          const xm = Math.cos(angle * r) * 20, ym = Math.sin(angle * r) * 20;
          return (
            <g key={i}>
              <line x1="0" y1="0" x2={x2} y2={y2} stroke={color} strokeWidth="1" opacity="0.8"/>
              {i % 2 === 0 && <>
                <line x1={xm} y1={ym} x2={xm + Math.cos((angle+90)*r)*7} y2={ym + Math.sin((angle+90)*r)*7} stroke={color2} strokeWidth="0.9"/>
                <line x1={xm} y1={ym} x2={xm + Math.cos((angle-90)*r)*7} y2={ym + Math.sin((angle-90)*r)*7} stroke={color2} strokeWidth="0.9"/>
              </>}
            </g>
          );
        })}
      </svg>

      {/* Valknut — center bottom */}
      <svg className="absolute bottom-8 left-1/2 -translate-x-1/2" width="80" height="72" viewBox="-40 -36 80 72" style={{ opacity: baseOp * 0.85 }}>
        <path d="M0 -34 L-14 -8 L14 -8 Z" stroke={color} strokeWidth="1.3" fill="none"/>
        <path d="M-16 -8 L-30 18 L-2 18 Z" stroke={color} strokeWidth="1.3" fill="none"/>
        <path d="M16 -8 L2 18 L30 18 Z" stroke={color} strokeWidth="1.3" fill="none"/>
      </svg>

      {/* Corner ornaments */}
      <svg className="absolute top-2 left-2" width="50" height="50" viewBox="0 0 50 50" style={{ opacity: baseOp }}>
        <path d="M2 2 L20 2 L2 20 Z" stroke={color} strokeWidth="1" fill="none"/>
        <path d="M6 2 L2 6" stroke={color2} strokeWidth="0.8"/>
        <circle cx="2" cy="2" r="2" fill={color} opacity="0.6"/>
      </svg>
      <svg className="absolute top-2 right-2" width="50" height="50" viewBox="0 0 50 50" style={{ opacity: baseOp }}>
        <path d="M48 2 L30 2 L48 20 Z" stroke={color} strokeWidth="1" fill="none"/>
        <path d="M44 2 L48 6" stroke={color2} strokeWidth="0.8"/>
        <circle cx="48" cy="2" r="2" fill={color} opacity="0.6"/>
      </svg>
      <svg className="absolute bottom-2 left-2" width="50" height="50" viewBox="0 0 50 50" style={{ opacity: baseOp }}>
        <path d="M2 48 L20 48 L2 30 Z" stroke={color} strokeWidth="1" fill="none"/>
        <circle cx="2" cy="48" r="2" fill={color} opacity="0.6"/>
      </svg>
      <svg className="absolute bottom-2 right-2" width="50" height="50" viewBox="0 0 50 50" style={{ opacity: baseOp }}>
        <path d="M48 48 L30 48 L48 30 Z" stroke={color} strokeWidth="1" fill="none"/>
        <circle cx="48" cy="48" r="2" fill={color} opacity="0.6"/>
      </svg>
    </div>
  );
}