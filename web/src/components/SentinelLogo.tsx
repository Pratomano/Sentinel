interface SentinelLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export default function SentinelLogo({ className = 'w-10 h-10', size, glow = true }: SentinelLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Glow effect surrounding the helmet */}
      {glow && (
        <div className="absolute inset-0 bg-fuchsia-600/30 rounded-full blur-md -z-10 scale-110 pointer-events-none" />
      )}

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_12px_rgba(168,85,247,0.4)]"
      >
        <defs>
          {/* Gradients inspirados na armadura clássica do Sentinel Marvel */}
          <linearGradient id="sentinel-armor-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="45%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>

          <linearGradient id="sentinel-armor-accent" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e879f9" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>

          <linearGradient id="sentinel-inner-face" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e1136" />
            <stop offset="100%" stopColor="#0a0512" />
          </linearGradient>

          {/* Olhos cibernéticos incandescentes (Fúcsia elétrico / Âmbar Sentinel) */}
          <linearGradient id="sentinel-optics" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff2e7e" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>

          {/* Filtro de brilho óptico */}
          <filter id="sentinel-eye-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Crista Superior do Capacete (Ícone tradicional do Sentinel) */}
        <polygon points="36,8 64,8 68,18 32,18" fill="url(#sentinel-armor-accent)" />
        <polygon points="44,8 56,8 54,16 46,16" fill="#f5d0fe" opacity="0.6" />

        {/* 2. Placa Frontal / Testa */}
        <polygon points="30,20 70,20 76,34 24,34" fill="url(#sentinel-armor-primary)" />
        <line x1="30" y1="20" x2="70" y2="20" stroke="#f0abfc" strokeWidth="1" opacity="0.7" />

        {/* 3. Protetores Auriculares / Têmporas Angulares */}
        <polygon points="22,24 10,38 14,60 24,62 23,38" fill="url(#sentinel-armor-primary)" />
        <polygon points="12,40 14,56 21,58 19,40" fill="#3b0764" opacity="0.6" />

        <polygon points="78,24 90,38 86,60 76,62 77,38" fill="url(#sentinel-armor-primary)" />
        <polygon points="88,40 86,56 79,58 81,40" fill="#3b0764" opacity="0.6" />

        {/* 4. Base da Máscara / Chassi Facial */}
        <polygon
          points="24,34 76,34 74,68 50,94 26,68"
          fill="url(#sentinel-inner-face)"
          stroke="url(#sentinel-armor-primary)"
          strokeWidth="1.8"
        />

        {/* 5. Placas Angulares das Bochechas */}
        <polygon points="24,50 36,68 26,68" fill="url(#sentinel-armor-accent)" opacity="0.85" />
        <polygon points="76,50 64,68 74,68" fill="url(#sentinel-armor-accent)" opacity="0.85" />

        {/* 6. Ponte Central do Visor */}
        <polygon points="48,34 52,34 53,49 47,49" fill="#a855f7" />

        {/* 7. Olhos Cibernéticos do Sentinel (Visor Luminescente) */}
        {/* Olho Esquerdo */}
        <polygon
          points="30,42 45,43 43,49 32,48"
          fill="url(#sentinel-optics)"
          filter="url(#sentinel-eye-glow)"
        />
        {/* Olho Direito */}
        <polygon
          points="70,42 55,43 57,49 68,48"
          fill="url(#sentinel-optics)"
          filter="url(#sentinel-eye-glow)"
        />

        {/* 8. Grade do Respirador / Fendas Mecânicas */}
        <line x1="42" y1="58" x2="58" y2="58" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="43" y1="64" x2="57" y2="64" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="45" y1="70" x2="55" y2="70" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />

        {/* 9. Placa do Queixo em Formato de Escudo Tapered */}
        <polygon
          points="40,78 60,78 50,91"
          fill="url(#sentinel-armor-primary)"
          stroke="#e879f9"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}
