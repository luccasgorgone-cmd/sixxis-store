import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth) return auth
  const { id } = await params
  const { numeroTeste } = await req.json()
  const num = await prisma.whatsappNumero.findUnique({ where: { id } })
  if (!num?.instanceId || !num?.apiUrl || !num?.apiKey) {
    return NextResponse.json({ ok: false, erro: 'Instância não configurada' }, { status: 400 })
  }
  try {
    const tel = (numeroTeste || num.numero).replace(/\D/g, '')
    const res = await fetch(`${num.apiUrl}/message/sendText/${num.instanceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': num.apiKey },
      body: JSON.stringify({ number: tel.startsWith('55') ? tel : `55${tel}`, text: '✅ Teste de conexão Sixxis Store. Se recebeu isso, está tudo funcionando!' }),
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    await prisma.whatsappNumero.update({ where: { id }, data: { status: 'CONECTADO' } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro'
    await prisma.whatsappNumero.update({ where: { id }, data: { status: 'ERRO' } })
    return NextResponse.json({ ok: false, erro: msg }, { status: 500 })
  }
}
