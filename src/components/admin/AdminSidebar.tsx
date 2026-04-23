'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard, Package, ShoppingBag, Settings,
  LogOut, Image as ImageIcon, Tag, Star,
  LayoutTemplate, Mail, X, BarChart2, Users,
  Smartphone, Home, ExternalLink, ShieldOff,
  Target, MessageSquare, Clock, Bot, UserCog,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { A } from '@/lib/admin-tokens'

const NAV_GROUPS = [
  {
    label: 'Visão Geral',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/admin/produtos', label: 'Produtos', icon: Package, exact: false },
    ],
  },
  {
    label: 'Vendas',
    items: [
      { href: '/admin/pedidos',   label: 'Pedidos',        icon: ShoppingBag, exact: false },
      { href: '/admin/cupons',    label: 'Cupons',         icon: Tag,         exact: false },
      { href: '/admin/clientes',  label: 'Clientes',       icon: Users,       exact: false },
      { href: '/admin/bloqueios', label: 'Bloqueios',      icon: ShieldOff,   exact: false },
    ],
  },
  {
    label: 'Fidelidade',
    items: [
      { href: '/admin/avaliacoes', label: 'Avaliações', icon: Star, exact: false },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/campanhas',              label: 'Campanhas', icon: Target,        exact: false },
      { href: '/admin/emails',                 label: 'E-mails',   icon: Mail,          exact: false },
      { href: '/admin/configuracoes/whatsapp', label: 'WhatsApp',  icon: MessageSquare, exact: false },
      { href: '/admin/luna',                   label: 'Luna',      icon: Bot,           exact: false },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/admin/editor-home',        label: 'Editor da Home',     icon: Home,       exact: false },
      { href: '/admin/mobile',             label: 'Editor Mobile',      icon: Smartphone, exact: false },
      { href: '/admin/banners',            label: 'Banners',            icon: ImageIcon,  exact: false },
      { href: '/admin/minha-conta-editor', label: 'Minha Conta Editor', icon: UserCog,    exact: false },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { href: '/admin/analytics',          label: 'Analytics',             icon: BarChart2, exact: false },
      { href: '/admin/vendas-horario',     label: 'Horários de Venda',     icon: Clock,     exact: false },
      { href: '/admin/configuracoes-loja', label: 'Configurações da Loja', icon: Settings,  exact: false },
      { href: '/admin/configuracoes',      label: 'Configurações Gerais',  icon: Settings,  exact: false },
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

      <aside
        className={`
          w-64 shrink-0 flex flex-col h-full
          fixed lg:static top-0 left-0 z-50
          transition-transform duration-300 lg:transition-none
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ backgroundColor: A.sidebarBg }}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: A.sidebarBorder }}>
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
        <nav className="flex-1 overflow-y-auto py-3 px-2" style={{ scrollbarWidth: 'none' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 mb-0.5"
                style={{ color: A.sidebarLabel, letterSpacing: '0.1em' }}
              >
                {group.label}
              </p>
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group"
                    style={{
                      color:           active ? A.sidebarActiveText : A.sidebarText,
                      backgroundColor: active ? A.sidebarActiveBg : undefined,
                      fontWeight:      active ? 600 : 400,
                    }}
                  >
                    {/* Squared icon container */}
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                      style={{
                        backgroundColor: active ? A.sidebarIconActive : A.sidebarIconBg,
                      }}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="flex-1 truncate">{label}</span>
                    {/* Active dot */}
                    {active && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: A.tiffany }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 border-t pt-3" style={{ borderColor: A.sidebarBorder }}>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition hover:bg-white/8 mb-1"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: A.sidebarIconBg }}
            >
              <ExternalLink size={13} />
            </span>
            Ver site
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition hover:bg-red-500/10 disabled:opacity-50"
            style={{ color: 'rgba(255,255,255,0.38)' }}
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: A.sidebarIconBg }}
            >
              <LogOut size={13} />
            </span>
            {loggingOut ? 'Saindo...' : 'Sair'}
          </button>
          <p className="text-center text-[10px] mt-3" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Admin v2.1
          </p>
        </div>
      </aside>
    </>
  )
}
