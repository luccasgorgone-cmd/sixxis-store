'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ItemCarrinho {
  produtoId:    string
  nome:         string
  preco:        number
  quantidade:   number
  imagem?:      string
  variacaoId?:  string
  variacaoNome?: string
}

// Chave única por produto + variação
function itemKey(produtoId: string, variacaoId?: string) {
  return produtoId + '::' + (variacaoId ?? '')
}

interface CarrinhoStore {
  itens: ItemCarrinho[]
  drawerAberto: boolean
  setDrawerAberto: (v: boolean) => void
  adicionarItem: (item: ItemCarrinho) => void
  removerItem: (produtoId: string, variacaoId?: string) => void
  atualizarQuantidade: (produtoId: string, quantidade: number, variacaoId?: string) => void
  limparCarrinho: () => void
  total: number
  totalItens: number
}

export const useCarrinho = create<CarrinhoStore>()(
  persist(
    (set, get) => ({
      itens: [],
      drawerAberto: false,
      setDrawerAberto: (v) => set({ drawerAberto: v }),
      get total() {
        return get().itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
      },
      get totalItens() {
        return get().itens.reduce((acc, item) => acc + item.quantidade, 0)
      },
      adicionarItem(item) {
        const key = itemKey(item.produtoId, item.variacaoId)
        set((state) => {
          const existente = state.itens.find(
            (i) => itemKey(i.produtoId, i.variacaoId) === key,
          )
          if (existente) {
            return {
              itens: state.itens.map((i) =>
                itemKey(i.produtoId, i.variacaoId) === key
                  ? { ...i, quantidade: i.quantidade + item.quantidade }
                  : i,
              ),
            }
          }
          return { itens: [...state.itens, item] }
        })
      },
      removerItem(produtoId, variacaoId) {
        const key = itemKey(produtoId, variacaoId)
        set((state) => ({
          itens: state.itens.filter(
            (i) => itemKey(i.produtoId, i.variacaoId) !== key,
          ),
        }))
      },
      atualizarQuantidade(produtoId, quantidade, variacaoId) {
        const key = itemKey(produtoId, variacaoId)
        if (quantidade <= 0) {
          get().removerItem(produtoId, variacaoId)
          return
        }
        set((state) => ({
          itens: state.itens.map((i) =>
            itemKey(i.produtoId, i.variacaoId) === key ? { ...i, quantidade } : i,
          ),
        }))
      },
      limparCarrinho() {
        set({ itens: [] })
      },
    }),
    {
      name: 'sixxis-carrinho',
      partialize: (state) => ({ itens: state.itens }),
    },
  ),
)
