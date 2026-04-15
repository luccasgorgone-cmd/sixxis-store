'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, Zap, Package } from 'lucide-react'
import EstrelasNota from '@/components/ui/EstrelasNota'
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
  const { adicionarItem, setDrawerAberto } = useCarrinho()
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

          {imagemCapa ? (
            <Image
              src={imagemCapa}
              alt={produto.nome}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              unoptimized
              loading="lazy"
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
                <span className="text-[10px] text-[#dc2626] font-bold">Baixou {desconto}%</span>
              </div>
            )}

            <p className="text-[17px] font-black text-gray-900 leading-none mb-1">
              R$ {fmt(precoFinal)}
            </p>

            <p className="text-xs text-gray-500 mb-1">
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
                  <Zap size={14} />
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
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
