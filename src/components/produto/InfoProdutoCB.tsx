'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, ShoppingBag, ChevronDown, Check, Share2, MessageCircle, Minus, Plus, Heart,
  ShieldCheck, Truck, Lock, CreditCard, BadgeCheck, Headphones,
} from 'lucide-react'
import EstrelasNota from '@/components/ui/EstrelasNota'
import CalcFrete from '@/components/produto/CalcFrete'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useFavoritos } from '@/hooks/useListas'
import SelectVariacaoModal, { type VariacaoSelecionavel } from '@/components/produto/SelectVariacaoModal'
import { trackAddToCart } from '@/lib/analytics/events'

const SELOS_CONFIANCA = [
  { icon: ShieldCheck, titulo: '12 meses de garantia',     sub: 'Garantia real e documentada' },
  { icon: Truck,       titulo: 'Entrega para todo o Brasil', sub: 'Grátis acima de R$ 500' },
  { icon: Lock,        titulo: 'Compra 100% segura',       sub: 'SSL 256-bit + Antifraude' },
  { icon: CreditCard,  titulo: '6x sem juros',             sub: 'No cartão de crédito' },
  { icon: BadgeCheck,  titulo: 'Produto 100% original',    sub: 'Direto da fábrica' },
  { icon: Headphones,  titulo: 'Suporte especializado',    sub: 'Seg–Sex 8h às 18h' },
] as const

interface Variacao {
  id: string
  nome: string
  sku: string
  preco: number | null
  estoque: number
  ativo: boolean
}

// Color map for known color names
const COLOR_MAP: Record<string, string> = {
  preto: '#1a1a1a',
  black: '#1a1a1a',
  branco: '#f5f5f5',
  white: '#f5f5f5',
  azul: '#2563eb',
  blue: '#2563eb',
  vermelho: '#dc2626',
  red: '#dc2626',
  verde: '#16a34a',
  green: '#16a34a',
  amarelo: '#facc15',
  yellow: '#facc15',
  rosa: '#ec4899',
  pink: '#ec4899',
  cinza: '#9ca3af',
  gray: '#9ca3af',
  laranja: '#f97316',
  orange: '#f97316',
  roxo: '#7c3aed',
  purple: '#7c3aed',
  marrom: '#92400e',
  brown: '#92400e',
  prata: '#cbd5e1',
  silver: '#cbd5e1',
  dourado: '#d97706',
  gold: '#d97706',
  grafite: '#4b5563',
  bege: '#d6b896',
  beige: '#d6b896',
}

function getCorHex(nome: string): string | null {
  const lower = nome.toLowerCase()
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return hex
  }
  return null
}

interface Props {
  produto: {
    id: string
    nome: string
    slug: string
    sku: string | null
    preco: number
    precoPromocional: number | null
    estoque: number
    temVariacoes: boolean
    imagem?: string
    categoria?: string | null
  }
  variacoes: Variacao[]
  taxaJuros: number
  mediaAvaliacoes: number
  totalAvaliacoes: number
  imagensPorVariacao?: Record<string, string[]>
  onVariacaoChange?: (variacaoNome: string | null) => void
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcPMT(pv: number, taxa: number, n: number) {
  if (taxa === 0) return pv / n
  return pv * (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1)
}

function inferirTipoVariacao(nomes: string[]): string {
  if (!nomes.length) return 'Variação'
  const joined = nomes.join(' ')
  if (/\d+\s*v\b|bivolt/i.test(joined)) return 'Voltagem'
  const cores = ['preto','branco','azul','vermelho','verde','amarelo','rosa','cinza','laranja','roxo','marrom','bege','prata','dourado','grafite']
  if (cores.some(c => joined.toLowerCase().includes(c))) return 'Cor'
  if (/\b(pp|p|m|g{1,2}|xg|xxg|xs|s|l|xl{1,2}|xxl)\b/i.test(joined)) return 'Tamanho'
  if (/\b\d+(cm|mm|ml|l|kg|g|w|hz|gb|tb|pol)\b/i.test(joined)) return 'Capacidade'
  return 'Variação'
}

export default function InfoProdutoCB({ produto, variacoes, taxaJuros, mediaAvaliacoes, totalAvaliacoes, imagensPorVariacao, onVariacaoChange }: Props) {
  const router = useRouter()
  const { adicionarItem, setDrawerAberto } = useCarrinho()
  const favIds = useFavoritos((s) => s.ids)
  const toggleFav = useFavoritos((s) => s.toggle)
  const isFav = favIds.includes(produto.id)

  // Derived from props — computed before useState so we can use them in initializers
  const variacoesAtivas = variacoes.filter(v => v.ativo)
  const tipoVariacao = inferirTipoVariacao(variacoesAtivas.map(v => v.nome))
  const isCor = tipoVariacao === 'Cor'

  // Pre-select first color variant (prefer Branco)
  const defaultVariacao = isCor
    ? (variacoesAtivas.find(v => v.nome.toLowerCase().includes('branco')) ?? variacoesAtivas[0] ?? null)
    : null

  const [variacaoSelecionada, setVariacaoSelecionada] = useState<Variacao | null>(defaultVariacao)
  const [adicionado, setAdicionado] = useState(false)
  const [parcelasAberto, setParcelasAberto] = useState(false)
  const [quantidade, setQuantidade] = useState(1)
  const [visitantes, setVisitantes] = useState(0)
  const [modalVariacaoAberto, setModalVariacaoAberto] = useState(false)

  // On mount, sync the default color selection with the gallery
  useEffect(() => {
    if (defaultVariacao && onVariacaoChange) {
      onVariacaoChange(defaultVariacao.nome)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Fake visitor counter — seed from productId for consistency per page
    const seed = produto.id.charCodeAt(0) + produto.id.charCodeAt(1)
    const base = 3 + (seed % 11)
    setVisitantes(base)
    const t = setInterval(() => {
      setVisitantes(v => {
        const delta = Math.random() < 0.4 ? (Math.random() < 0.5 ? 1 : -1) : 0
        return Math.max(2, Math.min(18, v + delta))
      })
    }, 7000)
    return () => clearInterval(t)
  }, [produto.id])

  const precoBase = produto.precoPromocional ?? produto.preco
  const precoAtual = variacaoSelecionada?.preco ?? precoBase
  const precoOriginal = produto.preco
  const desconto = precoOriginal > precoAtual
    ? Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100)
    : 0
  const precoAtVista = precoAtual * 0.97
  const taxa = taxaJuros / 100
  const estoqueAtual = variacaoSelecionada ? variacaoSelecionada.estoque : produto.estoque
  const esgotado = estoqueAtual === 0

  function selecionarVariacao(v: Variacao | null) {
    setVariacaoSelecionada(v)
    if (onVariacaoChange) onVariacaoChange(v?.nome ?? null)
  }

  function handleAddToCart() {
    if (produto.temVariacoes && !variacaoSelecionada) {
      setModalVariacaoAberto(true)
      return
    }
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoAtual,
      quantidade,
      imagem: produto.imagem,
      ...(variacaoSelecionada && {
        variacaoId: variacaoSelecionada.id,
        variacaoNome: variacaoSelecionada.nome,
      }),
    })
    trackAddToCart({
      item_id: produto.id,
      item_name: produto.nome,
      item_category: produto.categoria ?? undefined,
      item_brand: 'Sixxis',
      price: precoAtual,
      quantity: quantidade,
      variant: variacaoSelecionada?.nome,
    })
    setAdicionado(true)
    setDrawerAberto(true)
    setTimeout(() => setAdicionado(false), 2500)
  }

  function handleComprar() {
    if (produto.temVariacoes && !variacaoSelecionada) {
      setModalVariacaoAberto(true)
      return
    }
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoAtual,
      quantidade,
      imagem: produto.imagem,
      ...(variacaoSelecionada && {
        variacaoId: variacaoSelecionada.id,
        variacaoNome: variacaoSelecionada.nome,
      }),
    })
    trackAddToCart({
      item_id: produto.id,
      item_name: produto.nome,
      item_category: produto.categoria ?? undefined,
      item_brand: 'Sixxis',
      price: precoAtual,
      quantity: quantidade,
      variant: variacaoSelecionada?.nome,
    })
    router.push(`/checkout?compra_direta=1&produto=${produto.id}`)
  }

  function handleModalConfirmarCheckout(v: VariacaoSelecionavel, qty: number) {
    const preco = v.preco ?? precoBase
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco,
      quantidade: qty,
      imagem: produto.imagem,
      variacaoId: v.id,
      variacaoNome: v.nome,
    })
    trackAddToCart({
      item_id: produto.id,
      item_name: produto.nome,
      item_category: produto.categoria ?? undefined,
      item_brand: 'Sixxis',
      price: preco,
      quantity: qty,
      variant: v.nome,
    })
    setModalVariacaoAberto(false)
    router.push(`/checkout?compra_direta=1&produto=${produto.id}`)
  }

  function handleModalConfirmarCarrinho(v: VariacaoSelecionavel, qty: number) {
    const preco = v.preco ?? precoBase
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco,
      quantidade: qty,
      imagem: produto.imagem,
      variacaoId: v.id,
      variacaoNome: v.nome,
    })
    trackAddToCart({
      item_id: produto.id,
      item_name: produto.nome,
      item_category: produto.categoria ?? undefined,
      item_brand: 'Sixxis',
      price: preco,
      quantity: qty,
      variant: v.nome,
    })
    setModalVariacaoAberto(false)
    setDrawerAberto(true)
  }

  return (
    <div>
      {/* Vendido por */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
          Vendido e entregue por <strong>Sixxis</strong>
        </span>
      </div>

      {/* Título */}
      <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-2">
        {produto.nome}
      </h1>

      {/* SKU */}
      {produto.sku && (
        <p className="text-xs text-gray-400 mb-3">(Cód. Item {produto.sku})</p>
      )}

      {/* Avaliações */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, minHeight: 0, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
        {totalAvaliacoes > 0 ? (
          <>
            <EstrelasNota nota={mediaAvaliacoes} size={14} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1, minHeight: 0 }}>
              {mediaAvaliacoes.toFixed(1)}
            </span>
            <a href="#avaliacoes" style={{ fontSize: 12, color: '#0066cc', lineHeight: 1, minHeight: 0, height: 'auto', display: 'inline', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              ({totalAvaliacoes} avaliações)
            </a>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1, minHeight: 0 }}>Seja o primeiro a avaliar</span>
        )}
        <span style={{ color: '#D1D5DB', fontSize: 12, lineHeight: 1, minHeight: 0 }}>|</span>
        <a
          href={`https://wa.me/5518997474701?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20${encodeURIComponent(produto.nome)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#3cbfb3', lineHeight: 1, minHeight: 0, height: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 500 }}
        >
          <MessageCircle size={12} style={{ flexShrink: 0 }} />
          Tire sua dúvida
        </a>
      </div>

      {/* Visitantes ao vivo */}
      {visitantes > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, minHeight: 0 }}>
          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.25)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1, minHeight: 0 }}>
            <strong style={{ color: '#111827' }}>{visitantes}</strong> pessoas estão vendo este produto agora
          </span>
        </div>
      )}

      {/* Badge desconto */}
      {desconto > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-[#dc2626] text-white text-xs font-black px-2.5 py-1 rounded-lg">
            Baixou {desconto}%
          </span>
        </div>
      )}

      {/* Bloco de preços */}
      <div className="mb-5">
        {precoOriginal > precoAtual && (
          <p className="text-sm text-gray-400 line-through mb-0.5">
            de R$ {fmt(precoOriginal)}
          </p>
        )}

        <div className="mb-2">
          <span className="text-gray-600 text-sm">por </span>
          <span className="text-2xl md:text-3xl font-bold md:font-black text-gray-900">R$ {fmt(precoAtual)}</span>
          <span className="text-sm text-gray-600 ml-2">
            em até <strong>6x</strong> de{' '}
            <strong>R$ {fmt(precoAtual / 6)}</strong> sem juros no cartão
          </span>
        </div>

        {/* PIX */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-[#f0fffe] border border-[#3cbfb3]/20 rounded-xl">
          <div className="w-8 h-8 bg-[#3cbfb3] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-[9px]">PIX</span>
          </div>
          <div>
            <span className="text-gray-500 text-sm">por </span>
            <span className="text-base md:text-lg font-bold md:font-black text-gray-900">R$ {fmt(precoAtVista)}</span>
            <span className="text-[#3cbfb3] text-sm font-semibold ml-1">com 3% de desconto</span>
          </div>
        </div>

        {/* Ver parcelamento */}
        <button
          onClick={() => setParcelasAberto(a => !a)}
          className="text-[#0066cc] text-sm hover:underline mb-4 flex items-center gap-1"
        >
          Ver mais opções de pagamento
          <ChevronDown size={14} className={`transition-transform ${parcelasAberto ? 'rotate-180' : ''}`} />
        </button>

        {parcelasAberto && (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-4">
            <div className="grid grid-cols-2 gap-3">

              {/* Coluna 1: 1x–6x sem juros */}
              <div>
                <p className="text-[10px] font-extrabold text-green-700 uppercase tracking-wide mb-2 text-center">
                  Sem juros
                </p>
                <div className="space-y-1">
                  {[1,2,3,4,5,6].map(n => (
                    <div key={n} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                      n === 6 ? 'bg-[#e8f8f7] border border-[#3cbfb3]/30' : 'bg-white border border-gray-100'
                    }`}>
                      <span className="font-bold text-gray-700 w-6">{n}x</span>
                      <span className={`font-bold ${n === 6 ? 'text-[#3cbfb3]' : 'text-gray-700'}`}>
                        R$ {fmt(precoAtual / n)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna 2: 7x–12x com juros */}
              <div>
                <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide mb-2 text-center">
                  Com juros
                </p>
                <div className="space-y-1">
                  {[7,8,9,10,11,12].map(n => {
                    const valor = calcPMT(precoAtual, taxa, n)
                    return (
                      <div key={n} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white border border-gray-100">
                        <span className="font-bold text-gray-700 w-6">{n}x</span>
                        <span className="font-bold text-gray-600">R$ {fmt(valor)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
            <p className="text-[10px] text-gray-400 text-center mt-3">
              * Parcelas com juros calculadas sobre o valor total. Confira no checkout.
            </p>
          </div>
        )}
      </div>

      {/* Variações */}
      {variacoesAtivas.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-bold text-gray-700 mb-2">
            {tipoVariacao}
            {variacaoSelecionada && (
              <span className="text-[#3cbfb3] font-normal ml-1">— {variacaoSelecionada.nome}</span>
            )}
            :
          </p>

          {isCor ? (
            /* ── Color circle selector (MercadoLivre style) ── */
            <div className="flex flex-wrap gap-3">
              {variacoesAtivas.map(v => {
                const hex = getCorHex(v.nome) ?? '#9ca3af'
                const isBranco = hex === '#f5f5f5'
                const isSelected = variacaoSelecionada?.id === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => selecionarVariacao(v)}
                    disabled={v.estoque === 0}
                    title={v.nome}
                    className={`relative w-10 h-10 rounded-full transition-all duration-150 focus:outline-none ${
                      v.estoque === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'
                    } ${isSelected ? 'ring-2 ring-offset-2 ring-[#3cbfb3] scale-110' : 'ring-1 ring-gray-200'}`}
                    style={{ backgroundColor: hex, border: isBranco ? '1px solid #e5e7eb' : 'none' }}
                    aria-label={v.nome}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <polyline points="20 6 9 17 4 12"
                            stroke={isBranco || hex === '#facc15' || hex === '#cbd5e1' || hex === '#d6b896' ? '#374151' : '#ffffff'}
                            strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                    {v.estoque === 0 && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 40 40">
                          <line x1="4" y1="36" x2="36" y2="4" stroke="#6b7280" strokeWidth="2"/>
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            /* ── Standard pill selector ── */
            <div className="flex flex-wrap gap-2">
              {variacoesAtivas.map(v => (
                <button
                  key={v.id}
                  onClick={() => selecionarVariacao(v)}
                  disabled={v.estoque === 0}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                    variacaoSelecionada?.id === v.id
                      ? 'border-[#3cbfb3] bg-[#e8f8f7] text-[#1a4f4a]'
                      : v.estoque === 0
                        ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:border-[#3cbfb3]/50'
                  }`}
                >
                  {v.nome}
                </button>
              ))}
            </div>
          )}

          {produto.temVariacoes && !variacaoSelecionada && (
            <p className="text-amber-600 text-xs font-medium mt-2">Selecione a opção para continuar</p>
          )}
        </div>
      )}

      {/* Estoque */}
      <div className="mb-4">
        {esgotado ? (
          <span className="text-red-600 text-sm font-bold">✗ Produto esgotado</span>
        ) : (
          <span className="text-green-700 text-sm font-semibold">✓ Em estoque</span>
        )}
      </div>

      {/* Seletor de quantidade */}
      {!esgotado && (
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm font-bold text-gray-700">Quantidade:</span>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantidade(q => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
              aria-label="Diminuir quantidade"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-base font-bold text-gray-900">{quantidade}</span>
            <button
              onClick={() => setQuantidade(q => q + 1)}
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
              aria-label="Aumentar quantidade"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col gap-3 mb-6 px-4 md:px-0">
        {/* COMPRAR AGORA — principal, sempre sólido */}
        <button
          onClick={handleComprar}
          disabled={esgotado}
          className="w-full text-white font-extrabold text-base py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          style={{
            backgroundColor: '#3cbfb3',
            boxShadow: '0 6px 20px rgba(60,191,179,0.40)',
            opacity: 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          Comprar Agora
        </button>

        {/* ADICIONAR AO CARRINHO — secundário, outline */}
        <button
          onClick={handleAddToCart}
          disabled={esgotado}
          className="w-full font-bold text-base py-3.5 rounded-2xl border-2 border-[#3cbfb3] text-[#3cbfb3] hover:bg-[#e8f8f7] disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5"
        >
          {adicionado ? <Check size={18} /> : <ShoppingCart size={18} />}
          {adicionado ? 'Adicionado ao Carrinho!' : 'Adicionar ao Carrinho'}
        </button>
      </div>

      {/* 6 Selos de confiança — grid 2x3 */}
      <div className="grid grid-cols-2 gap-2 mt-4 mb-5 border-t border-gray-100 pt-4">
        {SELOS_CONFIANCA.map(({ icon: Icon, titulo, sub }) => (
          <div
            key={titulo}
            className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-white hover:border-[#3cbfb3]/30 hover:bg-[#3cbfb3]/5 transition-all duration-200"
          >
            <div className="shrink-0 w-8 h-8 rounded-lg bg-[#3cbfb3]/10 flex items-center justify-center">
              <Icon size={15} className="text-[#3cbfb3]" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-gray-800 leading-tight">
                {titulo}
              </p>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Frete */}
      <CalcFrete produtoId={produto.id} />

      {/* Compartilhar + Favoritar */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Olha esse produto na Sixxis Store: ${produto.nome} — ${typeof window !== 'undefined' ? window.location.origin : 'https://sixxis-store-production.up.railway.app'}/produtos/${produto.slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#25D366] border border-gray-200 hover:border-[#25D366] rounded-lg px-3 py-2 transition-colors"
        >
          <Share2 size={13} />
          Compartilhar via WhatsApp
        </a>
        <button
          onClick={() => toggleFav(produto.id)}
          className={`inline-flex items-center gap-2 text-xs border rounded-lg px-3 py-2 transition-colors ${
            isFav
              ? 'text-red-500 border-red-300'
              : 'text-gray-500 hover:text-red-500 border-gray-200 hover:border-red-300'
          }`}
        >
          <Heart size={13} className={isFav ? 'fill-red-500' : ''} />
          {isFav ? 'Salvo' : 'Salvar'}
        </button>
      </div>

      {/* Barra fixa de compra — somente mobile */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-2.5 flex gap-2"
        style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={handleAddToCart}
          disabled={esgotado}
          className="flex-1 border-2 border-[#3cbfb3] text-[#3cbfb3] text-sm font-bold rounded-xl py-3 flex items-center justify-center gap-1.5 disabled:opacity-40 transition active:scale-[0.98]"
        >
          <ShoppingCart size={16} />
          Carrinho
        </button>
        <button
          onClick={handleComprar}
          disabled={esgotado}
          className="flex-[1.3] bg-[#3cbfb3] text-white text-sm font-bold rounded-xl py-3 disabled:opacity-40 transition active:scale-[0.98]"
          style={{ boxShadow: '0 4px 12px rgba(60,191,179,0.35)' }}
        >
          {esgotado ? 'Esgotado' : 'Comprar Agora'}
        </button>
      </div>

      {/* Modal de seleção de variação — abre quando user clica Comprar/Adicionar sem escolher */}
      <SelectVariacaoModal
        aberto={modalVariacaoAberto}
        fechar={() => setModalVariacaoAberto(false)}
        produto={{ id: produto.id, nome: produto.nome, imagem: produto.imagem }}
        variacoes={variacoesAtivas}
        precoBase={precoBase}
        tipoVariacao={tipoVariacao}
        onConfirmarCheckout={handleModalConfirmarCheckout}
        onConfirmarCarrinho={handleModalConfirmarCarrinho}
      />
    </div>
  )
}
