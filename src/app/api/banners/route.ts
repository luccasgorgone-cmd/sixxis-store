import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const banners = await prisma.banner.findMany({
    where:   { ativo: true },
    orderBy: { ordem: 'asc' },
  })
  return NextResponse.json({ banners })
}
