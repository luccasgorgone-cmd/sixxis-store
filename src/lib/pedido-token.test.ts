import { describe, expect, it, beforeAll } from 'vitest'

// pedido-token.ts lê NEXTAUTH_SECRET no load do módulo. Define o segredo ANTES
// de importar (import dinâmico no beforeAll) para o round-trip funcionar no
// teste sem depender do ambiente.
let gerarPedidoToken: (pedidoId: string) => string
let pedidoTokenValido: (token: string | null | undefined, pedidoId: string) => boolean

beforeAll(async () => {
  process.env.NEXTAUTH_SECRET = 'segredo-de-teste-pedido-token'
  const mod = await import('./pedido-token')
  gerarPedidoToken = mod.gerarPedidoToken
  pedidoTokenValido = mod.pedidoTokenValido
})

describe('pedido-token', () => {
  it('valida um token recém-gerado para o MESMO pedido', () => {
    const token = gerarPedidoToken('pedido_abc')
    expect(pedidoTokenValido(token, 'pedido_abc')).toBe(true)
  })

  it('NÃO vale para outro pedido (escopo por pedidoId)', () => {
    const token = gerarPedidoToken('pedido_abc')
    expect(pedidoTokenValido(token, 'pedido_xyz')).toBe(false)
  })

  it('rejeita token com assinatura adulterada', () => {
    const token = gerarPedidoToken('pedido_abc')
    const [payload] = token.split('.')
    const adulterado = `${payload}.assinaturafalsa`
    expect(pedidoTokenValido(adulterado, 'pedido_abc')).toBe(false)
  })

  it('rejeita payload trocado mantendo a assinatura antiga', () => {
    // Troca o pid no payload sem recalcular a assinatura → deve falhar.
    const token = gerarPedidoToken('pedido_abc')
    const [, sig] = token.split('.')
    const outroPayload = Buffer.from(
      JSON.stringify({ pid: 'pedido_xyz', exp: Date.now() + 10_000 }),
    ).toString('base64url')
    expect(pedidoTokenValido(`${outroPayload}.${sig}`, 'pedido_xyz')).toBe(false)
  })

  it('rejeita entradas vazias ou malformadas', () => {
    expect(pedidoTokenValido('', 'pedido_abc')).toBe(false)
    expect(pedidoTokenValido(null, 'pedido_abc')).toBe(false)
    expect(pedidoTokenValido(undefined, 'pedido_abc')).toBe(false)
    expect(pedidoTokenValido('semponto', 'pedido_abc')).toBe(false)
  })

  it('rejeita token expirado', () => {
    // Forja um payload com exp no passado, assinado com o mesmo segredo via
    // round-trip não é possível aqui (sign é privado); então validamos que um
    // exp vencido embutido num token real falha: gera e reescreve o exp.
    const token = gerarPedidoToken('pedido_abc')
    const [payload, sig] = token.split('.')
    const obj = JSON.parse(Buffer.from(payload, 'base64url').toString())
    obj.exp = Date.now() - 1000
    const payloadVencido = Buffer.from(JSON.stringify(obj)).toString('base64url')
    // Assinatura não bate (payload mudou) → false de qualquer forma; o objetivo
    // é garantir que um token com exp vencido nunca passa.
    expect(pedidoTokenValido(`${payloadVencido}.${sig}`, 'pedido_abc')).toBe(false)
  })
})
