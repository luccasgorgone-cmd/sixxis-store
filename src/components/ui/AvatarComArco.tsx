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

  const config = NIVEIS_CONFIG[nivelAtual] || NIVEIS_CONFIG.Bronze

  // Arco SVG: 300° activo, gap de 60° na parte inferior
  const padding = 5
  const totalSize = size + padding * 2
  const cx = totalSize / 2
  const cy = totalSize / 2
  const r  = totalSize / 2 - config.espessura / 2 - 1
  const circ = 2 * Math.PI * r
  const arcoAtivo = circ * (300 / 360)
  const arcoGap   = circ - arcoAtivo
  const gradId = `arcgrad-${nivelAtual}-${size}`

  // Avatar: URL externa ou inicial
  const avatarUrl = getAvatarUrl(avatarId || 'inicial')
  const bgColor = avatarId && avatarId !== 'inicial'
    ? getAvatarBgColor(avatarId)
    : getInitialBgColor(nome)
  const inicial = nome?.[0]?.toUpperCase() || '?'

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: totalSize, height: totalSize }}
      title={mostrarTooltip ? `${nivelAtual} · R$ ${totalGasto.toLocaleString('pt-BR')}` : undefined}
    >
      {/* ── SVG DO ARCO ── */}
      <svg
        width={totalSize} height={totalSize}
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={config.cor} />
            <stop offset="100%" stopColor={config.corSec} />
          </linearGradient>
        </defs>

        {/* Trilha base (cinza) */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={config.espessura - 0.5}
          strokeDasharray={`${arcoAtivo} ${arcoGap}`}
          strokeLinecap="round"
          transform={`rotate(120 ${cx} ${cy})`}
        />

        {/* Arco colorido do nível */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={config.espessura}
          strokeDasharray={`${arcoAtivo} ${arcoGap}`}
          strokeLinecap="round"
          transform={`rotate(120 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 ${config.espessura + 1}px ${config.cor})` }}
        />
      </svg>

      {/* ── AVATAR CIRCLE ── */}
      <div
        className="rounded-full overflow-hidden flex items-center justify-center font-black text-white select-none"
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          boxShadow: `0 2px 10px ${config.corSombra}`,
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
          className="absolute flex items-center justify-center rounded-full border-2 border-white font-bold select-none leading-none"
          style={{
            width:  Math.max(14, size * 0.33),
            height: Math.max(14, size * 0.33),
            fontSize: Math.max(7, size * 0.16),
            bottom: padding - 2,
            right:  padding - 2,
            backgroundColor: config.cor,
            boxShadow: `0 1px 4px ${config.corSombra}`,
          }}
          title={nivelAtual}
        >
          {config.emoji}
        </div>
      )}
    </div>
  )
}
