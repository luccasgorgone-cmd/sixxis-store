'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Star, Check, Zap, Eye } from 'lucide-react'
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
  const router = useRouter()
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

  // Cast para campos extras que podem vir da API
  const mediaAvaliacoes = (produto as { mediaAvaliacoes?: number }).mediaAvaliacoes ?? 0
  const totalAvaliacoes = (produto as { totalAvaliacoes?: number }).totalAvaliacoes ?? 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (esgotado || adicionado) return
    adicionarItem({ produtoId: produto.id, nome: produto.nome, preco: precoFinal, quantidade: 1 })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  function handleComprarAgora(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (esgotado) return
    adicionarItem({ produtoId: produto.id, nome: produto.nome, preco: precoFinal, quantidade: 1 })
    router.push(`/checkout?compra_direta=1&produto=${produto.id}`)
  }

  return (
    <Link href={`/produtos/${produto.slug}`} className="block h-full">
      <article className="bg-white h-full flex flex-col border border-gray-200 rounded-2xl overflow-hidden hover:border-[#3cbfb3]/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">

        {/* ── Área de imagem ──────────────────────────────── */}
        <div className="relative bg-gray-50 flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: '1 / 1' }}>

          {/* Badge desconto */}
          {desconto > 0 && !esgotado && (
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <span className="bg-[#3cbfb3] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg leading-tight shadow-md">
                -{desconto}%
              </span>
            </div>
          )}

          {/* Badge NOVO — produtos sem desconto */}
          {!desconto && !esgotado && (
            <div className="absolute top-2 left-2 z-10">
              <span className="bg-[#0f2e2b] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-lg leading-tight tracking-wide uppercase">
                NOVO
              </span>
            </div>
          )}

          {/* Badge esgotado */}
          {esgotado && (
            <div className="absolute inset-0 bg-white/85 flex items-center justify-center z-10">
              <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                Esgotado
              </span>
            </div>
          )}

          {/* "Ver detalhes" overlay on hover */}
          {!esgotado && (
            <div className="absolute inset-0 bg-[#0f2e2b]/0 group-hover:bg-[#0f2e2b]/20 flex items-center justify-center z-10 transition-all duration-300 opacity-0 group-hover:opacity-100">
              <span className="bg-white text-[#0f2e2b] text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Eye size={13} />
                Ver detalhes
              </span>
            </div>
          )}

          {imagemCapa ? (
            <Image
              src={imagemCapa}
              alt={produto.nome}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
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
          <p className="text-sm text-gray-700 font-semibold line-clamp-2 leading-snug mb-2 min-h-[36px]">
            {produto.nome}
          </p>

          {/* Estrelas */}
          {totalAvaliacoes > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  size={11}
                  className={
                    s <= Math.round(mediaAvaliacoes)
                      ? 'text-[#f59e0b] fill-[#f59e0b]'
                      : 'text-gray-200 fill-gray-200'
                  }
                />
              ))}
              <span className="text-[10px] text-gray-400 ml-0.5">({totalAvaliacoes})</span>
            </div>
          )}

          {/* Preços */}
          <div className="mt-auto mb-3">
            {precoOriginal && (
              <p className="text-xs text-gray-400 line-through leading-tight mb-0.5">
                R$ {fmt(precoOriginal)}
              </p>
            )}

            <p className="text-xl font-extrabold text-gray-900 leading-none mb-1">
              R$ {fmt(precoFinal)}
            </p>

            <p className="text-[11px] text-[#2a9d8f] font-semibold mb-0.5">
              No Pix R$ {fmt(precoPix)}
              <span className="text-gray-400 font-normal"> (3% OFF)</span>
            </p>

            <p className="text-[11px] text-gray-500">
              ou 6x de R$ {fmt(parcela)} sem juros
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAddToCart}
              disabled={esgotado}
              className={`w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
                esgotado
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : adicionado
                    ? 'bg-green-500 text-white'
                    : 'bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white shadow-sm'
              }`}
            >
              {adicionado ? <Check size={13} /> : <ShoppingCart size={13} />}
              {esgotado ? 'Esgotado' : adicionado ? 'Adicionado!' : 'Adicionar ao Carrinho'}
            </button>

            {!esgotado && (
              <button
                onClick={handleComprarAgora}
                className="w-full font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border-2 border-[#3cbfb3] text-[#3cbfb3] hover:bg-[#e8f8f7] transition-all duration-200 active:scale-95"
              >
                <Zap size={12} />
                Comprar Agora
              </button>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
