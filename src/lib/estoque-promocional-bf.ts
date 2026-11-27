import { promoAtiva, PROMO_BF } from './promo-segunda-unidade'

export const LOTES_PROMOCIONAIS_BF = {
  'asp-bravo': { total: 30 },
  'sx180-trend': { total: 28 },
  'sx100-trend': { total: 12 },
  sx040: { total: 20 },
  'bicicleta-spinning-sixxis-cardio': { total: 20 },
  'm45-trend': { total: 26 },
  'sx070-trend': { total: 8 },
  'sx060-prime': { total: 6 },
  'sx120-prime': { total: 10 },
  'spinning-sixxis-life': {
    variantes: { preta: 14, branca: 10 },
  },
} as const

export const SLUGS_LOTES_PROMOCIONAIS_BF = Object.keys(LOTES_PROMOCIONAIS_BF)

export interface SaldoLoteBF {
  loteInicial: number
  restantes: number
}

export interface EstoquePromocionalBF extends SaldoLoteBF {
  variantes?: Record<string, SaldoLoteBF>
}

export interface VariacaoLoteInput {
  id: string
  nome: string
  estoque: number
}

export interface ProdutoLoteInput {
  id: string
  slug: string
  estoque: number
  variacoes?: readonly VariacaoLoteInput[]
}

export function chaveQuantidadePaga(produtoId: string, variacaoId: string | null): string {
  return `${produtoId}::${variacaoId ?? ''}`
}

export function calcularSaldoLote(loteInicial: number, vendidosPagos: number, estoqueReal: number): number {
  const saldoCampanha = Math.max(0, Math.floor(loteInicial) - Math.max(0, Math.floor(vendidosPagos)))
  return Math.max(0, Math.min(saldoCampanha, Math.max(0, Math.floor(estoqueReal))))
}

export function formatarAvisoUltimasUnidades(restantes: number): string {
  return restantes === 1
    ? 'Última unidade do lote Black Friday'
    : `Últimas ${restantes} unidades do lote Black Friday`
}

export function classificarVariacaoLote(nome: string): 'preta' | 'branca' | null {
  const valor = nome.toLocaleLowerCase('pt-BR')
  if (valor.includes('preta') || valor.includes('preto')) return 'preta'
  if (valor.includes('branca') || valor.includes('branco')) return 'branca'
  return null
}

function totalPagoProduto(produtoId: string, pagos: ReadonlyMap<string, number>): number {
  const prefixo = `${produtoId}::`
  let total = 0
  for (const [chave, quantidade] of pagos) {
    if (chave.startsWith(prefixo)) total += quantidade
  }
  return total
}

export function calcularEstoquePromocionalBF(
  produto: ProdutoLoteInput,
  pagos: ReadonlyMap<string, number>,
  agora: Date = new Date(),
): EstoquePromocionalBF | null {
  if (!promoAtiva(agora)) return null
  const config = LOTES_PROMOCIONAIS_BF[produto.slug as keyof typeof LOTES_PROMOCIONAIS_BF]
  if (!config) return null

  if ('total' in config) {
    return {
      loteInicial: config.total,
      restantes: calcularSaldoLote(config.total, totalPagoProduto(produto.id, pagos), produto.estoque),
    }
  }

  const variantes: Record<string, SaldoLoteBF> = {}
  let loteInicial = 0
  let restantes = 0

  for (const variacao of produto.variacoes ?? []) {
    const chaveCor = classificarVariacaoLote(variacao.nome)
    if (!chaveCor) continue
    const loteDaCor = config.variantes[chaveCor]
    const saldo = calcularSaldoLote(
      loteDaCor,
      pagos.get(chaveQuantidadePaga(produto.id, variacao.id)) ?? 0,
      variacao.estoque,
    )
    variantes[variacao.id] = { loteInicial: loteDaCor, restantes: saldo }
    loteInicial += loteDaCor
    restantes += saldo
  }

  if (loteInicial === 0) return null
  return { loteInicial, restantes, variantes }
}

export const INICIO_LOTES_PROMOCIONAIS_BF = new Date(PROMO_BF.inicio)
