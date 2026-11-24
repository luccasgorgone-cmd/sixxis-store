import { beforeEach, describe, expect, it, vi } from 'vitest'

// Banco em memória que respeita a semântica do UPDATE condicional (updateMany
// com `gte`), do update incondicional e de $transaction (array ou callback).
const db = { cashbackSaldo: 0, pontos: 0, cupons: 0 }

function decrementar(campo: 'cashbackSaldo' | 'pontos', where: Record<string, unknown>, data: Record<string, unknown>) {
  const cond = where[campo] as { gte?: number } | undefined
  const dec = (data[campo] as { decrement: number }).decrement
  if (cond?.gte != null && db[campo] < cond.gte) return { count: 0 }
  db[campo] -= dec
  return { count: 1 }
}

const prismaFake = {
  cliente: {
    findUnique: vi.fn(async () => ({ cashbackSaldo: db.cashbackSaldo })),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => decrementar('cashbackSaldo', {}, data)),
    updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) =>
      decrementar('cashbackSaldo', where, data)),
  },
  cashbackTransacao: { create: vi.fn(async () => ({})) },
  pontosCliente: {
    findUnique: vi.fn(async () => ({ pontos: db.pontos })),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => decrementar('pontos', {}, data)),
    updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) =>
      decrementar('pontos', where, data)),
  },
  cupom: { create: vi.fn(async () => { db.cupons += 1; return {} }) },
  historicoPontos: { create: vi.fn(async () => ({})) },
  configuracao: { findUnique: vi.fn(async () => null) },
  $transaction: vi.fn(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg)
    return (arg as (tx: unknown) => Promise<unknown>)(prismaFake)
  }),
}

vi.mock('@/lib/prisma', () => ({ prisma: prismaFake }))
vi.mock('@/lib/avatares', () => ({ calcularNivel: vi.fn(), NIVEIS_CONFIG: [] }))

const { resgatarCashback } = await import('./cashback')
const { resgatarPontos } = await import('./fidelidade')

describe('resgate concorrente de saldo', () => {
  beforeEach(() => {
    db.cashbackSaldo = 10
    db.pontos = 500
    db.cupons = 0
  })

  it('cashback: dois pedidos simultâneos não usam o mesmo saldo duas vezes', async () => {
    const [a, b] = await Promise.all([
      resgatarCashback('cli_1', 10, 1000, 'pedidoAAAAAAAA'),
      resgatarCashback('cli_1', 10, 1000, 'pedidoBBBBBBBB'),
    ])
    expect(a + b).toBe(10)
    expect(db.cashbackSaldo).toBe(0)
  })

  it('pontos: resgates simultâneos não geram cupom além do saldo', async () => {
    const r = await Promise.allSettled([
      resgatarPontos('cli_1', 500),
      resgatarPontos('cli_1', 500),
      resgatarPontos('cli_1', 500),
    ])
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1)
    expect(db.pontos).toBe(0)
    expect(db.cupons).toBe(1)
  })

  it('pontos: recusa quantidade fracionária', async () => {
    await expect(resgatarPontos('cli_1', 100.5)).rejects.toThrow()
  })
})
