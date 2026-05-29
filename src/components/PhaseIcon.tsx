// Ícone temático por fase (SVG inline, monocromático).
// Usado no painel de contexto para reforçar o tipo de operação.

interface Props {
  phaseNumber: number;
  size?: number;
  color?: string;
}

export function PhaseIcon({ phaseNumber, size = 22, color = "#5eead4" }: Props) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (phaseNumber) {
    case 1: // Initial access — antena
      return (
        <svg {...common}>
          <path d="M5 18 L19 18" />
          <path d="M12 18 L12 10" />
          <path d="M7 12 Q12 4 17 12" />
          <circle cx="12" cy="10" r="1.2" fill={color} />
        </svg>
      );
    case 2: // Domain enum — radar
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="12" x2="18" y2="6" />
          <circle cx="12" cy="12" r="1.2" fill={color} />
        </svg>
      );
    case 3: // User/group discovery — pessoas
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="3" />
          <path d="M2 20 Q2 14 8 14 Q14 14 14 20" />
          <circle cx="17" cy="11" r="2.2" />
          <path d="M14 20 Q14 16 17 16 Q22 16 22 20" />
        </svg>
      );
    case 4: // Service accounts — engrenagem
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3 L12 6 M12 18 L12 21 M3 12 L6 12 M18 12 L21 12 M5.6 5.6 L7.7 7.7 M16.3 16.3 L18.4 18.4 M5.6 18.4 L7.7 16.3 M16.3 7.7 L18.4 5.6" />
        </svg>
      );
    case 5: // AS-REP — envelope com chave
      return (
        <svg {...common}>
          <rect x="3" y="6" width="14" height="10" rx="1" />
          <path d="M3 7 L10 13 L17 7" />
          <circle cx="19" cy="17" r="2.2" />
          <path d="M19 14.8 L19 11" />
        </svg>
      );
    case 6: // Kerberoasting — ticket fragmentado
      return (
        <svg {...common}>
          <path d="M3 8 Q3 6 5 6 L19 6 Q21 6 21 8 L21 10 Q19 10 19 12 Q19 14 21 14 L21 16 Q21 18 19 18 L5 18 Q3 18 3 16 L3 14 Q5 14 5 12 Q5 10 3 10 Z" />
          <path d="M10 6 L10 18" strokeDasharray="2 2" />
        </svg>
      );
    case 7: // Cracking — chave + martelo
      return (
        <svg {...common}>
          <circle cx="7" cy="14" r="3" />
          <path d="M9 12 L20 3" />
          <path d="M16 7 L19 10" />
          <path d="M13 10 L16 13" />
        </svg>
      );
    case 8: // ACL Abuse — escudo com x
      return (
        <svg {...common}>
          <path d="M12 3 L20 6 L20 12 Q20 18 12 21 Q4 18 4 12 L4 6 Z" />
          <path d="M9 10 L15 14 M15 10 L9 14" />
        </svg>
      );
    case 9: // Delegation — cadeia/encadeamento
      return (
        <svg {...common}>
          <rect x="3" y="9" width="8" height="6" rx="3" />
          <rect x="13" y="9" width="8" height="6" rx="3" />
          <path d="M11 12 L13 12" />
        </svg>
      );
    case 10: // Lateral — setas saltando hosts
      return (
        <svg {...common}>
          <rect x="3" y="15" width="6" height="6" rx="1" />
          <rect x="15" y="15" width="6" height="6" rx="1" />
          <path d="M6 15 Q6 5 12 5 Q18 5 18 15" />
          <path d="M16 13 L18 15 L20 13" />
        </svg>
      );
    case 11: // DCSync — replicar
      return (
        <svg {...common}>
          <path d="M4 8 L8 4 L8 7 L16 7 Q20 7 20 11 L20 13" />
          <path d="M20 16 L16 20 L16 17 L8 17 Q4 17 4 13 L4 11" />
        </svg>
      );
    case 12: // Golden ticket — coroa
      return (
        <svg {...common}>
          <path d="M3 18 L21 18" />
          <path d="M3 18 L5 9 L9 13 L12 7 L15 13 L19 9 L21 18 Z" />
          <circle cx="12" cy="7" r="1" fill={color} />
          <circle cx="5" cy="9" r="0.8" fill={color} />
          <circle cx="19" cy="9" r="0.8" fill={color} />
        </svg>
      );
    case 13: // Impact — alvo
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5.5" />
          <circle cx="12" cy="12" r="2" fill={color} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
