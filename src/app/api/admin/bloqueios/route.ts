import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Painel central de "Bloqueios & Fraudes". O estado vigente vive em
// Cliente.bloqueado (toggle em Clientes); aqui consolidamos:
//  - lista AO VIVO de clientes bloqueados (com quem bloqueou, do histórico)
//  - histórico append-only (BloqueioFraude: bloqueio/desbloqueio)
//  - KPIs (total + últimos 30 dias)
export async function GET(req: NextRequest) {
  const unauth = await requireAdmin(req)
  if (unauth) return unauth

  const trintaDias = new Date(Date.now() - 30 * 86400000)

  const [bloqueadosRaw, totalBloqueados, bloqueados30d, historicoRaw] = await Promise.all([
    prisma.cliente.findMany({
      where: { bloqueado: true },
      orderBy: { bloqueadoEm: 'desc' },
      select: {
        id: true, nome: true, email: true, cpf: true,
        avatar: true, avatarGradiente: true,
        motivoBloqueio: true, bloqueadoEm: true, createdAt: true,
      },
    }),
    prisma.cliente.count({ where: { bloqueado: true } }),
    prisma.cliente.count({ where: { bloqueado: true, bloqueadoEm: { gte: trintaDias } } }),
    prisma.bloqueioFraude.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: { cliente: { select: { id: true, nome: true, email: true } } },
    }),
  ])

  // "Quem bloqueou": pega o registro de bloqueio mais recente de cada cliente.
  const ids = bloqueadosRaw.map((c) => c.id)
  const logsBloqueio = ids.length
    ? await prisma.bloqueioFraude.findMany({
        where: { clienteId: { in: ids }, acao: 'bloqueio' },
        orderBy: { createdAt: 'desc' },
        select: { clienteId: true, criadoPor: true, createdAt: true },
      })
    : []
  const porCliente = new Map<string, { criadoPor: string | null; createdAt: Date }>()
  for (const l of logsBloqueio) {
    if (!porCliente.has(l.clienteId)) porCliente.set(l.clienteId, { criadoPor: l.criadoPor, createdAt: l.createdAt })
  }

  const bloqueados = bloqueadosRaw.map((c) => ({
    ...c,
    bloqueadoPor: porCliente.get(c.id)?.criadoPor ?? null,
  }))

  return NextResponse.json({
    kpis: { totalBloqueados, bloqueados30d, totalHistorico: historicoRaw.length },
    bloqueados,
    historico: historicoRaw,
  })
}

// POST — bloqueio manual por clienteId (mantido p/ compat). Grava no histórico
// (acao=bloqueio) E atualiza Cliente.bloqueado, na mesma transação.
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin(req)
  if (unauth) return unauth

  const { clienteId, motivo, criadoPor } = await req.json() as {
    clienteId: string
    motivo: string
    criadoPor?: string
  }
  if (!clienteId || !motivo) {
    return NextResponse.json({ error: 'clienteId e motivo são obrigatórios' }, { status: 400 })
  }

  const [bloqueio] = await prisma.$transaction([
    prisma.bloqueioFraude.create({
      data: { clienteId, acao: 'bloqueio', motivo, criadoPor: criadoPor ?? 'admin' },
    }),
    prisma.cliente.update({
      where: { id: clienteId },
      data:  { bloqueado: true, motivoBloqueio: motivo, bloqueadoEm: new Date() },
    }),
  ])

  await auditLog({ req, action: 'cliente.block', target: clienteId, metadata: { motivo, via: 'bloqueios' } })

  return NextResponse.json({ bloqueio })
}
