import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LayoutConta from '@/components/conta/LayoutConta'
import Link from 'next/link'
import { ArrowLeft, MapPin, Package } from 'lucide-react'
import { isStatusPendente, getStatusInfo } from '@/lib/pedido-status'
import BotoesPedidoPendente from '@/components/pedido/BotoesPedidoPendente'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Detalhes do Pedido' }

interface Params { id: string }

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

const JANELA_CANCELAMENTO_HORAS = 48

export default async function PedidoDetalhePage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login?next=/minha-conta/pedidos')

  const pedido = await prisma.pedido.findFirst({
    where:   { id, clienteId: session.user.id },
    include: {
      itens:    { include: { produto: { select: { nome: true, slug: true, imagens: true } } } },
      endereco: true,
    },
  })

  if (!pedido) notFound()

  const pendente   = isStatusPendente(pedido.status)
  const horasDesde = (Date.now() - pedido.createdAt.getTime()) / 36e5
  const dentroJanela = horasDesde < JANELA_CANCELAMENTO_HORAS
  const statusInfo = getStatusInfo(pedido.status)

  return (
    <LayoutConta>
      <div className="space-y-5">
        <Link href="/minha-conta/pedidos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft size={14} /> Meus Pedidos
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-extrabold text-gray-900 text-lg">Pedido #{pedido.id.slice(-8).toUpperCase()}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          {pedido.codigoRastreio && (
            <div className="mt-3 px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700">
              <strong>Rastreio:</strong> {pedido.codigoRastreio}
            </div>
          )}
        </div>

        {pendente && (
          <BotoesPedidoPendente pedidoId={pedido.id} podeCancelar={dentroJanela} />
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm">Itens</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pedido.itens.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {(() => {
                    const img = (item.produto?.imagens as string[])?.[0]
                    // eslint-disable-next-line @next/next/no-img-element
                    return img ? <img src={img} alt="" className="w-full h-full object-contain p-1" /> : <Package size={18} className="text-gray-200" />
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.produto?.nome ?? '—'}</p>
                  {item.variacaoNome && <p className="text-xs text-gray-400">{item.variacaoNome}</p>}
                  <p className="text-xs text-gray-500 mt-0.5">Qtd: {item.quantidade}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 shrink-0">R$ {fmt(Number(item.precoUnitario) * item.quantidade)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>R$ {fmt(Number(pedido.total) - Number(pedido.frete) + Number(pedido.desconto))}</span>
          </div>
          {Number(pedido.desconto) > 0 && (
            <div className="flex justify-between text-sm text-green-600"><span>Desconto</span><span>-R$ {fmt(Number(pedido.desconto))}</span></div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Frete</span>
            <span>{Number(pedido.frete) === 0 ? 'Grátis' : `R$ ${fmt(Number(pedido.frete))}`}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total</span><span>R$ {fmt(Number(pedido.total))}</span>
          </div>
          <p className="text-xs text-gray-400 capitalize">{pedido.formaPagamento}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <h2 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-[#3cbfb3]" /> Endereço de entrega
          </h2>
          <p className="text-sm text-gray-700">{pedido.endereco.logradouro}, {pedido.endereco.numero}{pedido.endereco.complemento ? `, ${pedido.endereco.complemento}` : ''}</p>
          <p className="text-sm text-gray-700">{pedido.endereco.bairro}, {pedido.endereco.cidade} — {pedido.endereco.estado}</p>
          <p className="text-sm text-gray-500">CEP {pedido.endereco.cep}</p>
        </div>
      </div>
    </LayoutConta>
  )
}
