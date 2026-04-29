'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'

interface Props {
  produtoId: string
  nome: string
  precoFinal: number
  esgotado: boolean
  temVariacoes: boolean
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function StickyBarMobile({ produtoId, nome, precoFinal, esgotado, temVariacoes }: Props) {
  const { adicionarItem } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionar() {
    adicionarItem({ produtoId, nome, preco: precoFinal, quantidade: 1 })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  function scrollToSelector() {
    const el = document.getElementById('seletor-variacao')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (esgotado) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center gap-3 md:hidden z-30 safe-area-bottom">
      <div className="shrink-0">
        <p className="text-xs text-gray-500 leading-none mb-0.5">Preço</p>
        <p className="text-xl font-black text-[#3cbfb3] leading-tight">
          R$&nbsp;{formatBRL(precoFinal)}
        </p>
      </div>
      {temVariacoes ? (
        <button
          onClick={scrollToSelector}
          className="flex-1 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold py-4 rounded-xl transition-all active:scale-[0.97]"
        >
          Escolher Opção
        </button>
      ) : (
        <button
          onClick={handleAdicionar}
          className={`flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all active:scale-[0.97] ${
            adicionado
              ? 'bg-green-500 text-white'
              : 'bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white'
          }`}
        >
          {adicionado ? <Check size={18} /> : <ShoppingCart size={18} />}
          {adicionado ? 'Adicionado!' : 'Adicionar ao Carrinho'}
        </button>
      )}
    </div>
  )
}
