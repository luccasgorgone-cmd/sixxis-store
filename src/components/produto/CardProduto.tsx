'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, Check } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useState } from 'react'
import type { Produto } from '@/types'

interface Props {
  produto: Produto
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CardProduto({ produto }: Props) {
  const { adicionarItem } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)
  const [imgError, setImgError]     = useState(false)

  const imagens     = produto.imagens as string[]
  const imagemCapa  = !imgError && imagens?.[0] ? imagens[0] : null
  const preco       = Number(produto.preco)
  const promocional = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal  = promocional ?? preco
  const precoOriginal = promocional && preco > promocional ? preco : null
  const desconto    = precoOriginal
    ? Math.round(((precoOriginal - precoFinal) / precoOriginal) * 100)
    : 0
  const precoPix  = precoFinal * 0.97
  const parcela   = precoFinal / 6
  const esgotado  = (produto.estoque ?? 1) <= 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (esgotado || adicionado) return
    adicionarItem({ produtoId: produto.id, nome: produto.nome, preco: precoFinal, quantidade: 1 })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  return (
    <Link href={`/produtos/${produto.slug}`} className="block h-full">
      <article className="bg-white h-full flex flex-col border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">

        {/* ── Área de imagem ──────────────────────────────── */}
        <div className="relative bg-white flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: '1 / 1' }}>

          {/* Badge desconto */}
          {desconto > 0 && (
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <span className="bg-[#3cbfb3] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md leading-tight">
                -{desconto}%
              </span>
              <span className="bg-[#dcfce7] text-[#16a34a] text-[10px] font-bold px-2 py-0.5 rounded-md leading-tight">
                Baixou {desconto}%
              </span>
            </div>
          )}

          {/* Badge esgotado */}
          {esgotado && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-md">
                Esgotado
              </span>
            </div>
          )}

          {imagemCapa ? (
            <Image
              src={imagemCapa}
              alt={produto.nome}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              loading="lazy"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <ShoppingCart size={40} className="text-gray-200" />
            </div>
          )}
        </div>

        {/* ── Conteúdo ───────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-3 border-t border-gray-100">

          {/* Nome */}
          <p className="text-sm text-gray-700 font-medium line-clamp-2 leading-snug mb-2 min-h-[36px]">
            {produto.nome}
          </p>

          {/* Estrelas — exibidas quando houver avaliações cadastradas */}
          {(produto as { mediaAvaliacoes?: number; totalAvaliacoes?: number }).totalAvaliacoes ? (
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  size={11}
                  className={
                    s <= Math.round((produto as { mediaAvaliacoes?: number }).mediaAvaliacoes ?? 0)
                      ? 'text-[#f59e0b] fill-[#f59e0b]'
                      : 'text-gray-200 fill-gray-200'
                  }
                />
              ))}
              <span className="text-[10px] text-gray-400 ml-0.5">
                ({(produto as { totalAvaliacoes?: number }).totalAvaliacoes})
              </span>
            </div>
          ) : null}

          {/* Preços */}
          <div className="mt-auto">
            {precoOriginal && (
              <p className="text-xs text-gray-400 line-through leading-tight mb-0.5">
                R$ {fmt(precoOriginal)}
              </p>
            )}

            {/* Preço final — máximo destaque */}
            <p className="text-xl font-extrabold text-gray-900 leading-none mb-1">
              R$ {fmt(precoFinal)}
            </p>

            {/* PIX */}
            <p className="text-[11px] text-[#2a9d8f] font-semibold mb-0.5">
              No Pix R$ {fmt(precoPix)}
              <span className="text-gray-400 font-normal"> (3% OFF)</span>
            </p>

            {/* Parcelamento */}
            <p className="text-[11px] text-gray-500">
              ou 6x de R$ {fmt(parcela)} sem juros
            </p>
          </div>

          {/* Botão */}
          <button
            onClick={handleAddToCart}
            disabled={esgotado}
            className={`mt-3 w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
              esgotado
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : adicionado
                  ? 'bg-green-500 text-white'
                  : 'bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white'
            }`}
          >
            {adicionado ? <Check size={14} /> : <ShoppingCart size={14} />}
            {esgotado ? 'Esgotado' : adicionado ? 'Adicionado!' : 'Adicionar ao Carrinho'}
          </button>
        </div>
      </article>
    </Link>
  )
}
