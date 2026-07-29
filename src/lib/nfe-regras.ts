// ─── SIXXIS · Matriz fiscal da NF-e ──────────────────────────────────────────
//
// Função PURA: dado (categoria do produto, UF de destino, indicador de IE do
// destinatário), devolve NCM / CFOP / CSOSN / origem / CEST.
//
// Por que derivar da CATEGORIA e não de campos no Produto? Porque o catálogo da
// Sixxis é fechado em três famílias, todas importadas, e a classificação fiscal
// é a MESMA dentro de cada família. Um campo NCM por produto só criaria uma
// superfície a mais para digitar errado. Se um dia entrar uma família nova, o
// lugar de mexer é aqui — e a função LANÇA em categoria desconhecida, para que
// a emissão pare em vez de mandar um NCM chutado para a SEFAZ.
//
// Regime: Simples Nacional (CRT=1) → tributação de ICMS por CSOSN, não por CST.

export type CategoriaFiscal = 'climatizadores' | 'aspiradores' | 'spinning'

export interface RegrasFiscaisInput {
  /** Produto.categoria — 'climatizadores' | 'aspiradores' | 'spinning'. */
  categoria: string
  /** UF de destino (Endereco.estado), 2 letras. Case-insensitive. */
  ufDestino: string
  /**
   * Cliente.indicadorIE — 1=Contribuinte ICMS, 2=Isento, 9=Não contribuinte.
   * null/undefined é tratado como 9 (o caso PF, que é a maioria).
   */
  indicadorIE?: number | null
}

export interface RegrasFiscais {
  ncm: string
  cfop: string
  csosn: string
  /** icms_origem: 2 = estrangeira, adquirida no mercado interno. */
  origem: number
  /** Só existe para mercadoria sujeita a ICMS-ST (climatizadores). */
  cest?: string
}

// ─── Tabelas por categoria ───────────────────────────────────────────────────

const NCM: Record<CategoriaFiscal, string> = {
  climatizadores: '84796000', // aparelhos de ar por evaporação
  spinning:       '95069900', // artigos p/ ginástica e atletismo
  aspiradores:    '85081100', // aspiradores ≤ 1500 W e ≤ 20 L
}

const CEST: Partial<Record<CategoriaFiscal, string>> = {
  climatizadores: '2110500', // sujeito a ICMS-ST — CEST obrigatório
}

// TODO-FISCAL: o CSOSN 500 do climatizador quando o destinatário é PJ
// CONTRIBUINTE ainda aguarda confirmação da contadora. 500 = "ICMS cobrado
// anteriormente por substituição tributária", que é o que a pesquisa sustenta
// (a ST já foi retida na cadeia, na entrada). O ponto em aberto é se a venda
// interestadual a contribuinte deveria sair como 102 com ST recolhida à parte.
// Mantido 500 — VALIDAR ANTES DE PRODUÇÃO.
const CSOSN: Record<CategoriaFiscal, string> = {
  climatizadores: '500',
  spinning:       '102', // tributada pelo Simples, sem permissão de crédito
  aspiradores:    '102', // regra vigente a partir de 01/08/2026
}

/** Origem da mercadoria — toda a linha Sixxis é importada. */
const ORIGEM_ESTRANGEIRA_MERCADO_INTERNO = 2

/** UF do emitente. Operação dentro dela é interna (CFOP 5xxx). */
const UF_EMITENTE = 'SP'

function normalizarCategoria(categoria: string): CategoriaFiscal {
  const c = categoria?.trim().toLowerCase()
  if (c === 'climatizadores' || c === 'aspiradores' || c === 'spinning') return c
  throw new Error(
    `Categoria sem regra fiscal cadastrada: "${categoria}". ` +
      'Cadastre NCM/CFOP/CSOSN em src/lib/nfe-regras.ts antes de emitir.',
  )
}

/**
 * CFOP da operação.
 *
 *  • Dentro de SP (operação interna):
 *      climatizador (ST) → 5405 (venda de mercadoria com ICMS retido por ST,
 *                                na condição de contribuinte substituído)
 *      demais           → 5102 (venda de mercadoria adquirida de terceiros)
 *  • Fora de SP (interestadual):
 *      destinatário CONTRIBUINTE (indicadorIE = 1) → 6102
 *      destinatário NÃO contribuinte (PF, ou PJ isenta/não-contribuinte) → 6108
 *
 * Nota: 6108 é justamente "venda de mercadoria adquirida de terceiros destinada
 * a não contribuinte" — é ele que sinaliza o DIFAL de consumidor final.
 */
function cfopDe(categoria: CategoriaFiscal, uf: string, indicadorIE: number): string {
  if (uf === UF_EMITENTE) {
    return categoria === 'climatizadores' ? '5405' : '5102'
  }
  return indicadorIE === 1 ? '6102' : '6108'
}

export function regrasFiscais({
  categoria,
  ufDestino,
  indicadorIE,
}: RegrasFiscaisInput): RegrasFiscais {
  const cat = normalizarCategoria(categoria)
  const uf = (ufDestino ?? '').trim().toUpperCase()
  // PF e PJ sem indicador caem em 9 (não contribuinte) — o default seguro, que
  // nunca promove alguém a contribuinte por omissão de cadastro.
  const ie = indicadorIE ?? 9

  const cest = CEST[cat]

  return {
    ncm: NCM[cat],
    cfop: cfopDe(cat, uf, ie),
    csosn: CSOSN[cat],
    origem: ORIGEM_ESTRANGEIRA_MERCADO_INTERNO,
    ...(cest ? { cest } : {}),
  }
}
