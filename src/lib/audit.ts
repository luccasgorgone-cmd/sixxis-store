import { prisma } from '@/lib/prisma'
import { ipDoCliente } from '@/lib/client-ip'
import type { Prisma } from '@prisma/client'

function extractIp(req: Request): string | null {
  const ip = ipDoCliente(req.headers)
  return ip === 'unknown' ? null : ip
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
