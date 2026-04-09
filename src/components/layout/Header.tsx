'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Menu, X, User, UserPlus } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useCarrinho } from '@/hooks/useCarrinho'
import SearchBar from './SearchBar'
import MobileMenu from './MobileMenu'

const DEFAULT_ANNOUNCEMENTS = [
  '🚚 Frete grátis acima de R$\u00a0500 para todo o Brasil',
  '💳 Parcele em até 6x sem juros no cartão',
  '📞 Atendimento: (18) 99747-4701 | Seg-Sex 8h às 18h',
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
    <div className="bg-[#0a0a0a] text-white text-xs text-center py-2 px-4 h-8 flex items-center justify-center overflow-hidden">
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

const navLinks = [
  { href: '/produtos?categoria=climatizadores', label: 'Climatizadores' },
  { href: '/produtos?categoria=aspiradores',    label: 'Aspiradores' },
  { href: '/produtos?categoria=spinning',       label: 'Spinning' },
  { href: '/pecas',                             label: 'Peças' },
  { href: '/ofertas',                           label: 'Ofertas', destaque: true },
  { href: '/sobre',                             label: 'Sobre' },
  { href: '/contato',                           label: 'Contato' },
]

export default function Header({ logoUrl = '/logo-sixxis.png', anuncios = DEFAULT_ANNOUNCEMENTS }: { logoUrl?: string; anuncios?: string[] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session } = useSession()
  const { totalItens } = useCarrinho()

  return (
    <>
      {/* ── Banner topo animado ───────────────────────────────────────── */}
      <AnnouncementBar items={anuncios} />

      {/* ── Header principal ─────────────────────────────────────────── */}
      <header className="bg-header border-b border-brand/30 shadow-md sticky top-0 z-40">
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

          {/* Busca desktop */}
          <div className="flex-1 max-w-sm hidden lg:block mx-4">
            <SearchBar dark />
          </div>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium ml-auto">
            {navLinks.map(({ href, label, destaque }) => (
              <Link
                key={href}
                href={href}
                className={`relative py-1 transition group ${destaque ? 'text-yellow-300 font-bold' : 'text-white/90 hover:text-white'}`}
              >
                {label}
                {destaque && <span className="ml-1 text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full align-middle">HOT</span>}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-white group-hover:w-full transition-all duration-200" />
              </Link>
            ))}
          </nav>

          {/* Ações direita */}
          <div className="flex items-center gap-3 ml-4 lg:ml-0">
            {/* Carrinho */}
            <Link
              href="/carrinho"
              className="relative p-2 text-white hover:text-white/80 transition"
              aria-label="Carrinho"
            >
              <ShoppingCart size={22} />
              {totalItens > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#0f1f1e] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {totalItens > 9 ? '9+' : totalItens}
                </span>
              )}
            </Link>

            {/* Auth desktop */}
            {session ? (
              <div className="hidden lg:flex items-center gap-2">
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
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium px-4 py-1.5 rounded-full border border-white/40 text-white hover:border-white hover:bg-white/10 transition"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="text-sm font-bold px-4 py-1.5 rounded-full bg-white text-[#2a9d8f] hover:bg-white/90 transition"
                >
                  Cadastrar
                </Link>
              </div>
            )}

            {/* Hambúrguer mobile */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {menuOpen
                ? <X size={22} className="text-white" />
                : <Menu size={22} className="text-white" />
              }
            </button>
          </div>
        </div>

        {/* Busca mobile */}
        <div className="lg:hidden px-4 pb-3">
          <SearchBar dark />
        </div>
      </header>

      {/* Menu mobile (drawer) */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
