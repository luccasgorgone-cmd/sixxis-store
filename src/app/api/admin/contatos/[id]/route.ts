import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface Params { id: string }

const STATUS_VALIDOS = ['novo', 'lido', 'respondido', 'arquivado']

// GET /api/admin/contatos/[id] — todos os campos da mensagem.
export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const unauth = await requireAdmin(req)
  if (unauth) return unauth
  const { id } = await params

  const mensagem = await prisma.mensagemContato.findUnique({ where: { id } })
  if (!mensagem) {
    return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
  }
  return NextResponse.json({ mensagem })
}

// PATCH /api/admin/contatos/[id] — troca de status.
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

  const mensagem = await prisma.mensagemContato.update({
    where: { id },
    data: { status },
  })

  await auditLog({ req, action: 'contato.status', target: id, metadata: { status } })

  return NextResponse.json({ mensagem })
}
