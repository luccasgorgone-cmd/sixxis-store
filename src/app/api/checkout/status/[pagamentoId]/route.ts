import { NextRequest, NextResponse } from 'next/server'
import { mpPayment } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const ESTADOS_FINAIS = ['approved', 'rejected', 'cancelled', 'refunded', 'charged_back']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pagamentoId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { pagamentoId } = await params

  const pagamento = await prisma.pagamento.findUnique({
    where: { id: pagamentoId },
    include: { pedido: { select: { id: true, status: true, clienteId: true } } },
  })

  if (!pagamento) {
    return NextResponse.json(
      { error: 'Pagamento não encontrado' },
      { status: 404 },
    )
  }
  if (pagamento.pedido.clienteId !== session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  if (ESTADOS_FINAIS.includes(pagamento.mpStatus)) {
    return NextResponse.json({
      status: pagamento.mpStatus,
      pedidoStatus: pagamento.pedido.status,
    })
  }

  if (mpPayment && pagamento.mpPaymentId) {
    try {
      const mpResp = await mpPayment.get({ id: pagamento.mpPaymentId })
      const novoStatus = mpResp.status ?? pagamento.mpStatus

      if (novoStatus !== pagamento.mpStatus) {
        await prisma.pagamento.update({
          where: { id: pagamento.id },
          data: {
            mpStatus: novoStatus,
            mpStatusDetail: mpResp.status_detail ?? null,
            aprovadoEm: novoStatus === 'approved' ? new Date() : pagamento.aprovadoEm,
            rejeitadoEm: novoStatus === 'rejected' ? new Date() : pagamento.rejeitadoEm,
          },
        })

        if (novoStatus === 'approved' && pagamento.pedido.status !== 'pago') {
          await prisma.pedido.update({
            where: { id: pagamento.pedidoId },
            data: { status: 'pago', pagoEm: new Date() },
          })
        }
      }

      return NextResponse.json({
        status: novoStatus,
        pedidoStatus:
          novoStatus === 'approved' ? 'pago' : pagamento.pedido.status,
      })
    } catch (e) {
      const err = e as { message?: string }
      console.error('[mp:status]', err.message)
    }
  }

  return NextResponse.json({
    status: pagamento.mpStatus,
    pedidoStatus: pagamento.pedido.status,
  })
}
