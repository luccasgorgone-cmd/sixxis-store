'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3x3, ShoppingCart, User } from 'lucide-react'
import { useTotalItens, useCarrinho } from '@/hooks/useCarrinho'

interface NavItem {
  href: string
  icon: typeof Home
  label: string
  match: (p: string) => boolean
  abreCarrinhoDrawer?: boolean
}

const items: NavItem[] = [
  { href: '/',           icon: Home,        label: 'Início',     match: (p) => p === '/' },
  { href: '/produtos',   icon: Grid3x3,     label: 'Categorias', match: (p) => p.startsWith('/produtos') },
  { href: '/carrinho',   icon: ShoppingCart, label: 'Carrinho',  match: (p) => p.startsWith('/carrinho'), abreCarrinhoDrawer: true },
  { href: '/minha-conta', icon: User,       label: 'Conta',      match: (p) => p.startsWith('/minha-conta') || p === '/login' || p === '/cadastro' },
]

// Bottom nav fixa em mobile (md:hidden) — 4 ícones com badge no carrinho.
// Padrão do Mercado Livre / Magalu / Casas Bahia.
// Esconde em /checkout para concentrar atenção no fluxo de compra.
export default function BottomNavMobile() {
  const pathname = usePathname() ?? ''
  const totalItens = useTotalItens()
  const setDrawerAberto = useCarrinho((s) => s.setDrawerAberto)

  if (pathname.startsWith('/checkout')) return null
  if (pathname.startsWith('/adm-a7f9c2b4')) return null

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="grid grid-cols-4 h-14">
        {items.map((item) => {
          const Icon = item.icon
          const ativo = item.match(pathname)
          const colorClasses = ativo
            ? 'text-[#3cbfb3]'
            : 'text-gray-600 active:bg-gray-50'

          // O "Carrinho" abre o drawer em vez de navegar (mais fluido em mobile).
          if (item.abreCarrinhoDrawer) {
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => setDrawerAberto(true)}
                  className={`relative w-full h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${colorClasses}`}
                  aria-label="Abrir carrinho"
                  aria-current={ativo ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" strokeWidth={ativo ? 2.5 : 2} />
                  {totalItens > 0 && (
                    <span className="absolute top-1 right-[calc(50%-22px)] bg-[#3cbfb3] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                      {totalItens > 9 ? '9+' : totalItens}
                    </span>
                  )}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              </li>
            )
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative w-full h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${colorClasses}`}
                aria-current={ativo ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" strokeWidth={ativo ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
