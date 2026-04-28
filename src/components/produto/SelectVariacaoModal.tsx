'use client'

import { useEffect, useState } from 'react'
import { X, Minus, Plus, ShoppingCart, ShoppingBag, Package } from 'lucide-react'

export interface VariacaoSelecionavel {
  id: string
  nome: string
  preco: number | null
  estoque: number
  ativo: boolean
}

interface Props {
  aberto: boolean
  fechar: () => void
  produto: {
    id: string
    nome: string
    imagem?: string
  }
  variacoes: VariacaoSelecionavel[]
  precoBase: number
  tipoVariacao: string
  onConfirmarCheckout: (variacao: VariacaoSelecionavel, quantidade: number) => void
  onConfirmarCarrinho: (variacao: VariacaoSelecionavel, quantidade: number) => void
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function SelectVariacaoModal({
  aberto, fechar, produto, variacoes, precoBase, tipoVariacao,
  onConfirmarCheckout, onConfirmarCarrinho,
}: Props) {
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<VariacaoSelecionavel | null>(null)
  const [quantidade, setQuantidade] = useState(1)

  useEffect(() => {
    if (!aberto) {
      setVariacaoSelecionada(null)
      setQuantidade(1)
    }
  }, [aberto])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') fechar() }
    if (aberto) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      document.body.setAttribute('data-drawer-open', 'true')
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      document.body.removeAttribute('data-drawer-open')
    }
  }, [aberto, fechar])

  if (!aberto) return null

  const variacoesAtivas = variacoes.filter(v => v.ativo)
  const precoExibido = variacaoSelecionada?.preco ?? precoBase
  const podeContinuar = variacaoSelecionada !== null && variacaoSelecionada.estoque > 0

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[80] transition-opacity"
        onClick={fechar}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[81] w-full max-w-md bg-white shadow-2xl
                   bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2
                   rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Escolha uma opção"
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
            {produto.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-contain p-1" />
            ) : (
              <Package size={22} className="text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{produto.nome}</p>
            <p className="text-base font-black text-[#3cbfb3] mt-0.5">R$ {fmt(precoExibido)}</p>
          </div>
          <button
            onClick={fechar}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm font-bold text-gray-700 mb-3">
            Escolha {tipoVariacao === 'Variação' ? 'a opção' : `a ${tipoVariacao.toLowerCase()}`}
            {variacaoSelecionada && (
              <span className="text-[#3cbfb3] font-normal ml-1">— {variacaoSelecionada.nome}</span>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            {variacoesAtivas.map(v => {
              const sel = variacaoSelecionada?.id === v.id
              const sem = v.estoque === 0
              return (
                <button
                  key={v.id}
                  onClick={() => !sem && setVariacaoSelecionada(v)}
                  disabled={sem}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                    sel
                      ? 'border-[#3cbfb3] bg-[#e8f8f7] text-[#1a4f4a]'
                      : sem
                        ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:border-[#3cbfb3]/50'
                  }`}
                >
                  {v.nome}
                </button>
              )
            })}
          </div>

          {/* Quantidade */}
          <div className="flex items-center gap-3 mt-5">
            <span className="text-sm font-bold text-gray-700">Quantidade:</span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                aria-label="Diminuir"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-base font-bold text-gray-900">{quantidade}</span>
              <button
                onClick={() => setQuantidade(q => q + 1)}
                className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                aria-label="Aumentar"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {variacaoSelecionada && variacaoSelecionada.estoque === 0 && (
            <p className="text-red-500 text-xs font-medium mt-3">Esta opção está esgotada.</p>
          )}
        </div>

        {/* Footer com CTAs */}
        <div className="border-t border-gray-100 px-5 py-4 space-y-2.5 shrink-0 bg-white"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={() => podeContinuar && variacaoSelecionada && onConfirmarCheckout(variacaoSelecionada, quantidade)}
            disabled={!podeContinuar}
            className="w-full text-white font-extrabold text-base py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#3cbfb3',
              boxShadow: '0 6px 20px rgba(60,191,179,0.40)',
            }}
          >
            <ShoppingBag size={16} />
            Continuar para Checkout
          </button>
          <button
            onClick={() => podeContinuar && variacaoSelecionada && onConfirmarCarrinho(variacaoSelecionada, quantidade)}
            disabled={!podeContinuar}
            className="w-full font-bold text-sm py-3 rounded-2xl border-2 border-[#3cbfb3] text-[#3cbfb3] hover:bg-[#e8f8f7] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart size={15} />
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </>
  )
}
