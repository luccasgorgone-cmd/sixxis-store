'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useCarrinho } from '@/hooks/useCarrinho'
import { syncCarrinhoCliente, ETAPA } from '@/lib/carrinho-cliente-sync'

// Espelha o carrinho Zustand do cliente LOGADO no servidor (model CarrinhoCliente).
// Roda globalmente: observa `itens` + sessão e faz um POST debounced sempre que o
// carrinho muda (add/remove/qtd). Etapa = CARRINHO; o avanço de etapas no checkout
// é marcado separadamente lá. Visitante anônimo nunca dispara (servidor no-op de
// qualquer forma). Renderiza null.
export default function CarrinhoClienteSync() {
  const { status } = useSession()
  const itens = useCarrinho((s) => s.itens)
  const primeiraRender = useRef(true)

  useEffect(() => {
    if (status !== 'authenticated') return

    // Debounce: o cliente pode mudar a qtd várias vezes seguidas; só envia o
    // snapshot estável depois de ~800ms parado.
    const t = setTimeout(() => {
      syncCarrinhoCliente(itens, ETAPA.CARRINHO)
    }, primeiraRender.current ? 0 : 800)
    primeiraRender.current = false
    return () => clearTimeout(t)
  }, [itens, status])

  return null
}
