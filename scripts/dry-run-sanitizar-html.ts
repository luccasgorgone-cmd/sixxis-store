// DRY-RUN: mostra o que o sanitizador (src/lib/sanitize-html.ts) mudaria em
// conteúdo JÁ SALVO no banco (produtos.descricao e popupInicial.texto), sem
// gravar nada. Rodar antes de decidir se vale um backfill de verdade.
//
// Uso: railway run npx tsx scripts/dry-run-sanitizar-html.ts
import { prisma } from './_db'
import { sanitizarHtmlRico } from '../src/lib/sanitize-html'

async function main() {
  let alterados = 0
  let totalProdutos = 0

  const produtos = await prisma.produto.findMany({
    where: { descricao: { not: null } },
    select: { id: true, nome: true, descricao: true },
  })
  totalProdutos = produtos.length

  for (const p of produtos) {
    if (!p.descricao) continue
    const limpo = sanitizarHtmlRico(p.descricao)
    if (limpo !== p.descricao) {
      alterados++
      console.log(`\n[PRODUTO] ${p.id} — ${p.nome}`)
      console.log('  ANTES :', p.descricao.slice(0, 300))
      console.log('  DEPOIS:', limpo.slice(0, 300))
    }
  }

  const popup = await prisma.popupInicial.findUnique({ where: { id: 'singleton' } })
  let popupAlterado = false
  if (popup?.texto) {
    const limpo = sanitizarHtmlRico(popup.texto)
    if (limpo !== popup.texto) {
      popupAlterado = true
      console.log('\n[POPUP INICIAL]')
      console.log('  ANTES :', popup.texto.slice(0, 300))
      console.log('  DEPOIS:', limpo.slice(0, 300))
    }
  }

  console.log('\n=== RESUMO ===')
  console.log(`Produtos com descrição: ${totalProdutos}`)
  console.log(`Produtos que MUDARIAM: ${alterados}`)
  console.log(`Popup inicial mudaria: ${popupAlterado ? 'SIM' : 'não'}`)
  console.log('\nNenhuma escrita foi feita — isto é só leitura + comparação em memória.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
