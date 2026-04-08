'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ItemCarrinho {
  produtoId: string
  nome: string
  preco: number
  quantidade: number
}

interface CarrinhoStore {
  itens: ItemCarrinho[]
  adicionarItem: (item: ItemCarrinho) => void
  removerItem: (produtoId: string) => void
  atualizarQuantidade: (produtoId: string, quantidade: number) => void
  limparCarrinho: () => void
  total: number
  totalItens: number
}

export const useCarrinho = create<CarrinhoStore>()(
  persist(
    (set, get) => ({
      itens: [],
      get total() {
        return get().itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
      },
      get totalItens() {
        return get().itens.reduce((acc, item) => acc + item.quantidade, 0)
      },
      adicionarItem(item) {
        set((state) => {
          const existente = state.itens.find((i) => i.produtoId === item.produtoId)
          if (existente) {
            return {
              itens: state.itens.map((i) =>
                i.produtoId === item.produtoId
                  ? { ...i, quantidade: i.quantidade + item.quantidade }
                  : i,
              ),
            }
          }
          return { itens: [...state.itens, item] }
        })
      },
      removerItem(produtoId) {
        set((state) => ({
          itens: state.itens.filter((i) => i.produtoId !== produtoId),
        }))
      },
      atualizarQuantidade(produtoId, quantidade) {
        if (quantidade <= 0) {
          get().removerItem(produtoId)
          return
        }
        set((state) => ({
          itens: state.itens.map((i) =>
            i.produtoId === produtoId ? { ...i, quantidade } : i,
          ),
        }))
      },
      limparCarrinho() {
        set({ itens: [] })
      },
    }),
    { name: 'sixxis-carrinho' },
  ),
)
