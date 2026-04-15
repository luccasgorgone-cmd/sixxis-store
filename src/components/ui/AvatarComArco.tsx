'use client'

import { useMemo } from 'react'
import { NIVEIS_CONFIG, calcularNivel, getAvatarUrl, getAvatarBgColor, getInitialBgColor } from '@/lib/avatares'

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
  nome,
  avatarId,
  nivel,
  totalGasto = 0,
  size = 48,
  mostrarBadge = true,
  mostrarTooltip = false,
  className = '',
}: AvatarComArcoProps) {
  const nivelAtual = useMemo(() => {
    if (nivel) return nivel
    return calcularNivel(totalGasto)
  }, [nivel, totalGasto])

  const config = NIVEIS_CONFIG[nivelAtual] || NIVEIS_CONFIG.Cristal

  const avatarUrl = getAvatarUrl(avatarId || 'inicial')
  const bgColor = avatarId && avatarId !== 'inicial'
    ? getAvatarBgColor(avatarId)
    : getInitialBgColor(nome)
  const inicial = nome?.[0]?.toUpperCase() || '?'

  const badgeSize = Math.max(18, Math.round(size * 0.40))
  const badgeFontSize = Math.max(10, Math.round(badgeSize * 0.62))

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={mostrarTooltip ? `${nivelAtual} · R$ ${totalGasto.toLocaleString('pt-BR')}` : undefined}
    >
      {/* ── AVATAR CIRCLE (sem ring) ── */}
      <div
        className="rounded-full overflow-hidden flex items-center justify-center font-black text-white select-none w-full h-full"
        style={{
          backgroundColor: bgColor,
          boxShadow: `0 2px 10px rgba(0,0,0,0.20)`,
          fontSize: size * 0.38,
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
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.style.fontSize = `${size * 0.38}px`
                parent.textContent = inicial
              }
            }}
          />
        ) : (
          <span style={{ lineHeight: 1 }}>{inicial}</span>
        )}
      </div>

      {/* ── BADGE DO NÍVEL (inferior direito) ── */}
      {mostrarBadge && (
        <div
          className="absolute flex items-center justify-center rounded-full border-2 border-white select-none"
          style={{
            width: badgeSize,
            height: badgeSize,
            fontSize: badgeFontSize,
            lineHeight: 1,
            bottom: -2,
            right: -2,
            backgroundColor: config.cor,
            boxShadow: `0 2px 8px ${config.corSombra}`,
          }}
          title={nivelAtual}
        >
          <span style={{ lineHeight: 1 }}>{config.emoji}</span>
        </div>
      )}
    </div>
  )
}
