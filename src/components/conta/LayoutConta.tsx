'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingBag, Gift, User, MapPin, Shield,
} from 'lucide-react'

const MENU_ITENS = [
  { href: '/minha-conta',           label: 'Dashboard', icone: LayoutDashboard, exact: true },
  { href: '/minha-conta/pedidos',   label: 'Pedidos',   icone: ShoppingBag },
  { href: '/minha-conta/cashback',  label: 'Cashback',  icone: Gift },
  { href: '/minha-conta/perfil',    label: 'Perfil',    icone: User },
  { href: '/minha-conta/enderecos', label: 'Endereços', icone: MapPin },
  { href: '/minha-conta/seguranca', label: 'Segurança', icone: Shield },
]

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

  const ICONES_NIVEL: Record<string, string> = {
    Bronze: '🥉', Prata: '🥈', Ouro: '🥇', Diamante: '💎', Black: '⬛',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10"
        style={{ backgroundColor: nivel.cor }} />

      <div className="flex items-center gap-2.5 mb-3">
        <div className="text-2xl">{ICONES_NIVEL[nivel.atual] || '🏅'}</div>
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

export default function LayoutConta({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const inicial = session?.user?.name?.[0]?.toUpperCase() || '?'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-64 shrink-0 space-y-3">

            {/* Card de perfil */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-16 relative"
                style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 50%, #3cbfb3 100%)' }}>
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                  }} />
              </div>
              <div className="px-5 pb-5 -mt-8">
                <div
                  className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg
                             flex items-center justify-center font-black text-2xl mb-3"
                  style={{ background: 'linear-gradient(135deg, #0f2e2b, #3cbfb3)', color: 'white' }}
                >
                  {inicial}
                </div>
                <p className="font-black text-gray-900 text-sm leading-tight">
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
