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
        className="inline-flex items-center gap-1.5 text-sm text-[#B0BFBC] hover:text-[#F4F7F6] mb-4"
      >
        <ArrowLeft size={14} /> Voltar para o pedido
      </button>

      <h1 className="text-xl font-extrabold text-[#F4F7F6] mb-1">Finalizar pagamento</h1>
      <p className="text-sm text-[#B0BFBC] mb-6">
        Pedido #{pedidoId.slice(-8).toUpperCase()} · {itens.length} {itens.length === 1 ? 'item' : 'itens'}
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-4">
          <div className="bg-[#111717] border border-[#2A3937] rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#D7E0DD] flex items-center gap-2 mb-3">
              <Lock size={14} className="text-[#00cfb5]" /> Pagamento seguro · Mercado Pago
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

        <aside className="bg-[#111717] border border-[#2A3937] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2A3937] flex items-center justify-between">
            <p className="font-extrabold text-[#F4F7F6] text-sm">Resumo</p>
            <ShoppingBag size={16} className="text-[#6b7a77]" />
          </div>
          <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
            {itens.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg border border-[#2A3937] bg-[#192221] overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imagem} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <ShoppingBag size={14} className="text-[#6b7a77]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#F4F7F6] leading-snug line-clamp-2">{item.nome}</p>
                  {item.variacao && <p className="text-[10px] text-[#8a9794] mt-0.5">{item.variacao}</p>}
                  <p className="text-[10px] text-[#8a9794]">Qtd: {item.quantidade}</p>
                </div>
                <p className="text-xs font-bold text-[#F4F7F6] shrink-0 pt-0.5">
                  R$ {fmt(item.preco * item.quantidade)}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-[#2A3937] flex justify-between font-extrabold text-[#F4F7F6] text-sm">
            <span>Total</span>
            <span className="text-[#00cfb5]">R$ {fmt(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
