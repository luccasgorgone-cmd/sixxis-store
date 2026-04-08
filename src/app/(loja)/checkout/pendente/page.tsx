import Link from 'next/link'

export default function CheckoutPendentePage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-4">⏳</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento em processamento</h1>
      <p className="text-gray-500 mb-6">Seu pagamento está sendo processado. Aguarde a confirmação por e-mail.</p>
      <Link href="/pedidos" className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl transition">
        Ver meus pedidos
      </Link>
    </div>
  )
}
