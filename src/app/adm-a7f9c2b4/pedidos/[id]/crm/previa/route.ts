import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { crmPrevia } from '@/lib/crm'
import { montarDadosCrm, SELECT_PEDIDO_CRM } from '@/lib/crm-dados-pedido'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Prévia da sincronização: compara os dados do pedido com o contato do CRM.
// Autenticada por SESSÃO DE ADMIN. { leadId } vem do body (contato escolhido
// manualmente); `dados` é montado pela fonte única.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json().catch(() => ({})) as { leadId?: string }
  if (!body.leadId?.trim()) {
    return NextResponse.json({ error: 'Selecione um contato do CRM.' }, { status: 400 })
  }

  const pedido = await prisma.pedido.findUnique({ where: { id }, select: SELECT_PEDIDO_CRM })
  if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const dados = montarDadosCrm(pedido)
  const r = await crmPrevia({ leadId: body.leadId.trim(), dados })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 })
  return NextResponse.json(r.data)
}
