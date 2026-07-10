// ─── Agregações da central de lucratividade — FONTE ÚNICA ────────────────────
// Funções PURAS sobre as linhas do relatório. Usadas pela ROTA (período inteiro)
// e pela PÁGINA (ao filtrar por forma de pagamento, sem nova chamada). Sem isto,
// o filtro do client teria que reimplementar a mesma matemática — e as duas
// cópias divergiriam.
//
// Regra que atravessa tudo: custo/lucro DESCONHECIDO nunca vale 0.
//  • uma linha sem `margemContrib` não entra na soma nem no denominador da média
//    de margem; idem para `lucroReal`.
//  • um bucket (dia/forma) sem nenhuma linha com o valor devolve `null`, não 0.

export interface LinhaMargem {
  pedidoId: string
  data: string
  cliente: string
  forma: string
  venda: number
  taxaMp: number | null
  custoFrete: number | null
  custoProdutos: number | null
  margemContrib: number | null
  margemContribPct: number | null
  lucroReal: number | null
  lucroRealPct: number | null
  taxaPendente: boolean
  fretePendente: boolean
  custoPendente: boolean
}

const soma = (ns: (number | null)[]) => ns.reduce<number>((s, n) => s + (n ?? 0), 0)

// ── Totais ───────────────────────────────────────────────────────────────────

export function agregarTotais(linhas: LinhaMargem[]) {
  // Duas bases distintas — cada resultado só soma as linhas em que ele existe.
  const comContrib = linhas.filter((l) => l.margemContrib != null)
  const comLucro   = linhas.filter((l) => l.lucroReal != null)

  const vendasComContrib = soma(comContrib.map((l) => l.venda))
  const vendasComLucro   = soma(comLucro.map((l) => l.venda))
  const somaMargemContrib = soma(comContrib.map((l) => l.margemContrib))
  const somaLucroReal     = soma(comLucro.map((l) => l.lucroReal))

  return {
    pedidos: linhas.length,
    vendas: soma(linhas.map((l) => l.venda)),
    taxaMp: soma(linhas.map((l) => l.taxaMp)),
    custoFrete: soma(linhas.map((l) => l.custoFrete)),

    margemContrib: somaMargemContrib,
    margemContribPctMedia: vendasComContrib > 0 ? (somaMargemContrib / vendasComContrib) * 100 : null,
    linhasComContrib: comContrib.length,

    custoProdutos: soma(comLucro.map((l) => l.custoProdutos)),
    lucroReal: somaLucroReal,
    lucroRealPctMedia: vendasComLucro > 0 ? (somaLucroReal / vendasComLucro) * 100 : null,
    linhasComLucro: comLucro.length,
    /** false → a UI mostra "aguardando custos" em vez de R$ 0,00. */
    lucroDisponivel: comLucro.length > 0,

    taxasPendentes: linhas.filter((l) => l.taxaPendente).length,
    fretesPendentes: linhas.filter((l) => l.fretePendente).length,
    custosPendentes: linhas.filter((l) => l.custoPendente).length,
    vendasComContrib,
    vendasComLucro,
  }
}

// ── Série temporal ───────────────────────────────────────────────────────────

/** YYYY-MM-DD (data local, igual ao resto do admin). */
export function chaveDia(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Segunda-feira da semana da data (agrupamento de períodos longos). */
export function chaveSemana(d: Date): string {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diaSemana = (base.getDay() + 6) % 7 // 0 = segunda
  base.setDate(base.getDate() - diaSemana)
  return chaveDia(base)
}

export const DIAS_P_AGRUPAR_POR_SEMANA = 60

export interface PontoSerie {
  data: string
  vendas: number
  pedidos: number
  margemContrib: number | null
  lucroReal: number | null
}

export function agregarSerieTemporal(linhas: LinhaMargem[], porSemana: boolean): PontoSerie[] {
  const chaveDe = porSemana ? chaveSemana : chaveDia
  const buckets = new Map<string, {
    vendas: number; pedidos: number
    contribSoma: number; contribCount: number
    lucroSoma: number; lucroCount: number
  }>()

  for (const l of linhas) {
    const k = chaveDe(new Date(l.data))
    const b = buckets.get(k) ?? { vendas: 0, pedidos: 0, contribSoma: 0, contribCount: 0, lucroSoma: 0, lucroCount: 0 }
    b.vendas += l.venda
    b.pedidos += 1
    if (l.margemContrib != null) { b.contribSoma += l.margemContrib; b.contribCount++ }
    if (l.lucroReal != null)     { b.lucroSoma  += l.lucroReal;     b.lucroCount++ }
    buckets.set(k, b)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, b]) => ({
      data,
      vendas: b.vendas,
      pedidos: b.pedidos,
      // null quando nenhuma linha do bucket tem o valor — nunca 0 fingido, que
      // o gráfico desenharia como uma queda que não aconteceu.
      margemContrib: b.contribCount > 0 ? b.contribSoma : null,
      lucroReal:     b.lucroCount   > 0 ? b.lucroSoma   : null,
    }))
}

// ── Por forma de pagamento ───────────────────────────────────────────────────

export interface LinhaForma {
  forma: string
  vendas: number
  count: number
  margemContrib: number | null
  margemContribPct: number | null
  lucroReal: number | null
  lucroRealPct: number | null
}

export function agregarPorForma(linhas: LinhaMargem[]): LinhaForma[] {
  const formas = new Map<string, {
    vendas: number; count: number
    contribSoma: number; vendasContrib: number
    lucroSoma: number; vendasLucro: number
  }>()

  for (const l of linhas) {
    const f = formas.get(l.forma) ?? { vendas: 0, count: 0, contribSoma: 0, vendasContrib: 0, lucroSoma: 0, vendasLucro: 0 }
    f.vendas += l.venda
    f.count += 1
    // Denominador = vendas das linhas que TÊM aquele resultado. Uma linha sem
    // custo continua contando nas vendas e na margem, mas não na média de lucro.
    if (l.margemContrib != null) { f.contribSoma += l.margemContrib; f.vendasContrib += l.venda }
    if (l.lucroReal != null)     { f.lucroSoma   += l.lucroReal;     f.vendasLucro   += l.venda }
    formas.set(l.forma, f)
  }

  return [...formas.entries()]
    .map(([forma, f]) => ({
      forma,
      vendas: f.vendas,
      count: f.count,
      margemContrib: f.vendasContrib > 0 ? f.contribSoma : null,
      margemContribPct: f.vendasContrib > 0 ? (f.contribSoma / f.vendasContrib) * 100 : null,
      lucroReal: f.vendasLucro > 0 ? f.lucroSoma : null,
      lucroRealPct: f.vendasLucro > 0 ? (f.lucroSoma / f.vendasLucro) * 100 : null,
    }))
    .sort((a, b) => b.vendas - a.vendas)
}
