import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Mercado Pago webhook payload
    const { type, data } = body

    if (type === 'payment' && data?.id) {
      // TODO: verificar assinatura do webhook (x-signature header)
      // Por ora apenas registra o evento
      console.log('[Webhook] Pagamento recebido:', data.id)
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
