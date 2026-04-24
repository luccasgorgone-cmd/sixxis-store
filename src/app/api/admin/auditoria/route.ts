import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const sp = request.nextUrl.searchParams
  const page = Math.max(1, Number(sp.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') || '50')))
  const action = sp.get('action')?.trim() || ''
  const ip = sp.get('ip')?.trim() || ''
  const desde = sp.get('desde') // ISO
  const ate = sp.get('ate') // ISO

  const where: Record<string, unknown> = {}
  if (action) where.action = { contains: action }
  if (ip) where.ip = { contains: ip }
  if (desde || ate) {
    where.createdAt = {
      ...(desde ? { gte: new Date(desde) } : {}),
      ...(ate ? { lte: new Date(ate) } : {}),
    }
  }

  const [logs, total, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
      take: 200,
    }),
  ])

  return NextResponse.json({
    logs,
    total,
    page,
    limit,
    actions: actions.map((a) => a.action),
  })
}
