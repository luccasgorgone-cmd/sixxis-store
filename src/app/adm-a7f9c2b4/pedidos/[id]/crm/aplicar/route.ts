import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { crmAplicar } from '@/lib/crm'
import { montarDadosCrm, SELECT_PEDIDO_CRM } from '@/lib/crm-dados-pedido'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Aplica no CRM os campos selecionados. Autenticada por SESSÃO DE ADMIN.
// { leadId, campos } vêm do body; `dados` é montado pela fonte única.
// Em sucesso, grava a marca informativa Pedido.crmSincronizadoEm + crmLeadId
// (nunca bloqueia reaplicar — o CRM é idempotente).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await request.json().catch(() => ({})) as { leadId?: string; campos?: unknown }
  if (!body.leadId?.trim()) {
    return NextResponse.json({ error: 'Selecione um contato do CRM.' }, { status: 400 })
  }
  const campos = Array.isArray(body.campos)
    ? body.campos.filter((c): c is string => typeof c === 'string' && c.length > 0)
    : []
  if (campos.length === 0) {
    return NextResponse.json({ error: 'Selecione ao menos um campo para aplicar.' }, { status: 400 })
  }

  const pedido = await prisma.pedido.findUnique({ where: { id }, select: SELECT_PEDIDO_CRM })
  if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const leadId = body.leadId.trim()
  const dados = montarDadosCrm(pedido)
  const r = await crmAplicar({ leadId, dados, campos })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 })

  // Marca de sincronização (informativa). Falha aqui não desfaz o que o CRM já
  // aplicou — loga e segue devolvendo o resultado ao admin.
  const crmSincronizadoEm = new Date()
  try {
    await prisma.pedido.update({
      where: { id },
      data: { crmSincronizadoEm, crmLeadId: leadId },
    })
  } catch (e) {
    console.error('[crm/aplicar] marca de sync falhou:', (e as Error).message)
  }

  return NextResponse.json({ ...r.data, crmSincronizadoEm: crmSincronizadoEm.toISOString(), crmLeadId: leadId })
}
