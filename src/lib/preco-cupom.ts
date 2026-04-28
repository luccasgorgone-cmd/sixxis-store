// Tipos e helpers para cupom — separa o tipo do desconto (percentual vs valor
// fixo vs frete grátis) e expõe formatadores de descrição amigáveis.
//
// Bug histórico: código antigo armazenava `valor` como o DESCONTO calculado
// (em reais) e exibia "${valor}% de desconto", mostrando "300% de desconto"
// num cupom de R$ 300. Agora `valor` representa SEMPRE o parâmetro do cupom
// (10 → 10% se PERCENTUAL, 5000 → R$ 5000 se VALOR_FIXO).

export type TipoCupom = 'PERCENTUAL' | 'VALOR_FIXO' | 'FRETE_GRATIS'

export interface CupomAplicado {
  codigo: string
  tipo: TipoCupom
  /** Valor do parâmetro do cupom: 10 = 10% (se PERCENTUAL), 50 = R$ 50 (se VALOR_FIXO). */
  valor: number
  /** Desconto calculado em REAIS sobre o subtotal informado. */
  desconto: number
  /** Descrição amigável já formatada para o usuário. */
  descricao: string
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

export function descricaoCupom(tipo: TipoCupom, valor: number): string {
  if (tipo === 'PERCENTUAL') return `${valor}% OFF`
  if (tipo === 'VALOR_FIXO') return `${fmtBRL(valor)} de desconto`
  return 'Frete grátis'
}

export function calcularDescontoCupom(
  tipo: TipoCupom,
  valor: number,
  subtotal: number,
): number {
  if (tipo === 'PERCENTUAL') return Math.min(subtotal * (valor / 100), subtotal)
  if (tipo === 'VALOR_FIXO') return Math.min(valor, subtotal)
  return 0 // FRETE_GRATIS é aplicado no frete
}

export function legendaCupomAplicado(c: CupomAplicado): string {
  if (c.tipo === 'PERCENTUAL') return `−${fmtBRL(c.desconto)} · ${c.valor}% OFF`
  if (c.tipo === 'VALOR_FIXO') return `−${fmtBRL(c.desconto)}`
  return 'Frete grátis aplicado'
}
