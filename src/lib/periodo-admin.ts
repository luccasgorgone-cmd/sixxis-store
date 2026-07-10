// ─── Período dos relatórios do admin — FONTE ÚNICA ───────────────────────────
// Extraído de /api/admin/dashboard para ser reusado por qualquer relatório que
// precise do MESMO filtro (Hoje / 7d / 30d / Mês / Personalizado). Se as regras
// de janela mudarem, mudam para todos os cards e relatórios de uma vez.
//
// Semântica preservada do dashboard:
//  • from/to (ou dataInicio/dataFim) explícitos vencem o `periodo`.
//  • sem nada → últimos 30 dias.
//  • `to` sempre fecha no fim do dia; `from` sempre abre no início do dia.
//  • o período ANTERIOR tem a mesma duração e termina 1ms antes de `from`
//    (usado para as comparações "vs período anterior").

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

export function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

export interface Periodo {
  from: Date
  to: Date
  /** Janela anterior de mesma duração, p/ comparativos. */
  prevFrom: Date
  prevTo: Date
}

export function resolverPeriodo(searchParams: URLSearchParams): Periodo {
  const periodoParam = searchParams.get('periodo')
  const fromParam    = searchParams.get('from') || searchParams.get('dataInicio')
  const toParam      = searchParams.get('to')   || searchParams.get('dataFim')

  let from: Date
  let to: Date

  if (fromParam && toParam) {
    from = startOfDay(new Date(fromParam))
    to   = endOfDay(new Date(toParam))
  } else {
    to = endOfDay(new Date())
    if (periodoParam === 'hoje') {
      from = startOfDay(new Date())
    } else if (periodoParam === '7d') {
      from = startOfDay(new Date(Date.now() - 6 * 86400000))
    } else if (periodoParam === 'mes') {
      const now = new Date()
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
    } else {
      // default: 30d
      from = startOfDay(new Date(Date.now() - 29 * 86400000))
    }
  }

  const diffMs   = to.getTime() - from.getTime()
  const prevTo   = new Date(from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - diffMs)

  return { from, to, prevFrom, prevTo }
}
