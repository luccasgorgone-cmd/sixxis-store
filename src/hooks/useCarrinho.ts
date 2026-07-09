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
  // g:id do feed (Meta content_ids / GA4 item_id). Calculado com feedId() no
  // momento do add (onde temos sku/slug/variação). Persiste no carrinho p/ os
  // eventos de checkout/purchase mandarem o id do catálogo, não o CUID.
  feedId?:      string
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
  // Opt-in de uso do cashback — sincroniza /carrinho ↔ /checkout. Default false.
  usarCashback: boolean
  setDrawerAberto: (v: boolean) => void
  adicionarItem: (item: ItemCarrinho) => void
  removerItem: (produtoId: string, variacaoId?: string) => void
  atualizarQuantidade: (produtoId: string, quantidade: number, variacaoId?: string) => void
  limparCarrinho: () => void
  setCupom: (c: CupomAplicadoStore | null) => void
  setUsarCashback: (v: boolean) => void
  // Hidratação do persist (localStorage) — false até a reidratação assíncrona
  // terminar. Consumidores usam para evitar decidir "carrinho vazio" cedo demais.
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
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
      usarCashback: false,
      _hasHydrated: false,
      setDrawerAberto: (v) => set({ drawerAberto: v }),
      setCupom: (c) => set({ cupomAplicado: c }),
      setUsarCashback: (v) => set({ usarCashback: v }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
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
        set({ itens: [], cupomAplicado: null, usarCashback: false })
      },
    }),
    {
      name: 'sixxis-carrinho',
      partialize: (state) => ({
        itens: state.itens,
        cupomAplicado: state.cupomAplicado,
        usarCashback: state.usarCashback,
      }),
      // Dispara quando a reidratação do localStorage termina (automático). O
      // _hasHydrated NÃO é persistido (fora do partialize) — começa false no
      // servidor e no primeiro paint, e vira true só após reidratar no cliente.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

// Seletores reativos — usar em componentes para ler subtotal/quantidade.
// Cada chamada subscribe ao slice de `itens` e recalcula quando muda.
export const useTotalCarrinho = () =>
  useCarrinho((s) => s.itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0))

export const useTotalItens = () =>
  useCarrinho((s) => s.itens.reduce((acc, i) => acc + i.quantidade, 0))
