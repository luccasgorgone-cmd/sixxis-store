'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, ShoppingBag, Minus, Plus, Trash2, Truck, Package, Zap } from 'lucide-react'
import { useCarrinho } from '@/hooks/useCarrinho'

interface UpsellItem {
  id: string
  nome: string
  slug: string
  preco: number
  precoFinal: number
  desconto: number | null
  imagem: string | null
  pixPreco: string
}

const FRETE_GRATIS = 500

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CarrinhoDrawer() {
  const { itens, drawerAberto, setDrawerAberto, removerItem, atualizarQuantidade, total, adicionarItem } = useCarrinho()
  const [upsell, setUpsell] = useState<UpsellItem[]>([])

  // Fetch upsell products whenever cart opens or items change
  useEffect(() => {
    if (!drawerAberto || itens.length === 0) { setUpsell([]); return }
    const exclude = itens.map(i => i.produtoId).join(',')
    fetch(`/api/produtos/upsell?limit=3&exclude=${exclude}`)
      .then(r => r.json())
      .then(d => setUpsell(d.produtos || []))
      .catch(() => setUpsell([]))
  }, [drawerAberto, itens])

  // ESC close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerAberto(false)
    }
    if (drawerAberto) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawerAberto, setDrawerAberto])

  // body scroll lock + drawer signal
  useEffect(() => {
    document.body.style.overflow = drawerAberto ? 'hidden' : ''
    if (drawerAberto) {
      document.body.setAttribute('data-drawer-open', 'true')
    } else {
      document.body.removeAttribute('data-drawer-open')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.removeAttribute('data-drawer-open')
    }
  }, [drawerAberto])

  const faltaFrete   = Math.max(0, FRETE_GRATIS - total)
  const progressoPct = Math.min(100, (total / FRETE_GRATIS) * 100)
  const freteGratis  = total >= FRETE_GRATIS

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          drawerAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerAberto(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-[61] h-full flex flex-col shadow-2xl transition-transform duration-300"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#fff',
          transform: drawerAberto ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#3cbfb3]" />
            <h2 className="font-extrabold text-gray-900 text-base">Meu Carrinho</h2>
            {itens.length > 0 && (
              <span className="bg-[#3cbfb3] text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {itens.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setDrawerAberto(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
            aria-label="Fechar carrinho"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de progresso frete grátis */}
        <div className="px-5 py-3 border-b border-gray-50 shrink-0">
          {freteGratis ? (
            <div className="flex items-center gap-2 text-green-700">
              <Truck size={14} className="shrink-0" />
              <span className="text-xs font-bold">Parabéns! Você ganhou frete grátis!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Truck size={13} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600">
                Faltam <strong className="text-amber-600">R$ {fmt(faltaFrete)}</strong> para frete grátis
              </span>
            </div>
          )}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${freteGratis ? 'bg-green-500' : 'bg-amber-400'}`}
              style={{ width: `${progressoPct}%` }}
            />
          </div>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Package size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold">Seu carrinho está vazio</p>
              <p className="text-sm text-gray-400">Adicione produtos para começar</p>
              <button
                onClick={() => setDrawerAberto(false)}
                className="mt-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-2.5 rounded-xl transition text-sm"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            itens.map(item => (
              <div
                key={`${item.produtoId}-${item.variacaoId ?? ''}`}
                className="flex gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100"
              >
                {/* Imagem */}
                <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imagem} alt={item.nome} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Package size={24} className="text-gray-200" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{item.nome}</p>
                  {item.variacaoNome && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.variacaoNome}</p>
                  )}
                  <p className="text-sm font-extrabold text-[#3cbfb3] mt-1">
                    R$ {fmt(item.preco * item.quantidade)}
                  </p>

                  {/* Quantidade + remover */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => atualizarQuantidade(item.produtoId, item.quantidade - 1, item.variacaoId)}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
                        aria-label="Diminuir"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantidade}</span>
                      <button
                        onClick={() => atualizarQuantidade(item.produtoId, item.quantidade + 1, item.variacaoId)}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
                        aria-label="Aumentar"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removerItem(item.produtoId, item.variacaoId)}
                      className="text-gray-300 hover:text-red-400 transition p-1"
                      aria-label="Remover item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Upsell — você também pode gostar */}
          {itens.length > 0 && upsell.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Você também pode gostar</p>
              <div className="space-y-2.5">
                {upsell.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                    <Link href={`/produtos/${p.slug}`} onClick={() => setDrawerAberto(false)} className="shrink-0">
                      <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                        {p.imagem ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imagem} alt={p.nome} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package size={18} className="text-gray-200" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/produtos/${p.slug}`} onClick={() => setDrawerAberto(false)}>
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1 hover:text-[#3cbfb3] transition-colors">{p.nome}</p>
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-black text-gray-900">R$ {fmt(p.precoFinal)}</span>
                        {p.desconto && (
                          <span className="inline-flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            <Zap size={8} /> -{p.desconto}%
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#3cbfb3]">R$ {fmt(Number(p.pixPreco))} no PIX</p>
                    </div>
                    <button
                      onClick={() => adicionarItem({ produtoId: p.id, nome: p.nome, preco: p.precoFinal, quantidade: 1, imagem: p.imagem ?? undefined })}
                      className="shrink-0 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {itens.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3 shrink-0 bg-white">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-lg font-black text-gray-900">R$ {fmt(total)}</span>
            </div>
            <p className="text-xs text-gray-400 -mt-1">Frete calculado no checkout</p>

            {/* Selos */}
            <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-xl py-2 px-3 flex-wrap">
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                <span className="text-[10px] text-gray-500 font-medium">Compra Segura</span>
              </div>
              <div className="w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3cbfb3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span className="text-[10px] text-gray-500 font-medium">SSL Ativo</span>
              </div>
              <div className="w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1">
                <svg width="20" height="13" viewBox="0 0 200 130" fill="none">
                  <rect width="200" height="130" rx="10" fill="#009ee3"/>
                  <text x="100" y="85" textAnchor="middle" fill="white" fontSize="60" fontWeight="bold" fontFamily="Arial, sans-serif">MP</text>
                </svg>
                <span className="text-[10px] text-gray-500 font-medium">Mercado Pago</span>
              </div>
            </div>

            {/* Botões */}
            <Link
              href="/checkout"
              onClick={() => setDrawerAberto(false)}
              className="w-full flex items-center justify-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-[#3cbfb3]/25 hover:-translate-y-0.5 text-base"
            >
              <ShoppingBag size={18} />
              Finalizar Compra
            </Link>
            <Link
              href="/carrinho"
              onClick={() => setDrawerAberto(false)}
              className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 hover:border-[#3cbfb3] hover:text-[#3cbfb3] font-bold py-3 rounded-2xl transition text-sm"
            >
              Ver carrinho completo
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
