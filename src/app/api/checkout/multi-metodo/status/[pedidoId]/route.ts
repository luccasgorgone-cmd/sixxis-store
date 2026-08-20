import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Polling puro, sem side-effect — diferente de /api/checkout/status/[pagamentoId],
// que marca Pedido.status='pago' assim que UM pagamento aprova (errado aqui: a
// transição real de multiMetodoStatus é feita só pelo webhook do MP, que sabe
// diferenciar a perna Pix da perna cartão do restante).

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pedidoId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { pedidoId } = await params

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, clienteId: session.user.id },
    select: { status: true, multiMetodoStatus: true },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    pedidoStatus: pedido.status,
    multiMetodoStatus: pedido.multiMetodoStatus,
  })
}
