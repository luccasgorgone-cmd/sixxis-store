import { prisma } from '../src/lib/prisma'

async function main() {
  const produtos = await prisma.produto.findMany({ select: { id: true, slug: true } })
  let alterados = 0
  for (const p of produtos) {
    const lower = p.slug.toLowerCase()
    if (lower !== p.slug) {
      await prisma.produto.update({ where: { id: p.id }, data: { slug: lower } })
      alterados++
      console.log(`slug ${p.slug} -> ${lower}`)
    }
  }
  console.log(`Total alterados: ${alterados}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
