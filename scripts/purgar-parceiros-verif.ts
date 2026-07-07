// SEÇÃO 2 — Remove APENAS os 2 registros de TESTE de Parceiro criados na verificação
// do deploy: "VERIF FINAL" e "VERIF DEPLOY".
//
// POLÍTICA:
//   - Dry-run por padrão (lista o que casaria, não apaga). --execute aplica.
//   - Filtro ESTRITO: email IN (lista). Aborta se aparecer qualquer email fora da lista.
//
// Uso:
//   npx tsx scripts/purgar-parceiros-verif.ts             # dry-run (conferência)
//   npx tsx scripts/purgar-parceiros-verif.ts --execute   # APAGA (irreversível)

import { prisma } from './_db'

const EXECUTAR = process.argv.includes('--execute')

const ALVO_EMAILS = ['veriffinal@sixxis.com.br', 'verifdeploy@sixxis.com.br']

async function main() {
  const dbMasked = (process.env.DATABASE_URL || '').replace(/\/\/[^@]*@/, '//***:***@').split('?')[0]
  console.log(`\nBanco: ${dbMasked}`)
  console.log(`Alvo: SolicitacaoParceiro com email IN (${ALVO_EMAILS.map((e) => `"${e}"`).join(', ')})`)
  console.log(
    EXECUTAR
      ? '⚠️  MODO --execute: os registros abaixo SERÃO APAGADOS (irreversível).'
      : '🔎 DRY-RUN (padrão): apenas conferência. Nada será apagado. Use --execute para apagar.',
  )

  const alvos = await prisma.solicitacaoParceiro.findMany({
    where: { email: { in: ALVO_EMAILS } },
    select: { id: true, nome: true, email: true, telefone: true, nomeFantasia: true, segmento: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`\n══════════ REGISTROS QUE CASAM (${alvos.length}) ══════════`)
  for (const a of alvos) {
    console.log(
      `• ${a.id}\n    nome=${a.nome}  email=${a.email}  telefone=${a.telefone}\n` +
        `    empresa(nomeFantasia)=${a.nomeFantasia ?? '—'}  segmento=${a.segmento ?? '—'}  criadoEm=${a.createdAt.toISOString()}`,
    )
  }

  if (alvos.length === 0) {
    console.log('\nNenhum registro com esses emails. Nada a fazer.')
    return
  }

  // Guard-rail: nenhum email fora da lista pode estar presente.
  const foraDoAlvo = alvos.filter((a) => !ALVO_EMAILS.includes(a.email))
  if (foraDoAlvo.length > 0) {
    console.log('\n⛔ ABORTADO: apareceu registro com email fora da lista-alvo.')
    process.exit(1)
  }

  if (!EXECUTAR) {
    console.log('\n[dry-run] nada foi apagado. Para apagar: npx tsx scripts/purgar-parceiros-verif.ts --execute')
    return
  }

  const out = await prisma.solicitacaoParceiro.deleteMany({ where: { email: { in: ALVO_EMAILS } } })
  console.log(`\n✅ Concluído. Apagados: ${out.count}`)
}

main()
  .catch((err) => { console.error('Erro:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
