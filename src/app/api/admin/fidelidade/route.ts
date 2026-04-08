import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
