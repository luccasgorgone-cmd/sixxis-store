'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Menu, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useCarrinho } from '@/hooks/useCarrinho'
import SearchBar from './SearchBar'
import MobileMenu from './MobileMenu'

const DEFAULT_ANNOUNCEMENTS = [
  '🚚 Frete grátis acima de R$\u00a0500 para todo o Brasil',
  '💳 Parcele em até 6x sem juros no cartão',
  '📞 Atendimento: (18) 99747-4701 | Seg-Sex 8h às 18h',
]

const navLinks = [
  { href: '/produtos?categoria=climatizadores', label: 'Climatizadores' },
  { href: '/produtos?categoria=aspiradores',    label: 'Aspiradores' },
  { href: '/produtos?categoria=spinning',       label: 'Spinning' },
  { href: '/pecas',                             label: 'Peças' },
  { href: '/ofertas',                           label: 'Ofertas', destaque: true },
  { href: '/sobre',                             label: 'Sobre' },
  { href: '/contato',                           label: 'Contato' },
]

function AnnouncementBar({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
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
      className="text-xs text-center py-2 px-4 h-8 flex items-center justify-center overflow-hidden"
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

export default function Header({
  logoUrl  = '/logo-sixxis.png',
  anuncios = DEFAULT_ANNOUNCEMENTS,
}: {
  logoUrl?: string
  anuncios?: string[]
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session } = useSession()
  const { totalItens } = useCarrinho()

  return (
    <>
      {/* ── Announcement bar ── */}
      <AnnouncementBar items={anuncios} />

      {/* ── Sticky wrapper ── */}
      <div className="sticky top-0 z-40">

        {/* ═══════════════════════════════════════════════════════
            MOBILE HEADER (< md / < 768px)
        ═══════════════════════════════════════════════════════ */}
        <div
          className="md:hidden shadow-md border-b border-white/10"
          style={{ backgroundColor: 'var(--color-header, #1a4f4a)' }}
        >
          {/* Linha única h-14: [Hambúrguer] [Logo center] [Carrinho] */}
          <div className="h-14 px-4 flex items-center relative">

            {/* Hambúrguer — esquerda absoluta */}
            <button
              className="absolute left-4 z-10 p-2 rounded-lg hover:bg-white/20 transition"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={24} className="text-white" />
            </button>

            {/* Logo — centralizada absolutamente */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center"
            >
              <Image
                src={logoUrl}
                alt="Sixxis"
                width={110}
                height={36}
                className="object-contain"
                priority
              />
            </Link>

            {/* Carrinho — direita absoluta */}
            <Link
              href="/carrinho"
              className="absolute right-4 z-10 relative p-2 text-white hover:text-white/80 transition"
              aria-label="Carrinho"
            >
              <ShoppingCart size={24} />
              {totalItens > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-black rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center leading-none px-0.5">
                  {totalItens > 9 ? '9+' : totalItens}
                </span>
              )}
            </Link>
          </div>

          {/* Busca mobile — full-width, glass style */}
          <div className="px-3 pb-3">
            <SearchBar dark variant="mobile" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            DESKTOP HEADER (≥ md / ≥ 768px)
        ═══════════════════════════════════════════════════════ */}
        <header
          className="hidden md:block shadow-md border-b border-white/10"
          style={{ backgroundColor: 'var(--color-header, #1a4f4a)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center">
              <Image
                src={logoUrl}
                alt="Sixxis"
                width={130}
                height={44}
                className="object-contain"
                priority
              />
            </Link>

            {/* Busca centralizada */}
            <div className="flex flex-1 max-w-2xl mx-4">
              <SearchBar dark />
            </div>

            {/* Ações direita */}
            <div className="flex items-center gap-3 ml-auto md:ml-0">

              {/* Carrinho */}
              <Link
                href="/carrinho"
                className="relative p-2 text-white hover:text-white/80 transition"
                aria-label="Carrinho"
              >
                <ShoppingCart size={22} />
                {totalItens > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                    {totalItens > 9 ? '9+' : totalItens}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {session ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/minha-conta"
                    className="flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition"
                  >
                    <User size={18} />
                    Conta
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-xs text-white/60 hover:text-red-300 transition"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-sm font-medium px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className="text-sm font-bold px-4 py-1.5 rounded-full bg-[#3cbfb3] text-white hover:bg-[#2a9d8f] transition"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Nav de categorias — desktop only ── */}
        <nav className="hidden md:block bg-[#0f2e2b] border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center">
              {navLinks.map(({ href, label, destaque }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    destaque
                      ? 'text-yellow-300 font-bold hover:bg-white/10'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                  {destaque && (
                    <span className="ml-1.5 text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full align-middle">
                      HOT
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Menu mobile drawer — da esquerda */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} logoUrl={logoUrl} />
    </>
  )
}
