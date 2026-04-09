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
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CardProduto({ produto }: Props) {
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
  const isNovo = produto.createdAt
    ? (Date.now() - new Date(produto.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false

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
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-[#3cbfb3]/40 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">

      {/* ── Imagem ── */}
      <Link href={`/produtos/${produto.slug}`} className="block relative aspect-square bg-[#f9fafb] overflow-hidden">
        {imagemCapa ? (
          <Image
            src={imagemCapa}
            alt={produto.nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
            <Package size={40} strokeWidth={1.5} />
            <span className="text-xs text-gray-400">Sem imagem</span>
          </div>
        )}

        {/* Badge OFERTA */}
        {promocional && desconto > 0 && (
          <span className="absolute top-2 left-2 bg-[#f59e0b] text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            -{desconto}%
          </span>
        )}

        {/* Badge NOVO */}
        {isNovo && !promocional && (
          <span className="absolute top-2 left-2 bg-[#3cbfb3] text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            Novo
          </span>
        )}

        {/* ESGOTADO */}
        {produto.estoque === 0 && (
          <div className="absolute inset-0 bg-white/85 flex items-center justify-center">
            <span className="text-xs font-bold text-white bg-gray-400 px-3 py-1 rounded-md">
              Esgotado
            </span>
          </div>
        )}
      </Link>

      {/* ── Infos ── */}
      <div className="p-3 sm:p-5 flex flex-col flex-1">

        {/* Nome */}
        <Link href={`/produtos/${produto.slug}`} className="block flex-1 mb-2.5">
          <p className="font-semibold text-sm text-[#1f2937] line-clamp-2 leading-snug group-hover:text-[#3cbfb3] transition-colors duration-200">
            {produto.nome}
          </p>
        </Link>

        {/* Preços */}
        <div className="mb-3 space-y-0.5">
          {promocional && (
            <p className="text-xs text-gray-400 line-through">
              R$ {formatBRL(preco)}
            </p>
          )}
          <p className={`text-lg sm:text-xl font-black leading-none ${promocional ? 'text-[#3cbfb3]' : 'text-[#1f2937]'}`}>
            R$ {formatBRL(precoFinal)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-[#3cbfb3] font-semibold">
            💠 PIX: R$ {formatBRL(precoAtVista)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-gray-500">
            ou 6x de R$ {formatBRL(parcelamento)}
          </p>
        </div>

        {/* Botão */}
        <button
          onClick={handleAddToCart}
          disabled={produto.estoque === 0}
          className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-2.5 sm:py-3 rounded-xl transition-all duration-200 ${
            adicionado
              ? 'bg-[#22c55e] text-white scale-[0.98]'
              : 'bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none'
          }`}
        >
          {adicionado ? <Check size={15} /> : <ShoppingCart size={15} />}
          <span className="hidden sm:inline">{adicionado ? 'Adicionado!' : 'Adicionar ao Carrinho'}</span>
          <span className="sm:hidden">{adicionado ? 'Adicionado!' : 'Adicionar'}</span>
        </button>
      </div>
    </div>
  )
}
