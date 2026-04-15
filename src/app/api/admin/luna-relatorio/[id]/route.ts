import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params

  const conversa = await prisma.lunaConversa.findFirst({
    where: { OR: [{ id }, { sessaoId: id }] },
    include: {
      mensagens: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!conversa) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  return NextResponse.json(conversa)
}
