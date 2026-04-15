import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET — list recent blocks
export async function GET(req: NextRequest) {
  const page  = Math.max(1, Number(req.nextUrl.searchParams.get('page') || '1'))
  const limit = Math.min(50, Number(req.nextUrl.searchParams.get('limit') || '20'))
  const skip  = (page - 1) * limit

  const [total, bloqueios] = await Promise.all([
    prisma.bloqueioFraude.count(),
    prisma.bloqueioFraude.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
      },
    }),
  ])

  return NextResponse.json({ bloqueios, pagination: { total, page, limit, pages: Math.ceil(total / limit) } })
}

// POST — create block entry + update cliente
export async function POST(req: NextRequest) {
  const { clienteId, motivo, criadoPor } = await req.json() as {
    clienteId: string
    motivo: string
    criadoPor?: string
  }

  const [bloqueio] = await prisma.$transaction([
    prisma.bloqueioFraude.create({ data: { clienteId, motivo, criadoPor } }),
    prisma.cliente.update({
      where: { id: clienteId },
      data:  { bloqueado: true, motivoBloqueio: motivo, bloqueadoEm: new Date() },
    }),
  ])

  return NextResponse.json({ bloqueio })
}
