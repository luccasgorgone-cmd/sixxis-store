import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LayoutConta from '@/components/conta/LayoutConta'
import Link from 'next/link'
import { ArrowLeft, MapPin, Package, Truck, CheckCircle, Clock, ExternalLink, FileText } from 'lucide-react'
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
  // Rota é force-dynamic (sempre renderizada por request, sem PPR/cache);
  // Date.now() aqui é a janela de cancelamento real, não estado de render.
  // eslint-disable-next-line react-hooks/purity
  const horasDesde = (Date.now() - pedido.createdAt.getTime()) / 36e5
  const dentroJanela = horasDesde < JANELA_CANCELAMENTO_HORAS
  const statusInfo = getStatusInfo(pedido.status)

  return (
    <LayoutConta>
      <div className="space-y-5">
        <Link href="/minha-conta/pedidos" className="inline-flex items-center gap-2 text-sm text-[#B0BFBC] hover:text-[#F4F7F6] transition">
          <ArrowLeft size={14} /> Meus Pedidos
        </Link>

        <div className="bg-[#111717] rounded-2xl border border-[#2A3937] shadow-sm px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-extrabold text-[#F4F7F6] text-lg">Pedido #{pedido.id.slice(-8).toUpperCase()}</h1>
              <p className="text-xs text-[#8a9794] mt-0.5">{new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {pendente && (
          <BotoesPedidoPendente pedidoId={pedido.id} podeCancelar={dentroJanela} />
        )}

        {/* Checkout multi-método: Pix (etapa 1) confirmado, falta o cartão do
            restante (etapa 2). Sem formulário de cartão aqui ainda — completar
            via API /api/checkout/multi-metodo/pix-mais-cartao/completar é o
            próximo passo de UI (ver M3, marco separado). */}
        {pedido.multiMetodoStatus === 'aguardando_pagamento_restante' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800">
            Recebemos o Pix deste pedido. Falta confirmar o pagamento do valor restante no
            cartão — entraremos em contato para concluir.
          </div>
        )}

        {/* Acompanhamento da entrega (Pago → Enviado → Entregue) */}
        {statusInfo.step >= 1 && (
          <div className="bg-[#111717] rounded-2xl border border-[#2A3937] shadow-sm px-5 py-4 space-y-4">
            <h2 className="font-bold text-[#F4F7F6] text-sm flex items-center gap-2">
              <Truck size={14} className="text-[#00cfb5]" /> Acompanhe sua entrega
            </h2>

            {/* Timeline */}
            <div className="flex items-center gap-0">
              {[
                { label: 'Pago', step: 1 },
                { label: 'Enviado', step: 2 },
                { label: 'Entregue', step: 3 },
              ].map((s, i, arr) => {
                const done = statusInfo.step >= s.step
                return (
                  <div key={s.label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${done ? 'bg-[#00cfb5] border-[#00cfb5]' : 'bg-[#111717] border-[#2A3937]'}`}>
                        {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Clock className="w-3 h-3 text-[#6b7a77]" />}
                      </div>
                      <span className={`text-[10px] mt-1 ${done ? 'text-[#00cfb5] font-semibold' : 'text-[#6b7a77]'}`}>{s.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`flex-1 h-0.5 mb-4 mx-1 ${statusInfo.step > s.step ? 'bg-[#00cfb5]' : 'bg-[#2A3937]'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Dados de rastreio (quando despachado) */}
            {pedido.codigoRastreio && (
              <div className="rounded-xl bg-[#192221] border border-[#2A3937] px-4 py-3 space-y-1.5">
                {/* A transportadora NÃO é exposta ao cliente (só serviço/prazo/código).
                    O nome da transportadora permanece visível apenas no admin. */}
                <p className="text-sm text-[#D7E0DD]"><span className="text-[#8a9794]">Código de rastreio:</span> <strong className="font-mono">{pedido.codigoRastreio}</strong></p>
                {pedido.linkRastreio && (
                  <a
                    href={pedido.linkRastreio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold text-[#00cfb5] hover:text-[#65E5D4] transition"
                  >
                    <ExternalLink size={13} /> Acompanhar entrega
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Nota fiscal — só aparece depois que o admin informa o número. */}
        {pedido.notaFiscal && (
          <div className="bg-[#111717] rounded-2xl border border-[#2A3937] shadow-sm px-5 py-4">
            <h2 className="font-bold text-[#F4F7F6] text-sm flex items-center gap-2 mb-2">
              <FileText size={14} className="text-[#00cfb5]" /> Nota fiscal
            </h2>
            <p className="text-sm text-[#D7E0DD]">
              <span className="text-[#8a9794]">Número:</span>{' '}
              <strong className="font-mono">{pedido.notaFiscal}</strong>
            </p>
          </div>
        )}

        <div className="bg-[#111717] rounded-2xl border border-[#2A3937] shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2A3937]">
            <h2 className="font-bold text-[#F4F7F6] text-sm">Itens</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pedido.itens.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-12 h-12 rounded-xl bg-[#192221] border border-[#2A3937] overflow-hidden shrink-0 flex items-center justify-center">
                  {(() => {
                    const img = (item.produto?.imagens as string[])?.[0]
                    // eslint-disable-next-line @next/next/no-img-element
                    return img ? <img src={img} alt="" className="w-full h-full object-contain p-1" /> : <Package size={18} className="text-[#8a9794]" />
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#F4F7F6] line-clamp-1">{item.produto?.nome ?? '—'}</p>
                  {item.variacaoNome && <p className="text-xs text-[#8a9794]">{item.variacaoNome}</p>}
                  <p className="text-xs text-[#B0BFBC] mt-0.5">Qtd: {item.quantidade}</p>
                </div>
                <p className="text-sm font-bold text-[#F4F7F6] shrink-0">R$ {fmt(Number(item.precoUnitario) * item.quantidade)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111717] rounded-2xl border border-[#2A3937] shadow-sm px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-[#B0BFBC]">
            <span>Subtotal</span>
            <span>R$ {fmt(Number(pedido.total) - Number(pedido.frete) + Number(pedido.desconto))}</span>
          </div>
          {Number(pedido.desconto) > 0 && (
            <div className="flex justify-between text-sm text-green-600"><span>Desconto</span><span>-R$ {fmt(Number(pedido.desconto))}</span></div>
          )}
          <div className="flex justify-between text-sm text-[#B0BFBC]">
            <span>Frete</span>
            <span>{Number(pedido.frete) === 0 ? 'Grátis' : `R$ ${fmt(Number(pedido.frete))}`}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-[#F4F7F6] border-t border-[#2A3937] pt-2">
            <span>Total</span><span>R$ {fmt(Number(pedido.total))}</span>
          </div>
          <p className="text-xs text-[#8a9794] capitalize">{pedido.formaPagamento}</p>
        </div>

        <div className="bg-[#111717] rounded-2xl border border-[#2A3937] shadow-sm px-5 py-4">
          <h2 className="font-bold text-[#F4F7F6] text-sm mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-[#00cfb5]" /> Endereço de entrega
          </h2>
          <p className="text-sm text-[#D7E0DD]">{pedido.endereco.logradouro}, {pedido.endereco.numero}{pedido.endereco.complemento ? `, ${pedido.endereco.complemento}` : ''}</p>
          <p className="text-sm text-[#D7E0DD]">{pedido.endereco.bairro}, {pedido.endereco.cidade} — {pedido.endereco.estado}</p>
          <p className="text-sm text-[#B0BFBC]">CEP {pedido.endereco.cep}</p>
        </div>
      </div>
    </LayoutConta>
  )
}
