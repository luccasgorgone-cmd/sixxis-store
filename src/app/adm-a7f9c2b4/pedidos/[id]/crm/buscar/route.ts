import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { crmBuscarCliente } from '@/lib/crm'
import { montarBuscaCrm, SELECT_PEDIDO_CRM } from '@/lib/crm-dados-pedido'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Busca candidatos no CRM para vincular ao pedido. Autenticada por SESSÃO DE
// ADMIN (a chave interna fica só no servidor, em src/lib/crm.ts).
//
// Body opcional: busca manual { telefone?, cpf?, nome? } digitada à mão — tem
// prioridade sobre os dados do cadastro. Sem body, deriva do cliente do pedido.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const pedido = await prisma.pedido.findUnique({ where: { id }, select: SELECT_PEDIDO_CRM })
  if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const body = await request.json().catch(() => ({})) as {
    telefone?: string; cpf?: string; cnpj?: string; nome?: string
  }
  const manual: { telefone?: string; cpf?: string; cnpj?: string; nome?: string } = {}
  if (body.telefone?.trim()) manual.telefone = body.telefone.trim()
  // O modal tem um campo único "CPF/CNPJ" (chega em body.cpf); um cnpj explícito
  // também é aceito. Roteia por nº de dígitos: 14 -> cnpj, senão -> cpf. Só dígitos.
  const docManual = (body.cnpj?.replace(/\D/g, '') || body.cpf?.replace(/\D/g, '')) ?? ''
  if (docManual) {
    if (docManual.length === 14) manual.cnpj = docManual
    else manual.cpf = docManual
  }
  if (body.nome?.trim()) manual.nome = body.nome.trim()

  const input = Object.keys(manual).length > 0 ? manual : montarBuscaCrm(pedido.cliente)

  // Sem nenhum critério (cliente sem telefone/documento/nome) não há o que buscar.
  if (Object.keys(input).length === 0) {
    return NextResponse.json({ candidatos: [] })
  }

  const r = await crmBuscarCliente(input)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 })
  return NextResponse.json(r.data)
}
