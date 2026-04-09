import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { User, MapPin, ShoppingBag, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Minha Conta' }

export default async function MinhaContaPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const cliente = await prisma.cliente.findUnique({
    where:   { email: session.user.email! },
    include: { enderecos: true, pontos: true },
  })

  if (!cliente) redirect('/login')

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight mb-8">Minha Conta</h1>

      {/* Dados pessoais */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#e8f8f7] flex items-center justify-center">
            <User size={18} className="text-[#3cbfb3]" />
          </div>
          <h2 className="text-base font-bold text-[#0a0a0a]">Dados Pessoais</h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Nome',     value: cliente.nome },
            { label: 'Email',    value: cliente.email },
            { label: 'CPF',      value: cliente.cpf ?? '—' },
            { label: 'Telefone', value: cliente.telefone ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</dt>
              <dd className="font-semibold text-[#0a0a0a]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Endereços */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#e8f8f7] flex items-center justify-center">
            <MapPin size={18} className="text-[#3cbfb3]" />
          </div>
          <h2 className="text-base font-bold text-[#0a0a0a]">Endereços</h2>
        </div>

        {cliente.enderecos.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum endereço cadastrado.</p>
        ) : (
          <ul className="space-y-3">
            {cliente.enderecos.map((end: { id: string; logradouro: string; numero: string; complemento: string | null; bairro: string; cidade: string; estado: string; cep: string; principal: boolean }) => (
              <li key={end.id} className="text-sm border border-gray-200 rounded-lg p-3 bg-gray-50">
                {end.logradouro}, {end.numero}
                {end.complemento ? `, ${end.complemento}` : ''} — {end.bairro},{' '}
                {end.cidade}/{end.estado} — CEP {end.cep}
                {end.principal && (
                  <span className="ml-2 text-xs bg-[#e8f8f7] text-[#3cbfb3] font-semibold px-2 py-0.5 rounded-full">
                    Principal
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick-access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/pedidos"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-5 hover:border-[#3cbfb3] hover:bg-[#e8f8f7] transition group"
        >
          <div className="w-10 h-10 rounded-full bg-[#e8f8f7] group-hover:bg-white flex items-center justify-center">
            <ShoppingBag size={18} className="text-[#3cbfb3]" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#0a0a0a]">Meus Pedidos</p>
            <p className="text-xs text-gray-500">Ver histórico de compras</p>
          </div>
        </Link>

        <Link
          href="/fidelidade"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-5 hover:border-[#3cbfb3] hover:bg-[#e8f8f7] transition group"
        >
          <div className="w-10 h-10 rounded-full bg-[#e8f8f7] group-hover:bg-white flex items-center justify-center">
            <Trophy size={18} className="text-[#3cbfb3]" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#0a0a0a]">Programa Fidelidade</p>
            <p className="text-xs text-gray-500">
              {cliente.pontos ? `${cliente.pontos.pontos} pontos disponíveis` : 'Acumule e troque pontos'}
            </p>
          </div>
        </Link>
      </div>
    </main>
  )
}
