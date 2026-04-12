import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ShoppingCart, Users, Package, Mail } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [totalPedidos, totalClientes, totalProdutos, totalEmails] = await Promise.all([
    prisma.pedido.count(),
    prisma.cliente.count(),
    prisma.produto.count({ where: { ativo: true } }),
    prisma.emailTemplate.count({ where: { ativo: true } }),
  ])

  const ultimosPedidos = await prisma.pedido.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { cliente: { select: { nome: true, email: true } } },
  })

  const stats = [
    { label: 'Pedidos', value: totalPedidos, icon: ShoppingCart, href: '/admin/pedidos', color: '#3cbfb3' },
    { label: 'Clientes', value: totalClientes, icon: Users, href: '/admin/clientes', color: '#6366f1' },
    { label: 'Produtos ativos', value: totalProdutos, icon: Package, href: '/admin/produtos', color: '#f59e0b' },
    { label: 'Emails ativos', value: totalEmails, icon: Mail, href: '/admin/emails', color: '#10b981' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0a0a0a]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da loja</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${color}20` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#0a0a0a]">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Últimos pedidos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-[#0a0a0a]">Últimos Pedidos</h2>
          <Link href="/admin/pedidos" className="text-sm text-[#3cbfb3] hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {ultimosPedidos.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-400 text-sm">Nenhum pedido ainda</p>
          ) : (
            ultimosPedidos.map((pedido) => (
              <div key={pedido.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-[#0a0a0a]">
                    #{pedido.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">{pedido.cliente.nome}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-[#3cbfb3]">
                    R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      pedido.status === 'entregue'
                        ? 'bg-green-100 text-green-700'
                        : pedido.status === 'enviado'
                          ? 'bg-blue-100 text-blue-700'
                          : pedido.status === 'cancelado'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {pedido.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
