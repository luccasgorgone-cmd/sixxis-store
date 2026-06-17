import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface Params { id: string }

const STATUS_VALIDOS = ['novo', 'em_analise', 'aprovado', 'recusado']

// GET /api/admin/parceiros/[id] — todos os campos da solicitação.
export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const unauth = await requireAdmin(req)
  if (unauth) return unauth
  const { id } = await params

  const solicitacao = await prisma.solicitacaoParceiro.findUnique({ where: { id } })
  if (!solicitacao) {
    return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
  }
  return NextResponse.json({ solicitacao })
}

// PATCH /api/admin/parceiros/[id] — troca de status.
export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const unauth = await requireAdmin(req)
  if (unauth) return unauth
  const { id } = await params
  const body = await req.json().catch(() => null)
  const status = body?.status

  if (!status || !STATUS_VALIDOS.includes(status)) {
    return NextResponse.json(
      { error: `status inválido (use: ${STATUS_VALIDOS.join(', ')})` },
      { status: 400 },
    )
  }

  const solicitacao = await prisma.solicitacaoParceiro.update({
    where: { id },
    data: { status },
  })

  await auditLog({ req, action: 'parceiro.status', target: id, metadata: { status } })

  return NextResponse.json({ solicitacao })
}
