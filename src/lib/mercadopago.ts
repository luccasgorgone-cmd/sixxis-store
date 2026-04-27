import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

// Suporta tanto MERCADOPAGO_ACCESS_TOKEN (Sprint 2A) quanto MP_ACCESS_TOKEN (legado)
const accessToken =
  process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN

if (!accessToken && process.env.NODE_ENV !== 'test') {
  console.warn('[mercadopago] Access token ausente — pagamentos desabilitados')
}

export const mpClient = accessToken
  ? new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10_000 },
    })
  : null

export const mpPayment = mpClient ? new Payment(mpClient) : null
export const mpPreference = mpClient ? new Preference(mpClient) : null

export const MP_PUBLIC_KEY =
  process.env.MERCADOPAGO_PUBLIC_KEY ?? process.env.MP_PUBLIC_KEY ?? ''
export const MP_ENV = process.env.MERCADOPAGO_ENV ?? 'sandbox'
export const MP_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? ''
