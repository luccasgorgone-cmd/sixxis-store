'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Menu, X, User, UserPlus,
  Wind, Fan, Bike, Tag, Info, Phone, HelpCircle,
  Clock, Mail, Package, Wrench, Store, Search,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useCarrinho } from '@/hooks/useCarrinho'

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Sugestao {
  id: string
  nome: string
  slug: string
  preco: number
  imagens: string[]
}

interface CepResultado {
  ok: boolean
  mensagem: string
}

// ── WA Icon ───────────────────────────────────────────────────────────────────
function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.882a.5.5 0 0 0 .606.596l6.187-1.422A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.014-1.374l-.36-.213-3.724.856.896-3.62-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.567 6.567 2.182 12 2.182c5.433 0 9.818 4.385 9.818 9.818 0 5.432-4.385 9.818-9.818 9.818z"/>
    </svg>
  )
}

// ── SearchVentisol ────────────────────────────────────────────────────────────
function SearchVentisol({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const buscar = useCallback((q: string) => {
    if (q.length < 2) { setSugestoes([]); setAberto(false); return }
    setCarregando(true)
    fetch(`/api/produtos?q=${encodeURIComponent(q)}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        const lista: Sugestao[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data) ? data : []
        setSugestoes(lista.slice(0, 5))
        setAberto(lista.length > 0)
      })
      .catch(() => setSugestoes([]))
      .finally(() => setCarregando(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => buscar(val), 300)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) { setAberto(false); router.push(`/produtos?q=${encodeURIComponent(q)}`); setQuery('') }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-white/20">
        <input
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder="O que você está buscando?"
          autoComplete="off"
          className="flex-1 py-3 px-4 text-gray-700 text-base sm:text-sm outline-none min-w-0"
        />
        <button
          type="submit"
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] px-5 text-white transition-colors flex items-center justify-center shrink-0"
          aria-label="Buscar"
        >
          {carregando
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search size={18} />
          }
        </button>
      </form>

      {/* Dropdown sugestões */}
      {aberto && sugestoes.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {sugestoes.map((s) => (
            <Link
              key={s.id}
              href={`/produtos/${s.slug}`}
              onClick={() => { setAberto(false); setQuery('') }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
            >
              {s.imagens?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imagens[0]} alt={s.nome} className="w-9 h-9 object-contain rounded-lg shrink-0 bg-gray-50 p-0.5" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#3cbfb3] transition-colors">{s.nome}</p>
                <p className="text-xs text-[#3cbfb3] font-semibold">
                  R$ {Number(s.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </Link>
          ))}
          <Link
            href={`/produtos?q=${encodeURIComponent(query)}`}
            onClick={() => { setAberto(false); setQuery('') }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-[#3cbfb3] font-semibold hover:bg-gray-100 transition-colors"
          >
            <Search size={12} /> Ver todos os resultados para &ldquo;{query}&rdquo;
          </Link>
        </div>
      )}
    </div>
  )
}

// ── CampoFrete ────────────────────────────────────────────────────────────────
function CampoFrete({ compact = false }: { compact?: boolean }) {
  const [cep, setCep] = useState('')
  const [resultado, setResultado] = useState<CepResultado | null>(null)
  const [carregando, setCarregando] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8)
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5)
    setCep(v)
    if (resultado) setResultado(null)
  }

  async function handleOk() {
    const limpo = cep.replace(/\D/g, '')
    if (limpo.length !== 8) return
    setCarregando(true)
    try {
      const r = await fetch('/api/frete/cep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: limpo }),
      })
      const data = await r.json()
      setResultado({ ok: !!data.ok, mensagem: data.ok ? data.mensagem : (data.erro || 'CEP não encontrado') })
    } catch {
      setResultado({ ok: false, mensagem: 'Erro ao consultar' })
    } finally {
      setCarregando(false)
    }
  }

  if (compact) {
    return (
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[#3cbfb3] text-xs font-bold uppercase tracking-wider mb-2">Calcule o Frete</p>
        <div className="flex items-center bg-white rounded-xl overflow-hidden border border-gray-200">
          <input
            type="text" value={cep} onChange={handleChange}
            placeholder="XXXXX-XXX" maxLength={9}
            className="flex-1 py-2.5 px-3 text-base sm:text-sm text-gray-700 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleOk()}
          />
          <button
            onClick={handleOk} disabled={carregando || cep.replace(/\D/g,'').length < 8}
            className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white px-3 py-2.5 text-xs font-bold transition"
          >
            {carregando ? '...' : 'OK'}
          </button>
        </div>
        {resultado && (
          <p className={`text-xs mt-1.5 font-medium ${resultado.ok ? 'text-[#3cbfb3]' : 'text-red-400'}`}>
            {resultado.ok ? '✓ ' : '✗ '}{resultado.mensagem}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="shrink-0 flex flex-col gap-1">
      <label className="text-white font-semibold text-xs uppercase tracking-wider">
        Calcule o Frete
      </label>
      <div className="flex items-center bg-white rounded-lg overflow-hidden h-9">
        <input
          type="text"
          value={cep}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleOk()}
          placeholder="00000-000"
          maxLength={9}
          className="flex-1 px-3 text-sm text-gray-700 outline-none w-32"
        />
        <button
          onClick={handleOk}
          disabled={carregando}
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white text-xs font-bold px-3 h-full transition"
        >
          {carregando ? '...' : 'OK'}
        </button>
      </div>
      {resultado?.ok && (
        <p className="text-[10px] text-[#3cbfb3] font-semibold">✓ {resultado.mensagem}</p>
      )}
      {resultado && !resultado.ok && (
        <p className="text-[10px] text-red-400 font-semibold">✗ {resultado.mensagem}</p>
      )}
    </div>
  )
}

// ── Nav links ─────────────────────────────────────────────────────────────────
const navLinks = [
  { href: '/produtos?categoria=climatizadores', label: 'Climatizadores', icon: Wind,       destaque: false },
  { href: '/produtos?categoria=aspiradores',    label: 'Aspiradores',    icon: Fan,        destaque: false },
  { href: '/produtos?categoria=spinning',       label: 'Spinning',       icon: Bike,       destaque: false },
  { href: '/ofertas',                           label: 'Ofertas',        icon: Tag,        destaque: true  },
  { href: '/sobre',                             label: 'Sobre',          icon: Info,       destaque: false },
  { href: '/contato',                           label: 'Contato',        icon: Phone,      destaque: false },
]

// ── HEADER ────────────────────────────────────────────────────────────────────
export default function Header({
  logoUrl = '/logo-sixxis.png',
}: {
  logoUrl?: string
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: session } = useSession()
  const { totalItens } = useCarrinho()

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          CAMADA 1 — Barra superior (NÃO sticky, some ao rolar)
          Desktop only
      ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block bg-[#0f2e2b] py-1.5">
        <div className="max-w-7xl mx-auto px-4 xl:px-6 flex items-center justify-between">

          {/* Esquerda */}
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
            <span>🏆</span>
            <span>Bem-vindo à <strong className="text-[#3cbfb3]">Loja Oficial da Sixxis!</strong></span>
          </div>

          {/* Direita */}
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/pedidos"
              className="flex items-center gap-1.5 text-white/80 hover:text-white font-medium transition-colors"
            >
              <Package size={13} />
              Rastreie seu Pedido
            </Link>
            <span className="text-white/20">|</span>
            <a
              href="https://wa.me/5511934102621"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/80 hover:text-white font-medium transition-colors"
            >
              <Wrench size={13} />
              Assistência Técnica
            </a>
            <span className="text-white/20">|</span>
            <Link
              href="/seja-revendedor"
              className="flex items-center gap-1.5 text-[#3cbfb3] hover:text-[#5ad8cc] font-semibold transition-colors"
            >
              <Store size={13} />
              Seja um Revendedor
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          STICKY WRAPPER — Camadas 2 e 3
      ═══════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-40">

        {/* ─────────────────────────────────────────────────────
            CAMADA 2 — Header principal
        ───────────────────────────────────────────────────── */}
        <div
          className="shadow-md"
          style={{ backgroundColor: 'var(--color-header, #1a4f4a)' }}
        >

          <div className="max-w-7xl mx-auto px-4 xl:px-6">

            {/* Linha unificada — mobile e desktop compartilham a mesma row */}
            <div className="relative flex items-center h-16 lg:h-auto lg:py-0 gap-4">

              {/* Burger — mobile only */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden shrink-0 p-2 rounded-lg hover:bg-white/20 transition"
                aria-label="Abrir menu"
              >
                <Menu size={24} className="text-white" />
              </button>

              {/* ★ LOGO ÚNICA — centralizada no mobile via absolute, estática no desktop */}
              <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 shrink-0 flex flex-col items-start lg:mr-2">
                <Link href="/">
                  <Image
                    src={logoUrl}
                    alt="Sixxis"
                    width={140}
                    height={47}
                    className="object-contain w-auto"
                    priority
                  />
                </Link>
                <p style={{ color: '#ffffff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textAlign: 'left', marginTop: '3px', opacity: 0.9 }}>
                  Qualidade e Inovação
                </p>
              </div>

              {/* Search — desktop only */}
              <SearchVentisol className="hidden lg:flex flex-1 max-w-lg" />

              {/* CEP — desktop only */}
              <div className="hidden lg:block shrink-0">
                <CampoFrete />
              </div>

              {/* Auth + Carrinho — desktop only */}
              <div className="hidden lg:flex items-center gap-2 shrink-0 ml-2">
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
                      className="border border-white/30 text-white text-sm px-4 py-2 rounded-lg hover:bg-white/10 transition whitespace-nowrap"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/cadastro"
                      className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-bold px-4 py-2 rounded-lg transition whitespace-nowrap"
                    >
                      Cadastrar
                    </Link>
                  </>
                )}
                <Link
                  href="/carrinho"
                  className="relative flex items-center gap-2 p-2 text-white hover:text-[#3cbfb3] transition"
                  aria-label="Carrinho"
                >
                  <ShoppingCart size={24} />
                  <span className="hidden xl:inline text-sm font-medium">Carrinho</span>
                  {totalItens > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#3cbfb3] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                      {totalItens > 9 ? '9+' : totalItens}
                    </span>
                  )}
                </Link>
              </div>

              {/* Carrinho — mobile only */}
              <Link
                href="/carrinho"
                className="lg:hidden relative ml-auto p-2 text-white hover:text-white/80 transition"
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

            {/* Search mobile — row abaixo */}
            <div className="lg:hidden pb-3">
              <SearchVentisol />
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────
            CAMADA 3 — Nav de categorias (desktop only)
            Fundo #0f2e2b — mais escuro
        ───────────────────────────────────────────────────── */}
        <nav className="hidden lg:block bg-[#0f2e2b]">
          <div className="max-w-7xl mx-auto px-4 xl:px-6">
            <div className="flex items-center justify-center overflow-x-auto scrollbar-hide">
              {navLinks.map(({ href, label, destaque }) => (
                <Link
                  key={href}
                  href={href}
                  className={`
                    group relative shrink-0 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors duration-200
                    ${destaque ? 'text-amber-300 hover:text-amber-200' : 'text-white/80 hover:text-white'}
                  `}
                >
                  {label}
                  {destaque && (
                    <span className="ml-1.5 text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full align-middle normal-case tracking-normal">
                      HOT
                    </span>
                  )}
                  {/* Underline tiffany no hover */}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#3cbfb3] transition-all duration-200 ${destaque ? 'w-0 group-hover:w-4/5' : 'w-0 group-hover:w-4/5'}`} />
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MOBILE DRAWER (slide da esquerda)
      ═══════════════════════════════════════════════════════ */}

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Painel */}
      <div
        className="fixed top-0 left-0 z-50 h-full flex flex-col shadow-2xl transition-transform duration-300 lg:hidden"
        style={{
          width: '85%',
          maxWidth: '320px',
          backgroundColor: '#1a4f4a',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0" style={{ backgroundColor: '#0f2e2b' }}>
          <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center">
            <Image src={logoUrl} alt="Sixxis" width={100} height={34} className="object-contain brightness-0 invert" unoptimized />
          </Link>
          <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-white/10 transition" aria-label="Fechar menu">
            <X size={22} className="text-white" />
          </button>
        </div>

        {/* CEP no topo do drawer */}
        <CampoFrete compact />

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navLinks.map(({ href, label, icon: Icon, destaque }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-4 px-6 py-4 text-base font-semibold border-b border-white/5 transition-colors ${
                destaque ? 'text-amber-300 hover:bg-white/10' : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} className={destaque ? 'text-amber-300' : 'text-white/50'} />
              {label}
              {destaque && (
                <span className="ml-auto text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">HOT</span>
              )}
            </Link>
          ))}

          <div className="mx-6 my-3 border-t border-white/10" />

          {/* Links extras */}
          <Link href="/seja-revendedor" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-[#3cbfb3] hover:bg-white/10 transition-colors border-b border-white/5">
            <Store size={20} className="text-[#3cbfb3]" />
            Seja um Revendedor
          </Link>
          <Link href="/faq" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5">
            <HelpCircle size={20} className="text-white/50" />
            FAQ
          </Link>

          <div className="mx-6 my-3 border-t border-white/10" />

          {session ? (
            <>
              <Link href="/minha-conta" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5">
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
              <Link href="/login" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5">
                <User size={20} className="text-white/50" />
                Entrar
              </Link>
              <Link href="/cadastro" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-[#3cbfb3] hover:bg-white/10 transition-colors border-b border-white/5">
                <UserPlus size={20} className="text-[#3cbfb3]" />
                Criar Conta
              </Link>
            </>
          )}
        </nav>

        {/* Footer do drawer */}
        <div className="px-5 py-5 border-t border-white/10 space-y-3 shrink-0">
          <a
            href="https://wa.me/5518997474701"
            target="_blank" rel="noopener noreferrer"
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
            <a href="mailto:brasil.sixxis@gmail.com" className="hover:text-white/80 transition">brasil.sixxis@gmail.com</a>
          </div>
        </div>
      </div>
    </>
  )
}
