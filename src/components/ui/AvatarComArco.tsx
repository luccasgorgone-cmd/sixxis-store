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
  const iconSize = Math.max(10, Math.round(badgeSize * 0.68))

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: size,
        height: size,
      }}
      title={mostrarTooltip ? nivelAtual : undefined}
    >
      {/* Círculo do avatar — sem ring, sem border, sem outline */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
          fontSize: size * 0.38,
          fontWeight: 900,
          color: 'white',
          userSelect: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
          flexShrink: 0,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={nome}
            width={size}
            height={size}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

      {/* Badge do nível — SVG nítido */}
      {mostrarBadge && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            borderRadius: '50%',
            border: '2px solid white',
            backgroundColor: config.cor,
            boxShadow: `0 2px 8px ${config.corSombra}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: getNivelSVGString(nivelAtual, iconSize) }}
        />
      )}
    </div>
  )
}
