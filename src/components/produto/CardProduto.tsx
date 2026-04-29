'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, Package, Heart, GitCompare } from 'lucide-react'
import EstrelasNota from '@/components/ui/EstrelasNota'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useFavoritos, useComparador } from '@/hooks/useListas'
import { useState } from 'react'
import { trackAddToCart } from '@/lib/analytics/events'
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

  const imagens = produto.imagens as string[]
  const imagemCapa = !imgError && imagens?.[0] ? imagens[0] : null
  const preco = Number(produto.preco)
  const promocional = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal = promocional ?? preco
  const precoOriginal = promocional && preco > promocional ? preco : null
  const desconto = precoOriginal
    ? Math.round(((precoOriginal - precoFinal) / precoOriginal) * 100)
    : 0
  const precoPix = precoFinal * 0.97
  const esgotado = (produto.estoque ?? 1) <= 0
  const isNovo = !desconto
  const isSX040 = /sx040|sx-040/i.test(produto.slug || '') || /sx040|sx-040/i.test(produto.nome || '')

  const mediaAvaliacoes = (produto as { mediaAvaliacoes?: number }).mediaAvaliacoes ?? 0
  const totalAvaliacoes = (produto as { totalAvaliacoes?: number }).totalAvaliacoes ?? 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (esgotado || adicionado) return
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoFinal,
      quantidade: 1,
      imagem: imagemCapa || undefined,
    })
    trackAddToCart({
      item_id: produto.id,
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
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoFinal,
      quantidade: 1,
      imagem: imagemCapa || undefined,
    })
    trackAddToCart({
      item_id: produto.id,
      item_name: produto.nome,
      item_category: produto.categoria,
      item_brand: 'Sixxis',
      price: precoFinal,
      quantity: 1,
    })
    router.push(`/checkout?compra_direta=1&produto=${produto.id}`)
  }

  return (
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

          {/* Urgência — últimas unidades */}
          {isSX040 && !esgotado && (
            <span className="inline-block text-xs text-orange-500 font-medium mb-2">
              Últimas unidades
            </span>
          )}

          {/* Preços */}
          <div>
            {precoOriginal && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs text-gray-400 line-through">R$ {fmt(precoOriginal)}</span>
                <span className="text-[10px] text-[#dc2626] font-bold">Baixou {desconto}%</span>
              </div>
            )}

            <p className="text-[17px] font-black text-gray-900 leading-none mb-1">
              R$ {fmt(precoFinal)}
            </p>

            <p className="hidden sm:block text-xs text-gray-500 mb-1">
              em até 6x de <span className="font-semibold">R$ {fmt(precoFinal / 6)}</span> sem juros
            </p>

            <p className="text-xs text-[#3cbfb3] font-semibold mb-3">
              R$ {fmt(precoPix)} no Pix
              <span className="text-gray-400 font-normal"> (3% OFF)</span>
            </p>

            {/* Botões — Comprar Agora primeiro, Adicionar segundo */}
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
                className={`w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${
                  esgotado
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : adicionado
                      ? 'bg-green-500 text-white border-2 border-green-500'
                      : 'border-2 border-[#3cbfb3] text-[#3cbfb3] hover:bg-[#e8f8f7]'
                }`}
              >
                <ShoppingCart size={14} />
                {esgotado ? 'Esgotado' : adicionado ? (
                  <><Check size={14} /> Adicionado!</>
                ) : 'Adicionar ao Carrinho'}
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
  )
}
