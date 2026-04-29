// Remove do banco TODAS as configurações sensíveis (api keys, tokens, secrets,
// hashes, senhas) que estavam vazando via /adm-a7f9c2b4/configuracoes-loja.
// Essas chaves devem viver exclusivamente em variáveis de ambiente.
//
// Uso (local com .env.local apontando p/ DB de prod):
//   npx tsx scripts/limpar-secrets-loja.ts
//   npx tsx scripts/limpar-secrets-loja.ts --dry  (só lista, não apaga)
//
// Sempre rode com backup do banco feito previamente.

import { prisma } from './_db'
import { isSecretKey } from '../src/lib/config-secrets'

const DRY = process.argv.includes('--dry')

async function main() {
  const todas = await prisma.configuracao.findMany({ select: { chave: true } })
  const sensiveis = todas.filter((c) => isSecretKey(c.chave)).map((c) => c.chave)

  if (sensiveis.length === 0) {
    console.log('✅ Nenhuma chave sensível encontrada no banco.')
    return
  }

  console.log(`Encontradas ${sensiveis.length} chave(s) sensível(is):`)
  for (const c of sensiveis) console.log(`  - ${c}`)

  if (DRY) {
    console.log('\n[dry-run] nenhuma alteração feita. Rode sem --dry para apagar.')
    return
  }

  const { count } = await prisma.configuracao.deleteMany({
    where: { chave: { in: sensiveis } },
  })
  console.log(`\n🧹 Removidas ${count} chave(s) sensível(is) do banco.`)
  console.log('⚠️  Lembre-se de configurar essas chaves como ENV vars no Railway:')
  console.log('   ANTHROPIC_API_KEY, MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MELHORENVIO_TOKEN, etc.')
}

main()
  .catch((err) => {
    console.error('Erro:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
