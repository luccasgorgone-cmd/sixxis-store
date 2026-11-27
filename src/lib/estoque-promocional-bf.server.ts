import { prisma } from '@/lib/prisma'
import { STATUS_PAGO_TODOS } from '@/lib/pedido-status'
import { promoAtiva } from './promo-segunda-unidade'
import {
  calcularEstoquePromocionalBF,
  chaveQuantidadePaga,
  INICIO_LOTES_PROMOCIONAIS_BF,
  SLUGS_LOTES_PROMOCIONAIS_BF,
  type EstoquePromocionalBF,
  type ProdutoLoteInput,
  type SaldoLoteBF,
  type VariacaoLoteInput,
} from './estoque-promocional-bf'

export async function buscarQuantidadesPagasLoteBF(): Promise<Map<string, number>> {
  if (!promoAtiva()) return new Map()

  const linhas = await prisma.itemPedido.groupBy({
    by: ['produtoId', 'variacaoId'],
    where: {
      produto: { slug: { in: SLUGS_LOTES_PROMOCIONAIS_BF } },
      pedido: {
        status: { in: STATUS_PAGO_TODOS },
        pagoEm: { gte: INICIO_LOTES_PROMOCIONAIS_BF },
      },
    },
    _sum: { quantidade: true },
  })

  return new Map(
    linhas.map((linha) => [
      chaveQuantidadePaga(linha.produtoId, linha.variacaoId),
      linha._sum.quantidade ?? 0,
    ]),
  )
}

type ProdutoComVariacoes = ProdutoLoteInput & {
  variacoes?: readonly (VariacaoLoteInput & Record<string, unknown>)[]
  [key: string]: unknown
}

export type ProdutoComSaldoPromocional<T extends ProdutoComVariacoes> = Omit<T, 'variacoes'> & {
  estoquePromocional?: EstoquePromocionalBF
  variacoes?: Array<(NonNullable<T['variacoes']>[number]) & { estoquePromocional?: SaldoLoteBF }>
}

export function anexarSaldosLoteBF<T extends ProdutoComVariacoes>(
  produtos: readonly T[],
  pagos: ReadonlyMap<string, number>,
  agora: Date = new Date(),
): Array<ProdutoComSaldoPromocional<T>> {
  return produtos.map((produto) => {
    const saldo = calcularEstoquePromocionalBF(produto, pagos, agora)
    if (!saldo) return produto as unknown as ProdutoComSaldoPromocional<T>

    const variacoes = produto.variacoes?.map((variacao) => {
      const saldoVariacao = saldo.variantes?.[variacao.id]
      return saldoVariacao
        ? { ...variacao, estoquePromocional: saldoVariacao }
        : variacao
    })

    return {
      ...produto,
      estoquePromocional: saldo,
      ...(variacoes ? { variacoes } : {}),
    } as ProdutoComSaldoPromocional<T>
  })
}
