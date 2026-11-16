import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function fonte(caminho: string): string {
  return readFileSync(join(process.cwd(), caminho), 'utf8')
}

describe('observabilidade do pagamento no checkout', () => {
  it('registra tentativa, resultado e erro do Brick no pipeline interno', () => {
    const checkout = fonte('src/app/(loja)/checkout/CheckoutBricks.tsx')

    expect(checkout).toContain('trackCheckoutPaymentOutcome')
    expect(checkout).toContain("trackCheckoutPaymentOutcome('submit'")
    expect(checkout).toContain("trackCheckoutPaymentOutcome('approved'")
    expect(checkout).toContain("trackCheckoutPaymentOutcome('pix_generated'")
    expect(checkout).toContain("trackCheckoutPaymentOutcome('rejected'")
    expect(checkout).toContain("trackCheckoutPaymentOutcome('api_error'")
    expect(checkout).toContain("trackCheckoutPaymentOutcome('brick_error'")
  })

  it('não envia PAN, token ou dados do pagador para o tracker', () => {
    const events = fonte('src/lib/analytics/events.ts')
    const inicio = events.indexOf('export function trackCheckoutPaymentOutcome')
    const trecho = events.slice(inicio, inicio + 900)

    expect(inicio).toBeGreaterThan(-1)
    expect(trecho).not.toMatch(/cardToken|formData|payerEmail|payerCpf|security_code/)
  })
})
