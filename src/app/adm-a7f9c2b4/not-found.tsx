import Link from 'next/link'

export default function NotFoundAdmin() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-7xl font-black text-[#3cbfb3]/20 select-none" aria-hidden>
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Página admin não encontrada
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Esta rota do painel não existe ou foi removida.
        </p>
        <Link
          href="/adm-a7f9c2b4"
          className="inline-flex items-center gap-2 mt-6 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition"
        >
          ← Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
