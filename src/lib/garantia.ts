import { prisma } from '@/lib/prisma'

export interface GarantiaSelecionadaInput {
  produtoId: string
  pedidoItemId?: string
  mesesAdicionais: 12 | 24
  valorPago: number // em REAIS (Decimal)
}

/**
 * Cria os registros de GarantiaEstendida vinculados a um pedido após
 * confirmação de pagamento. A vigência começa após o término da garantia
 * de fábrica (que conta a partir da data do pedido).
 */
export async function criarGarantiasPedido(
  pedidoId: string,
  pedidoCriadoEm: Date,
  itens: GarantiaSelecionadaInput[],
) {
  if (!itens.length) return []

  const produtos = await prisma.produto.findMany({
    where: { id: { in: itens.map((i) => i.produtoId) } },
    select: { id: true, garantiaFabricaMeses: true },
  })
  const fabricaPorProduto = new Map(produtos.map((p) => [p.id, p.garantiaFabricaMeses]))

  const dados = itens.map((g) => {
    const fabrica = fabricaPorProduto.get(g.produtoId) ?? 12
    const inicio = new Date(pedidoCriadoEm)
    inicio.setMonth(inicio.getMonth() + fabrica)
    const fim = new Date(inicio)
    fim.setMonth(fim.getMonth() + g.mesesAdicionais)
    return {
      pedidoId,
      produtoId: g.produtoId,
      pedidoItemId: g.pedidoItemId ?? null,
      mesesAdicionais: g.mesesAdicionais,
      valorPago: g.valorPago,
      inicioVigencia: inicio,
      fimVigencia: fim,
      status: 'ativa',
    }
  })

  await prisma.garantiaEstendida.createMany({ data: dados })
  return prisma.garantiaEstendida.findMany({
    where: { pedidoId },
    include: { produto: { select: { nome: true, slug: true } } },
  })
}

export function statusGarantia(g: { status: string; fimVigencia: Date }): string {
  if (g.status === 'cancelada') return 'cancelada'
  if (g.status === 'acionada') return 'acionada'
  if (new Date() > g.fimVigencia) return 'expirada'
  return 'ativa'
}
