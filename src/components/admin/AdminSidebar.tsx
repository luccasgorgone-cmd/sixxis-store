'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Image as ImageIcon, Tag, Star, Trophy, LayoutTemplate } from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { href: '/admin',               label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/admin/produtos',      label: 'Produtos',     icon: Package,         exact: false },
  { href: '/admin/pedidos',       label: 'Pedidos',      icon: ShoppingCart,    exact: false },
  { href: '/admin/editor-home',    label: 'Editor da Home', icon: LayoutTemplate,  exact: false },
  { href: '/admin/banners',       label: 'Banners',      icon: ImageIcon,       exact: false },
  { href: '/admin/cupons',        label: 'Cupons',       icon: Tag,             exact: false },
  { href: '/admin/avaliacoes',    label: 'Avaliações',   icon: Star,            exact: false },
  { href: '/admin/fidelidade',    label: 'Fidelidade',   icon: Trophy,          exact: false },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings,       exact: false },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoUrl, setLogoUrl] = useState('/logo-sixxis.png')

  useEffect(() => {
    fetch('/api/admin/configuracoes')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data?.logo_url) setLogoUrl(data.logo_url)
      })
      .catch(() => {})
  }, [])

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  }

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <aside className="w-60 shrink-0 bg-[#111827] flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/admin" className="block">
          <Image
            src={logoUrl}
            alt="Sixxis"
            width={130}
            height={44}
            className="object-contain brightness-0 invert"
            unoptimized
          />
        </Link>
        <p className="text-white/30 text-xs mt-2 uppercase tracking-widest">Admin</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-[#3cbfb3]/20 text-[#3cbfb3] border-l-2 border-[#3cbfb3]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          {loggingOut ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </aside>
  )
}
