'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import { useCarrinho } from '@/hooks/useCarrinho'
import type { Produto } from '@prisma/client'

interface Props {
  produto: Produto
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CardProduto({ produto }: Props) {
  const { adicionarItem } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)

  const imagens     = produto.imagens as string[]
  const imagemCapa  = imagens?.[0] ?? null
  const preco       = Number(produto.preco)
  const promocional = produto.precoPromocional ? Number(produto.precoPromocional) : null
  const precoFinal  = promocional ?? preco
  const precoAtVista = precoFinal * 0.97
  const parcelamento = precoFinal / 12

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
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full">

      {/* Imagem — clicável para o produto */}
      <Link href={`/produtos/${produto.slug}`} className="block relative aspect-square bg-[#f8f9fa]">
        {imagemCapa ? (
          <Image
            src={imagemCapa}
            alt={produto.nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
            <Package size={48} strokeWidth={1.5} />
            <span className="text-xs text-gray-400">Sem imagem</span>
          </div>
        )}

        {/* Badge OFERTA */}
        {promocional && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
            OFERTA
          </span>
        )}

        {/* Fora de estoque */}
        {produto.estoque === 0 && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-400">Fora de estoque</span>
          </div>
        )}
      </Link>

      {/* Infos */}
      <div className="p-4 flex flex-col flex-1">
        {/* Nome — clicável */}
        <Link href={`/produtos/${produto.slug}`} className="block flex-1 mb-3">
          <p className="font-semibold text-sm text-[#0a0a0a] line-clamp-2 leading-snug hover:text-[#3cbfb3] transition-colors">
            {produto.nome}
          </p>
        </Link>

        {/* Preços */}
        <div className="space-y-0.5 mb-3">
          {promocional && (
            <p className="text-xs text-gray-400 line-through">
              R$ {formatBRL(preco)}
            </p>
          )}
          <p className="text-lg font-bold text-[#3cbfb3]">
            R$ {formatBRL(precoFinal)}
          </p>
          <p className="text-xs text-[#2a9d8f] font-medium">
            R$ {formatBRL(precoAtVista)} à vista no PIX (-3%)
          </p>
          <p className="text-xs text-gray-500">
            ou 12x de R$ {formatBRL(parcelamento)}
          </p>
        </div>

        {/* Botão add ao carrinho */}
        <button
          onClick={handleAddToCart}
          disabled={produto.estoque === 0}
          className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 ${
            adicionado
              ? 'bg-green-500 text-white'
              : 'bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {adicionado ? <Check size={16} /> : <ShoppingCart size={16} />}
          {adicionado ? 'Adicionado!' : 'Adicionar ao Carrinho'}
        </button>
      </div>
    </div>
  )
}
