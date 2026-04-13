'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import { useCarrinho } from '@/hooks/useCarrinho'
import type { Produto } from '@/types'

interface Props {
  produto:      Produto
  showDesconto?: boolean
  ofertaBadge?: boolean
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CardProduto({ produto, ofertaBadge = false }: Props) {
  const { adicionarItem } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)

  const imagens      = produto.imagens as string[]
  const imagemCapa   = imagens?.[0] ?? null
  const preco        = Number(produto.preco)
  const promocional  = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal   = promocional ?? preco
  const precoAtVista = precoFinal * 0.97
  const parcelamento = precoFinal / 6
  const desconto     = (promocional && preco > 0)
    ? Math.round(((preco - promocional) / preco) * 100)
    : 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    adicionarItem({
      produtoId: produto.id,
      nome:      produto.nome,
      preco:     precoFinal,
      quantidade: 1,
    })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-[#3cbfb3]/40 hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col">

      {/* Imagem */}
      <Link href={`/produtos/${produto.slug}`} className="relative bg-white p-4 flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
        {/* Badge desconto */}
        {desconto > 0 && (
          <span className="absolute top-2 left-2 bg-[#3cbfb3] text-white text-xs font-black px-2 py-1 rounded-md z-10">
            -{desconto}%
          </span>
        )}
        {/* Badge oferta relâmpago */}
        {ofertaBadge && !desconto && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-md z-10">
            OFERTA
          </span>
        )}
        {/* Esgotado */}
        {produto.estoque === 0 && (
          <div className="absolute inset-0 bg-white/85 flex items-center justify-center z-10">
            <span className="text-xs font-bold text-white bg-gray-400 px-3 py-1 rounded-md">
              Esgotado
            </span>
          </div>
        )}
        {imagemCapa ? (
          <Image
            src={imagemCapa}
            alt={produto.nome}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
            <Package size={40} strokeWidth={1.5} />
            <span className="text-xs text-gray-400">Sem imagem</span>
          </div>
        )}
      </Link>

      {/* Conteúdo */}
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/produtos/${produto.slug}`} className="block mb-2">
          <p className="text-sm text-gray-700 line-clamp-2 leading-snug min-h-[40px] group-hover:text-[#3cbfb3] transition-colors">
            {produto.nome}
          </p>
        </Link>

        <div className="mt-auto">
          {/* Preço original riscado */}
          {promocional && promocional < preco && (
            <p className="text-xs text-gray-400 line-through mb-0.5">
              R$ {formatBRL(preco)}
            </p>
          )}

          {/* Badge desconto textual */}
          {desconto > 0 && (
            <span className="inline-block bg-[#3cbfb3]/10 text-[#2a9d8f] text-xs font-bold px-2 py-0.5 rounded mb-1">
              Baixou {desconto}%
            </span>
          )}

          {/* Preço principal */}
          <p className="text-xl font-extrabold text-gray-900 leading-tight">
            R$ {formatBRL(precoFinal)}
          </p>

          {/* PIX */}
          <p className="text-xs text-[#3cbfb3] font-semibold mt-0.5">
            No Pix R$ {formatBRL(precoAtVista)} (3% OFF)
          </p>

          {/* Parcelamento */}
          <p className="text-xs text-gray-500 mt-0.5">
            ou 6x de R$ {formatBRL(parcelamento)} sem juros
          </p>
        </div>

        {/* Botão */}
        <button
          onClick={handleAddToCart}
          disabled={produto.estoque === 0}
          className={`mt-3 w-full text-sm font-bold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            adicionado
              ? 'bg-[#22c55e] text-white'
              : 'bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {adicionado ? <Check size={14} /> : <ShoppingCart size={14} />}
          {adicionado ? 'Adicionado!' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}
