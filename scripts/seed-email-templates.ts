// Insere/atualiza os templates padrão de email no banco. Roda fora do build.
//
// Uso:
//   npx tsx scripts/seed-email-templates.ts
//
// Ou em prod:
//   railway run npx tsx scripts/seed-email-templates.ts

import { prisma } from './_db'
import { EMAIL_TEMPLATES } from '../src/lib/email-templates-seed'

async function main() {
  console.log(`Seeding ${EMAIL_TEMPLATES.length} email templates...`)
  for (const template of EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { tipo: template.tipo },
      update: template,
      create: template,
    })
    console.log(`  ✓ ${template.tipo}`)
  }
  console.log('Done!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
