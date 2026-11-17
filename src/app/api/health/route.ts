import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch {
    return Response.json({ ok: false, error: 'health check failed' }, { status: 500 })
  }
}
