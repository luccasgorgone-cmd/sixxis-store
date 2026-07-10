// ─── Registro de carriers ────────────────────────────────────────────────────
// Ponto único de entrada. cotarComCarriers() consulta TODAS as transportadoras
// habilitadas (Braspress, Melhor Envio) e devolve as cotações normalizadas. Nunca
// lança: cada carrier já retorna [] em falha, e agregamos o que vier. O resolver
// escolhe a mais barata — com ambos ativos, o menor preço vence automaticamente.

import type { Carrier, Cotacao, CotacaoDetalhada, CotacaoInput } from './types'
import { braspressCarrier, braspressEnabled } from './braspress'
import { melhorenvioCarrier, melhorenvioEnabled } from './melhorenvio'

export type { Carrier, Cotacao, CotacaoDetalhada, CotacaoInput, ItemCotacao } from './types'
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

// Cotação DETALHADA por transportadora — mesma fan-out de cotarComCarriers, mas
// devolve UM resultado por carrier ATIVO, com nome e (quando falha) o motivo, sem
// colapsar na mais barata. Uso INTERNO/admin (API interna do CRM). Nunca lança:
// um carrier que estoure vira ok:false com o erro, sem derrubar os outros.
export async function cotarComCarriersDetalhado(input: CotacaoInput): Promise<CotacaoDetalhada[]> {
  const carriers = carriersHabilitados()
  if (!carriers.length) return []

  return Promise.all(
    carriers.map((c) =>
      c.cotarDetalhado(input).catch((err) => {
        console.warn(`[carriers] ${c.id} falhou (detalhado):`, String(err))
        return {
          carrierId: c.id,
          transportadora: c.nome,
          ok: false,
          preco: null,
          prazoDias: null,
          erro: String(err),
        } satisfies CotacaoDetalhada
      }),
    ),
  )
}
