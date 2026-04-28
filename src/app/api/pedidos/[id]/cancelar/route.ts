import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { isStatusPendente } from '@/lib/pedido-status'

const JANELA_HORAS = 48

interface Params { id: string }

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params

  const body = await req.json().catch(() => ({})) as { motivo?: string }

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { itens: true },
  })

  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (pedido.clienteId !== session.user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  if (!isStatusPendente(pedido.status)) {
    return NextResponse.json(
      { error: 'Apenas pedidos pendentes podem ser cancelados pelo cliente' },
      { status: 400 },
    )
  }
  const horas = (Date.now() - pedido.createdAt.getTime()) / 36e5
  if (horas > JANELA_HORAS) {
    return NextResponse.json(
      { error: `Janela de cancelamento de ${JANELA_HORAS}h expirada` },
      { status: 400 },
    )
  }

  await prisma.$transaction(async (tx) => {
    await tx.pedido.update({
      where: { id },
      data: { status: 'cancelado_cliente' },
    })
    // Devolver estoque (variações + produto pai).
    for (const item of pedido.itens) {
      if (item.variacaoId) {
        await tx.variacaoProduto.update({
          where: { id: item.variacaoId },
          data: { estoque: { increment: item.quantidade } },
        }).catch(() => {})
        const variacoes = await tx.variacaoProduto.findMany({
          where: { produtoId: item.produtoId },
          select: { estoque: true },
        })
        const totalEstoque = variacoes.reduce((s, v) => s + Math.max(0, v.estoque), 0)
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: totalEstoque },
        })
      } else {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { increment: item.quantidade } },
        })
      }
    }
    // Liberar cupom (decrementa contador de uso).
    if (pedido.cupomCodigo) {
      await tx.cupom.update({
        where: { codigo: pedido.cupomCodigo },
        data: { totalUsos: { decrement: 1 } },
      }).catch(() => {})
    }
  })

  await auditLog({
    req,
    actor: `cliente:${session.user.id}`,
    action: 'pedido.cancelar_cliente',
    target: id,
    metadata: { motivo: body.motivo ?? null },
  })

  return NextResponse.json({ ok: true })
}
