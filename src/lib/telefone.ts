// ─── Normalização de telefone BR — fonte ÚNICA, pura (sem prisma) ────────────
//
// Extraído de telefone-busca.ts para poder ser reusado em módulos puros/testáveis
// (ex.: guest-checkout) sem arrastar o import de prisma. telefone-busca.ts
// reexporta estas funções, então nada muda para quem já importava de lá.

/** Só dígitos. */
export function digitosTelefone(v: string): string {
  return (v ?? '').replace(/\D/g, '')
}

/**
 * Forma canônica BR: DDD(2) + número de 8 dígitos (sem o 9 de celular, sem o
 * DDI 55). Tolera com/sem 55 e com/sem o 9. Retorna os dígitos crus se não der
 * para normalizar (números curtos/estrangeiros).
 */
export function canonTelefone(raw: string): string {
  let d = digitosTelefone(raw)
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2) // 55 + DDD + 9 dígitos
  else if (d.length === 12 && d.startsWith('55')) d = d.slice(2) // 55 + DDD + 8 dígitos
  if (d.length === 11) return d.slice(0, 2) + d.slice(3) // DDD + 9 + 8 -> DDD + 8
  if (d.length === 10) return d // DDD + 8
  return d
}
