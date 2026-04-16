'use client'

import { useMemo } from 'react'
import {
  NIVEIS_CONFIG, calcularNivel, normalizarNivel,
  getAvatarUrl, getAvatarBgColor, getInitialBgColor,
  getNivelSVGString,
} from '@/lib/avatares'

interface AvatarComArcoProps {
  nome: string
  avatarId?: string | null
  nivel?: string
  totalGasto?: number
  size?: number
  mostrarBadge?: boolean
  mostrarTooltip?: boolean
  className?: string
}

export function AvatarComArco({
  nome, avatarId, nivel, totalGasto = 0,
  size = 48, mostrarBadge = true,
  mostrarTooltip = false, className = '',
}: AvatarComArcoProps) {
  const nivelAtual = useMemo(() =>
    normalizarNivel(nivel || calcularNivel(totalGasto))
  , [nivel, totalGasto])

  const config = NIVEIS_CONFIG[nivelAtual] || NIVEIS_CONFIG.Cristal
  const avatarUrl = getAvatarUrl(avatarId || 'inicial')
  const bgColor = (avatarId && avatarId !== 'inicial')
    ? getAvatarBgColor(avatarId)
    : getInitialBgColor(nome)
  const inicial = (nome?.[0] || '?').toUpperCase()
  const badgeSize = Math.max(18, Math.round(size * 0.40))
  const badgeIconSize = Math.max(10, Math.round(badgeSize * 0.68))

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={mostrarTooltip ? nivelAtual : undefined}
    >
      <div
        className="rounded-full overflow-hidden flex items-center justify-center
                   font-black text-white select-none w-full h-full"
        style={{
          backgroundColor: bgColor,
          fontSize: size * 0.38,
          boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={nome}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              const t = e.currentTarget
              t.style.display = 'none'
              const p = t.parentElement
              if (p) { p.textContent = inicial }
            }}
          />
        ) : (
          <span style={{ lineHeight: 1 }}>{inicial}</span>
        )}
      </div>

      {mostrarBadge && (
        <div
          className="absolute flex items-center justify-center rounded-full border-2 border-white"
          style={{
            width: badgeSize,
            height: badgeSize,
            bottom: -2,
            right: -2,
            backgroundColor: config.cor,
            boxShadow: `0 2px 8px ${config.corSombra}`,
          }}
          dangerouslySetInnerHTML={{
            __html: getNivelSVGString(nivelAtual, badgeIconSize),
          }}
        />
      )}
    </div>
  )
}
