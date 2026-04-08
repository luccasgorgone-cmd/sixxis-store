import { prisma } from '@/lib/prisma'
import { Package, ShoppingCart, Clock, DollarSign } from 'lucide-react'

async function getMetrics() {
  const [totalProdutos, totalPedidos, pedidosPendentes, receitaAgg] = await Promise.all([
    prisma.produto.count({ where: { ativo: true } }),
    prisma.pedido.count(),
    prisma.pedido.count({ where: { status: 'pendente' } }),
    prisma.pedido.aggregate({ _sum: { total: true } }),
  ])

  return {
    totalProdutos,
    totalPedidos,
    pedidosPendentes,
    receita: Number(receitaAgg._sum.total ?? 0),
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const cards = (m: Awaited<ReturnType<typeof getMetrics>>) => [
  {
    label: 'Produtos ativos',
    value: m.totalProdutos.toString(),
    icon: Package,
    color: '#3cbfb3',
    bg: '#3cbfb3',
  },
  {
    label: 'Total de pedidos',
    value: m.totalPedidos.toString(),
    icon: ShoppingCart,
    color: '#6366f1',
    bg: '#6366f1',
  },
  {
    label: 'Pedidos pendentes',
    value: m.pedidosPendentes.toString(),
    icon: Clock,
    color: '#f59e0b',
    bg: '#f59e0b',
  },
  {
    label: 'Receita total',
    value: formatCurrency(m.receita),
    icon: DollarSign,
    color: '#10b981',
    bg: '#10b981',
  },
]

export default async function AdminDashboard() {
  const metrics = await getMetrics()
  const metricCards = cards(metrics)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da Sixxis Store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {metricCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${bg}1a` }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-gray-500 text-sm font-medium truncate">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Acesso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/admin/produtos/novo"
            className="flex items-center gap-3 p-4 rounded-xl border border-[#3cbfb3]/30 bg-[#3cbfb3]/5 hover:bg-[#3cbfb3]/10 transition"
          >
            <Package className="w-5 h-5 text-[#3cbfb3]" />
            <span className="text-sm font-medium text-gray-700">Novo produto</span>
          </a>
          <a
            href="/admin/pedidos"
            className="flex items-center gap-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition"
          >
            <ShoppingCart className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Ver pedidos</span>
          </a>
          <a
            href="/admin/produtos"
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
          >
            <Package className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Gerenciar produtos</span>
          </a>
        </div>
      </div>
    </div>
  )
}
