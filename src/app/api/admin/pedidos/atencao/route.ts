import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// Contador leve para o badge de atenção (menu lateral): pedidos pagos sem
// código de rastreio = aguardando despacho.
export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const aguardandoEnvio = await prisma.pedido.count({
    where: { status: { in: ['pago', 'PAGO'] }, codigoRastreio: null },
  })

  return NextResponse.json(
    { aguardandoEnvio },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
