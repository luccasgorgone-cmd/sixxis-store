import { NextResponse } from 'next/server'
import { MP_PUBLIC_KEY, MP_ENV } from '@/lib/mercadopago'

export async function GET() {
  return NextResponse.json({
    publicKey: MP_PUBLIC_KEY,
    env: MP_ENV,
    enabled: Boolean(MP_PUBLIC_KEY),
  })
}
