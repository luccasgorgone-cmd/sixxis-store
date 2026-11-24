'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Lock, ArrowLeft, ShoppingBag } from 'lucide-react'

const CheckoutBricks = dynamic(() => import('../../CheckoutBricks'), { ssr: false })

interface Item {
  nome:       string
  variacao:   string | null
  quantidade: number
  preco:      number
  imagem:     string | null
}

interface Props {
  pedidoId:   string
  total:      number
  payerEmail: string
  payerNome:  string
  payerCpf:   string
  itens:      Item[]
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export default function RetomarClient({
  pedidoId, total, payerEmail, payerNome, payerCpf, itens,
}: Props) {
  const router = useRouter()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <button
        type="button"
        onClick={() => router.push(`/minha-conta/pedidos/${pedidoId}`)}
        className="inline-flex items-center gap-1.5 text-sm text-sx-muted hover:text-sx-text mb-4"
      >
        <ArrowLeft size={14} /> Voltar para o pedido
      </button>

      <h1 className="text-xl font-extrabold text-sx-text mb-1">Finalizar pagamento</h1>
      <p className="text-sm text-sx-muted mb-6">
        Pedido #{pedidoId.slice(-8).toUpperCase()} · {itens.length} {itens.length === 1 ? 'item' : 'itens'}
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-4">
          <div className="bg-sx-surface border border-sx-line rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-sx-text-2 flex items-center gap-2 mb-3">
              <Lock size={14} className="text-sx-accent-text" /> Pagamento seguro · Mercado Pago
            </p>
            <CheckoutBricks
              pedidoId={pedidoId}
              valor={total}
              payerEmail={payerEmail}
              payerNome={payerNome}
              payerCpf={payerCpf}
              onSucesso={() => router.push(`/pedido/${pedidoId}/sucesso`)}
            />
          </div>
        </div>

        <aside className="bg-sx-surface border border-sx-line rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-sx-line flex items-center justify-between">
            <p className="font-extrabold text-sx-text text-sm">Resumo</p>
            <ShoppingBag size={16} className="text-sx-subtle" />
          </div>
          <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
            {itens.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg border border-sx-line bg-sx-raised overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imagem} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <ShoppingBag size={14} className="text-sx-subtle" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sx-text leading-snug line-clamp-2">{item.nome}</p>
                  {item.variacao && <p className="text-[10px] text-sx-subtle mt-0.5">{item.variacao}</p>}
                  <p className="text-[10px] text-sx-subtle">Qtd: {item.quantidade}</p>
                </div>
                <p className="text-xs font-bold text-sx-text shrink-0 pt-0.5">
                  R$ {fmt(item.preco * item.quantidade)}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-sx-line flex justify-between font-extrabold text-sx-text text-sm">
            <span>Total</span>
            <span className="text-sx-accent-text">R$ {fmt(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
