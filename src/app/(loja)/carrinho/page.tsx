'use client'

import Link from 'next/link'
import { Trash2, ShoppingCart, ArrowRight, Minus, Plus } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'

export default function CarrinhoPage() {
  const { itens, removerItem, atualizarQuantidade, total } = useCarrinho()

  if (itens.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-5">
          <ShoppingCart size={28} className="text-[#3cbfb3]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0a0a0a] mb-3">Seu carrinho está vazio</h1>
        <p className="text-gray-500 text-sm mb-8">Explore nossos produtos e adicione ao carrinho.</p>
        <Link href="/produtos" className="btn-primary">
          Explorar Produtos <ArrowRight size={16} />
        </Link>
      </main>
    )
  }

  const frete = total >= 500 ? 0 : null

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] tracking-tight mb-6 sm:mb-8">
        Carrinho
      </h1>

      {/* Layout: flex-col em mobile, grid em lg */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 sm:gap-8">

        {/* ── Itens ── */}
        <div className="lg:col-span-2 space-y-3">
          {itens.map((item) => {
            const key = item.produtoId + (item.variacaoId ?? '')
            return (
              <div key={key} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#0a0a0a] line-clamp-2 leading-snug">{item.nome}</p>
                  {item.variacaoNome && (
                    <p className="text-xs text-[#3cbfb3] font-medium mt-0.5">{item.variacaoNome}</p>
                  )}
                  <p className="text-sm text-[#3cbfb3] font-semibold mt-1">
                    R$ {item.preco.toFixed(2)}
                  </p>
                </div>

                {/* Quantidade — botões grandes para toque */}
                <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden shrink-0">
                  <button
                    onClick={() => atualizarQuantidade(item.produtoId, item.quantidade - 1, item.variacaoId)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold transition"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{item.quantidade}</span>
                  <button
                    onClick={() => atualizarQuantidade(item.produtoId, item.quantidade + 1, item.variacaoId)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold transition"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="font-bold text-sm w-20 text-right shrink-0">
                  R$ {(item.preco * item.quantidade).toFixed(2)}
                </p>

                <button
                  onClick={() => removerItem(item.produtoId, item.variacaoId)}
                  className="text-gray-300 hover:text-red-400 transition shrink-0 p-1"
                  aria-label="Remover item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Resumo ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-bold text-lg text-[#0a0a0a] mb-5">Resumo</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frete</span>
              <span className={frete === 0 ? 'text-green-600 font-medium' : ''}>
                {frete === 0 ? 'Grátis' : 'Calculado no checkout'}
              </span>
            </div>
            {total >= 500 && (
              <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                Parabéns! Você ganhou frete grátis.
              </p>
            )}
            <div className="border-t pt-3 flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-[#3cbfb3]">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <Link href="/checkout" className="btn-primary w-full mt-6 justify-center">
            Finalizar Compra <ArrowRight size={16} />
          </Link>
          <Link
            href="/produtos"
            className="block text-center text-sm text-gray-500 hover:text-[#3cbfb3] transition mt-3"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </main>
  )
}
