'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard, Package, ShoppingBag, Settings, LogOut,
  Image as ImageIcon, Tag, Star, Trophy, LayoutTemplate, Mail,
  X, BarChart2, Users, Smartphone, Home, Gift, ExternalLink, Handshake, ShieldOff,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV_GROUPS = [
  {
    label: 'Loja',
    items: [
      { href: '/admin',          label: 'Dashboard', icon: LayoutDashboard, exact: true  },
      { href: '/admin/produtos', label: 'Produtos',  icon: Package,         exact: false },
      { href: '/admin/pedidos',  label: 'Pedidos',   icon: ShoppingBag,     exact: false },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/admin/editor-home', label: 'Editor da Home',  icon: Home,         exact: false },
      { href: '/admin/mobile',      label: 'Editor Mobile',   icon: Smartphone,   exact: false },
      { href: '/admin/banners',     label: 'Banners',         icon: ImageIcon,    exact: false },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { href: '/admin/clientes',            label: 'Clientes',        icon: Users,     exact: false },
      { href: '/admin/bloqueios',           label: 'Bloqueios',       icon: ShieldOff, exact: false },
      { href: '/admin/cupons',              label: 'Cupons',          icon: Tag,       exact: false },
      { href: '/admin/avaliacoes',          label: 'Avaliações',      icon: Star,      exact: false },
      { href: '/admin/avaliacoes-parceiros',label: 'Aval. Parceiros', icon: Handshake, exact: false },
      { href: '/admin/fidelidade',          label: 'Fidelidade',      icon: Gift,      exact: false },
      { href: '/admin/emails',              label: 'E-mails',         icon: Mail,      exact: false },
    ],
  },
  {
    label: 'Dados',
    items: [
      { href: '/admin/analytics',     label: 'Analytics',      icon: BarChart2, exact: false },
      { href: '/admin/configuracoes', label: 'Configurações',  icon: Settings,  exact: false },
    ],
  },
]

interface Props {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: Props) {
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

  // Fecha o drawer mobile ao navegar
  useEffect(() => {
    onMobileClose?.()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  }

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar
          - Mobile: fixed, desliza da esquerda com overlay
          - Desktop (lg+): static, parte do flex layout normal
      */}
      <aside
        className={`
          w-64 shrink-0 flex flex-col h-full
          fixed lg:static top-0 left-0 z-50
          transition-transform duration-300 lg:transition-none
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ backgroundColor: '#0f2e2b' }}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Link href="/admin" className="block">
            <Image
              src={logoUrl}
              alt="Sixxis"
              width={110}
              height={36}
              className="object-contain"
              unoptimized
            />
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label="Fechar menu"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest px-5 py-2 mt-2"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                {group.label}
              </p>
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? 'font-semibold'
                        : 'hover:bg-white/8'
                    }`}
                    style={{
                      color: active ? '#3cbfb3' : 'rgba(255,255,255,0.6)',
                      backgroundColor: active ? 'rgba(60,191,179,0.15)' : undefined,
                    }}
                  >
                    <Icon className="shrink-0" size={16} />
                    {label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 mx-0 px-3 py-2 rounded-xl text-xs font-medium transition hover:bg-white/8 mb-1"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            <ExternalLink size={14} className="shrink-0" />
            Ver site
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition hover:bg-red-500/10 disabled:opacity-50"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <LogOut size={14} className="shrink-0" />
            {loggingOut ? 'Saindo...' : 'Sair'}
          </button>
          <p className="text-center text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Admin v2.0
          </p>
        </div>
      </aside>
    </>
  )
}
