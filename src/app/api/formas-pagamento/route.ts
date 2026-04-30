import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const formas = await prisma.formaPagamento.findMany({
      where:   { ativo: true },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
      select:  { id: true, nome: true, iconeUrl: true },
    })
    return NextResponse.json({ formas })
  } catch (err) {
    console.error('[api/formas-pagamento] error:', err)
    return NextResponse.json({ formas: [] })
  }
}
