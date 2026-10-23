import { prisma } from '@/lib/prisma'
import { canonTelefone, digitosTelefone } from '@/lib/telefone'

// ─── Busca de Cliente por TELEFONE — normalização única ──────────────────────
//
// Telefone chega de todo jeito: com/sem DDI 55, com/sem o 9º dígito de celular,
// com máscara. A normalização (digitosTelefone/canonTelefone) vive agora em
// @/lib/telefone (puro, sem prisma) e é REEXPORTADA aqui para não quebrar quem
// já importava daqui. Este módulo segue sendo o ponto único da BUSCA.
export { canonTelefone, digitosTelefone }

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
