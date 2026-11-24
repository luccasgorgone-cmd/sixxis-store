import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Meus Pedidos' }

const statusLabel: Record<string, string> = {
  pendente:  'Pendente',
  pago:      'Pago',
  enviado:   'Enviado',
  entregue:  'Entregue',
  cancelado: 'Cancelado',
}

const statusColor: Record<string, string> = {
  pendente:  'bg-yellow-100 text-yellow-700',
  pago:      'bg-sx-tint text-sx-accent-text',
  enviado:   'bg-purple-100 text-purple-700',
  entregue:  'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

export default async function PedidosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const cliente = await prisma.cliente.findUnique({
    where:  { email: session.user.email! },
    select: { id: true },
  })
  if (!cliente) redirect('/login')

  const pedidos = await prisma.pedido.findMany({
    where:   { clienteId: cliente.id },
    include: { itens: { include: { produto: { select: { nome: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight mb-8">Meus Pedidos</h1>

      {pedidos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-sx-line rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-sx-tint flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={24} className="text-sx-accent-text" />
          </div>
          <p className="text-sx-muted font-medium mb-2">Você ainda não fez nenhum pedido.</p>
          <Link href="/produtos" className="btn-primary mt-4 inline-flex">
            Ver Produtos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-sx-surface border border-sx-line rounded-xl p-6 hover:border-sx-accent transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-sm text-[#0a0a0a]">
                    Pedido #{pedido.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-sx-subtle mt-0.5">
                    {new Date(pedido.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    statusColor[pedido.status] ?? 'bg-sx-raised text-sx-muted'
                  }`}
                >
                  {statusLabel[pedido.status] ?? pedido.status}
                </span>
              </div>

              <ul className="text-sm text-sx-muted space-y-1 mb-4">
                {pedido.itens.map((item) => (
                  <li key={item.id} className="flex items-center gap-1.5">
                    <span className="text-sx-accent-text">•</span>
                    {item.quantidade}x {item.produto.nome}
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center border-t border-sx-line pt-3">
                <p className="text-sm text-sx-muted">Total do pedido</p>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-sx-accent-text">
                    R$ {Number(pedido.total).toFixed(2)}
                  </p>
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="text-xs font-semibold text-sx-accent-text hover:text-sx-accent-text border border-sx-accent/30 hover:border-sx-accent rounded-lg px-3 py-1.5 transition"
                  >
                    Ver detalhes →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
