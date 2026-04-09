'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart, Menu, X, User, UserPlus,
  Wind, Fan, Bike, Tag, Info, Phone, HelpCircle,
  Clock, Mail,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useCarrinho } from '@/hooks/useCarrinho'
import SearchBar from './SearchBar'

// ── WhatsApp icon ─────────────────────────────────────────────────────────────
function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.882a.5.5 0 0 0 .606.596l6.187-1.422A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.014-1.374l-.36-.213-3.724.856.896-3.62-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.567 6.567 2.182 12 2.182c5.433 0 9.818 4.385 9.818 9.818 0 5.432-4.385 9.818-9.818 9.818z"/>
    </svg>
  )
}

// ── PART A: AnnouncementBar — NOT sticky, scrolls away ───────────────────────
function AnnouncementBar({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % items.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [items.length])

  return (
    <div
      className="py-2.5 text-sm font-semibold text-center overflow-hidden"
      style={{
        backgroundColor: 'var(--color-anuncio-fundo, #0f2e2b)',
        color: 'var(--color-anuncio-texto, #ffffff)',
      }}
    >
      <span
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          display: 'inline-block',
        }}
      >
        {items[index]}
      </span>
    </div>
  )
}

// ── Nav links (sem Peças) ─────────────────────────────────────────────────────
const navLinks = [
  { href: '/produtos?categoria=climatizadores', label: 'Climatizadores', icon: Wind,        destaque: false },
  { href: '/produtos?categoria=aspiradores',    label: 'Aspiradores',    icon: Fan,         destaque: false },
  { href: '/produtos?categoria=spinning',       label: 'Spinning',       icon: Bike,        destaque: false },
  { href: '/ofertas',                           label: 'Ofertas',        icon: Tag,         destaque: true  },
  { href: '/sobre',                             label: 'Sobre',          icon: Info,        destaque: false },
  { href: '/contato',                           label: 'Contato',        icon: Phone,       destaque: false },
  { href: '/faq',                               label: 'FAQ',            icon: HelpCircle,  destaque: false },
]

const DEFAULT_ANUNCIOS = [
  '🚚 Frete GRÁTIS acima de R$ 500 para todo o Brasil',
  '💳 Parcele em até 6x SEM JUROS no cartão',
  '📞 Atendimento: (18) 99747-4701 | Seg-Sex 8h às 18h',
]

export default function Header({
  logoUrl  = '/logo-sixxis.png',
  anuncios = DEFAULT_ANUNCIOS,
}: {
  logoUrl?: string
  anuncios?: string[]
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: session } = useSession()
  const { totalItens } = useCarrinho()

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      {/* ── PART A: Announcement bar (NOT sticky) ── */}
      <AnnouncementBar items={anuncios} />

      {/* ── PART B + C: Sticky header ── */}
      <div
        className="sticky top-0 z-40 shadow-lg"
        style={{ backgroundColor: 'var(--color-header, #1a4f4a)' }}
      >

        {/* ═══════════════════════════════════════════════════════
            MOBILE (< lg)
        ═══════════════════════════════════════════════════════ */}
        <div className="lg:hidden">
          {/* Row: [Hamburger] [Logo centrado] [Carrinho] */}
          <div className="h-16 px-4 flex items-center relative">
            <button
              onClick={() => setDrawerOpen(true)}
              className="absolute left-4 p-2 rounded-lg hover:bg-white/20 transition"
              aria-label="Abrir menu"
            >
              <Menu size={24} className="text-white" />
            </button>

            <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center">
              <Image
                src={logoUrl}
                alt="Sixxis"
                width={110}
                height={36}
                className="object-contain"
                priority
              />
            </Link>

            <Link
              href="/carrinho"
              className="absolute right-4 relative p-2 text-white hover:text-white/80 transition"
              aria-label="Carrinho"
            >
              <ShoppingCart size={24} />
              {totalItens > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#3cbfb3] text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none px-0.5">
                  {totalItens > 9 ? '9+' : totalItens}
                </span>
              )}
            </Link>
          </div>

          {/* Busca full-width abaixo da linha */}
          <div className="px-3 pb-3">
            <SearchBar dark variant="mobile" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            DESKTOP (≥ lg)
            PART B: [Logo] [SearchBar] [Entrar] [Cadastrar] [Carrinho]
        ═══════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex items-center h-16 max-w-7xl mx-auto px-4 xl:px-6 gap-4">

          <Link href="/" className="shrink-0 flex items-center mr-2">
            <Image
              src={logoUrl}
              alt="Sixxis"
              width={130}
              height={42}
              className="object-contain"
              priority
            />
          </Link>

          <div className="flex flex-1 max-w-xl mx-4">
            <SearchBar dark />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {session ? (
              <>
                <Link
                  href="/minha-conta"
                  className="flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <User size={16} />
                  Minha Conta
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-xs text-white/60 hover:text-red-300 transition px-2 py-1"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="border border-white/30 text-white text-sm px-4 py-2 rounded-lg hover:bg-white/10 transition"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-bold px-4 py-2 rounded-lg transition"
                >
                  Cadastrar
                </Link>
              </>
            )}

            <Link
              href="/carrinho"
              className="relative p-2 text-white hover:text-white/80 transition ml-1"
              aria-label="Carrinho"
            >
              <ShoppingCart size={22} />
              {totalItens > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#3cbfb3] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {totalItens > 9 ? '9+' : totalItens}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART C: Nav de categorias (desktop only, mesmo fundo)
        ═══════════════════════════════════════════════════════ */}
        <div className="hidden lg:block border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 xl:px-6">
            <div className="flex items-center overflow-x-auto scrollbar-hide">
              {navLinks.map(({ href, label, destaque }) => (
                <Link
                  key={href}
                  href={href}
                  className={`shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    destaque
                      ? 'text-amber-300 font-bold hover:bg-white/10'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                  {destaque && (
                    <span className="ml-1.5 text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full align-middle">
                      HOT
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MOBILE DRAWER (slide from left)
      ═══════════════════════════════════════════════════════ */}

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 left-0 z-50 h-full flex flex-col shadow-2xl transition-transform duration-300 lg:hidden"
        style={{
          width: '85%',
          maxWidth: '320px',
          backgroundColor: '#1a4f4a',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center">
            <Image
              src={logoUrl}
              alt="Sixxis"
              width={100}
              height={34}
              className="object-contain brightness-0 invert"
              unoptimized
            />
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Fechar menu"
          >
            <X size={22} className="text-white" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navLinks.map(({ href, label, icon: Icon, destaque }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-4 px-6 py-4 text-base font-semibold border-b border-white/5 transition-colors ${
                destaque
                  ? 'text-amber-300 hover:bg-white/10'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} className={destaque ? 'text-amber-300' : 'text-white/50'} />
              {label}
              {destaque && (
                <span className="ml-auto text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                  HOT
                </span>
              )}
            </Link>
          ))}

          <div className="mx-6 my-3 border-t border-white/10" />

          {session ? (
            <>
              <Link
                href="/minha-conta"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5"
              >
                <User size={20} className="text-white/50" />
                Minha Conta
              </Link>
              <button
                onClick={() => { signOut({ callbackUrl: '/' }); setDrawerOpen(false) }}
                className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-red-300 hover:text-red-200 hover:bg-white/10 w-full text-left transition-colors border-b border-white/5"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5"
              >
                <User size={20} className="text-white/50" />
                Entrar
              </Link>
              <Link
                href="/cadastro"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-[#3cbfb3] hover:bg-white/10 transition-colors border-b border-white/5"
              >
                <UserPlus size={20} className="text-[#3cbfb3]" />
                Criar Conta
              </Link>
            </>
          )}
        </nav>

        {/* Drawer footer — contato */}
        <div className="px-5 py-5 border-t border-white/10 space-y-3 shrink-0">
          <a
            href="https://wa.me/5518997474701"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full bg-[#25D366] text-white text-sm font-semibold px-4 py-3 rounded-xl transition hover:bg-[#128C7E]"
          >
            <WaIcon />
            (18) 99747-4701 — Vendas
          </a>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Clock size={12} />
            <span>Seg–Sex 8h às 18h&nbsp;&nbsp;|&nbsp;&nbsp;Sáb 8h às 12h</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Mail size={12} />
            <a href="mailto:brasil.sixxis@gmail.com" className="hover:text-white/80 transition">
              brasil.sixxis@gmail.com
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
