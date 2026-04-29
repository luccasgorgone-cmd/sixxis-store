'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingBag, Gift, User, MapPin, Shield, ShieldCheck,
} from 'lucide-react'
import { AvatarComArco } from '@/components/ui/AvatarComArco'
import { IconeNivel } from '@/components/ui/NivelIcons'
import { calcularNivel, NIVEIS_CONFIG, getNivelSVGString, normalizarNivel } from '@/lib/avatares'

const MENU_ITENS = [
  { href: '/minha-conta',           label: 'Dashboard', icone: LayoutDashboard, exact: true },
  { href: '/minha-conta/pedidos',   label: 'Pedidos',   icone: ShoppingBag },
  { href: '/minha-conta/cashback',  label: 'Cashback',  icone: Gift },
  { href: '/minha-conta/garantias', label: 'Garantias', icone: ShieldCheck },
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
  const [nivel, setNivel] = useState('Cristal')

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

        {/* Abas horizontais scrolláveis — mobile only */}
        <nav className="flex lg:hidden overflow-x-auto gap-0.5 pb-3 mb-4 border-b border-gray-200 hide-scrollbar">
          {MENU_ITENS.map(item => {
            const ativo = isActive(item.href, item.exact)
            const Icon = item.icone
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  ativo
                    ? 'bg-[#3cbfb3] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={13} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-64 shrink-0 space-y-3">

            {/* Card de perfil */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              {/* Header — cor dinâmica do nível */}
              {(() => {
                const nivelNorm = normalizarNivel(nivel || 'Cristal')
                const cfgNivel = NIVEIS_CONFIG[nivelNorm] || NIVEIS_CONFIG.Cristal
                return (
                  <div
                    className="rounded-t-2xl px-4 pt-4 pb-12 relative overflow-hidden"
                    style={{ background: cfgNivel.corBanner }}
                  >
                    <div className="absolute inset-0 opacity-[0.07]"
                      style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                      }}
                    />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-[9px] font-black uppercase tracking-widest">Seu nível</p>
                        <p className="text-white font-black text-sm leading-tight mt-0.5">{cfgNivel.label}</p>
                      </div>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${cfgNivel.cor}30`,
                          border: `1.5px solid ${cfgNivel.cor}55`,
                        }}
                        dangerouslySetInnerHTML={{ __html: getNivelSVGString(nivelNorm, 20) }}
                      />
                    </div>
                  </div>
                )
              })()}

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

            {/* Navegação — só desktop (mobile usa abas acima) */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
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
