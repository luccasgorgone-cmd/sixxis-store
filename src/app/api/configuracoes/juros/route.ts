import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cfg = await prisma.configuracao.findUnique({
      where: { chave: 'juros_cartao_taxa_mensal' },
    })
    return Response.json({ taxa: Number(cfg?.valor || 2.99) })
  } catch {
    return Response.json({ taxa: 2.99 })
  }
}
