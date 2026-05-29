// Ilustração SVG inline — antena de estação terrestre, satélite em órbita e Terra.
// Sem dependência externa, escala bem em qualquer largura.

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 300"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <radialGradient id="earthGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="55%" stopColor="#0c1f4f" />
          <stop offset="100%" stopColor="#020817" />
        </radialGradient>
        <linearGradient id="dishGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="orbitGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0" />
          <stop offset="50%" stopColor="#5eead4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Estrelas */}
      <g fill="#cbd5e1">
        <circle cx="40" cy="40" r="1" opacity="0.7" />
        <circle cx="120" cy="22" r="0.8" opacity="0.5" />
        <circle cx="220" cy="60" r="1.2" opacity="0.8" />
        <circle cx="320" cy="30" r="0.8" opacity="0.6" />
        <circle cx="400" cy="55" r="1" opacity="0.7" />
        <circle cx="450" cy="100" r="0.8" opacity="0.5" />
        <circle cx="60" cy="120" r="0.7" opacity="0.5" />
        <circle cx="380" cy="200" r="0.9" opacity="0.5" />
      </g>

      {/* Terra (canto inferior direito) */}
      <g>
        <circle cx="370" cy="290" r="120" fill="url(#earthGrad)" />
        {/* Contornos de continentes estilizados */}
        <path
          d="M 290 280 Q 310 250 340 260 Q 360 270 380 250 Q 400 245 420 270 Q 430 290 410 305 Q 380 315 350 305 Q 320 305 300 295 Z"
          fill="#0ea5a4"
          opacity="0.35"
        />
        <path
          d="M 270 305 Q 290 295 310 310 Q 320 320 305 330 Q 285 325 270 320 Z"
          fill="#0ea5a4"
          opacity="0.3"
        />
        {/* Atmosfera */}
        <circle cx="370" cy="290" r="120" fill="none" stroke="#38bdf8" strokeOpacity="0.25" strokeWidth="2" />
      </g>

      {/* Órbita */}
      <ellipse
        cx="240"
        cy="160"
        rx="220"
        ry="60"
        fill="none"
        stroke="url(#orbitGrad)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
      />

      {/* Satélite em órbita */}
      <g transform="translate(110, 130)">
        <rect x="-9" y="-7" width="18" height="14" rx="2" fill="#cbd5e1" />
        <rect x="-26" y="-3" width="14" height="6" fill="#38bdf8" />
        <rect x="12" y="-3" width="14" height="6" fill="#38bdf8" />
        <rect x="-26" y="-3" width="14" height="6" fill="none" stroke="#0e7490" strokeWidth="0.5" />
        <rect x="12" y="-3" width="14" height="6" fill="none" stroke="#0e7490" strokeWidth="0.5" />
        <line x1="0" y1="7" x2="0" y2="14" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="0" cy="16" r="2" fill="#fbbf24" />
      </g>

      {/* Feixe de comunicação satélite ↔ antena */}
      <line x1="110" y1="138" x2="115" y2="232" stroke="#5eead4" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.7" />

      {/* Estação terrestre (canto inferior esquerdo) */}
      <g transform="translate(100, 250)">
        {/* Base */}
        <rect x="-30" y="20" width="60" height="6" fill="#1e293b" />
        <rect x="-22" y="14" width="44" height="6" fill="#334155" />
        {/* Poste */}
        <rect x="-3" y="-30" width="6" height="44" fill="#475569" />
        {/* Parabólica */}
        <g transform="translate(0, -20) rotate(-25)">
          <path d="M -30 0 Q 0 -36 30 0 L 25 6 Q 0 -22 -25 6 Z" fill="url(#dishGrad)" />
          <line x1="0" y1="-18" x2="0" y2="-2" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="0" cy="-22" r="2.5" fill="#0f172a" />
        </g>
        {/* Painel solar */}
        <g transform="translate(-70, 0)">
          <rect x="-12" y="-14" width="24" height="20" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="0.5" />
          <line x1="-12" y1="-7" x2="12" y2="-7" stroke="#3b82f6" strokeWidth="0.5" />
          <line x1="-12" y1="0" x2="12" y2="0" stroke="#3b82f6" strokeWidth="0.5" />
          <line x1="-4" y1="-14" x2="-4" y2="6" stroke="#3b82f6" strokeWidth="0.5" />
          <line x1="4" y1="-14" x2="4" y2="6" stroke="#3b82f6" strokeWidth="0.5" />
        </g>
      </g>

      {/* Etiqueta */}
      <text x="20" y="280" fontSize="9" fill="#5eead4" fontFamily="ui-monospace, monospace" letterSpacing="2">
        GROUND-STATION · TLM-INGEST · L-BAND
      </text>
    </svg>
  );
}
