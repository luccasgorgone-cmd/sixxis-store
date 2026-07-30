import { prisma } from '@/lib/prisma'

// ─── Busca de Cliente por TELEFONE — normalização única ──────────────────────
//
// Telefone chega de todo jeito: com/sem DDI 55, com/sem o 9º dígito de celular,
// com máscara. Este módulo é o ponto ÚNICO que resolve isso — estava inline em
// /api/interno/cliente e foi extraído para o endpoint de pedidos-por-telefone
// usar EXATAMENTE o mesmo casamento (duas normalizações divergentes achariam
// clientes diferentes para o mesmo número).

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

/**
 * Clientes cujo telefone casa o informado, do mais provável para o menos.
 *
 * Candidatos vêm por SQL (os últimos 8 dígitos, ignorando a formatação livre
 * gravada na coluna) e são confirmados pelo canônico completo — o DDD entra na
 * conta. Quando o input não normaliza para 10 dígitos (número curto, número de
 * fora), os candidatos por final de 8 dígitos são devolvidos como estão.
 *
 * Lista vazia = nenhum casamento; quem chama decide o que fazer.
 */
export async function acharClientesPorTelefone(
  telefone: string,
  limite = 20,
): Promise<{ id: string; telefone: string | null }[]> {
  const d = digitosTelefone(telefone)
  if (d.length < 8) return []

  const last8 = d.slice(-8)
  const candidatos = await prisma.$queryRaw<{ id: string; telefone: string | null }[]>`
    SELECT id, telefone FROM Cliente
    WHERE telefone IS NOT NULL
      AND RIGHT(REGEXP_REPLACE(telefone, '[^0-9]', ''), 8) = ${last8}
    LIMIT ${limite}
  `

  const canonInput = canonTelefone(telefone)
  if (canonInput.length !== 10) return candidatos
  return candidatos.filter((c) => canonTelefone(c.telefone ?? '') === canonInput)
}
