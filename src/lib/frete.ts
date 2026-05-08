// Tabela de frete fallback por região, em REAIS (price já em float).
// Ativada quando Melhor Envio falha (token inválido, timeout, erro 5xx).
// IMPORTANTE: NUNCA retornar 500 ao cliente — degrada UX gravemente.

interface RegiaoFrete {
  pacPreco: number
  sedexPreco: number
  pacDias: string
  sedexDias: string
}

// Mapa por dígito inicial do CEP (faixas oficiais Correios)
//  0xxxxxxx — SP capital/grande SP
//  1xxxxxxx — interior SP
//  2xxxxxxx — RJ + ES
//  3xxxxxxx — MG
//  4xxxxxxx — BA + SE
//  5xxxxxxx — PE + AL + PB + RN
//  6xxxxxxx — CE + PI + MA + PA + AP + AM + RR
//  7xxxxxxx — DF + GO + TO + MT + MS + RO + AC
//  8xxxxxxx — PR + SC
//  9xxxxxxx — RS
const TABELA: Record<string, RegiaoFrete> = {
  '0': { pacPreco: 28,  sedexPreco: 55,  pacDias: '3 a 5 dias úteis', sedexDias: '1 a 2 dias úteis' },
  '1': { pacPreco: 32,  sedexPreco: 58,  pacDias: '3 a 5 dias úteis', sedexDias: '1 a 2 dias úteis' },
  '2': { pacPreco: 38,  sedexPreco: 68,  pacDias: '4 a 6 dias úteis', sedexDias: '2 a 3 dias úteis' },
  '3': { pacPreco: 42,  sedexPreco: 75,  pacDias: '4 a 6 dias úteis', sedexDias: '2 a 3 dias úteis' },
  '4': { pacPreco: 75,  sedexPreco: 135, pacDias: '6 a 9 dias úteis', sedexDias: '3 a 5 dias úteis' },
  '5': { pacPreco: 80,  sedexPreco: 140, pacDias: '7 a 10 dias úteis', sedexDias: '3 a 5 dias úteis' },
  '6': { pacPreco: 95,  sedexPreco: 175, pacDias: '8 a 12 dias úteis', sedexDias: '4 a 6 dias úteis' },
  '7': { pacPreco: 65,  sedexPreco: 115, pacDias: '5 a 8 dias úteis', sedexDias: '3 a 4 dias úteis' },
  '8': { pacPreco: 48,  sedexPreco: 88,  pacDias: '5 a 7 dias úteis', sedexDias: '2 a 4 dias úteis' },
  '9': { pacPreco: 55,  sedexPreco: 98,  pacDias: '5 a 8 dias úteis', sedexDias: '2 a 4 dias úteis' },
}

export interface OpcaoFreteFallback {
  id: string
  nome: string
  prazo: string
  preco: number
  servico: 'pac' | 'sedex' | 'retira'
}

// Regra de frete grátis acima de R$ 500 foi removida (decisão pré-launch).
// Frete agora sempre cobrado conforme transportadora, independente do subtotal.
// Cupom do tipo FRETE_GRATIS continua funcional (lógica em src/lib/preco-cupom).
export function calcularFreteFallback(
  cepDestino: string,
  subtotal: number,
): OpcaoFreteFallback[] {
  void subtotal
  const limpo = cepDestino.replace(/\D/g, '')
  const regiao = TABELA[limpo[0]] ?? TABELA['0']

  return [
    {
      id: 'pac',
      nome: 'PAC',
      prazo: regiao.pacDias,
      preco: regiao.pacPreco,
      servico: 'pac',
    },
    {
      id: 'sedex',
      nome: 'SEDEX',
      prazo: regiao.sedexDias,
      preco: regiao.sedexPreco,
      servico: 'sedex',
    },
  ]
}
