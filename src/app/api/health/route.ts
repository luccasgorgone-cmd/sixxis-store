import { prisma } from '@/lib/prisma'
import { reconcileActiveApiKeyDigests } from '@/lib/api-v1/active-digest-sync'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      reconcileActiveApiKeyDigests(prisma),
    ])
    return Response.json({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch {
    return Response.json({ ok: false, error: 'health check failed' }, { status: 500 })
  }
}
