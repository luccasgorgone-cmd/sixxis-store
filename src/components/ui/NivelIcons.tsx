'use client'

// ════════════════════════════════════════════════════════════
// SIXXIS — Ícones de gema por nível de fidelidade
// Cristal · Topázio · Safira · Diamante · Esmeralda
//
// Esta camada é apenas um wrapper de compatibilidade — o SVG e as cores
// canônicas vivem em `src/lib/loyalty.ts` (que reexporta de `avatares.ts`).
// Isso garante que admin e cliente vejam o mesmo ícone.
// ════════════════════════════════════════════════════════════

import NivelLoyaltyIcon from '@/components/loyalty/NivelLoyaltyIcon'
import { nivelPorId } from '@/lib/loyalty'

export function IconeNivel({ nivel, size = 40 }: { nivel: string; size?: number }) {
  return <NivelLoyaltyIcon nivel={nivel} size={size} />
}

export function BadgeNivel({ nivel, className = '' }: { nivel: string; className?: string }) {
  const cfg = nivelPorId(nivel)
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black text-white ${className}`}
      style={{
        background: cfg.corBanner,
        boxShadow:  `0 4px 16px ${cfg.cor}55, 0 0 24px ${cfg.cor}25`,
      }}
    >
      <span>{cfg.emoji}</span>
      {cfg.nome}
    </span>
  )
}
