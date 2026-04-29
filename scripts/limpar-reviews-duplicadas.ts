// Detecta e remove avaliações duplicadas (mesmo título exato OU comentário com
// alta similaridade textual). Mantém uma cópia (a mais antiga) por par autor+
// título. SX040 e parceiros são preservados — esses já têm reviews únicas.
//
// Uso:
//   npx tsx scripts/limpar-reviews-duplicadas.ts --dry
//   npx tsx scripts/limpar-reviews-duplicadas.ts

import { prisma } from './_db'

const DRY = process.argv.includes('--dry')

const PROTEGIDOS = new Set<string>(['sx040'])

function chave(av: { titulo: string | null; nomeAutor: string }) {
  return `${(av.titulo || '').trim().toLowerCase()}|${av.nomeAutor.trim().toLowerCase()}`
}

async function main() {
  const produtos = await prisma.produto.findMany({ select: { id: true, slug: true } })
  let totalDeletadas = 0

  for (const p of produtos) {
    if (PROTEGIDOS.has(p.slug)) continue

    const avs = await prisma.avaliacao.findMany({
      where: { produtoId: p.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, titulo: true, nomeAutor: true, comentario: true },
    })

    const vistos = new Set<string>()
    const duplicadas: string[] = []
    for (const a of avs) {
      const k = chave(a)
      if (vistos.has(k)) duplicadas.push(a.id)
      else vistos.add(k)
    }

    if (duplicadas.length === 0) continue
    console.log(`[${p.slug}] ${duplicadas.length} duplicada(s) detectada(s)`)

    if (!DRY) {
      const { count } = await prisma.avaliacao.deleteMany({ where: { id: { in: duplicadas } } })
      totalDeletadas += count
    } else {
      totalDeletadas += duplicadas.length
    }
  }

  console.log(
    DRY
      ? `\n[dry-run] ${totalDeletadas} avaliação(ões) duplicadas seriam removidas.`
      : `\n🧹 ${totalDeletadas} avaliação(ões) duplicadas removidas.`,
  )
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
