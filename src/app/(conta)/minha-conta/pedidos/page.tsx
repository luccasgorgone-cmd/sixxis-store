import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LayoutConta from '@/components/conta/LayoutConta'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { getStatusInfo } from '@/lib/pedido-status'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Meus Pedidos' }

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export default async function PedidosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?next=/minha-conta/pedidos')

  const pedidos = await prisma.pedido.findMany({
    where:   { clienteId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      itens: { include: { produto: { select: { nome: true, imagens: true } } } },
    },
  })

  return (
    <LayoutConta>
      <div className="bg-sx-surface rounded-2xl border border-sx-line shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-sx-line">
          <h1 className="font-extrabold text-sx-text flex items-center gap-2">
            <ShoppingBag size={18} className="text-sx-accent-text" /> Meus Pedidos
          </h1>
        </div>
        {pedidos.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={36} className="text-sx-subtle mx-auto mb-3" />
            <p className="text-sx-muted font-semibold">Nenhum pedido ainda.</p>
            <Link href="/produtos" className="inline-block mt-4 bg-sx-accent hover:bg-sx-accent-hover text-[#032E28] text-sm font-bold px-6 py-2.5 rounded-xl transition">
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pedidos.map(p => (
              <Link key={p.id} href={`/minha-conta/pedidos/${p.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-sx-raised transition group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sx-raised border border-sx-line overflow-hidden shrink-0 flex items-center justify-center">
                    {(() => {
                      const img = (p.itens[0]?.produto?.imagens as string[])?.[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      return img ? <img src={img} alt="" className="w-full h-full object-contain p-1" /> : <ShoppingBag size={18} className="text-sx-subtle" />
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-sx-text group-hover:text-sx-accent-text transition-colors">#{p.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-sx-subtle">{new Date(p.createdAt).toLocaleDateString('pt-BR')} · {p.itens.length} {p.itens.length === 1 ? 'item' : 'itens'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const info = getStatusInfo(p.status)
                    return (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${info.bg} ${info.color}`}>
                        {info.label}
                      </span>
                    )
                  })()}
                  <span className="text-sm font-extrabold text-sx-text">R$ {fmt(Number(p.total))}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </LayoutConta>
  )
}
