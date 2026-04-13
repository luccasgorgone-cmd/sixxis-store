import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { prisma } = await import('@/lib/prisma')
  const banners = await prisma.banner.findMany()
  const configs = await prisma.configuracao.findMany()
  const produtos = await prisma.produto.count()
  return Response.json({
    timestamp: new Date().toISOString(),
    banners: banners.length,
    bannersData: banners,
    configs: configs.length,
    configsData: configs,
    produtos,
  })
}
