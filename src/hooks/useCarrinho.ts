'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TipoCupom } from '@/lib/preco-cupom'

export interface ItemCarrinho {
  produtoId:    string
  nome:         string
  preco:        number
  quantidade:   number
  imagem?:      string
  variacaoId?:  string
  variacaoNome?: string
}

// Cupom aplicado fica no estado global pra sincronizar /carrinho ↔ /checkout.
// Antes da Sprint 2C cada página tinha seu próprio state local — cliente
// aplicava no carrinho e tinha que reaplicar no checkout.
export interface CupomAplicadoStore {
  codigo:    string
  tipo:      TipoCupom
  valor:     number  // parâmetro do cupom (10 = 10%, 50 = R$50)
  desconto:  number  // já calculado em reais
  descricao: string
}

function itemKey(produtoId: string, variacaoId?: string) {
  return produtoId + '::' + (variacaoId ?? '')
}

interface CarrinhoStore {
  itens: ItemCarrinho[]
  drawerAberto: boolean
  cupomAplicado: CupomAplicadoStore | null
  setDrawerAberto: (v: boolean) => void
  adicionarItem: (item: ItemCarrinho) => void
  removerItem: (produtoId: string, variacaoId?: string) => void
  atualizarQuantidade: (produtoId: string, quantidade: number, variacaoId?: string) => void
  limparCarrinho: () => void
  setCupom: (c: CupomAplicadoStore | null) => void
}

// NOTA: total/totalItens NÃO podem ser getters JS no objeto do store, porque o
// Zustand internamente faz Object.assign({}, current, partial) ao processar set(),
// o que invoca o getter e congela o valor primitivo no novo estado. Por isso eles
// retornam sempre o valor inicial (0). A solução correta é expor seletores hook
// que recalculam reativamente a cada mudança em `itens`.
export const useCarrinho = create<CarrinhoStore>()(
  persist(
    (set, get) => ({
      itens: [],
      drawerAberto: false,
      cupomAplicado: null,
      setDrawerAberto: (v) => set({ drawerAberto: v }),
      setCupom: (c) => set({ cupomAplicado: c }),
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
        set({ itens: [], cupomAplicado: null })
      },
    }),
    {
      name: 'sixxis-carrinho',
      partialize: (state) => ({ itens: state.itens, cupomAplicado: state.cupomAplicado }),
    },
  ),
)

// Seletores reativos — usar em componentes para ler subtotal/quantidade.
// Cada chamada subscribe ao slice de `itens` e recalcula quando muda.
export const useTotalCarrinho = () =>
  useCarrinho((s) => s.itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0))

export const useTotalItens = () =>
  useCarrinho((s) => s.itens.reduce((acc, i) => acc + i.quantidade, 0))
