'use client'

// ════════════════════════════════════════════════════════════
// SIXXIS — Ícones de gema por nível de fidelidade
// Cristal · Topázio · Safira · Diamante · Esmeralda
// ════════════════════════════════════════════════════════════

function CristalSVG({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      {/* Hexagonal crystal shape */}
      <polygon points="16,2 27,8 27,20 16,26 5,20 5,8"
        fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4" />
      <polygon points="16,6 23,10 23,18 16,22 9,18 9,10"
        fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
      {/* Inner light refraction */}
      <line x1="16" y1="2" x2="16" y2="26" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7"/>
      <line x1="5" y1="8" x2="27" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6"/>
      <line x1="27" y1="8" x2="5" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6"/>
      {/* Sparkle top */}
      <circle cx="16" cy="2" r="1.5" fill="rgba(255,255,255,0.9)"/>
    </svg>
  )
}

function TopazioSVG({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      {/* Oval topaz */}
      <ellipse cx="16" cy="15" rx="11" ry="13"
        fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4"/>
      {/* Table facet */}
      <ellipse cx="16" cy="13" rx="6" ry="7"
        fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
      {/* Culet lines */}
      <line x1="10" y1="28" x2="16" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
      <line x1="22" y1="28" x2="16" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
      <line x1="5" y1="15" x2="10" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6"/>
      <line x1="27" y1="15" x2="22" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6"/>
      {/* Crown sparkle */}
      <circle cx="16" cy="2.5" r="1.4" fill="rgba(255,255,255,0.9)"/>
    </svg>
  )
}

function SafiraSVG({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      {/* Oval brilliant-cut sapphire */}
      <ellipse cx="16" cy="15" rx="12" ry="13"
        fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5"/>
      {/* Star-cut table */}
      <polygon points="16,5 20,11 27,11 22,16 24,23 16,19 8,23 10,16 5,11 12,11"
        fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
      {/* Girdle lines */}
      <ellipse cx="16" cy="15" rx="12" ry="4"
        fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6"/>
      <circle cx="16" cy="3" r="1.5" fill="rgba(255,255,255,0.95)"/>
    </svg>
  )
}

function DiamanteGemSVG({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      {/* Brilliant-cut diamond — round */}
      <circle cx="16" cy="15" r="13"
        fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4"/>
      {/* Table octagon */}
      <polygon points="16,5 21,7 25,11 27,16 25,21 21,25 16,27 11,25 7,21 5,16 7,11 11,7"
        fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8"/>
      {/* Star facets */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 16 + Math.cos(rad) * 7
        const y1 = 15 + Math.sin(rad) * 7
        return <line key={i} x1="16" y1="15" x2={x1} y2={y1}
          stroke="rgba(255,255,255,0.3)" strokeWidth="0.6"/>
      })}
      <circle cx="16" cy="3" r="1.5" fill="rgba(255,255,255,0.95)"/>
    </svg>
  )
}

function EsmeraldaSVG({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      {/* Octagonal emerald cut */}
      <polygon points="10,2 22,2 28,8 28,22 22,28 10,28 4,22 4,8"
        fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
      {/* Step-cut inner lines */}
      <polygon points="12,6 20,6 24,10 24,20 20,24 12,24 8,20 8,10"
        fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.9"/>
      <polygon points="13,9 19,9 22,12 22,18 19,21 13,21 10,18 10,12"
        fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7"/>
      {/* Horizontal step lines */}
      <line x1="8" y1="15" x2="24" y2="15" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6"/>
      <line x1="4" y1="12" x2="28" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      <line x1="4" y1="18" x2="28" y2="18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      <circle cx="16" cy="2" r="1.5" fill="rgba(255,255,255,0.95)"/>
    </svg>
  )
}

// ── Gradiente e sombra por nível ──────────────────────────────────────────────
const NIVEL_BADGE_CONFIG: Record<string, { bg: string; sombra: string }> = {
  Cristal: {
    bg: 'linear-gradient(145deg, #0ea5e9 0%, #38bdf8 50%, #bae6fd 100%)',
    sombra: '0 4px 16px rgba(14,165,233,0.55), 0 0 24px rgba(56,189,248,0.25)',
  },
  Topázio: {
    bg: 'linear-gradient(145deg, #b45309 0%, #f59e0b 45%, #fde68a 100%)',
    sombra: '0 4px 16px rgba(180,83,9,0.5), 0 0 24px rgba(245,158,11,0.3)',
  },
  Safira: {
    bg: 'linear-gradient(145deg, #1d4ed8 0%, #2563eb 45%, #60a5fa 100%)',
    sombra: '0 4px 20px rgba(29,78,216,0.6), 0 0 32px rgba(96,165,250,0.25)',
  },
  Diamante: {
    bg: 'linear-gradient(145deg, #4338ca 0%, #818cf8 50%, #e0e7ff 100%)',
    sombra: '0 4px 20px rgba(67,56,202,0.6), 0 0 36px rgba(129,140,248,0.3)',
  },
  Esmeralda: {
    bg: 'linear-gradient(145deg, #047857 0%, #10b981 45%, #6ee7b7 100%)',
    sombra: '0 4px 20px rgba(4,120,87,0.65), 0 0 36px rgba(16,185,129,0.3)',
  },
}

// ── IconeNivel — caixa com gema SVG ─────────────────────────────────────────
export function IconeNivel({ nivel, size = 40 }: { nivel: string; size?: number }) {
  const s = size * 0.58
  const cfg = NIVEL_BADGE_CONFIG[nivel] ?? NIVEL_BADGE_CONFIG.Cristal
  const Gem = {
    Cristal:   CristalSVG,
    Topázio:   TopazioSVG,
    Safira:    SafiraSVG,
    Diamante:  DiamanteGemSVG,
    Esmeralda: EsmeraldaSVG,
  }[nivel] ?? CristalSVG

  return (
    <div
      className="flex items-center justify-center rounded-xl transition-transform hover:scale-110"
      style={{ width: size, height: size, background: cfg.bg, boxShadow: cfg.sombra, flexShrink: 0 }}
    >
      <Gem s={s} />
    </div>
  )
}

// ── BadgeNivel — pill compacto ────────────────────────────────────────────────
export function BadgeNivel({ nivel, className = '' }: { nivel: string; className?: string }) {
  const cfg = NIVEL_BADGE_CONFIG[nivel] ?? NIVEL_BADGE_CONFIG.Cristal
  const emojis: Record<string, string> = {
    Cristal: '🔷', Topázio: '🟡', Safira: '💙', Diamante: '💎', Esmeralda: '💚',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black text-white ${className}`}
      style={{ background: cfg.bg, boxShadow: cfg.sombra }}
    >
      <span>{emojis[nivel] ?? '🔷'}</span>
      {nivel}
    </span>
  )
}
