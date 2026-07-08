// ─── Registro de carriers ────────────────────────────────────────────────────
// Ponto único de entrada. cotarComCarriers() consulta TODAS as transportadoras
// habilitadas (hoje: Braspress) e devolve as cotações normalizadas. Nunca lança:
// cada carrier já retorna [] em falha, e agregamos o que vier.

import type { Carrier, Cotacao, CotacaoInput } from './types'
import { braspressCarrier, braspressEnabled } from './braspress'

export type { Carrier, Cotacao, CotacaoInput, ItemCotacao } from './types'
export { braspressEnabled } from './braspress'

// Carriers habilitados por feature flag. Futuro: Correios, Jadlog, etc.
export function carriersHabilitados(): Carrier[] {
  const lista: Carrier[] = []
  if (braspressEnabled()) lista.push(braspressCarrier)
  return lista
}

// True se pelo menos um carrier de cotação em tempo real está ligado.
export function algumCarrierHabilitado(): boolean {
  return braspressEnabled()
}

export async function cotarComCarriers(input: CotacaoInput): Promise<Cotacao[]> {
  const carriers = carriersHabilitados()
  if (!carriers.length) return []

  const resultados = await Promise.all(
    carriers.map((c) =>
      c.cotar(input).catch((err) => {
        console.warn(`[carriers] ${c.id} falhou:`, String(err))
        return [] as Cotacao[]
      }),
    ),
  )
  return resultados.flat()
}
