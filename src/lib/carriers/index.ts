// ─── Registro de carriers ────────────────────────────────────────────────────
// Ponto único de entrada. cotarComCarriers() consulta TODAS as transportadoras
// habilitadas (Braspress, Melhor Envio) e devolve as cotações normalizadas. Nunca
// lança: cada carrier já retorna [] em falha, e agregamos o que vier. O resolver
// escolhe a mais barata — com ambos ativos, o menor preço vence automaticamente.

import type { Carrier, Cotacao, CotacaoInput } from './types'
import { braspressCarrier, braspressEnabled } from './braspress'
import { melhorenvioCarrier, melhorenvioEnabled } from './melhorenvio'

export type { Carrier, Cotacao, CotacaoInput, ItemCotacao } from './types'
export { braspressEnabled } from './braspress'
export { melhorenvioEnabled } from './melhorenvio'

// Carriers habilitados por feature flag. Futuro: Correios, Jadlog, etc.
export function carriersHabilitados(): Carrier[] {
  const lista: Carrier[] = []
  if (braspressEnabled()) lista.push(braspressCarrier)
  if (melhorenvioEnabled()) lista.push(melhorenvioCarrier)
  return lista
}

// True se pelo menos um carrier de cotação em tempo real está ligado.
export function algumCarrierHabilitado(): boolean {
  return braspressEnabled() || melhorenvioEnabled()
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
