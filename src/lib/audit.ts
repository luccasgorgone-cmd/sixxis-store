import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

function extractIp(req: Request): string | null {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri
  return null
}

export async function auditLog(params: {
  req: Request
  action: string
  target?: string | null
  metadata?: Prisma.InputJsonValue
  actor?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actor: params.actor ?? 'admin',
        action: params.action,
        target: params.target ?? null,
        metadata: params.metadata,
        ip: extractIp(params.req),
        userAgent: params.req.headers.get('user-agent'),
      },
    })
  } catch (e) {
    // Auditoria nunca deve quebrar a operação
    console.error('[audit] failed:', e)
  }
}
