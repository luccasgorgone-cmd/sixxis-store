import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [climatizadores, aspiradores, spinning] = await Promise.all([
    prisma.produto.count({ where: { ativo: true, categoria: 'climatizadores' } }),
    prisma.produto.count({ where: { ativo: true, categoria: 'aspiradores' } }),
    prisma.produto.count({ where: { ativo: true, categoria: 'spinning' } }),
  ])

  return NextResponse.json({ climatizadores, aspiradores, spinning })
}
