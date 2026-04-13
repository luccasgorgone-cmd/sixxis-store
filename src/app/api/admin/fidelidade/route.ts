import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const ranking = await prisma.cliente.findMany({
    select: {
      id:     true,
      nome:   true,
      email:  true,
      pontos: { select: { pontos: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ ranking })
}
