import type { Metadata } from 'next'
import Link from 'next/link'
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pagamento não aprovado | Sixxis Store',
  description: 'Houve um problema ao processar seu pagamento. Tente novamente ou entre em contato com nossa equipe.',
}

export default function CheckoutFalhaPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#f9fafb]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-red-500" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] mb-3 tracking-tight">
          Pagamento não aprovado
        </h1>
        <p className="text-gray-500 text-sm mb-2 leading-relaxed">
          Houve um problema ao processar seu pagamento.
        </p>
        <p className="text-gray-400 text-xs mb-8">
          Verifique os dados do cartão e tente novamente, ou escolha outra forma de pagamento.
        </p>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 text-left">
          <p className="text-sm font-semibold text-amber-800 mb-1">Possíveis causas:</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>Dados do cartão incorretos</li>
            <li>Limite insuficiente</li>
            <li>Cartão bloqueado pelo banco</li>
            <li>Erro na autenticação 3D Secure</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/carrinho"
            className="flex-1 flex items-center justify-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <ArrowLeft size={16} />
            Voltar ao carrinho
          </Link>
          <a
            href="https://wa.me/5518997474701"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:border-[#3cbfb3] text-gray-600 hover:text-[#3cbfb3] font-medium px-6 py-3 rounded-xl transition-all"
          >
            <MessageCircle size={16} />
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </main>
  )
}
