import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { statusGarantia } from '@/lib/garantia'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Faça login para continuar' }, { status: 401 })
  }

  const garantias = await prisma.garantiaEstendida.findMany({
    where: { pedido: { clienteId: session.user.id } },
    include: {
      produto: { select: { id: true, nome: true, slug: true, imagens: true } },
      pedido: { select: { id: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Marca status atualizado (expirada se passou da vigência) sem persistir
  const enriquecido = garantias.map((g) => ({
    ...g,
    statusAtual: statusGarantia(g),
  }))

  return NextResponse.json({ garantias: enriquecido })
}
