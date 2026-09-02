import { describe, expect, it } from 'vitest'
import { LOCK_PAGAMENTO_STALE_MS, cutoffLockPagamento } from './pagamento-lock'

describe('cutoffLockPagamento', () => {
  it('é exatamente LOCK_PAGAMENTO_STALE_MS antes do instante informado', () => {
    const agora = new Date('2026-09-02T12:00:00.000Z')
    expect(cutoffLockPagamento(agora).getTime()).toBe(agora.getTime() - LOCK_PAGAMENTO_STALE_MS)
  })

  it('preserva o tipo Date', () => {
    expect(cutoffLockPagamento(new Date())).toBeInstanceOf(Date)
  })
})
