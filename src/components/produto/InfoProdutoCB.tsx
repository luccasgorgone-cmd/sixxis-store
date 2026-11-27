'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, ChevronDown, Check, Share2, MessageCircle, Minus, Plus, Heart, Flame, Ticket,
} from 'lucide-react'
import EstrelasNota from '@/components/ui/EstrelasNota'
import CalcFrete from '@/components/produto/CalcFrete'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useFavoritos } from '@/hooks/useListas'
import SelectVariacaoModal, { type VariacaoSelecionavel } from '@/components/produto/SelectVariacaoModal'
import { trackAddToCart } from '@/lib/analytics/events'
import { precoPix, DESCONTO_PIX_PCT } from '@/lib/preco-pix'
import { feedId } from '@/lib/feed-id'
import { promoVigentePorFeedId } from '@/lib/promo-segunda-unidade'
import { MAX_PARCELAS_SEM_JUROS } from '@/lib/parcelamento'
import { inferirTipoVariacao } from '@/lib/variacao'
import { estoqueDisponivel } from '@/lib/produto-variacao'
import { beneficioCupomTexto, type CupomProduto } from '@/lib/cupom-pdp'
import WhatsAppTrackedLink from '@/components/analytics/WhatsAppTrackedLink'
import AvisoUltimasUnidades from '@/components/produto/AvisoUltimasUnidades'
import AvisoPrazoEntrega from '@/components/produto/AvisoPrazoEntrega'
import type { EstoquePromocionalBF, SaldoLoteBF } from '@/lib/estoque-promocional-bf'
import type { AvisoEntregaProduto } from '@/lib/produto-disponibilidade'

interface Variacao {
  id: string
  nome: string
  sku: string
  preco: number | null
  estoque: number
  ativo: boolean
  estoquePromocional?: SaldoLoteBF
}

// Color map for known color names
const COLOR_MAP: Record<string, string> = {
  preto: '#1a1a1a',
  preta: '#1a1a1a',
  black: '#1a1a1a',
  branco: '#f5f5f5',
  branca: '#f5f5f5',
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
    estoquePromocional?: EstoquePromocionalBF
    avisoEntrega?: AvisoEntregaProduto | null
  }
  variacoes: Variacao[]
  initialVariacaoId?: string
  // Legado: não é mais usado desde que o parcelamento virou "até Nx sem juros"
  // (fonte única em @/lib/parcelamento). Mantido só para não quebrar os callers.
  taxaJuros?: number
  mediaAvaliacoes: number
  totalAvaliacoes: number
  imagensPorVariacao?: Record<string, string[]>
  cuponsProduto?: CupomProduto[]
  onVariacaoChange?: (variacaoNome: string | null) => void
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function InfoProdutoCB({ produto, variacoes, initialVariacaoId, mediaAvaliacoes, totalAvaliacoes, imagensPorVariacao, cuponsProduto, onVariacaoChange }: Props) {
  const router = useRouter()
  const { adicionarItem, setDrawerAberto } = useCarrinho()
  const favIds = useFavoritos((s) => s.ids)
  const toggleFav = useFavoritos((s) => s.toggle)
  const isFav = favIds.includes(produto.id)

  // Derived from props — computed before useState so we can use them in initializers
  const variacoesAtivas = variacoes.filter(v => v.ativo)
  const tipoVariacao = inferirTipoVariacao(variacoesAtivas.map(v => v.nome))
  const isCor = tipoVariacao === 'Cor'

  // Pré-seleção SOMENTE para cor. Voltagem NUNCA é pré-selecionada: 110V x 220V
  // errado queima o aparelho, então a escolha tem que ser ativa do cliente.
  // Cor padrão depende da linha: bicicletas de spinning (Sixxis Life) abrem em
  // PRETO; os demais produtos continuam preferindo Branco.
  const coresPreferidas = produto.categoria === 'spinning'
    ? ['preta', 'preto']
    : ['branco', 'branca']
  const defaultVariacao = isCor
    ? (variacoesAtivas.find(v => v.id === initialVariacaoId) ??
      variacoesAtivas.find(v => coresPreferidas.some(c => v.nome.toLowerCase().includes(c))) ??
      variacoesAtivas[0] ?? null)
    : null

  // Escolha obrigatória. Usa temVariacoes OU a existência de variação ativa: se
  // a flag estiver dessincronizada no banco, a existência da variação manda —
  // nunca deixar sair item sem opção definida.
  const exigeVariacao = produto.temVariacoes || variacoesAtivas.length > 0

  const [variacaoSelecionada, setVariacaoSelecionada] = useState<Variacao | null>(defaultVariacao)
  const [adicionado, setAdicionado] = useState(false)
  const [parcelasAberto, setParcelasAberto] = useState(false)
  const [quantidade, setQuantidade] = useState(1)
  const [modalVariacaoAberto, setModalVariacaoAberto] = useState(false)
  const [cupomCopiado, setCupomCopiado] = useState<string | null>(null)

  // Copia o código do cupom p/ a área de transferência. Fallback silencioso: se
  // a clipboard API não existir (http/contexto inseguro), só não marca copiado.
  async function copiarCupom(codigo: string) {
    try {
      await navigator.clipboard?.writeText(codigo)
      setCupomCopiado(codigo)
      setTimeout(() => setCupomCopiado((c) => (c === codigo ? null : c)), 2000)
    } catch { /* clipboard indisponível — código fica visível p/ cópia manual */ }
  }

  // On mount, sync the default color selection with the gallery
  useEffect(() => {
    if (defaultVariacao && onVariacaoChange) {
      onVariacaoChange(defaultVariacao.nome)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const precoBase = produto.precoPromocional ?? produto.preco
  // Promo "2ª unidade" vigente p/ este produto (casa por sku ?? slug = feedId).
  const promoBadge = promoVigentePorFeedId(produto.sku ?? produto.slug)
  const precoAtual = variacaoSelecionada?.preco ?? precoBase
  const precoOriginal = produto.preco
  const desconto = precoOriginal > precoAtual
    ? Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100)
    : 0
  const precoAtVista = precoPix(precoAtual)
  // Lista de parcelas sem juros derivada da fonte única (1..MAX).
  const parcelasSemJuros = Array.from({ length: MAX_PARCELAS_SEM_JUROS }, (_, i) => i + 1)
  const estoqueAtual = variacaoSelecionada ? variacaoSelecionada.estoque : produto.estoque
  const estoquePromocionalAtual = variacaoSelecionada?.estoquePromocional ?? produto.estoquePromocional
  const esgotado = !estoqueDisponivel(estoqueAtual)

  function selecionarVariacao(v: Variacao | null) {
    setVariacaoSelecionada(v)
    if (onVariacaoChange) onVariacaoChange(v?.nome ?? null)
  }

  // Imagem que vai pro item do carrinho. Cascata: capa da COR escolhida →
  // capa do produto (comportamento antigo) → nada (drawer mostra placeholder).
  // Sem isso, adicionar "Branco" mostrava a foto preta (a capa) no carrinho.
  function imagemCarrinho(variacaoNome?: string | null): string | undefined {
    if (variacaoNome) {
      const capaDaCor = imagensPorVariacao?.[variacaoNome]?.[0]
      if (capaDaCor) return capaDaCor
    }
    return produto.imagem
  }

  // g:id do feed p/ este produto/variação (Meta content_ids / GA4 item_id).
  // `variacoes` (todas) decide se o produto é vendido por variação precificada.
  function gIdCarrinho(v?: { sku?: string | null; preco?: number | null } | null): string {
    return feedId({ sku: produto.sku, slug: produto.slug }, v, variacoes)
  }

  function handleAddToCart() {
    if (exigeVariacao && !variacaoSelecionada) {
      setModalVariacaoAberto(true)
      return
    }
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoAtual,
      quantidade,
      imagem: imagemCarrinho(variacaoSelecionada?.nome),
      feedId: gIdCarrinho(variacaoSelecionada),
      ...(variacaoSelecionada && {
        variacaoId: variacaoSelecionada.id,
        variacaoNome: variacaoSelecionada.nome,
      }),
    })
    trackAddToCart({
      item_id: gIdCarrinho(variacaoSelecionada),
      produto_id: produto.id,
      item_slug: produto.slug,
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
    if (exigeVariacao && !variacaoSelecionada) {
      setModalVariacaoAberto(true)
      return
    }
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoAtual,
      quantidade,
      imagem: imagemCarrinho(variacaoSelecionada?.nome),
      feedId: gIdCarrinho(variacaoSelecionada),
      ...(variacaoSelecionada && {
        variacaoId: variacaoSelecionada.id,
        variacaoNome: variacaoSelecionada.nome,
      }),
    })
    trackAddToCart({
      item_id: gIdCarrinho(variacaoSelecionada),
      produto_id: produto.id,
      item_slug: produto.slug,
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
    const gid = gIdCarrinho(variacoes.find((x) => x.id === v.id))
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco,
      quantidade: qty,
      imagem: imagemCarrinho(v.nome),
      feedId: gid,
      variacaoId: v.id,
      variacaoNome: v.nome,
    })
    trackAddToCart({
      item_id: gid,
      produto_id: produto.id,
      item_slug: produto.slug,
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
    const gid = gIdCarrinho(variacoes.find((x) => x.id === v.id))
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco,
      quantidade: qty,
      imagem: imagemCarrinho(v.nome),
      feedId: gid,
      variacaoId: v.id,
      variacaoNome: v.nome,
    })
    trackAddToCart({
      item_id: gid,
      produto_id: produto.id,
      item_slug: produto.slug,
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
        <span className="text-xs text-sx-muted bg-sx-raised border border-sx-line px-2 py-1 rounded-lg">
          Vendido e entregue por <strong>Sixxis</strong>
        </span>
      </div>

      {/* Título */}
      <h1 className="text-xl sm:text-2xl font-black text-sx-text leading-tight mb-2">
        {produto.nome}
      </h1>

      {/* SKU */}
      {produto.sku && (
        <p className="text-xs text-sx-subtle mb-3">(Cód. Item {produto.sku})</p>
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
          <span style={{ fontSize: 12, color: 'var(--sx-subtle)', lineHeight: 1, minHeight: 0 }}>Seja o primeiro a avaliar</span>
        )}
        <span aria-hidden="true" style={{ color: '#D1D5DB', fontSize: 12, lineHeight: 1, minHeight: 0 }}>|</span>
        <WhatsAppTrackedLink
          telefone="5518997474701"
          texto={`Olá! Tenho uma dúvida sobre ${produto.nome}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'var(--sx-accent-text)', lineHeight: 1, minHeight: 0, height: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 500 }}
        >
          <MessageCircle size={12} style={{ flexShrink: 0 }} />
          Tire sua dúvida
        </WhatsAppTrackedLink>
      </div>

      {/* Badge desconto */}
      {desconto > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-[#dc2626] text-white text-xs font-black px-2.5 py-1 rounded-lg">
            Baixou {desconto}%
          </span>
        </div>
      )}

      {/* Promo "2ª unidade" — bloco informativo; desconto automático por quantidade no carrinho */}
      {promoBadge && (
        <div className="mb-3 rounded-xl border border-sx-accent/30 bg-sx-surface p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 bg-sx-accent text-[#07201d] text-xs font-black px-2.5 py-1 rounded-lg">
              <Flame size={14} strokeWidth={2.25} color="#ea580c" fill="#fb923c" className="shrink-0" />
              {promoBadge.descricao}
            </span>
          </div>
          <p className="text-sm text-sx-muted leading-snug">
            Leve <strong className="text-sx-text">2 produtos</strong> e a <strong className="text-sx-text">2ª unidade sai com {promoBadge.percentual}% OFF</strong> — válido em
            <strong className="text-sx-text"> todo o site</strong>{promoBadge.ressalva ? <>, <strong className="text-sx-text">{promoBadge.ressalva}</strong></> : null}. Levando produtos diferentes, o desconto cai na unidade de
            <strong className="text-sx-text"> menor valor</strong>, <strong className="text-sx-text">automaticamente no carrinho</strong>.
          </p>
          <p className="text-xs text-sx-subtle mt-1">
            {promoBadge.fim
              ? `Válido até ${promoBadge.fim.slice(8, 10)}/${promoBadge.fim.slice(5, 7)}`
              : 'Por tempo limitado'} · não acumula com cupom
          </p>
        </div>
      )}

      {/* Cupom(s) exclusivo(s) deste produto — callout informativo. O desconto
          real é recomputado no servidor (/api/pedidos). */}
      {cuponsProduto && cuponsProduto.length > 0 && (
        <div className="mb-3 space-y-2">
          {cuponsProduto.map((c) => (
            <div key={c.codigo} className="rounded-xl border border-dashed border-sx-accent/60 bg-sx-surface p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 bg-sx-accent text-[#032E28] text-xs font-black px-2.5 py-1 rounded-lg">
                  <Ticket size={14} strokeWidth={2.25} className="shrink-0" />
                  Cupom deste produto
                </span>
              </div>
              <p className="text-sm text-sx-muted leading-snug">
                Use o cupom <strong className="text-sx-text">{c.codigo}</strong> e ganhe{' '}
                <strong className="text-sx-text">{beneficioCupomTexto(c)}</strong> neste produto.
                {c.descricao ? <span className="block text-xs text-sx-subtle mt-0.5">{c.descricao}</span> : null}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-sm font-black tracking-wide text-sx-text bg-sx-surface border border-sx-accent/40 rounded-lg px-2.5 py-1">
                  {c.codigo}
                </code>
                <button
                  type="button"
                  onClick={() => copiarCupom(c.codigo)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sx-text hover:text-sx-accent-text transition-colors"
                  aria-label={`Copiar cupom ${c.codigo}`}
                >
                  {cupomCopiado === c.codigo
                    ? (<><Check size={14} strokeWidth={2.5} /> Copiado</>)
                    : (<>Copiar código</>)}
                </button>
              </div>
              <p className="text-xs text-sx-subtle mt-1.5">Aplique no checkout. 1 cupom por pedido.</p>
            </div>
          ))}
        </div>
      )}

      <AvisoPrazoEntrega aviso={produto.avisoEntrega} className="mb-3" />
      <AvisoUltimasUnidades
        saldo={estoquePromocionalAtual}
        variacoes={variacoesAtivas}
        className="mb-3"
      />

      {/* Bloco de preços */}
      <div className="mb-5">
        {precoOriginal > precoAtual && (
          <p className="text-sm text-sx-subtle line-through mb-0.5">
            de R$ {fmt(precoOriginal)}
          </p>
        )}

        <div className="mb-2">
          <span className="text-sx-muted text-sm">por </span>
          <span className="text-2xl md:text-3xl font-bold md:font-black text-sx-text">R$ {fmt(precoAtual)}</span>
          <span className="text-sm text-sx-muted ml-2">
            em até <strong>{MAX_PARCELAS_SEM_JUROS}x</strong> de{' '}
            <strong>R$ {fmt(precoAtual / MAX_PARCELAS_SEM_JUROS)}</strong> sem juros no cartão
          </span>
        </div>

        {/* PIX */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-sx-surface border border-sx-accent/20 rounded-xl">
          <div className="w-8 h-8 bg-sx-accent rounded-lg flex items-center justify-center shrink-0">
            <span className="text-sx-ink font-black text-[9px]">PIX</span>
          </div>
          <div>
            <span className="text-sx-muted text-sm">por </span>
            <span className="text-base md:text-lg font-bold md:font-black text-sx-text">R$ {fmt(precoAtVista)}</span>
            <span className="text-sx-accent-text text-sm font-semibold ml-1">com {DESCONTO_PIX_PCT}% de desconto</span>
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
          <div className="bg-sx-raised rounded-2xl border border-sx-line p-4 mb-4">
            <p className="text-[10px] font-extrabold text-green-700 uppercase tracking-wide mb-2 text-center">
              Sem juros
            </p>
            {/* Contagem VERTICAL (column-major): 1..5 na coluna esquerda, 6..10 na
                direita. grid-flow-col preenche coluna a coluna; as linhas vêm de
                MAX_PARCELAS_SEM_JUROS/2 para acompanhar a fonte única (se virar 12x,
                viram 6 linhas em vez de estourar uma 3ª coluna). */}
            <div
              className="grid grid-cols-2 grid-flow-col gap-2"
              style={{ gridTemplateRows: `repeat(${Math.ceil(MAX_PARCELAS_SEM_JUROS / 2)}, auto)` }}
            >
              {parcelasSemJuros.map(n => (
                <div key={n} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                  n === MAX_PARCELAS_SEM_JUROS ? 'bg-sx-accent/10 border border-sx-accent/30' : 'bg-sx-surface border border-sx-line'
                }`}>
                  <span className="font-bold text-sx-text-2 w-6">{n}x</span>
                  <span className={`font-bold ${n === MAX_PARCELAS_SEM_JUROS ? 'text-sx-accent-text' : 'text-sx-text-2'}`}>
                    R$ {fmt(precoAtual / n)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-sx-subtle text-center mt-3">
              Parcelas sem juros no cartão de crédito. Confira as condições no checkout.
            </p>
          </div>
        )}
      </div>

      {/* Variações */}
      {variacoesAtivas.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-bold text-sx-text-2 mb-2">
            {tipoVariacao}
            {variacaoSelecionada && (
              <span className="text-sx-accent-text font-normal ml-1">— {variacaoSelecionada.nome}</span>
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
                    disabled={!estoqueDisponivel(v.estoque)}
                    title={v.nome}
                    className={`relative w-10 h-10 rounded-full transition-all duration-150 focus:outline-none ${
                      !estoqueDisponivel(v.estoque) ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'
                    } ${isSelected ? 'ring-2 ring-offset-2 ring-sx-accent scale-110' : 'ring-1 ring-gray-200'}`}
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
                    {!estoqueDisponivel(v.estoque) && (
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
                  disabled={!estoqueDisponivel(v.estoque)}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                    variacaoSelecionada?.id === v.id
                      ? 'border-sx-accent bg-sx-accent/10 text-sx-muted'
                      : !estoqueDisponivel(v.estoque)
                        ? 'border-sx-line text-sx-subtle line-through cursor-not-allowed'
                        : 'border-sx-line text-sx-muted hover:border-sx-accent/50'
                  }`}
                >
                  {v.nome}
                </button>
              ))}
            </div>
          )}

          {exigeVariacao && !variacaoSelecionada && (
            <p className="text-amber-700 text-xs font-medium mt-2">
              Selecione a {tipoVariacao === 'Variação' ? 'opção' : tipoVariacao.toLowerCase()} para continuar
            </p>
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
          <span className="text-sm font-bold text-sx-text-2">Quantidade:</span>
          <div className="flex items-center border border-sx-line rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantidade(q => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center text-sx-muted hover:bg-sx-raised transition"
              aria-label="Diminuir quantidade"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-base font-bold text-sx-text">{quantidade}</span>
            <button
              onClick={() => setQuantidade(q => q + 1)}
              className="w-9 h-9 flex items-center justify-center text-sx-muted hover:bg-sx-raised transition"
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
          className="w-full text-sx-ink font-extrabold text-base py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          style={{
            backgroundColor: 'var(--sx-accent)',
            boxShadow: '0 6px 20px rgba(60,191,179,0.40)',
            opacity: 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          className="w-full font-bold text-base py-3.5 rounded-2xl border-2 border-sx-accent text-sx-accent-text hover:bg-sx-accent/10 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5"
        >
          {adicionado ? <Check size={18} /> : <ShoppingCart size={18} />}
          {adicionado ? 'Adicionado ao Carrinho!' : 'Adicionar ao Carrinho'}
        </button>
      </div>

      {/* Frete — antes dos selos pra reduzir fricção pós-CTA (mobile/tablet/desktop) */}
      <div className="mt-4 border-t border-sx-line pt-4">
        <CalcFrete produtoId={produto.id} />
      </div>

      {/* Compartilhar + Favoritar */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Olha esse produto na Sixxis: ${produto.nome} — ${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sixxis.com.br')}/produtos/${produto.slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-sx-muted hover:text-[#25D366] border border-sx-line hover:border-[#25D366] rounded-lg px-3 py-2 transition-colors"
        >
          <Share2 size={13} />
          Compartilhar via WhatsApp
        </a>
        <button
          onClick={() => toggleFav(produto.id)}
          className={`inline-flex items-center gap-2 text-xs border rounded-lg px-3 py-2 transition-colors ${
            isFav
              ? 'text-red-500 border-red-300'
              : 'text-sx-muted hover:text-red-500 border-sx-line hover:border-red-300'
          }`}
        >
          <Heart size={13} className={isFav ? 'fill-red-500' : ''} />
          {isFav ? 'Salvo' : 'Salvar'}
        </button>
      </div>

      {/* Barra fixa de compra — somente mobile */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-sx-surface border-t border-sx-line shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-2.5 flex gap-2"
        style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={handleAddToCart}
          disabled={esgotado}
          className="flex-1 border-2 border-sx-accent text-sx-accent-text text-sm font-bold rounded-xl py-3 flex items-center justify-center gap-1.5 disabled:opacity-40 transition active:scale-[0.98]"
        >
          <ShoppingCart size={16} />
          Carrinho
        </button>
        <button
          onClick={handleComprar}
          disabled={esgotado}
          className="flex-[1.3] bg-sx-accent text-sx-ink text-sm font-bold rounded-xl py-3 disabled:opacity-40 transition active:scale-[0.98]"
          style={{ boxShadow: '0 4px 12px rgba(60,191,179,0.35)' }}
        >
          {esgotado ? 'Esgotado' : 'Comprar Agora'}
        </button>
      </div>

      {/* Modal de seleção de variação — abre quando user clica Comprar/Adicionar sem escolher */}
      <SelectVariacaoModal
        aberto={modalVariacaoAberto}
        fechar={() => setModalVariacaoAberto(false)}
        produto={{
          id: produto.id,
          nome: produto.nome,
          imagem: produto.imagem,
          estoquePromocional: produto.estoquePromocional,
          avisoEntrega: produto.avisoEntrega,
        }}
        variacoes={variacoesAtivas}
        precoBase={precoBase}
        tipoVariacao={tipoVariacao}
        onConfirmarCheckout={handleModalConfirmarCheckout}
        onConfirmarCarrinho={handleModalConfirmarCarrinho}
      />
    </div>
  )
}
