import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth) return auth
  const numeros = await prisma.whatsappNumero.findMany({
    orderBy: [{ ehPadrao: 'desc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ numeros })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth) return auth
  const { nome, numero, instanceId, apiUrl, apiKey, ehPadrao } = await req.json()
  if (!nome || !numero) return NextResponse.json({ error: 'Nome e número obrigatórios' }, { status: 400 })
  if (ehPadrao) await prisma.whatsappNumero.updateMany({ data: { ehPadrao: false } })
  const novo = await prisma.whatsappNumero.create({
    data: { nome, numero: numero.replace(/\D/g, ''), instanceId: instanceId || null, apiUrl: apiUrl || null, apiKey: apiKey || null, ehPadrao: !!ehPadrao },
  })
  return NextResponse.json(novo, { status: 201 })
}
