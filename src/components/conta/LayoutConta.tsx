'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingBag, Gift, User, MapPin, Shield,
} from 'lucide-react'
import { AvatarComArco } from '@/components/ui/AvatarComArco'
import { calcularNivel } from '@/lib/avatares'

const MENU_ITENS = [
  { href: '/minha-conta',           label: 'Dashboard', icone: LayoutDashboard, exact: true },
  { href: '/minha-conta/pedidos',   label: 'Pedidos',   icone: ShoppingBag },
  { href: '/minha-conta/cashback',  label: 'Cashback',  icone: Gift },
  { href: '/minha-conta/perfil',    label: 'Perfil',    icone: User },
  { href: '/minha-conta/enderecos', label: 'Endereços', icone: MapPin },
  { href: '/minha-conta/seguranca', label: 'Segurança', icone: Shield },
]

const GRADIENTES_MAP: Record<string, string> = {
  tiffany: 'linear-gradient(145deg, #0f2e2b, #3cbfb3)',
  blue:    'linear-gradient(145deg, #1e3a5f, #3b82f6)',
  purple:  'linear-gradient(145deg, #3b1f6b, #8b5cf6)',
  rose:    'linear-gradient(145deg, #6b1f3a, #f43f5e)',
  orange:  'linear-gradient(145deg, #6b3010, #f97316)',
  dark:    'linear-gradient(145deg, #111827, #374151)',
}

// ── Ícone SVG premium por nível ───────────────────────────────────────────────
function IconeNivel({ nivel, size = 40 }: { nivel: string; size?: number }) {
  const s = size * 0.55

  type NivelConfig = { bg: string; sombra: string; svg: React.ReactNode }
  const configs: Record<string, NivelConfig> = {
    Bronze: {
      bg: 'linear-gradient(145deg, #b45309 0%, #d97706 50%, #fbbf24 100%)',
      sombra: '0 4px 15px rgba(180,83,9,0.5)',
      svg: (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <path d="M16 2L28 7V17C28 23.627 22.627 29 16 29C9.373 29 4 23.627 4 17V7L16 2Z"
            fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
          <path d="M16 6L24 9.5V16.5C24 20.918 20.418 24.5 16 24.5C11.582 24.5 8 20.918 8 16.5V9.5L16 6Z"
            fill="rgba(255,255,255,0.15)"/>
          <text x="16" y="21" textAnchor="middle" fontSize="12" fontWeight="900"
            fill="rgba(255,255,255,0.95)" fontFamily="system-ui">B</text>
        </svg>
      ),
    },
    Prata: {
      bg: 'linear-gradient(145deg, #475569 0%, #94a3b8 50%, #cbd5e1 100%)',
      sombra: '0 4px 15px rgba(71,85,105,0.5)',
      svg: (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <path d="M16 2L27.856 8.5V21.5L16 28L4.144 21.5V8.5L16 2Z"
            fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
          <circle cx="16" cy="15" r="4" fill="rgba(255,255,255,0.35)"
            stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
          <text x="16" y="20" textAnchor="middle" fontSize="11" fontWeight="900"
            fill="rgba(255,255,255,0.95)" fontFamily="system-ui">P</text>
        </svg>
      ),
    },
    Ouro: {
      bg: 'linear-gradient(145deg, #92400e 0%, #d97706 30%, #fbbf24 60%, #fde68a 100%)',
      sombra: '0 4px 20px rgba(217,119,6,0.6), 0 0 30px rgba(251,191,36,0.3)',
      svg: (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <path d="M4 22H28L26 10L21 16L16 6L11 16L6 10L4 22Z"
            fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"
            strokeLinejoin="round"/>
          <circle cx="6" cy="10" r="2" fill="rgba(255,255,255,0.8)"/>
          <circle cx="16" cy="6" r="2.5" fill="rgba(255,255,255,0.9)"/>
          <circle cx="26" cy="10" r="2" fill="rgba(255,255,255,0.8)"/>
          <rect x="4" y="23" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.5)"/>
        </svg>
      ),
    },
    Diamante: {
      bg: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 40%, #60a5fa 70%, #bfdbfe 100%)',
      sombra: '0 4px 20px rgba(37,99,235,0.6), 0 0 40px rgba(96,165,250,0.3)',
      svg: (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <path d="M16 3L28 11L24 29H8L4 11L16 3Z"
            fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
          <path d="M4 11H28L24 29H8L4 11Z" fill="rgba(255,255,255,0.1)"/>
          <path d="M4 11L10 18M28 11L22 18M10 18H22M16 3L10 11M16 3L22 11"
            stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
          <path d="M14 10L16 7L18 10" fill="rgba(255,255,255,0.6)"/>
        </svg>
      ),
    },
    Black: {
      bg: 'linear-gradient(145deg, #0a0a0a 0%, #1f1f1f 40%, #3d3d3d 70%, #1f1f1f 100%)',
      sombra: '0 4px 20px rgba(0,0,0,0.8), 0 0 40px rgba(60,191,179,0.2)',
      svg: (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <polygon points="18,2 9,17 15,17 14,30 23,15 17,15"
            fill="#ffd700" stroke="rgba(255,215,0,0.5)" strokeWidth="0.5"/>
          <circle cx="16" cy="16" r="13" stroke="rgba(60,191,179,0.4)" strokeWidth="1" fill="none"/>
          <circle cx="16" cy="16" r="10" stroke="rgba(60,191,179,0.2)" strokeWidth="0.5" fill="none"/>
        </svg>
      ),
    },
  }

  const cfg = configs[nivel] ?? configs.Bronze

  return (
    <div
      className="flex items-center justify-center rounded-xl transition-transform hover:scale-110"
      style={{ width: size, height: size, background: cfg.bg, boxShadow: cfg.sombra, flexShrink: 0 }}
    >
      {cfg.svg}
    </div>
  )
}

// ── NivelCard ─────────────────────────────────────────────────────────────────
function NivelCard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nivel, setNivel] = useState<any>(null)
  const [totalGasto, setTotalGasto] = useState(0)

  useEffect(() => {
    fetch('/api/cashback')
      .then(r => r.json())
      .then(d => { setNivel(d.nivel); setTotalGasto(d.totalGasto || 0) })
      .catch(() => {})
  }, [])

  if (!nivel) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10"
        style={{ backgroundColor: nivel.cor }} />

      <div className="flex items-center gap-2.5 mb-3">
        <IconeNivel nivel={nivel.atual} size={36} />
        <div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Seu Nível</p>
          <p className="text-sm font-black" style={{ color: nivel.cor }}>{nivel.atual}</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>R$ {totalGasto.toLocaleString('pt-BR')}</span>
          {nivel.proximoNivel && (
            <span>R$ {(totalGasto + (nivel.faltam || 0)).toLocaleString('pt-BR')}</span>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${nivel.progressoPercent}%`, backgroundColor: nivel.cor }} />
        </div>
      </div>

      {nivel.proximoNivel ? (
        <p className="text-[10px] text-gray-500">
          Faltam <strong>R$ {(nivel.faltam || 0).toLocaleString('pt-BR')}</strong> para{' '}
          <span className="font-black">{nivel.proximoNivel}</span>
        </p>
      ) : (
        <p className="text-[10px] font-bold" style={{ color: nivel.cor }}>
          Nível máximo atingido! ⭐
        </p>
      )}
    </div>
  )
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function LayoutConta({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [perfil, setPerfil] = useState<any>(null)
  const [totalGasto, setTotalGasto] = useState(0)
  const [nivel, setNivel] = useState('Bronze')

  useEffect(() => {
    if (!session) return
    fetch('/api/conta/perfil')
      .then(r => r.json())
      .then(d => setPerfil(d.cliente ?? d))
      .catch(() => {})
    fetch('/api/cashback')
      .then(r => r.json())
      .then(d => {
        const gasto = d.totalGasto || 0
        setTotalGasto(gasto)
        setNivel(d.nivel?.atual || calcularNivel(gasto))
      })
      .catch(() => {})
  }, [session])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-64 shrink-0 space-y-3">

            {/* Card de perfil */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              {/* Header gradiente */}
              <div
                className="rounded-t-2xl px-5 pt-5 pb-14 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0b2220 0%, #0f2e2b 50%, #1a4f4a 100%)' }}
              >
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />
              </div>

              {/* Conteúdo — avatar overlap */}
              <div className="relative px-5 pb-5">
                <div className="flex justify-start -mt-8">
                  <AvatarComArco
                    nome={session?.user?.name || '?'}
                    avatarId={perfil?.avatar || 'inicial'}
                    nivel={nivel}
                    totalGasto={totalGasto}
                    size={56}
                    mostrarBadge={true}
                    mostrarTooltip={true}
                  />
                </div>
                <p className="font-black text-gray-900 text-sm leading-tight mt-2">
                  {session?.user?.name || 'Cliente'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>

            {/* Navegação */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
              {MENU_ITENS.map(item => {
                const ativo = isActive(item.href, item.exact)
                const Icon = item.icone
                return (
                  <Link key={item.href} href={item.href}
                    className={[
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
                      ativo
                        ? 'bg-[#3cbfb3]/10 text-[#3cbfb3]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                    ].join(' ')}>
                    <div className={[
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
                      ativo
                        ? 'bg-[#3cbfb3] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200',
                    ].join(' ')}>
                      <Icon size={15} strokeWidth={ativo ? 2.5 : 2} />
                    </div>
                    <span className={`text-sm flex-1 ${ativo ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    {ativo && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3cbfb3] shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Card de nível */}
            <NivelCard />
          </aside>

          {/* ── CONTEÚDO ── */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
