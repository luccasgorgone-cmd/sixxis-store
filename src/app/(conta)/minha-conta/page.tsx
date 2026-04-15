import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LayoutConta from '@/components/conta/LayoutConta'
import { ShoppingBag, Coins, Package, MapPin } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Minha Conta' }

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

const STATUS_LABEL: Record<string, string> = { pendente: 'Pendente', pago: 'Pago', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado' }
const STATUS_COLOR: Record<string, string> = { pendente: 'bg-amber-50 text-amber-700', pago: 'bg-blue-50 text-blue-700', enviado: 'bg-purple-50 text-purple-700', entregue: 'bg-green-50 text-green-700', cancelado: 'bg-gray-100 text-gray-500' }

export default async function MinhaContaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?next=/minha-conta')

  const cliente = await prisma.cliente.findUnique({
    where:  { id: session.user.id },
    select: { nome: true, email: true, cashbackSaldo: true, totalGasto: true, totalPedidos: true },
  })
  if (!cliente) redirect('/login')

  const pedidosRecentes = await prisma.pedido.findMany({
    where:   { clienteId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take:    3,
    select:  { id: true, status: true, total: true, createdAt: true },
  })

  return (
    <LayoutConta>
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2e2b] to-[#1a4f4a] rounded-2xl px-6 py-5 text-white">
          <p className="text-sm text-white/60">Olá,</p>
          <p className="text-xl font-extrabold">{cliente.nome}</p>
          <p className="text-xs text-white/50 mt-0.5">{cliente.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { icon: ShoppingBag, label: 'Pedidos',    value: String(cliente.totalPedidos),         color: 'text-blue-500',  bg: 'bg-blue-50'   },
            { icon: Coins,       label: 'Cashback',   value: `R$ ${fmt(cliente.cashbackSaldo)}`,   color: 'text-[#3cbfb3]', bg: 'bg-[#f0fffe]' },
            { icon: Package,     label: 'Total Gasto',value: `R$ ${fmt(cliente.totalGasto)}`,      color: 'text-amber-500', bg: 'bg-amber-50'  },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-base font-extrabold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Pedidos recentes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-extrabold text-gray-900">Pedidos Recentes</h2>
            <Link href="/minha-conta/pedidos" className="text-xs text-[#3cbfb3] hover:text-[#2a9d8f] font-semibold">Ver todos →</Link>
          </div>
          {pedidosRecentes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum pedido ainda.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {pedidosRecentes.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">#{p.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    <span className="text-sm font-bold text-gray-900">R$ {fmt(Number(p.total))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/minha-conta/enderecos" className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition">
            <MapPin size={18} className="text-[#3cbfb3]" />
            <div><p className="text-sm font-semibold text-gray-900">Endereços</p><p className="text-xs text-gray-400">Gerenciar</p></div>
          </Link>
          <Link href="/minha-conta/cashback" className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition">
            <Coins size={18} className="text-[#3cbfb3]" />
            <div><p className="text-sm font-semibold text-gray-900">Cashback</p><p className="text-xs text-gray-400">Ver extrato</p></div>
          </Link>
        </div>
      </div>
    </LayoutConta>
  )
}
