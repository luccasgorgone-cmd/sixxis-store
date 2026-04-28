// ─── SIXXIS · Fidelidade · Fonte única dos níveis ────────────────────────────
// Versão canônica: usamos os ícones e cores definidos em `avatares.ts` (mais
// polidos e já em produção no /minha-conta) tanto no admin quanto no cliente.
// Antes desta sprint, /adm-a7f9c2b4/clientes e /minha-conta exibiam SVGs/cores
// diferentes — agora há uma fonte única.

import {
  NIVEIS_CONFIG,
  ORDEM_NIVEIS_GEM,
  calcularNivel,
  normalizarNivel,
  getNivelSVGString,
  calcularNivelCompleto,
} from './avatares'

export type NivelLoyaltyId = 'Cristal' | 'Topázio' | 'Safira' | 'Diamante' | 'Esmeralda'

export interface NivelLoyalty {
  id:         NivelLoyaltyId
  nome:       string
  cor:        string
  corBanner:  string
  corTexto:   string
  bg:         string
  emoji:      string
  minGasto:   number
  cashbackPc: number
  proximo:    NivelLoyaltyId | null
}

export const NIVEIS_LOYALTY: NivelLoyalty[] = ORDEM_NIVEIS_GEM.map((id) => {
  const c = NIVEIS_CONFIG[id]
  return {
    id:         id as NivelLoyaltyId,
    nome:       c.label,
    cor:        c.cor,
    corBanner:  c.corBanner,
    corTexto:   c.corTexto,
    bg:         c.bg,
    emoji:      c.emoji,
    minGasto:   c.minGasto,
    cashbackPc: c.cashbackPct,
    proximo:    (c.proximoNivel as NivelLoyaltyId | null) ?? null,
  }
})

export function nivelPorGasto(totalGasto: number): NivelLoyalty {
  const id = calcularNivel(totalGasto)
  return NIVEIS_LOYALTY.find((n) => n.id === id) ?? NIVEIS_LOYALTY[0]
}

export function nivelPorId(id: string): NivelLoyalty {
  const norm = normalizarNivel(id)
  return NIVEIS_LOYALTY.find((n) => n.id === norm) ?? NIVEIS_LOYALTY[0]
}

// Re-exporta o SVG canônico — mesmo asset usado no /minha-conta header.
export const svgIconeNivel = getNivelSVGString
export { calcularNivel, calcularNivelCompleto, normalizarNivel }
