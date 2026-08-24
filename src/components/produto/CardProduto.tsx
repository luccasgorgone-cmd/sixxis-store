'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, Heart, GitCompare } from 'lucide-react'
import EstrelasNota from '@/components/ui/EstrelasNota'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useFavoritos, useComparador } from '@/hooks/useListas'
import { useState } from 'react'
import { trackAddToCart } from '@/lib/analytics/events'
import { feedId, feedIdProduto } from '@/lib/feed-id'
import { MAX_PARCELAS_SEM_JUROS, valorParcela } from '@/lib/parcelamento'
import { precoPix as aplicarDescontoPix, DESCONTO_PIX_PCT } from '@/lib/preco-pix'
import { inferirTipoVariacao } from '@/lib/variacao'
import SelectVariacaoModal, { type VariacaoSelecionavel } from '@/components/produto/SelectVariacaoModal'
import type { Produto } from '@/types'

interface Props {
  produto: Produto
  priority?: boolean
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CardProduto({ produto, priority = false }: Props) {
  const router = useRouter()
  const { adicionarItem, setDrawerAberto } = useCarrinho()
  const favIds = useFavoritos((s) => s.ids)
  const toggleFav = useFavoritos((s) => s.toggle)
  const cmpIds = useComparador((s) => s.ids)
  const toggleCmp = useComparador((s) => s.toggle)
  const isFav = favIds.includes(produto.id)
  const isCmp = cmpIds.includes(produto.id)
  const [adicionado, setAdicionado] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [modalVariacaoAberto, setModalVariacaoAberto] = useState(false)

  const imagens = produto.imagens as string[]
  const imagemCapa = !imgError && imagens?.[0] ? imagens[0] : null
  const preco = Number(produto.preco)
  const promocional = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal = promocional ?? preco
  const precoOriginal = promocional && preco > promocional ? preco : null
  const desconto = precoOriginal
    ? Math.round(((precoOriginal - precoFinal) / precoOriginal) * 100)
    : 0
  const precoPix = aplicarDescontoPix(precoFinal)
  const esgotado = (produto.estoque ?? 1) <= 0
  const isNovo = !desconto

  // Produto com variação (voltagem/cor) nunca pode ir pro carrinho sem a escolha
  // feita ativamente: adicionar sem escolher já gerou pedido com voltagem nula
  // (caso real: K531UFIN, Climatizador M45), e voltagem errada queima o aparelho
  // do cliente. O modal abaixo replica a mesma trava da PDP (SelectVariacaoModal
  // só libera Comprar/Adicionar depois de uma opção selecionada, nunca
  // pré-selecionada). `variacoes` não vem de todas as origens do card (algumas
  // buscas de produto não incluem o relacionamento) — nesse caso raro caímos de
  // volta pra página do produto, que sempre exige a escolha.
  const precisaEscolherVariacao = Boolean(produto.temVariacoes)
  const variacoesAtivas = (produto.variacoes ?? []).filter((v) => v.ativo)
  const temVariacoesCarregadas = variacoesAtivas.length > 0
  const tipoVariacao = inferirTipoVariacao(variacoesAtivas.map((v) => v.nome))

  // g:id do feed p/ este card (sem variação → item único: sku ?? slug).
  const gId = feedIdProduto({ sku: produto.sku, slug: produto.slug })

  function gIdVariacao(v: VariacaoSelecionavel): string {
    const completa = produto.variacoes?.find((x) => x.id === v.id)
    return feedId({ sku: produto.sku, slug: produto.slug }, completa, produto.variacoes)
  }

  const mediaAvaliacoes = (produto as { mediaAvaliacoes?: number }).mediaAvaliacoes ?? 0
  const totalAvaliacoes = (produto as { totalAvaliacoes?: number }).totalAvaliacoes ?? 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (esgotado || adicionado) return
    if (precisaEscolherVariacao) {
      if (!temVariacoesCarregadas) { router.push(`/produtos/${produto.slug}`); return }
      setModalVariacaoAberto(true)
      return
    }
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoFinal,
      quantidade: 1,
      imagem: imagemCapa || undefined,
      feedId: gId,
    })
    trackAddToCart({
      item_id: gId,
      produto_id: produto.id,
      item_slug: produto.slug,
      item_name: produto.nome,
      item_category: produto.categoria,
      item_brand: 'Sixxis',
      price: precoFinal,
      quantity: 1,
    })
    setAdicionado(true)
    setDrawerAberto(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  function handleComprarAgora(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (esgotado) return
    if (precisaEscolherVariacao) {
      if (!temVariacoesCarregadas) { router.push(`/produtos/${produto.slug}`); return }
      setModalVariacaoAberto(true)
      return
    }
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoFinal,
      quantidade: 1,
      imagem: imagemCapa || undefined,
      feedId: gId,
    })
    trackAddToCart({
      item_id: gId,
      produto_id: produto.id,
      item_slug: produto.slug,
      item_name: produto.nome,
      item_category: produto.categoria,
      item_brand: 'Sixxis',
      price: precoFinal,
      quantity: 1,
    })
    router.push(`/checkout?compra_direta=1&produto=${produto.id}`)
  }

  // Callbacks do SelectVariacaoModal — só disparam depois que o usuário
  // escolheu ativamente uma opção (o modal bloqueia os dois CTAs até lá).
  function handleModalConfirmarCarrinho(v: VariacaoSelecionavel, quantidade: number) {
    const preco = v.preco ?? precoFinal
    const gid = gIdVariacao(v)
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco,
      quantidade,
      imagem: imagemCapa || undefined,
      feedId: gid,
      variacaoId: v.id,
      variacaoNome: v.nome,
    })
    trackAddToCart({
      item_id: gid,
      produto_id: produto.id,
      item_slug: produto.slug,
      item_name: produto.nome,
      item_category: produto.categoria,
      item_brand: 'Sixxis',
      price: preco,
      quantity: quantidade,
      variant: v.nome,
    })
    setModalVariacaoAberto(false)
    setAdicionado(true)
    setDrawerAberto(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  function handleModalConfirmarCheckout(v: VariacaoSelecionavel, quantidade: number) {
    const preco = v.preco ?? precoFinal
    const gid = gIdVariacao(v)
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco,
      quantidade,
      imagem: imagemCapa || undefined,
      feedId: gid,
      variacaoId: v.id,
      variacaoNome: v.nome,
    })
    trackAddToCart({
      item_id: gid,
      produto_id: produto.id,
      item_slug: produto.slug,
      item_name: produto.nome,
      item_category: produto.categoria,
      item_brand: 'Sixxis',
      price: preco,
      quantity: quantidade,
      variant: v.nome,
    })
    setModalVariacaoAberto(false)
    router.push(`/checkout?compra_direta=1&produto=${produto.id}`)
  }

  return (
    <>
    <Link href={`/produtos/${produto.slug}`} className="block h-full group">
      <article className="bg-white h-full flex flex-col border border-gray-200/80 rounded-2xl overflow-hidden hover:border-[#3cbfb3]/30 hover:shadow-lg hover:shadow-gray-200/80 hover:-translate-y-0.5 transition-all duration-200">

        {/* Imagem */}
        <div className="relative bg-white overflow-hidden" style={{ aspectRatio: '1/1', minHeight: 'min(220px, 42vw)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          {/* Badge desconto */}
          {desconto > 0 && !esgotado && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="bg-[#dc2626] text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
                Baixou {desconto}%
              </span>
            </div>
          )}

          {/* Badge novo */}
          {isNovo && !esgotado && (
            <span className="absolute top-2.5 left-2.5 z-10 bg-[#3cbfb3] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
              NOVO
            </span>
          )}

          {/* Esgotado */}
          {esgotado && (
            <div className="absolute inset-0 bg-white/85 flex items-center justify-center z-10">
              <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                Esgotado
              </span>
            </div>
          )}

          {/* Favoritar — canto superior direito */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(produto.id) }}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all"
            title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              size={15}
              className={isFav ? 'text-red-500 fill-red-500' : 'text-gray-400'}
            />
          </button>

          {imagemCapa ? (
            <Image
              src={imagemCapa}
              alt={produto.nome}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              unoptimized
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={42} className="text-gray-200" />
            </div>
          )}

          {/* Overlay "Ver produto" ao hover */}
          {!esgotado && (
            <div className="absolute inset-0 bg-[#0f2e2b]/0 group-hover:bg-[#0f2e2b]/10
                            transition-colors duration-300 flex items-end justify-center pb-3 pointer-events-none">
              <span className="text-white text-xs font-bold bg-[#0f2e2b]/70 px-3 py-1.5
                               rounded-full opacity-0 group-hover:opacity-100 translate-y-2
                               group-hover:translate-y-0 transition-all duration-300">
                Ver produto
              </span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col flex-1 px-3 pt-3 pb-3">
          <p className="text-xs sm:text-sm text-gray-800 line-clamp-2 leading-snug font-medium mb-2 flex-1">
            {produto.nome}
          </p>

          {/* Avaliações */}
          {totalAvaliacoes > 0 && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <EstrelasNota nota={mediaAvaliacoes} size={12} />
              <span className="text-xs text-gray-500">({totalAvaliacoes})</span>
            </div>
          )}

          {/* Preços */}
          <div>
            {precoOriginal && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs text-gray-400 line-through">R$ {fmt(precoOriginal)}</span>
              </div>
            )}

            <p className="text-[17px] font-black text-gray-900 leading-none mb-1">
              R$ {fmt(precoFinal)}
            </p>

            <p className="hidden sm:block text-xs text-gray-500 mb-1">
              em até {MAX_PARCELAS_SEM_JUROS}x de <span className="font-semibold">R$ {fmt(valorParcela(precoFinal))}</span> sem juros
            </p>

            <p className="text-[11px] sm:text-xs text-[#3cbfb3] font-semibold mb-3 whitespace-nowrap">
              R$ {fmt(precoPix)} no Pix
              <span className="text-gray-400 font-normal whitespace-nowrap"> ({DESCONTO_PIX_PCT}% OFF)</span>
            </p>

            {/* Botões — Comprar Agora primeiro, Adicionar segundo. Sempre os dois,
                pra todo produto (com ou sem variação): quando exige escolha, o
                clique abre o modal de seleção em vez de agir direto. */}
            <div className="space-y-2">
              {!esgotado && (
                <button
                  onClick={handleComprarAgora}
                  className="w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white shadow-sm transition-all duration-200 active:scale-[0.98]"
                >
                  Comprar Agora
                </button>
              )}

              <button
                onClick={handleAddToCart}
                disabled={esgotado}
                className={`w-full font-bold py-2 md:py-2.5 px-2 rounded-xl text-xs md:text-sm flex items-center justify-center transition-all duration-200 active:scale-[0.98] ${
                  esgotado
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : adicionado
                      ? 'bg-green-500 text-white border-2 border-green-500'
                      : 'border-2 border-[#3cbfb3] text-[#3cbfb3] hover:bg-[#e8f8f7]'
                }`}
              >
                <span className="whitespace-nowrap">
                  {esgotado ? 'Esgotado' : adicionado ? 'Adicionado!' : 'Adicionar ao Carrinho'}
                </span>
              </button>

              {/* Comparar — oculto em mobile */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCmp(produto.id) }}
                className={`hidden md:flex text-xs font-medium items-center justify-center gap-1 w-full transition-colors ${
                  isCmp ? 'text-[#3cbfb3]' : 'text-gray-500 hover:text-[#3cbfb3]'
                }`}
              >
                <GitCompare size={12} />
                {isCmp ? 'Remover da comparação' : 'Comparar'}
              </button>
            </div>
          </div>
        </div>
      </article>
    </Link>

    {temVariacoesCarregadas && (
      <SelectVariacaoModal
        aberto={modalVariacaoAberto}
        fechar={() => setModalVariacaoAberto(false)}
        produto={{ id: produto.id, nome: produto.nome, imagem: imagemCapa || undefined }}
        variacoes={variacoesAtivas}
        precoBase={precoFinal}
        tipoVariacao={tipoVariacao}
        onConfirmarCheckout={handleModalConfirmarCheckout}
        onConfirmarCarrinho={handleModalConfirmarCarrinho}
      />
    )}
    </>
  )
}
