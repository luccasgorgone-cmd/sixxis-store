import { prisma } from '@/lib/prisma'
import { calcularNivel, NIVEIS_CONFIG } from '@/lib/avatares'

const STATUS_GASTO = ['pago', 'entregue', 'PAGO', 'ENTREGUE'] as const

// Teto de uso de cashback: 10% do subtotal de produtos do pedido.
export const TETO_USO_CASHBACK = 0.10

function round2(v: number): number {
  return parseFloat(v.toFixed(2))
}

/** Soma dos pedidos pagos/entregues do cliente — base do nível de fidelidade. */
async function totalGastoDe(clienteId: string): Promise<number> {
  const agg = await prisma.pedido.aggregate({
    where: { clienteId, status: { in: [...STATUS_GASTO] } },
    _sum:  { total: true },
  })
  return Number(agg._sum.total ?? 0)
}

/**
 * Credita cashback após uma compra virar 'pago'.
 * - valorElegivel = subtotal de PRODUTOS (sem frete); % = o do NÍVEL do cliente
 *   (Cristal 2% / Topázio 3% / Safira 4% / Diamante 5% / Esmeralda 7%).
 * - Entra como PENDENTE (não utilizável até a entrega).
 * - Idempotente: nunca credita 2x o mesmo pedido (chave pedidoId + tipo credito).
 */
export async function creditarCashback(clienteId: string, valorElegivel: number, pedidoId: string) {
  if (valorElegivel <= 0) return

  const jaCreditado = await prisma.cashbackTransacao.findFirst({
    where:  { pedidoId, clienteId, tipo: 'credito' },
    select: { id: true },
  })
  if (jaCreditado) return

  const totalGasto = await totalGastoDe(clienteId)
  const pct = NIVEIS_CONFIG[calcularNivel(totalGasto)]?.cashbackPct ?? NIVEIS_CONFIG.Cristal.cashbackPct
  const valor = round2(valorElegivel * pct)
  if (valor <= 0) return

  await prisma.$transaction([
    prisma.cashbackTransacao.create({
      data: {
        clienteId,
        tipo:      'credito',
        status:    'pendente',
        valor,
        descricao: `Cashback do pedido #${pedidoId.slice(-8).toUpperCase()} (pendente até a entrega)`,
        pedidoId,
      },
    }),
    prisma.cliente.update({
      where: { id: clienteId },
      data:  { cashbackPendente: { increment: valor } },
    }),
  ])
}

/**
 * Libera o cashback PENDENTE de um pedido (chamado quando vira 'entregue').
 * Move o valor de cashbackPendente → cashbackSaldo (disponível). Idempotente:
 * só age sobre o lançamento ainda 'pendente'.
 */
export async function liberarCashbackPedido(pedidoId: string) {
  const lanc = await prisma.cashbackTransacao.findFirst({
    where: { pedidoId, tipo: 'credito', status: 'pendente' },
  })
  if (!lanc) return

  const valor = Number(lanc.valor)
  const cli = await prisma.cliente.findUnique({
    where:  { id: lanc.clienteId },
    select: { cashbackPendente: true },
  })
  const moverDoPendente = Math.min(valor, Number(cli?.cashbackPendente ?? 0)) // pendente nunca negativo

  await prisma.$transaction([
    prisma.cashbackTransacao.update({ where: { id: lanc.id }, data: { status: 'disponivel' } }),
    prisma.cliente.update({
      where: { id: lanc.clienteId },
      data:  {
        cashbackPendente: { decrement: moverDoPendente },
        cashbackSaldo:    { increment: valor },
      },
    }),
  ])
}

/**
 * Clawback: remove o cashback CREDITADO por um pedido cancelado/estornado e
 * recalcula o nível. Pendente → some do pendente; disponível não gasto → remove
 * do saldo (nunca negativo). Idempotente: lançamento já 'cancelado' é no-op.
 * IMPORTANTE: chame DEPOIS de marcar o pedido como 'cancelado', para o recálculo
 * de totalGasto já desconsiderá-lo.
 */
export async function estornarCashbackPedido(pedidoId: string) {
  const lanc = await prisma.cashbackTransacao.findFirst({
    where:   { pedidoId, tipo: 'credito' },
    orderBy: { createdAt: 'desc' },
  })

  if (lanc && lanc.status !== 'cancelado') {
    const valor = Number(lanc.valor)
    const cli = await prisma.cliente.findUnique({
      where:  { id: lanc.clienteId },
      select: { cashbackSaldo: true, cashbackPendente: true },
    })

    if (lanc.status === 'pendente') {
      const remover = Math.min(valor, Number(cli?.cashbackPendente ?? 0))
      await prisma.$transaction([
        prisma.cashbackTransacao.update({ where: { id: lanc.id }, data: { status: 'cancelado' } }),
        prisma.cliente.update({
          where: { id: lanc.clienteId },
          data:  { cashbackPendente: { decrement: remover } },
        }),
      ])
    } else {
      // 'disponivel' — remove do saldo o que ainda existe (nunca negativo).
      const remover = Math.min(valor, Number(cli?.cashbackSaldo ?? 0))
      await prisma.$transaction([
        prisma.cashbackTransacao.update({ where: { id: lanc.id }, data: { status: 'cancelado' } }),
        prisma.cliente.update({
          where: { id: lanc.clienteId },
          data:  { cashbackSaldo: { decrement: remover } },
        }),
      ])
    }
  }

  // Recalcular nível: totalGasto é a soma dos pedidos pagos/entregues. O pedido
  // cancelado já não entra (status != pago/entregue), então o nível pode rebaixar.
  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId }, select: { clienteId: true } })
  if (!pedido) return
  const totalGasto = await totalGastoDe(pedido.clienteId)
  await prisma.cliente.update({ where: { id: pedido.clienteId }, data: { totalGasto } })
}

/**
 * Resgate de cashback no checkout. Valida e debita SERVER-SIDE:
 * o valor é limitado a min(pedido, saldo disponível, 10% do subtotal de produtos).
 * Retorna o valor efetivamente aplicado (0 se nada). Cria débito + decrementa saldo.
 */
export async function resgatarCashback(
  clienteId: string,
  valorSolicitado: number,
  subtotalProdutos: number,
  pedidoId: string,
): Promise<number> {
  if (!valorSolicitado || valorSolicitado <= 0) return 0

  const cli = await prisma.cliente.findUnique({
    where:  { id: clienteId },
    select: { cashbackSaldo: true },
  })
  const disponivel = Number(cli?.cashbackSaldo ?? 0)
  const teto = round2(Math.max(0, subtotalProdutos) * TETO_USO_CASHBACK)

  const aplicar = round2(Math.max(0, Math.min(valorSolicitado, disponivel, teto)))
  if (aplicar <= 0) return 0

  await prisma.$transaction([
    prisma.cashbackTransacao.create({
      data: {
        clienteId,
        tipo:      'debito',
        status:    'disponivel',
        valor:     aplicar,
        descricao: `Cashback usado no pedido #${pedidoId.slice(-8).toUpperCase()}`,
        pedidoId,
      },
    }),
    prisma.cliente.update({
      where: { id: clienteId },
      data:  { cashbackSaldo: { decrement: aplicar } },
    }),
  ])
  return aplicar
}

/** Retorna extrato do cliente */
export async function extratoCashback(clienteId: string, limit = 20) {
  return prisma.cashbackTransacao.findMany({
    where:   { clienteId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
  })
}
