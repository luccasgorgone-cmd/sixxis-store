import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LayoutConta from '@/components/conta/LayoutConta'
import { Coins, TrendingUp, TrendingDown } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Cashback' }

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export default async function CashbackPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?next=/minha-conta/cashback')

  const [cliente, transacoes] = await Promise.all([
    prisma.cliente.findUnique({ where: { id: session.user.id }, select: { cashbackSaldo: true } }),
    prisma.cashbackTransacao.findMany({ where: { clienteId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ])

  const saldo = cliente?.cashbackSaldo ?? 0

  return (
    <LayoutConta>
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-[#0f2e2b] to-[#1a4f4a] rounded-2xl px-6 py-5 text-white">
          <p className="text-sm text-white/60 flex items-center gap-2"><Coins size={14} /> Saldo de Cashback</p>
          <p className="text-3xl font-black mt-1">R$ {fmt(saldo)}</p>
          <p className="text-xs text-white/50 mt-1">Disponível para usar na próxima compra</p>
        </div>

        <div className="bg-[#f0fffe] border border-[#3cbfb3]/20 rounded-2xl px-5 py-4">
          <p className="text-sm font-semibold text-[#1a4f4a]">Como funciona?</p>
          <p className="text-xs text-gray-600 mt-1">Você ganha <strong>3% de cashback</strong> em cada compra aprovada. O saldo pode ser usado como desconto no checkout.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50"><h2 className="font-bold text-gray-900 text-sm">Extrato</h2></div>
          {transacoes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Nenhuma transação ainda.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {transacoes.map(t => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.tipo === 'credito' ? 'bg-green-50' : 'bg-red-50'}`}>
                      {t.tipo === 'credito' ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.descricao ?? (t.tipo === 'credito' ? 'Cashback creditado' : 'Cashback utilizado')}</p>
                      <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${t.tipo === 'credito' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.tipo === 'credito' ? '+' : '-'}R$ {fmt(t.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutConta>
  )
}
