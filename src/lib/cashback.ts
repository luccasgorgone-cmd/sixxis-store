import { prisma } from '@/lib/prisma'
import { calcularNivel, NIVEIS_CONFIG } from '@/lib/avatares'

const STATUS_GASTO = ['pago', 'entregue', 'PAGO', 'ENTREGUE'] as const

/**
 * Credita cashback ao cliente após uma compra.
 * - % é o do NÍVEL de fidelidade do cliente (Cristal 2% … Esmeralda 7%),
 *   determinado pelo totalGasto (soma dos pedidos pagos/entregues) — mesma
 *   fonte usada em /api/cashback.
 * - Idempotente: nunca credita 2x o mesmo pedido (chave pedidoId + tipo credito).
 */
export async function creditarCashback(clienteId: string, valorPedido: number, pedidoId: string) {
  if (valorPedido <= 0) return

  // Idempotência: se já há crédito pra este pedido, não faz nada.
  const jaCreditado = await prisma.cashbackTransacao.findFirst({
    where:  { pedidoId, clienteId, tipo: 'credito' },
    select: { id: true },
  })
  if (jaCreditado) return

  // Nível pelo total gasto (inclui este pedido, que já está 'pago' ao creditar).
  const agg = await prisma.pedido.aggregate({
    where: { clienteId, status: { in: [...STATUS_GASTO] } },
    _sum:  { total: true },
  })
  const totalGasto = Number(agg._sum.total ?? 0)
  const pct = NIVEIS_CONFIG[calcularNivel(totalGasto)]?.cashbackPct ?? NIVEIS_CONFIG.Cristal.cashbackPct

  const valor = parseFloat((valorPedido * pct).toFixed(2))
  if (valor <= 0) return

  await prisma.$transaction([
    prisma.cashbackTransacao.create({
      data: {
        clienteId,
        tipo:      'credito',
        valor,
        descricao: `Cashback do pedido #${pedidoId.slice(-8).toUpperCase()}`,
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
