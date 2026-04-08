'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, User, UserPlus } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useCarrinho } from '@/hooks/useCarrinho'
import SearchBar from './SearchBar'
import MobileMenu from './MobileMenu'

const announcements = [
  '🚚 Frete grátis acima de R$\u00a0500 para todo o Brasil',
  '💳 Parcele em até 12x sem juros no cartão',
  '📦 Produtos originais com garantia Sixxis',
]

function AnnouncementBar() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % announcements.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-[#0a0a0a] text-white text-xs text-center py-2 px-4 h-8 flex items-center justify-center overflow-hidden">
      <span
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          display: 'inline-block',
        }}
      >
        {announcements[index]}
      </span>
    </div>
  )
}

const navLinks = [
  { href: '/produtos?categoria=climatizadores', label: 'Climatizadores' },
  { href: '/produtos?categoria=aspiradores',    label: 'Aspiradores' },
  { href: '/produtos?categoria=spinning',       label: 'Spinning' },
  { href: '/pecas',                             label: 'Peças' },
  { href: '/sobre',                             label: 'Sobre' },
  { href: '/contato',                           label: 'Contato' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session } = useSession()
  const { totalItens } = useCarrinho()

  return (
    <>
      {/* ── Banner topo animado ───────────────────────────────────────── */}
      <AnnouncementBar />

      {/* ── Header principal ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-baseline gap-0.5">
            <span className="text-2xl font-black tracking-tight text-[#0a0a0a]">SIXXIS</span>
            <span className="text-2xl font-black tracking-tight text-[#3cbfb3]">.store</span>
          </Link>

          {/* Busca desktop */}
          <div className="flex-1 max-w-sm hidden lg:block mx-4">
            <SearchBar />
          </div>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-700 ml-auto">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative py-1 hover:text-[#3cbfb3] transition group"
              >
                {label}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#3cbfb3] group-hover:w-full transition-all duration-200" />
              </Link>
            ))}
          </nav>

          {/* Ações direita */}
          <div className="flex items-center gap-3 ml-4 lg:ml-0">
            {/* Carrinho */}
            <Link
              href="/carrinho"
              className="relative p-2 text-gray-700 hover:text-[#3cbfb3] transition"
              aria-label="Carrinho"
            >
              <ShoppingCart size={22} />
              {totalItens > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#3cbfb3] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {totalItens > 9 ? '9+' : totalItens}
                </span>
              )}
            </Link>

            {/* Auth desktop */}
            {session ? (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href="/minha-conta"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#3cbfb3] transition"
                >
                  <User size={18} />
                  Conta
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-xs text-gray-400 hover:text-red-500 transition"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href="/login"
                  className="btn-outline py-2 px-4 text-sm"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="btn-primary py-2 px-4 text-sm"
                >
                  Cadastrar
                </Link>
              </div>
            )}

            {/* Hambúrguer mobile */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {menuOpen
                ? <X size={22} className="text-gray-700" />
                : <Menu size={22} className="text-gray-700" />
              }
            </button>
          </div>
        </div>

        {/* Busca mobile */}
        <div className="lg:hidden px-4 pb-3">
          <SearchBar />
        </div>
      </header>

      {/* Menu mobile (drawer) */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
