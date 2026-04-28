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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h1 className="font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#3cbfb3]" /> Meus Pedidos
          </h1>
        </div>
        {pedidos.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">Nenhum pedido ainda.</p>
            <Link href="/produtos" className="inline-block mt-4 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-bold px-6 py-2.5 rounded-xl transition">
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pedidos.map(p => (
              <Link key={p.id} href={`/minha-conta/pedidos/${p.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {(() => {
                      const img = (p.itens[0]?.produto?.imagens as string[])?.[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      return img ? <img src={img} alt="" className="w-full h-full object-contain p-1" /> : <ShoppingBag size={18} className="text-gray-200" />
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#3cbfb3] transition-colors">#{p.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')} · {p.itens.length} {p.itens.length === 1 ? 'item' : 'itens'}</p>
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
                  <span className="text-sm font-extrabold text-gray-900">R$ {fmt(Number(p.total))}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </LayoutConta>
  )
}
