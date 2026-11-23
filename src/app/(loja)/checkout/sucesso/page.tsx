import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pedido Confirmado',
  description: 'Seu pedido foi confirmado com sucesso. Acompanhe o status na área de pedidos.',
}

export default function CheckoutSucessoPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#080B0B]">
      <div className="w-full max-w-md bg-[#111717] rounded-2xl shadow-sm border border-[#2A3937] p-8 sm:p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-[#00cfb5]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] mb-3 tracking-tight">
          Pedido confirmado!
        </h1>
        <p className="text-[#B0BFBC] text-sm mb-2 leading-relaxed">
          Seu pagamento foi aprovado com sucesso.
        </p>
        <p className="text-[#8a9794] text-xs mb-8">
          Você receberá um e-mail com todos os detalhes do pedido e atualizações de entrega.
        </p>

        <div className="bg-[#080B0B] rounded-xl p-4 mb-8 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#e8f8f7] flex items-center justify-center shrink-0">
              <Package size={18} className="text-[#00cfb5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0a0a0a]">Próximo passo</p>
              <p className="text-xs text-[#B0BFBC]">Acompanhe o status do seu pedido na área do cliente.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/pedidos"
            className="flex-1 flex items-center justify-center gap-2 bg-[#00cfb5] hover:bg-[#65E5D4] text-[#032E28] font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Ver meus pedidos
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/produtos"
            className="flex-1 flex items-center justify-center gap-2 border border-[#2A3937] hover:border-[#00cfb5] text-[#B0BFBC] hover:text-[#00cfb5] font-medium px-6 py-3 rounded-xl transition-all"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </main>
  )
}
