import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Package, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pagamento em processamento',
  description: 'Seu pagamento está sendo processado. Aguarde a confirmação por e-mail.',
}

export default function CheckoutPendentePage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#080B0B]">
      <div className="w-full max-w-md bg-[#111717] rounded-2xl shadow-sm border border-[#2A3937] p-8 sm:p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <Clock size={40} className="text-amber-500" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] mb-3 tracking-tight">
          Pagamento em processamento
        </h1>
        <p className="text-[#B0BFBC] text-sm mb-2 leading-relaxed">
          Seu pedido foi recebido e o pagamento está sendo processado.
        </p>
        <p className="text-[#8a9794] text-xs mb-8">
          Isso pode levar alguns minutos. Assim que confirmado, você receberá um e-mail com os detalhes.
        </p>

        <div className="bg-[#080B0B] rounded-xl p-4 mb-8 text-left space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0a0a0a]">PIX aguardando pagamento</p>
              <p className="text-xs text-[#B0BFBC]">Efetue o pagamento dentro do prazo indicado no e-mail enviado.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#e8f8f7] flex items-center justify-center shrink-0 mt-0.5">
              <Package size={16} className="text-[#00cfb5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0a0a0a]">Próximo passo</p>
              <p className="text-xs text-[#B0BFBC]">Após confirmação, seu pedido será preparado e despachado.</p>
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
            href="/"
            className="flex-1 flex items-center justify-center gap-2 border border-[#2A3937] hover:border-[#00cfb5] text-[#B0BFBC] hover:text-[#00cfb5] font-medium px-6 py-3 rounded-xl transition-all"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  )
}
