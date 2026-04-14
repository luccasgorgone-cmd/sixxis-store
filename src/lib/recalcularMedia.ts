import { prisma } from './prisma'

export async function recalcularMediaProduto(produtoId: string) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { produtoId, aprovada: true },
    select: { nota: true },
  })

  const total = avaliacoes.length
  const media = total > 0
    ? Math.round((avaliacoes.reduce((s, a) => s + a.nota, 0) / total) * 10) / 10
    : 0

  await prisma.produto.update({
    where: { id: produtoId },
    data: {
      mediaAvaliacoes: media,
      totalAvaliacoes: total,
    },
  })

  return { media, total }
}
