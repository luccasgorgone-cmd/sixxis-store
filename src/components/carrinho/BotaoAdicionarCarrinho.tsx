'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'
import { trackAddToCart } from '@/lib/analytics/events'
import type { Produto } from '@/types'

interface Props {
  produto: Produto
}

export default function BotaoAdicionarCarrinho({ produto }: Props) {
  const { adicionarItem } = useCarrinho()
  const [quantidade, setQuantidade] = useState(1)
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionar() {
    const preco = Number(produto.precoPromocional ?? produto.preco)
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      preco,
      quantidade,
    })
    trackAddToCart({
      item_id: produto.id,
      item_name: produto.nome,
      item_category: produto.categoria ?? undefined,
      item_brand: 'Sixxis',
      price: preco,
      quantity: quantidade,
    })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Seletor de quantidade */}
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
          className="px-3 py-2.5 hover:bg-gray-100 text-gray-600 font-bold transition"
        >
          −
        </button>
        <span className="px-4 py-2.5 font-semibold text-sm min-w-[2.5rem] text-center">{quantidade}</span>
        <button
          type="button"
          onClick={() => setQuantidade((q) => Math.min(produto.estoque, q + 1))}
          className="px-3 py-2.5 hover:bg-gray-100 text-gray-600 font-bold transition"
        >
          +
        </button>
      </div>

      {/* Botão adicionar */}
      <button
        type="button"
        onClick={handleAdicionar}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
          adicionado
            ? 'bg-green-500 text-white scale-95'
            : 'bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white hover:shadow-lg hover:-translate-y-0.5'
        }`}
      >
        {adicionado ? <Check size={18} /> : <ShoppingCart size={18} />}
        {adicionado ? 'Adicionado!' : 'Adicionar ao carrinho'}
      </button>
    </div>
  )
}
