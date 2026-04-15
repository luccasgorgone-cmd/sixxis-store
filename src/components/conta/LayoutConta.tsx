'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, ShoppingBag, Coins, MapPin, Lock, LayoutDashboard } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

const MENU = [
  { href: '/minha-conta',           label: 'Dashboard',  icon: LayoutDashboard, exact: true  },
  { href: '/minha-conta/pedidos',   label: 'Pedidos',    icon: ShoppingBag,     exact: false },
  { href: '/minha-conta/cashback',  label: 'Cashback',   icon: Coins,           exact: false },
  { href: '/minha-conta/perfil',    label: 'Perfil',     icon: User,            exact: false },
  { href: '/minha-conta/enderecos', label: 'Endereços',  icon: MapPin,          exact: false },
  { href: '/minha-conta/seguranca', label: 'Segurança',  icon: Lock,            exact: false },
]

const BREADCRUMB_LABELS: Record<string, string> = {
  '/minha-conta':           'Dashboard',
  '/minha-conta/pedidos':   'Pedidos',
  '/minha-conta/cashback':  'Cashback',
  '/minha-conta/perfil':    'Perfil',
  '/minha-conta/enderecos': 'Endereços',
  '/minha-conta/seguranca': 'Segurança',
}

export default function LayoutConta({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  }

  const subLabel = BREADCRUMB_LABELS[pathname] ?? 'Minha Conta'
  const breadcrumbItems = pathname === '/minha-conta'
    ? [{ label: 'Início', href: '/' }, { label: 'Minha Conta' }]
    : [{ label: 'Início', href: '/' }, { label: 'Minha Conta', href: '/minha-conta' }, { label: subLabel }]

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Minha Conta</p>
              </div>
              {MENU.map(item => {
                const Icon    = item.icon
                const active  = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                      active
                        ? 'bg-[#f0fffe] text-[#3cbfb3] font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-[#3cbfb3]' : 'text-gray-400'} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
