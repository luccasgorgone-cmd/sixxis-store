import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pedido Confirmado',
  description: 'Seu pedido foi confirmado com sucesso. Acompanhe o status na área de pedidos.',
}

export default function CheckoutSucessoPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-sx-bg">
      <div className="w-full max-w-md bg-sx-surface rounded-2xl shadow-sm border border-sx-line p-8 sm:p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-sx-tint flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-sx-accent-text" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] mb-3 tracking-tight">
          Pedido confirmado!
        </h1>
        <p className="text-sx-muted text-sm mb-2 leading-relaxed">
          Seu pagamento foi aprovado com sucesso.
        </p>
        <p className="text-sx-subtle text-xs mb-8">
          Você receberá um e-mail com todos os detalhes do pedido e atualizações de entrega.
        </p>

        <div className="bg-sx-bg rounded-xl p-4 mb-8 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sx-tint flex items-center justify-center shrink-0">
              <Package size={18} className="text-sx-accent-text" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0a0a0a]">Próximo passo</p>
              <p className="text-xs text-sx-muted">Acompanhe o status do seu pedido na área do cliente.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/pedidos"
            className="flex-1 flex items-center justify-center gap-2 bg-sx-accent hover:bg-sx-accent-hover text-[#032E28] font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Ver meus pedidos
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/produtos"
            className="flex-1 flex items-center justify-center gap-2 border border-sx-line hover:border-sx-accent text-sx-muted hover:text-sx-accent-text font-medium px-6 py-3 rounded-xl transition-all"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </main>
  )
}
