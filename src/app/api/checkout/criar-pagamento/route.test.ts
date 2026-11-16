import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const prismaFake = {
  pedido: {
    findFirst: vi.fn(),
    // count 0 = "já existe tentativa em andamento" → a rota devolve 409 logo
    // depois da sincronização de nome, sem tocar no Mercado Pago.
    updateMany: vi.fn(async () => ({ count: 0 })),
  },
  cliente: { update: vi.fn(async () => ({})) },
}
const authz = { clienteSessaoId: null as string | null, tokenValido: true, autenticado: true }

vi.mock('@/lib/prisma', () => ({ prisma: prismaFake }))
vi.mock('@/lib/mercadopago', () => ({ mpPayment: { create: vi.fn() } }))
vi.mock('@/lib/autorizar-pedido', () => ({
  autorizarPedido: vi.fn(async () => authz),
  podeOperarPedido: vi.fn(() => true),
}))
vi.mock('@/lib/cliente-bloqueio', () => ({ isClienteBloqueado: vi.fn(async () => false), MSG_CONTA_BLOQUEADA: 'x' }))
vi.mock('@/lib/ratelimit', () => ({ rateLimit: vi.fn(async () => ({ success: true })), getClientIp: () => '1.1.1.1' }))
vi.mock('@/lib/cashback', () => ({ creditarCashback: vi.fn() }))
vi.mock('@/lib/cupom', () => ({ registrarUsoCupom: vi.fn() }))
vi.mock('@/lib/email', () => ({ enviarEmailConfirmacaoPedido: vi.fn() }))
vi.mock('@/lib/mercadopago-antifraude', () => ({ construirSinaisAntifraude: vi.fn() }))

const { POST } = await import('./route')

function req() {
  return new NextRequest('http://localhost/api/checkout/criar-pagamento', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-pedido-token': 't' },
    body: JSON.stringify({ pedidoId: 'ped_1', metodo: 'pix', payerNome: 'Nome Trocado Pelo Atacante' }),
  })
}

describe('criar-pagamento: sincronização do nome do cadastro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaFake.pedido.findFirst.mockResolvedValue({
      id: 'ped_1', clienteId: 'cli_vitima', status: 'pendente',
      cliente: { nome: 'Nome Original', email: 'vitima@example.com' },
      itens: [], garantias: [],
    })
  })

  it('só com token de posse (convidado) NÃO altera o nome de uma conta existente', async () => {
    authz.clienteSessaoId = null
    const res = await POST(req())
    expect(res.status).toBe(409)
    expect(prismaFake.cliente.update).not.toHaveBeenCalled()
  })

  it('dono logado continua sincronizando o nome', async () => {
    authz.clienteSessaoId = 'cli_vitima'
    await POST(req())
    expect(prismaFake.cliente.update).toHaveBeenCalledWith({
      where: { id: 'cli_vitima' }, data: { nome: 'Nome Trocado Pelo Atacante' },
    })
  })
})
