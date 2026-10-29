// ─── Política regional de frete — FONTE ÚNICA DE VERDADE (regra de negócio) ──
// Regra vigente (out/2026): o frete grátis NÃO é mais para todo o Brasil.
//
//   • Frete GRÁTIS nas UFs de FreteGratis (Sul + Sudeste + MS + GO + MT).
//   • Demais UFs (Centro-Oeste restante incl. DF, Nordeste, Norte) →
//     frete = PERCENTUAL_FRETE (9%) sobre o VALOR do produto (preço efetivo ×
//     quantidade), somado por item.
//   • ASPIRADOR é isento da cobrança: frete grátis em QUALQUER UF.
//
// Esta política é AUTORITATIVA e substitui, no caminho padrão, a tabela manual
// FreteRegra como motor de preço. O cálculo incide sobre o preço EFETIVO
// (precoPromocional quando houver, senão preco) para cobrar sobre o que o
// cliente realmente paga. Funções puras, 100% testáveis, sem acesso a banco.

import { normalizarUF, type UF } from './ufs'

/** UFs com frete grátis: Sul (PR, SC, RS) + Sudeste (SP, RJ, MG, ES) + MS, GO, MT. */
export const UFS_FRETE_GRATIS: readonly UF[] = [
  'PR', 'SC', 'RS', 'SP', 'RJ', 'MG', 'ES', 'MS', 'GO', 'MT',
] as const

const SET_FRETE_GRATIS = new Set<string>(UFS_FRETE_GRATIS)

/** Percentual do valor do produto cobrado como frete nas UFs fora do grátis. */
export const PERCENTUAL_FRETE = 0.09 // 9%

/** Prazo (dias úteis) por UF [min, max] — tabela conferida (Sixxis). */
const PRAZO_UF: Record<UF, [number, number]> = {
  SP: [1, 3], MG: [2, 5], RJ: [3, 5], ES: [3, 6], PR: [2, 4], SC: [3, 5],
  RS: [4, 7], MS: [3, 6], GO: [3, 6], DF: [3, 6], MT: [4, 8], BA: [5, 9],
  SE: [6, 10], AL: [7, 12], PE: [7, 12], PB: [7, 13], RN: [7, 13], CE: [8, 13],
  PI: [8, 13], MA: [8, 14], TO: [5, 10], RO: [8, 15], PA: [8, 16], AC: [9, 17],
  AM: [10, 20], AP: [12, 22], RR: [12, 22],
}

/** Uma UF tem frete grátis? UF inválida → false. */
export function ufTemFreteGratis(uf: string | null | undefined): boolean {
  const u = normalizarUF(uf)
  return !!u && SET_FRETE_GRATIS.has(u)
}

/** O produto é um aspirador (isento de cobrança de frete)? Casa pela categoria. */
export function isAspirador(categoria: string | null | undefined): boolean {
  return /aspirador/i.test(categoria ?? '')
}

/** Prazo [min, max] em dias úteis para a UF. UF desconhecida → [0, 0]. */
export function prazoPorUF(uf: string | null | undefined): [number, number] {
  const u = normalizarUF(uf)
  return u ? PRAZO_UF[u] : [0, 0]
}

/** Arredonda para centavos (2 casas), evitando ruído de ponto flutuante. */
function arredondar2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100
}

/** Item do carrinho para cálculo de frete regional. */
export interface ItemFretePolitica {
  /** Preço efetivo unitário em reais (precoPromocional quando houver, senão preco). */
  precoEfetivo: number
  quantidade: number
  /** Categoria do produto (para isenção de aspirador). */
  categoria?: string | null
}

/**
 * Frete de UM item segundo a política regional:
 *   aspirador OU UF grátis → 0; senão 9% × (precoEfetivo × quantidade).
 */
export function calcularFreteItem(uf: string, item: ItemFretePolitica): number {
  if (isAspirador(item.categoria)) return 0
  if (ufTemFreteGratis(uf)) return 0
  const preco = Number.isFinite(item.precoEfetivo) ? Math.max(0, item.precoEfetivo) : 0
  const qtd = Math.max(1, Math.floor(Number(item.quantidade)) || 1)
  return arredondar2(preco * qtd * PERCENTUAL_FRETE)
}

export interface ResultadoFretePolitica {
  preco: number
  freteGratis: boolean
  prazoDiasMin: number
  prazoDiasMax: number
}

/**
 * Frete do CARRINHO inteiro: soma o frete de cada item. Frete grátis quando o
 * total é 0 (todas as UFs grátis OU todos os itens isentos). O prazo é o da UF
 * de destino (igual para todos os itens).
 */
export function calcularFreteCarrinho(
  uf: string,
  itens: ItemFretePolitica[],
): ResultadoFretePolitica {
  const total = arredondar2(
    itens.reduce((acc, item) => acc + calcularFreteItem(uf, item), 0),
  )
  const [prazoDiasMin, prazoDiasMax] = prazoPorUF(uf)
  return { preco: total, freteGratis: total === 0, prazoDiasMin, prazoDiasMax }
}
