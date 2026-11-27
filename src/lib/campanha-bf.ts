import { promoAtiva } from './promo-segunda-unidade'

export const CAMPANHA_CUPOM_BF = {
  codigo: 'BLACKFRIDAY10',
  percentual: 10,
  textoCurto: '10% OFF · BLACKFRIDAY10',
  textoHeader: '10% OFF com BLACKFRIDAY10 · em 1 produto elegível · não acumula com 50% na 2ª unidade',
  textoHeaderMobile: '1 item elegível · não acumula c/ 50% da 2ª un.',
} as const

export function campanhaCupomAtiva(agora: Date = new Date()): boolean {
  return promoAtiva(agora)
}
