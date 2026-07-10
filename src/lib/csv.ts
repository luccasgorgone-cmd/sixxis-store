// ─── Exportação CSV compatível com Excel BR ──────────────────────────────────
// Sem dependência nova (nada de SheetJS): o Excel pt-BR abre CSV corretamente
// quando (a) o separador é `;`, (b) há BOM UTF-8 no início — senão acentos viram
// mojibake — e (c) os decimais usam vírgula.

/** Escapa um campo: aspas duplicadas e envolve se contiver ; " ou quebra de linha. */
function campo(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'number' ? String(v) : v
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Número no formato pt-BR (vírgula decimal), sem separador de milhar. */
export function numeroBR(v: number | null | undefined, casas = 2): string {
  if (v == null || !Number.isFinite(v)) return ''
  return v.toFixed(casas).replace('.', ',')
}

export function gerarCsv(cabecalho: string[], linhas: (string | number | null)[][]): string {
  const corpo = [cabecalho, ...linhas].map((l) => l.map(campo).join(';')).join('\r\n')
  return '﻿' + corpo // BOM
}

/** Dispara o download no browser. Revoga a URL para não vazar memória. */
export function baixarCsv(nomeArquivo: string, conteudo: string): void {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
