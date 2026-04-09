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

export default function CardProduto({ produto, showDesconto }: Props) {
  const { adicionarItem } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)

  const imagens     = produto.imagens as string[]
  const imagemCapa  = imagens?.[0] ?? null
  const preco       = Number(produto.preco)
  const promocional = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal  = promocional ?? preco
  const precoAtVista = precoFinal * 0.97
  const parcelamento = precoFinal / 6
  const desconto = (promocional && preco > 0) ? Math.round(((preco - promocional) / preco) * 100) : 0
  const isNovo = produto.createdAt
    ? (Date.now() - new Date(produto.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco: precoFinal,
      quantidade: 1,
    })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 hover:border-[#3cbfb3]/40 flex flex-col h-full">

      {/* Imagem — clicável para o produto */}
      <Link href={`/produtos/${produto.slug}`} className="block relative aspect-square bg-[#f8f9fa] overflow-hidden">
        {imagemCapa ? (
          <Image
            src={imagemCapa}
            alt={produto.nome}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
            <Package size={48} strokeWidth={1.5} />
            <span className="text-xs text-gray-400">Sem imagem</span>
          </div>
        )}

        {/* Badge desconto */}
        {promocional && desconto > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            -{desconto}%
          </span>
        )}

        {/* Badge Novo */}
        {isNovo && !promocional && (
          <span className="absolute top-2 left-2 bg-[#3cbfb3] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            Novo
          </span>
        )}

        {/* Fora de estoque */}
        {produto.estoque === 0 && (
          <div className="absolute inset-0 bg-white/85 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Fora de estoque</span>
          </div>
        )}
      </Link>

      {/* Infos */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Nome — clicável */}
        <Link href={`/produtos/${produto.slug}`} className="block flex-1 mb-3">
          <p className="font-semibold text-sm text-[#0a0a0a] line-clamp-2 leading-snug group-hover:text-[#3cbfb3] transition-colors duration-200">
            {produto.nome}
          </p>
        </Link>

        {/* Preços */}
        <div className="mb-4">
          {promocional && (
            <p className="text-xs text-gray-400 line-through mb-0.5">
              R$ {formatBRL(preco)}
            </p>
          )}
          <p className="text-xl font-black text-[#3cbfb3] leading-none mb-1">
            R$ {formatBRL(precoFinal)}
          </p>
          <p className="text-[11px] text-[#2a9d8f] font-semibold">
            R$ {formatBRL(precoAtVista)} no PIX <span className="text-gray-400 font-normal">(-3%)</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            6x de R$ {formatBRL(parcelamento)} s/ juros
          </p>
        </div>

        {/* Botão add ao carrinho */}
        <button
          onClick={handleAddToCart}
          disabled={produto.estoque === 0}
          className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition-all duration-200 ${
            adicionado
              ? 'bg-green-500 text-white scale-95'
              : 'bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {adicionado ? <Check size={16} /> : <ShoppingCart size={16} />}
          {adicionado ? 'Adicionado!' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}
