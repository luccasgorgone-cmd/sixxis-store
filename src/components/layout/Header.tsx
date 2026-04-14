'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Tag, Truck, MapPin, Search, User, ShoppingCart,
  Menu, X, Navigation, Clock, Mail, Store, HelpCircle,
  Wind, Fan, Bike, Info, Phone, UserPlus,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useCarrinho } from '@/hooks/useCarrinho'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Sugestao {
  id: string
  nome: string
  slug: string
  preco: number
  imagens: string[]
}

// ── WA Icon (drawer) ──────────────────────────────────────────────────────────
function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.827L.057 23.882a.5.5 0 0 0 .606.596l6.187-1.422A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.014-1.374l-.36-.213-3.724.856.896-3.62-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.567 6.567 2.182 12 2.182c5.433 0 9.818 4.385 9.818 9.818 0 5.432-4.385 9.818-9.818 9.818z" />
    </svg>
  )
}

// ── SearchBar com autocomplete ────────────────────────────────────────────────
function SearchBar({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const buscar = useCallback((q: string) => {
    if (q.length < 2) { setSugestoes([]); setAberto(false); return }
    setCarregando(true)
    fetch(`/api/produtos?q=${encodeURIComponent(q)}&limit=5`)
      .then(r => r.json())
      .then(data => {
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
      <form onSubmit={handleSubmit} className="flex h-11 bg-white rounded-xl overflow-hidden shadow-sm">
        <input
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder="O que você está buscando?"
          autoComplete="off"
          className="flex-1 px-4 text-gray-700 text-sm outline-none bg-transparent"
        />
        <button
          type="submit"
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] px-5 flex items-center justify-center transition shrink-0"
          aria-label="Buscar"
        >
          {carregando
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Search size={17} className="text-white" />
          }
        </button>
      </form>

      {aberto && sugestoes.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {sugestoes.map(s => (
            <Link
              key={s.id}
              href={`/produtos/${s.slug}`}
              onClick={() => { setAberto(false); setQuery('') }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
            >
              {s.imagens?.[0]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={s.imagens[0]} alt={s.nome} className="w-9 h-9 object-contain rounded-lg shrink-0 bg-gray-50 p-0.5" />
                : <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
              }
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
            <Search size={12} /> Ver todos para &ldquo;{query}&rdquo;
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Nav links ─────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: '/produtos?categoria=climatizadores', label: 'CLIMATIZADORES', icon: Wind  },
  { href: '/produtos?categoria=aspiradores',    label: 'ASPIRADORES',    icon: Fan   },
  { href: '/produtos?categoria=spinning',       label: 'SPINNING',       icon: Bike  },
  { href: '/ofertas',                           label: 'OFERTAS',        icon: Tag, hot: true },
  { href: '/sobre',                             label: 'SOBRE',          icon: Info  },
  { href: '/contato',                           label: 'CONTATO',        icon: Phone },
]

// ── HEADER ────────────────────────────────────────────────────────────────────
export default function Header({ logoUrl = '/logo-sixxis.png' }: { logoUrl?: string }) {
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [cepModalOpen,  setCepModalOpen]  = useState(false)
  const [cepSalvo,      setCepSalvo]      = useState('')
  const [cepInput,      setCepInput]      = useState('')
  const [cepLoading,    setCepLoading]    = useState(false)
  const [cepResultado,  setCepResultado]  = useState<{ mensagem: string } | null>(null)
  const [cepErro,       setCepErro]       = useState('')

  const { data: session } = useSession()
  const { totalItens }    = useCarrinho()

  useEffect(() => {
    document.body.style.overflow = (drawerOpen || cepModalOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen, cepModalOpen])

  useEffect(() => {
    const saved = localStorage.getItem('sixxis_cep')
    if (saved) setCepSalvo(saved)
  }, [])

  const handleBuscarCep = useCallback(async (cepOverride?: string) => {
    const limpo = (cepOverride || cepInput).replace(/\D/g, '')
    if (limpo.length !== 8) return
    setCepLoading(true)
    setCepErro('')
    setCepResultado(null)
    try {
      const r = await fetch('/api/frete/cep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: limpo }),
      })
      const data = await r.json()
      if (data.ok) {
        setCepResultado({ mensagem: data.mensagem })
        const fmt = limpo.slice(0, 5) + '-' + limpo.slice(5)
        setCepSalvo(fmt)
        localStorage.setItem('sixxis_cep', fmt)
      } else {
        setCepErro(data.erro || 'CEP não encontrado')
      }
    } catch {
      setCepErro('Erro ao consultar CEP')
    } finally {
      setCepLoading(false)
    }
  }, [cepInput])

  const usarLocalizacaoAtual = () => {
    if (!navigator.geolocation) { setCepErro('Geolocalização não disponível'); return }
    setCepLoading(true)
    setCepErro('')
    setCepResultado(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          let cepEncontrado = ''
          try {
            const r1 = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              { headers: { 'User-Agent': 'SixxisStore/1.0 (brasil.sixxis@gmail.com)' } }
            )
            const d1 = await r1.json()
            if (d1.address?.postcode) {
              const pc = d1.address.postcode.replace(/\D/g, '')
              if (pc.length >= 8) cepEncontrado = pc.slice(0, 8)
            }
          } catch {}
          if (cepEncontrado.length === 8) {
            try {
              const r2 = await fetch(`https://viacep.com.br/ws/${cepEncontrado}/json/`)
              const d2 = await r2.json()
              if (!d2.erro) {
                const cepFormatado = cepEncontrado.slice(0, 5) + '-' + cepEncontrado.slice(5)
                setCepInput(cepFormatado)
                const r3 = await fetch('/api/frete/cep', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ cep: cepEncontrado }),
                })
                const d3 = await r3.json()
                if (d3.ok) {
                  setCepResultado({ mensagem: d3.mensagem })
                  setCepSalvo(cepFormatado)
                  localStorage.setItem('sixxis_cep', cepFormatado)
                  setCepLoading(false)
                  return
                }
              }
            } catch {}
          }
          setCepErro('CEP não detectado automaticamente. Digite manualmente.')
        } catch {
          setCepErro('Erro ao obter localização.')
        } finally {
          setCepLoading(false)
        }
      },
      (error) => {
        setCepLoading(false)
        const msgs: Record<number, string> = {
          1: 'Permissão negada. Digite o CEP manualmente.',
          2: 'Localização indisponível.',
          3: 'Tempo esgotado.',
        }
        setCepErro(msgs[error.code] || 'Erro de localização.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          CAMADA 1 — ANNOUNCEMENT BAR
      ═══════════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: '#0f2e2b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-10">

            {/* Esquerda — Cupom */}
            <div className="flex items-center gap-2">
              <Tag size={13} className="text-[#3cbfb3] shrink-0" strokeWidth={2} />
              <span className="text-white/80 text-xs font-medium">CUPOM:</span>
              <span className="bg-[#3cbfb3] text-black text-[11px] font-black px-2 py-0.5 rounded-md tracking-wide">
                SIXXIS10
              </span>
              <span className="text-white text-xs font-semibold hidden sm:inline">
                — 10% OFF na 1ª compra
              </span>
            </div>

            {/* Centro — Frete */}
            <div className="hidden md:flex items-center gap-2">
              <Truck size={13} className="text-[#3cbfb3] shrink-0" strokeWidth={2} />
              <span className="text-white text-xs font-bold tracking-wide">
                FRETE GRÁTIS acima de R$ 500
              </span>
            </div>

            {/* Direita — Entrega */}
            <div className="hidden lg:flex items-center gap-2">
              <MapPin size={13} className="text-[#3cbfb3] shrink-0" strokeWidth={2} />
              <span className="text-white text-xs font-medium">
                Entrega para todo o Brasil
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CAMADA 2 — HEADER PRINCIPAL (sticky)
      ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40">

        <div style={{ backgroundColor: '#1a4f4a' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">

            {/* ── Desktop ────────────────────────────────────── */}
            <div className="hidden md:flex items-center h-[68px] gap-4">

              {/* Logo */}
              <Link href="/" className="shrink-0">
                <Image
                  src={logoUrl}
                  alt="Sixxis"
                  width={130}
                  height={44}
                  className="object-contain h-10 w-auto"
                  priority
                />
              </Link>

              {/* Search */}
              <div className="flex-1 max-w-2xl mx-4">
                <SearchBar className="w-full" />
              </div>

              {/* Ações */}
              <div className="flex items-center gap-0 shrink-0">

                {/* CEP */}
                <button
                  onClick={() => { setCepResultado(null); setCepErro(''); setCepModalOpen(true) }}
                  className="hidden lg:flex flex-col items-center gap-0.5 px-3 py-2 text-white hover:text-[#3cbfb3] hover:bg-white/10 rounded-xl transition min-w-[70px]"
                >
                  <MapPin size={21} strokeWidth={1.5} />
                  <span className="text-[11px] font-medium leading-none whitespace-nowrap">
                    {cepSalvo || 'Informe CEP'}
                  </span>
                </button>

                <div className="w-px h-8 bg-white/20 hidden lg:block mx-1" />

                {/* Entrar / Conta */}
                <Link
                  href={session ? '/minha-conta' : '/login'}
                  className="flex flex-col items-center gap-0.5 px-3 py-2 text-white hover:text-[#3cbfb3] hover:bg-white/10 rounded-xl transition min-w-[60px]"
                >
                  <User size={21} strokeWidth={1.5} />
                  <span className="text-[11px] font-medium leading-none">
                    {session ? (session.user?.name?.split(' ')[0] || 'Conta') : 'Entrar'}
                  </span>
                </Link>

                <div className="w-px h-8 bg-white/20 mx-1" />

                {/* Carrinho */}
                <Link
                  href="/carrinho"
                  className="relative flex flex-col items-center gap-0.5 px-3 py-2 text-white hover:text-[#3cbfb3] hover:bg-white/10 rounded-xl transition min-w-[60px]"
                >
                  <ShoppingCart size={21} strokeWidth={1.5} />
                  <span className="text-[11px] font-medium leading-none">Carrinho</span>
                  {totalItens > 0 && (
                    <span className="absolute top-1.5 right-2 bg-[#f59e0b] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
                      {totalItens > 9 ? '9+' : totalItens}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* ── Mobile ─────────────────────────────────────── */}
            <div className="flex md:hidden items-center h-16 gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="shrink-0 p-2 rounded-lg hover:bg-white/20 transition"
                aria-label="Abrir menu"
              >
                <Menu size={24} className="text-white" />
              </button>

              <Link href="/" className="absolute left-1/2 -translate-x-1/2">
                <Image src={logoUrl} alt="Sixxis" width={115} height={38} className="object-contain" priority />
              </Link>

              <Link
                href="/carrinho"
                className="relative ml-auto p-2 text-white"
                aria-label="Carrinho"
              >
                <ShoppingCart size={24} />
                {totalItens > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-[#f59e0b] text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none px-0.5">
                    {totalItens > 9 ? '9+' : totalItens}
                  </span>
                )}
              </Link>
            </div>

            {/* Busca mobile */}
            <div className="md:hidden pb-2">
              <SearchBar className="w-full" />
            </div>

          </div>
        </div>

        {/* ── Separador ───────────────────────────────────────── */}
        <div className="w-full border-t border-white/15" />

        {/* ── NAV CATEGORIAS ──────────────────────────────────── */}
        <nav className="hidden lg:block" style={{ backgroundColor: '#0f2e2b' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-center gap-0 py-2">
              {NAV_LINKS.map((link, i) => (
                <div key={link.href} className="flex items-center">
                  {i > 0 && (
                    <span className="text-white/25 mx-1 select-none text-sm">|</span>
                  )}
                  <Link
                    href={link.href}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-bold text-white hover:text-[#3cbfb3] tracking-wide transition whitespace-nowrap rounded-lg hover:bg-white/10"
                  >
                    {link.label}
                    {link.hot && (
                      <span className="bg-[#f59e0b] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase leading-none">
                        HOT
                      </span>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </nav>

      </header>

      {/* ═══════════════════════════════════════════════════════
          MODAL CEP
      ═══════════════════════════════════════════════════════ */}
      {cepModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setCepModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Informe seu CEP</h3>
              <button
                onClick={() => setCepModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <button
              onClick={usarLocalizacaoAtual}
              className="w-full flex items-center gap-3 p-3 border border-[#3cbfb3] rounded-xl mb-4 hover:bg-[#e8f8f7] transition text-left"
            >
              <div className="w-10 h-10 bg-[#e8f8f7] rounded-full flex items-center justify-center shrink-0">
                <Navigation size={18} className="text-[#3cbfb3]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Usar minha localização atual</p>
                <p className="text-xs text-gray-500">Detectar CEP automaticamente</p>
              </div>
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-xs text-gray-400">ou digite o CEP</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={cepInput}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 8)
                  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5)
                  setCepInput(v)
                  setCepErro('')
                  setCepResultado(null)
                }}
                onKeyDown={e => e.key === 'Enter' && handleBuscarCep()}
                placeholder="00000-000"
                maxLength={9}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#3cbfb3] focus:ring-2 focus:ring-[#3cbfb3]/20 outline-none"
                autoFocus
              />
              <button
                onClick={() => handleBuscarCep()}
                disabled={cepLoading}
                className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-3 rounded-xl transition disabled:opacity-60"
              >
                {cepLoading ? '...' : 'OK'}
              </button>
            </div>

            {cepResultado && (
              <div className="mt-3 p-3 bg-[#e8f8f7] rounded-xl">
                <p className="text-sm font-semibold text-[#1a4f4a]">✓ {cepResultado.mensagem}</p>
              </div>
            )}
            {cepErro && (
              <p className="mt-2 text-xs text-red-500 font-medium">✗ {cepErro}</p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MOBILE DRAWER
      ═══════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <div
        className="fixed top-0 left-0 z-50 h-full flex flex-col shadow-2xl transition-transform duration-300 lg:hidden"
        style={{
          width: '85%',
          maxWidth: '320px',
          backgroundColor: '#1a4f4a',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0" style={{ backgroundColor: '#0f2e2b' }}>
          <Link href="/" onClick={() => setDrawerOpen(false)}>
            <Image src={logoUrl} alt="Sixxis" width={100} height={34} className="object-contain brightness-0 invert" unoptimized />
          </Link>
          <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-white/10 transition" aria-label="Fechar menu">
            <X size={22} className="text-white" />
          </button>
        </div>

        {/* CEP */}
        <div className="px-5 py-4 border-b border-white/10">
          <button
            onClick={() => { setDrawerOpen(false); setCepModalOpen(true) }}
            className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition text-left"
          >
            <MapPin size={18} className="text-[#3cbfb3] shrink-0" />
            <p className="text-sm font-semibold text-white">
              {cepSalvo ? cepSalvo : 'Informe seu CEP'}
            </p>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_LINKS.map(({ href, label, icon: Icon, hot }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-4 px-6 py-4 text-base font-semibold border-b border-white/5 transition-colors ${
                hot ? 'text-amber-300 hover:bg-white/10' : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} className={hot ? 'text-amber-300' : 'text-white/50'} />
              {label}
              {hot && (
                <span className="ml-auto text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">HOT</span>
              )}
            </Link>
          ))}

          <div className="mx-6 my-3 border-t border-white/10" />

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

        {/* Footer drawer */}
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
