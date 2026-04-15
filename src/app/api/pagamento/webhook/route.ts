import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularPontos, creditarPontos } from '@/lib/fidelidade'
import { enviarEmailConfirmacaoPedido } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (type === 'payment' && data?.id) {
      const pedido = await prisma.pedido.findFirst({
        where: { mpPaymentId: String(data.id) },
        include: {
          cliente:  { select: { id: true, nome: true, email: true } },
          endereco: true,
          itens:    { include: { produto: { select: { nome: true, slug: true } } } },
        },
      })

      if (pedido && pedido.status === 'pendente') {
        await prisma.pedido.update({ where: { id: pedido.id }, data: { status: 'pago' } })

        // Creditar pontos
        const pontos = await calcularPontos(Number(pedido.total))
        if (pontos > 0) {
          await creditarPontos(pedido.clienteId, pontos, `Compra #${pedido.id.slice(-8).toUpperCase()}`, pedido.id).catch(() => {})
        }

        // Incrementar uso do cupom
        if (pedido.cupomCodigo) {
          await prisma.cupom.update({ where: { codigo: pedido.cupomCodigo }, data: { totalUsos: { increment: 1 } } }).catch(() => {})
        }

        // Email de confirmação
        const end = pedido.endereco
        await enviarEmailConfirmacaoPedido(pedido.cliente.email, {
          nomeCliente:    pedido.cliente.nome,
          pedidoId:       pedido.id,
          itens:          pedido.itens.map((i) => ({
            nome:          i.produto.nome,
            variacaoNome:  i.variacaoNome,
            quantidade:    i.quantidade,
            precoUnitario: Number(i.precoUnitario),
          })),
          frete:          Number(pedido.frete),
          desconto:       Number(pedido.desconto),
          total:          Number(pedido.total),
          formaPagamento: pedido.formaPagamento,
          endereco:       `${end.logradouro}, ${end.numero} — ${end.bairro}, ${end.cidade}/${end.estado}`,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
