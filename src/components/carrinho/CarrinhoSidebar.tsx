'use client'

import Link from 'next/link'
import { X, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'

interface Props {
  aberto: boolean
  fechar: () => void
}

export default function CarrinhoSidebar({ aberto, fechar }: Props) {
  const { itens, removerItem, total } = useCarrinho()

  return (
    <>
      {/* Overlay */}
      {aberto && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={fechar}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          aberto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-[#3cbfb3]" />
            <h2 className="font-bold text-[#0a0a0a]">Carrinho</h2>
          </div>
          <button
            onClick={fechar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Fechar carrinho"
          >
            <X size={18} />
          </button>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {itens.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-3">
                <ShoppingCart size={20} className="text-[#3cbfb3]" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Carrinho vazio</p>
              <p className="text-xs text-gray-400 mt-1">Adicione produtos para começar</p>
            </div>
          ) : (
            itens.map((item) => (
              <div key={item.produtoId} className="flex items-center gap-3 bg-[#f8f9fa] rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0a0a0a] truncate">{item.nome}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.quantidade}x{' '}
                    <span className="text-[#3cbfb3] font-medium">
                      R$ {item.preco.toFixed(2)}
                    </span>
                  </p>
                </div>
                <p className="text-sm font-bold text-[#0a0a0a] whitespace-nowrap">
                  R$ {(item.preco * item.quantidade).toFixed(2)}
                </p>
                <button
                  onClick={() => removerItem(item.produtoId)}
                  className="text-gray-300 hover:text-red-400 transition shrink-0"
                  aria-label="Remover item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {itens.length > 0 && (
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-extrabold text-lg text-[#3cbfb3]">
                R$ {total.toFixed(2)}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={fechar}
              className="btn-primary w-full justify-center"
            >
              Finalizar Compra <ArrowRight size={16} />
            </Link>
            <Link
              href="/carrinho"
              onClick={fechar}
              className="block text-center text-xs text-gray-500 hover:text-[#3cbfb3] transition"
            >
              Ver carrinho completo
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
