import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizarPedido, podeOperarPedido } from '@/lib/autorizar-pedido'

// Polling puro, sem side-effect — diferente de /api/checkout/status/[pagamentoId],
// que marca Pedido.status='pago' assim que UM pagamento aprova (errado aqui: a
// transição real de multiMetodoStatus é feita só pelo webhook do MP, que sabe
// diferenciar a perna Pix da perna cartão do restante).

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pedidoId: string }> },
) {
  const { pedidoId } = await params

  // Autoriza: sessão do dono OU token de posse do pedido.
  const authz = await autorizarPedido(req, pedidoId)
  if (!authz.autenticado) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { status: true, multiMetodoStatus: true, clienteId: true },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (!podeOperarPedido(authz, pedido.clienteId)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  return NextResponse.json({
    pedidoStatus: pedido.status,
    multiMetodoStatus: pedido.multiMetodoStatus,
  })
}
