import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Detalhes do Pedido' }
import { CheckCircle, Clock, Package, Truck, Home, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_STEPS = [
  { key: 'pendente',  label: 'Pedido realizado', icon: Clock },
  { key: 'pago',      label: 'Pagamento confirmado', icon: CheckCircle },
  { key: 'enviado',   label: 'Enviado', icon: Truck },
  { key: 'entregue',  label: 'Entregue', icon: Home },
]

const STATUS_ORDER = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado']

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function PedidoDetalheContaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const cliente = await prisma.cliente.findUnique({
    where:  { email: session.user.email! },
    select: { id: true },
  })
  if (!cliente) redirect('/login')

  const pedido = await prisma.pedido.findUnique({
    where:   { id },
    include: {
      itens:    { include: { produto: { select: { nome: true, imagens: true, slug: true } } } },
      endereco: true,
    },
  })

  if (!pedido || pedido.clienteId !== cliente.id) notFound()

  const statusIdx = STATUS_ORDER.indexOf(pedido.status)
  const stepIdx = STATUS_STEPS.findIndex((s) => s.key === pedido.status)

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/pedidos" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3cbfb3] transition">
          <ArrowLeft size={16} /> Meus Pedidos
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0a0a]">
            Pedido #{pedido.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(pedido.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${
          pedido.status === 'entregue' ? 'bg-green-100 text-green-700' :
          pedido.status === 'enviado'  ? 'bg-purple-100 text-purple-700' :
          pedido.status === 'pago'     ? 'bg-blue-100 text-blue-700' :
          pedido.status === 'cancelado' ? 'bg-red-100 text-red-500' :
          'bg-amber-100 text-amber-700'
        }`}>
          {pedido.status}
        </span>
      </div>

      {/* Timeline */}
      {pedido.status !== 'cancelado' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Progresso</h2>
          <div className="flex items-start justify-between">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= stepIdx
              const active = i === stepIdx
              const Icon = step.icon
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  {/* Linha conectora */}
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`absolute top-5 left-1/2 w-full h-0.5 ${done && stepIdx > i ? 'bg-[#3cbfb3]' : 'bg-gray-200'}`} />
                  )}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    done
                      ? 'bg-[#3cbfb3] border-[#3cbfb3]'
                      : 'bg-white border-gray-200'
                  }`}>
                    <Icon className={`w-5 h-5 ${done ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                  <p className={`text-xs mt-2 text-center leading-tight font-medium ${
                    active ? 'text-[#3cbfb3]' : done ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Código de rastreio */}
      {pedido.codigoRastreio && (
        <div className="bg-[#e8f8f7] border border-[#3cbfb3]/30 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-[#3cbfb3]" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Código de Rastreio</p>
              <p className="font-mono font-bold text-[#3cbfb3] text-lg tracking-widest mt-0.5">
                {pedido.codigoRastreio}
              </p>
            </div>
            <a
              href="https://www.correios.com.br/rastreamento"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs font-semibold text-[#3cbfb3] hover:underline"
            >
              Rastrear →
            </a>
          </div>
        </div>
      )}

      {/* Itens */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          <Package className="w-4 h-4 inline-block mr-1.5" />
          Itens do Pedido
        </h2>
        <div className="space-y-3">
          {pedido.itens.map((item) => {
            const thumb = (item.produto.imagens as string[])?.[0]
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                  {thumb ? (
                    <Image src={thumb} alt={item.produto.nome} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.produto.nome}
                    {item.variacaoNome && (
                      <span className="ml-2 text-xs font-semibold text-[#3cbfb3] bg-[#e8f8f7] px-1.5 py-0.5 rounded">
                        {item.variacaoNome}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{item.quantidade}x {fmt(Number(item.precoUnitario))}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {fmt(item.quantidade * Number(item.precoUnitario))}
                </p>
              </div>
            )
          })}
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Frete</span>
            <span>{Number(pedido.frete) === 0 ? 'Grátis' : fmt(Number(pedido.frete))}</span>
          </div>
          {Number(pedido.desconto) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto{pedido.cupomCodigo ? ` (${pedido.cupomCodigo})` : ''}</span>
              <span>-{fmt(Number(pedido.desconto))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
            <span>Total</span>
            <span className="text-[#3cbfb3]">{fmt(Number(pedido.total))}</span>
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Endereço de Entrega</h2>
        <p className="text-sm text-gray-700">
          {pedido.endereco.logradouro}, {pedido.endereco.numero}
          {pedido.endereco.complemento ? `, ${pedido.endereco.complemento}` : ''}
        </p>
        <p className="text-sm text-gray-700">
          {pedido.endereco.bairro} — {pedido.endereco.cidade}/{pedido.endereco.estado}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">CEP {pedido.endereco.cep}</p>
        <p className="text-xs text-gray-400 mt-2 capitalize">Pagamento: {pedido.formaPagamento}</p>
      </div>

      {/* Ajuda */}
      <div className="text-center">
        <a
          href="https://wa.me/5518997474701"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#1ebe5d] text-white font-semibold rounded-xl px-6 py-3 text-sm transition"
        >
          💬 Precisa de ajuda? Fale conosco
        </a>
      </div>
    </main>
  )
}
