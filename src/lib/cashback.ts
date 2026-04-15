import { prisma } from '@/lib/prisma'

export const CASHBACK_PERCENT = 0.03 // 3% de cada compra

/** Credita cashback ao cliente após uma compra */
export async function creditarCashback(clienteId: string, valorPedido: number, pedidoId: string) {
  const valor = parseFloat((valorPedido * CASHBACK_PERCENT).toFixed(2))
  if (valor <= 0) return

  await prisma.$transaction([
    prisma.cashbackTransacao.create({
      data: {
        clienteId,
        tipo:      'credito',
        valor,
        descricao: `Cashback do pedido #${pedidoId}`,
        pedidoId,
      },
    }),
    prisma.cliente.update({
      where: { id: clienteId },
      data:  { cashbackSaldo: { increment: valor } },
    }),
  ])
}

/** Debita cashback do cliente ao usar no checkout */
export async function usarCashback(clienteId: string, valor: number, pedidoId: string) {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { cashbackSaldo: true } })
  if (!cliente || cliente.cashbackSaldo < valor) throw new Error('Saldo de cashback insuficiente')

  await prisma.$transaction([
    prisma.cashbackTransacao.create({
      data: {
        clienteId,
        tipo:      'debito',
        valor,
        descricao: `Cashback usado no pedido #${pedidoId}`,
        pedidoId,
      },
    }),
    prisma.cliente.update({
      where: { id: clienteId },
      data:  { cashbackSaldo: { decrement: valor } },
    }),
  ])
}

/** Retorna extrato do cliente */
export async function extratoCashback(clienteId: string, limit = 20) {
  return prisma.cashbackTransacao.findMany({
    where:   { clienteId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
  })
}
