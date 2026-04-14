import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const avaliacoes = await prisma.avaliacaoParceiro.findMany({
    where: { aprovada: true },
    orderBy: [{ destaque: 'desc' }, { ordem: 'asc' }],
  })
  return Response.json(avaliacoes)
}
