// Estados brasileiros (27 UFs) + agrupamento por região.
// Fonte única usada pela tela admin de frete (preenchimento por região)
// e pela validação do resolver de frete.

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export type UF = (typeof UFS)[number]

export const UF_NOMES: Record<UF, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
}

export const REGIOES: { nome: string; ufs: UF[] }[] = [
  { nome: 'Norte',        ufs: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'] },
  { nome: 'Nordeste',     ufs: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'] },
  { nome: 'Centro-Oeste', ufs: ['DF', 'GO', 'MT', 'MS'] },
  { nome: 'Sudeste',      ufs: ['ES', 'MG', 'RJ', 'SP'] },
  { nome: 'Sul',          ufs: ['PR', 'RS', 'SC'] },
]

export function isUF(v: string): v is UF {
  return (UFS as readonly string[]).includes(v)
}

export function normalizarUF(v: string | null | undefined): UF | null {
  const up = String(v ?? '').trim().toUpperCase()
  return isUF(up) ? up : null
}
