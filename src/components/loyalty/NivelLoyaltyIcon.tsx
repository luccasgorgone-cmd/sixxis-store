'use client'

import { nivelPorId, svgIconeNivel } from '@/lib/loyalty'

interface Props {
  nivel:      string
  size?:      number
  showLabel?: boolean
  className?: string
}

// Ícone unificado de nível — mesmo asset/cor em /adm-a7f9c2b4/clientes e
// /minha-conta. Layout: caixa colorida (gradiente do nível) + SVG da gema.
export default function NivelLoyaltyIcon({
  nivel,
  size = 32,
  showLabel = false,
  className = '',
}: Props) {
  const cfg = nivelPorId(nivel)
  const inner = Math.round(size * 0.58)
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className="flex items-center justify-center rounded-xl transition-transform hover:scale-110"
        style={{
          width:        size,
          height:       size,
          background:   cfg.corBanner,
          boxShadow:    `0 4px 16px ${cfg.cor}55, 0 0 24px ${cfg.cor}25`,
          flexShrink:   0,
        }}
        dangerouslySetInnerHTML={{ __html: svgIconeNivel(cfg.id, inner) }}
      />
      {showLabel && (
        <span className="text-sm font-bold" style={{ color: cfg.cor }}>
          {cfg.nome}
        </span>
      )}
    </div>
  )
}
