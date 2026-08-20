/* eslint-disable @typescript-eslint/no-explicit-any -- fake Prisma em memória
   abaixo mimetiza o shape solto e dinâmico do `where`/`data`/`include` real do
   Prisma (união de dezenas de formatos possíveis); tipar cada método com
   precisão aqui seria só ruído sem valor de teste real. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PaymentsClientDeps } from './checkout-multi-metodo'

// ── Fake Prisma em memória — só os métodos que o orquestrador realmente chama.
// Sem banco real neste sandbox; testa a MESMA lógica que roda em produção,
// não uma reimplementação paralela (o orquestrador de verdade é o SUT).
let tentativas: Record<string, any> = {}
let pagamentos: Record<string, any> = {}
let pedidos: Record<string, any> = {}
let auditLogs: any[] = []
let idSeq = 0
const novoId = (prefixo: string) => `${prefixo}_${++idSeq}`

function limparBanco() {
  tentativas = {}
  pagamentos = {}
  pedidos = {}
  auditLogs = []
  idSeq = 0
}

function criarPedidoFake(overrides: Record<string, any> = {}) {
  const id = overrides.id ?? novoId('ped')
  pedidos[id] = {
    id,
    status: 'pendente',
    multiMetodoStatus: null,
    clienteId: 'cli_1',
    capiPurchaseEnviadoEm: null,
    ga4PurchaseEnviadoEm: null,
    mpTaxaReal: null,
    total: 0,
    frete: 0,
    desconto: 0,
    cupomCodigo: null,
    fbp: null,
    fbc: null,
    clientIp: null,
    clientUserAgent: null,
    gaClientId: null,
    ...overrides,
  }
  return pedidos[id]
}

const prismaFake = {
  tentativaMultiMetodo: {
    async create({ data }: any) {
      const id = novoId('tent')
      tentativas[id] = { id, status: 'em_andamento', erro: null, detalhe: null, prazoExpiracao: null, updatedAt: new Date(), ...data }
      return tentativas[id]
    },
    async findUnique({ where, include }: any) {
      const t = tentativas[where.id]
      if (!t) return null
      return montarTentativaComPagamentos(t, include)
    },
    async findUniqueOrThrow({ where, include }: any) {
      const t = await this.findUnique({ where, include })
      if (!t) throw new Error('not found')
      return t
    },
    async findFirst({ where, include }: any) {
      const lista = Object.values(tentativas)
        .filter((t: any) => t.pedidoId === where.pedidoId && t.tipo === where.tipo && t.status === where.status)
        .sort((a: any, b: any) => b.createdAt?.getTime?.() - a.createdAt?.getTime?.() || 0)
      const t = lista[0]
      if (!t) return null
      return montarTentativaComPagamentos(t, include)
    },
    async findMany({ where }: any) {
      return Object.values(tentativas)
        .filter((t: any) => where.status.in.includes(t.status) && t.updatedAt < where.updatedAt.lt)
        .map((t: any) => montarTentativaComPagamentos(t, { pagamentos: true }))
    },
    async update({ where, data }: any) {
      tentativas[where.id] = { ...tentativas[where.id], ...data, updatedAt: new Date() }
      return tentativas[where.id]
    },
  },
  pagamento: {
    async create({ data }: any) {
      const id = novoId('pag')
      pagamentos[id] = { id, estornoStatus: null, estornoTentativas: 0, estornoErro: null, rawResponse: null, ...data }
      return pagamentos[id]
    },
    async update({ where, data }: any) {
      pagamentos[where.id] = { ...pagamentos[where.id], ...data }
      return pagamentos[where.id]
    },
    async updateMany({ where, data }: any) {
      let count = 0
      for (const p of Object.values(pagamentos) as any[]) {
        if (where.id && p.id !== where.id) continue
        if (where.OR) {
          const bate = where.OR.some((cond: any) =>
            'estornoStatus' in cond ? p.estornoStatus === cond.estornoStatus : false,
          )
          if (!bate) continue
        }
        Object.assign(p, data)
        count++
      }
      return { count }
    },
    async findFirst({ where }: any) {
      return (
        Object.values(pagamentos).find(
          (p: any) => p.tentativaMultiMetodoId === where.tentativaMultiMetodoId && p.perna === where.perna,
        ) ?? null
      )
    },
    async findUniqueOrThrow({ where }: any) {
      const p = pagamentos[where.id]
      if (!p) throw new Error('not found')
      return p
    },
    async findMany({ where }: any) {
      return Object.values(pagamentos).filter(
        (p: any) => p.estornoStatus === where.estornoStatus && p.estornoTentativas < where.estornoTentativas.lt,
      )
    },
  },
  pedido: {
    async update({ where, data }: any) {
      pedidos[where.id] = { ...pedidos[where.id], ...data }
      return pedidos[where.id]
    },
    async updateMany({ where, data }: any) {
      const p = pedidos[where.id]
      if (!p) return { count: 0 }
      if (where.status && p.status === where.status.not) return { count: 0 }
      if ('capiPurchaseEnviadoEm' in where && p.capiPurchaseEnviadoEm !== null) return { count: 0 }
      if ('ga4PurchaseEnviadoEm' in where && p.ga4PurchaseEnviadoEm !== null) return { count: 0 }
      if ('mpTaxaReal' in where && p.mpTaxaReal !== null) return { count: 0 }
      Object.assign(p, data)
      return { count: 1 }
    },
    async findUnique({ where }: any) {
      const p = pedidos[where.id]
      if (!p) return null
      return {
        ...p,
        cliente: { email: 'cliente@teste.com', nome: 'Cliente Teste', telefone: '11999999999' },
        endereco: { logradouro: 'Rua X', numero: '1', bairro: 'B', cidade: 'C', estado: 'SP', cep: '00000000' },
        itens: [],
        pagamentos: Object.values(pagamentos).filter((pg: any) => pg.tentativaMultiMetodoId === where.include?.pagamentos?.where?.tentativaMultiMetodoId),
      }
    },
  },
  auditLog: {
    async create({ data }: any) {
      auditLogs.push(data)
      return data
    },
  },
  async $transaction(ops: Promise<unknown>[]) {
    return Promise.all(ops)
  },
}

function montarTentativaComPagamentos(t: any, include: any) {
  if (!include?.pagamentos) return { ...t }
  const where = include.pagamentos.where
  let pgs = Object.values(pagamentos).filter((p: any) => p.tentativaMultiMetodoId === t.id)
  if (where?.perna) pgs = pgs.filter((p: any) => p.perna === where.perna)
  return { ...t, pagamentos: pgs }
}

vi.mock('./prisma', () => ({ prisma: prismaFake }))
vi.mock('./audit', () => ({ auditLog: vi.fn() }))
vi.mock('./fidelidade', () => ({
  calcularPontos: vi.fn().mockResolvedValue(0),
  creditarPontos: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('./cashback', () => ({ creditarCashback: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./cupom', () => ({ registrarUsoCupom: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./email', () => ({ enviarEmailConfirmacaoPedido: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./analytics/meta-capi', () => ({ enviarPurchaseCapi: vi.fn().mockResolvedValue({ ok: true }) }))
vi.mock('./analytics/ga4-measurement-protocol', () => ({ enviarPurchaseGa4: vi.fn().mockResolvedValue({ ok: true }) }))
vi.mock('./feed-id', () => ({ gIdItemPedido: () => 'sku-x' }))
vi.mock('./mercadopago', () => ({ somarTaxaMp: () => null }))

const { processarTentativa, reverterPernaComClaim, reconciliarMultiMetodo } = await import(
  './checkout-multi-metodo-orquestrador'
)

function mockDeps(overrides: Partial<PaymentsClientDeps> = {}): PaymentsClientDeps {
  return {
    criarPagamento: vi.fn(),
    buscarPagamento: vi.fn(),
    estornarPagamento: vi.fn().mockResolvedValue(undefined),
    cancelarPagamento: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

beforeEach(() => {
  limparBanco()
})

describe('processarTentativa — fluxo dois_cartoes', () => {
  it('feliz: cobra A, cobra B, marca tentativa e pedido pago (requisito 5 soma bate)', async () => {
    const pedido = criarPedidoFake()
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: {
        pedidoId: pedido.id, tipo: 'dois_cartoes', totalCentavos: 10000,
        proximaAcao: {
          payerEmail: 'a@b.com',
          cartaoA: { token: 'tokA', bandeiraId: 'master', parcelas: 1, valorCentavos: 4000 },
          cartaoB: { token: 'tokB', bandeiraId: 'visa', parcelas: 1, valorCentavos: 6000 },
        },
      },
    })

    const deps = mockDeps({
      criarPagamento: vi
        .fn()
        .mockResolvedValueOnce({ id: 'mpA', status: 'approved' })
        .mockResolvedValueOnce({ id: 'mpB', status: 'approved' }),
    })

    await processarTentativa(deps, tentativa.id)

    expect(tentativas[tentativa.id].status).toBe('pago')
    expect(pedidos[pedido.id].status).toBe('pago')
    expect(deps.criarPagamento).toHaveBeenCalledTimes(2)
  })

  it('requisito 2 — cartão A pending: para no aguardar, NÃO cobra B ainda; webhook resolve depois e o mesmo laço prossegue', async () => {
    const pedido = criarPedidoFake()
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: {
        pedidoId: pedido.id, tipo: 'dois_cartoes', totalCentavos: 10000,
        proximaAcao: {
          payerEmail: 'a@b.com',
          cartaoA: { token: 'tokA', bandeiraId: 'master', parcelas: 1, valorCentavos: 4000 },
          cartaoB: { token: 'tokB', bandeiraId: 'visa', parcelas: 1, valorCentavos: 6000 },
        },
      },
    })

    const deps = mockDeps({
      criarPagamento: vi
        .fn()
        .mockResolvedValueOnce({ id: 'mpA', status: 'pending' })
        .mockResolvedValueOnce({ id: 'mpB', status: 'approved' }),
    })

    await processarTentativa(deps, tentativa.id)
    expect(tentativas[tentativa.id].status).toBe('aguardando_confirmacao')
    expect(pedidos[pedido.id].multiMetodoStatus).toBe('aguardando_confirmacao')
    expect(deps.criarPagamento).toHaveBeenCalledTimes(1) // NUNCA cobrou B com A ainda incerto

    // simula o webhook: perna A resolveu pra approved, chama de novo (mesmo caminho)
    const pernaA = Object.values(pagamentos).find((p: any) => p.perna === 'A') as any
    pernaA.mpStatus = 'approved'
    await processarTentativa(deps, tentativa.id)

    expect(deps.criarPagamento).toHaveBeenCalledTimes(2) // agora sim cobrou B
    expect(tentativas[tentativa.id].status).toBe('pago')
  })

  it('B recusado depois de A aprovado: marca falhou e reverte A pelo status REAL', async () => {
    const pedido = criarPedidoFake()
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: {
        pedidoId: pedido.id, tipo: 'dois_cartoes', totalCentavos: 10000,
        proximaAcao: {
          payerEmail: 'a@b.com',
          cartaoA: { token: 'tokA', bandeiraId: 'master', parcelas: 1, valorCentavos: 4000 },
          cartaoB: { token: 'tokB', bandeiraId: 'visa', parcelas: 1, valorCentavos: 6000 },
        },
      },
    })

    const deps = mockDeps({
      criarPagamento: vi
        .fn()
        .mockResolvedValueOnce({ id: 'mpA', status: 'approved' })
        .mockResolvedValueOnce({ id: 'mpB', status: 'rejected' }),
      buscarPagamento: vi.fn().mockResolvedValue({ status: 'approved' }), // status real de A na hora de reverter
    })

    await processarTentativa(deps, tentativa.id)

    expect(tentativas[tentativa.id].status).toBe('falhou')
    expect(pedidos[pedido.id].multiMetodoStatus).toBe('falhou')
    const pernaA = Object.values(pagamentos).find((p: any) => p.perna === 'A') as any
    expect(pernaA.estornoStatus).toBe('estornado')
    expect(deps.estornarPagamento).toHaveBeenCalledWith('mpA')
  })

  it('tentativa já terminal (pago) — chamar de novo é no-op total, nunca chama a MP outra vez', async () => {
    const pedido = criarPedidoFake({ status: 'pago' })
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: { pedidoId: pedido.id, tipo: 'dois_cartoes', totalCentavos: 10000, status: 'pago', proximaAcao: {} },
    })
    const deps = mockDeps()
    await processarTentativa(deps, tentativa.id)
    expect(deps.criarPagamento).not.toHaveBeenCalled()
    expect(deps.buscarPagamento).not.toHaveBeenCalled()
  })
})

describe('processarTentativa — fluxo pix_mais_cartao', () => {
  it('requisito 3 — pix pending dentro do prazo: aguarda, nunca cobra o cartão restante cedo demais', async () => {
    const pedido = criarPedidoFake()
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: {
        pedidoId: pedido.id, tipo: 'pix_mais_cartao', totalCentavos: 10000,
        proximaAcao: { payerEmail: 'a@b.com', valorPixCentavos: 3000 },
      },
    })
    const deps = mockDeps({ criarPagamento: vi.fn().mockResolvedValue({ id: 'mpPix', status: 'pending' }) })

    await processarTentativa(deps, tentativa.id)

    expect(tentativas[tentativa.id].status).toBe('aguardando_pix')
    expect(pedidos[pedido.id].multiMetodoStatus).toBe('aguardando_pix')
    expect(deps.criarPagamento).toHaveBeenCalledTimes(1)
  })

  it('pix aprovado mas cliente ainda não mandou o cartão restante: fica esperando, sem marcar falhou', async () => {
    const pedido = criarPedidoFake()
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: {
        pedidoId: pedido.id, tipo: 'pix_mais_cartao', totalCentavos: 10000,
        proximaAcao: { payerEmail: 'a@b.com', valorPixCentavos: 3000 },
      },
    })
    const deps = mockDeps({ criarPagamento: vi.fn().mockResolvedValue({ id: 'mpPix', status: 'approved' }) })

    await processarTentativa(deps, tentativa.id)

    // ficou em aguardando_pagamento_restante — não falhou por "falta de dados"
    expect(tentativas[tentativa.id].status).toBe('aguardando_pagamento_restante')
  })

  it('cliente manda o cartão restante depois do pix aprovado: cobra e marca pago', async () => {
    const pedido = criarPedidoFake()
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: {
        pedidoId: pedido.id, tipo: 'pix_mais_cartao', totalCentavos: 10000,
        proximaAcao: { payerEmail: 'a@b.com', valorPixCentavos: 3000 },
      },
    })
    const deps = mockDeps({ criarPagamento: vi.fn().mockResolvedValue({ id: 'mpPix', status: 'approved' }) })
    await processarTentativa(deps, tentativa.id)

    await prismaFake.tentativaMultiMetodo.update({
      where: { id: tentativa.id },
      data: {
        proximaAcao: {
          payerEmail: 'a@b.com', valorPixCentavos: 3000,
          cartaoRestante: { token: 'tokC', bandeiraId: 'master', parcelas: 1, valorCentavos: 7000 },
        },
      },
    })
    deps.criarPagamento = vi.fn().mockResolvedValue({ id: 'mpRestante', status: 'approved' })
    await processarTentativa(deps, tentativa.id)

    expect(tentativas[tentativa.id].status).toBe('pago')
    expect(pedidos[pedido.id].status).toBe('pago')
  })

  it('requisito 3 — prazo esgotado com pix ainda pending: falhou por timeout e reverte (aqui, nada a reverter — nunca cobrou)', async () => {
    const pedido = criarPedidoFake()
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: {
        pedidoId: pedido.id, tipo: 'pix_mais_cartao', totalCentavos: 10000, status: 'aguardando_pix',
        prazoExpiracao: new Date(Date.now() - 1000),
        proximaAcao: { payerEmail: 'a@b.com', valorPixCentavos: 3000 },
      },
    })
    await prismaFake.pagamento.create({
      data: { pedidoId: pedido.id, tentativaMultiMetodoId: tentativa.id, perna: 'pix', mpPaymentId: 'mpPix', mpStatus: 'pending', metodo: 'pix', valor: 3000 },
    })
    const deps = mockDeps({ buscarPagamento: vi.fn().mockResolvedValue({ status: 'pending' }) })

    await processarTentativa(deps, tentativa.id)

    expect(tentativas[tentativa.id].status).toBe('falhou')
    expect(tentativas[tentativa.id].erro).toBe('pix_expirou')
    const pernaPix = Object.values(pagamentos).find((p: any) => p.perna === 'pix') as any
    expect(pernaPix.estornoStatus).toBe('nao_aplicavel') // pix nunca aprovou de fato — nada pra reverter
  })

  it('cartão restante recusado NÃO reverte o pix (decisão de negócio já documentada)', async () => {
    const pedido = criarPedidoFake()
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: {
        pedidoId: pedido.id, tipo: 'pix_mais_cartao', totalCentavos: 10000,
        proximaAcao: { payerEmail: 'a@b.com', valorPixCentavos: 3000 },
      },
    })
    const deps = mockDeps({ criarPagamento: vi.fn().mockResolvedValue({ id: 'mpPix', status: 'approved' }) })
    await processarTentativa(deps, tentativa.id)

    await prismaFake.tentativaMultiMetodo.update({
      where: { id: tentativa.id },
      data: {
        proximaAcao: {
          payerEmail: 'a@b.com', valorPixCentavos: 3000,
          cartaoRestante: { token: 'tokC', bandeiraId: 'master', parcelas: 1, valorCentavos: 7000 },
        },
      },
    })
    deps.criarPagamento = vi.fn().mockResolvedValue({ id: 'mpRestante', status: 'rejected' })
    await processarTentativa(deps, tentativa.id)

    expect(tentativas[tentativa.id].status).toBe('falhou')
    const pernaPix = Object.values(pagamentos).find((p: any) => p.perna === 'pix') as any
    expect(pernaPix.estornoStatus ?? null).toBeNull() // nunca chamou reversão pra essa perna
    expect(deps.estornarPagamento).not.toHaveBeenCalled()
  })
})

describe('reverterPernaComClaim — requisito 7 (nunca reverte 2x, mesmo concorrente)', () => {
  it('2 chamadas concorrentes na mesma perna: só 1 chega a chamar a API de reversão', async () => {
    const pedido = criarPedidoFake()
    const pagamento = await prismaFake.pagamento.create({
      data: { pedidoId: pedido.id, mpPaymentId: 'mp1', mpStatus: 'approved', metodo: 'credit_card', valor: 1000 },
    })
    const deps = mockDeps({ buscarPagamento: vi.fn().mockResolvedValue({ status: 'approved' }) })

    await Promise.all([
      reverterPernaComClaim(deps, pagamento.id),
      reverterPernaComClaim(deps, pagamento.id),
    ])

    expect(deps.estornarPagamento).toHaveBeenCalledTimes(1)
    expect(pagamentos[pagamento.id].estornoStatus).toBe('estornado')
  })

  it('chamar de novo depois de já estornado: no-op, nunca rechama a API', async () => {
    const pedido = criarPedidoFake()
    const pagamento = await prismaFake.pagamento.create({
      data: { pedidoId: pedido.id, mpPaymentId: 'mp1', mpStatus: 'approved', metodo: 'credit_card', valor: 1000, estornoStatus: 'estornado', estornoTentativas: 1 },
    })
    const deps = mockDeps()
    await reverterPernaComClaim(deps, pagamento.id)
    expect(deps.buscarPagamento).not.toHaveBeenCalled()
  })

  it('requisito 6 — falha na reversão marca falhou_estorno; alerta só dispara no teto de tentativas', async () => {
    const pedido = criarPedidoFake()
    const pagamento = await prismaFake.pagamento.create({
      data: { pedidoId: pedido.id, mpPaymentId: 'mp1', mpStatus: 'approved', metodo: 'credit_card', valor: 1000, estornoTentativas: 2 },
    })
    const deps = mockDeps({ buscarPagamento: vi.fn().mockRejectedValue(new Error('falhou')) })
    await reverterPernaComClaim(deps, pagamento.id)
    expect(pagamentos[pagamento.id].estornoStatus).toBe('falhou_estorno')
    expect(pagamentos[pagamento.id].estornoTentativas).toBe(3)
    expect(auditLogs.some((a) => a.action === 'checkout.multi_metodo.estorno_falhou_alerta')).toBe(true)
  })
})

describe('reconciliarMultiMetodo — requisito 8 (crash recovery)', () => {
  it('refresca uma perna pending via a API e retoma a tentativa até convergir', async () => {
    const pedido = criarPedidoFake()
    const tentativa = await prismaFake.tentativaMultiMetodo.create({
      data: {
        pedidoId: pedido.id, tipo: 'dois_cartoes', totalCentavos: 10000, status: 'aguardando_confirmacao',
        updatedAt: new Date(Date.now() - 10 * 60_000), // 10min atrás, passou do corte
        proximaAcao: {
          payerEmail: 'a@b.com',
          cartaoA: { token: 'tokA', bandeiraId: 'master', parcelas: 1, valorCentavos: 4000 },
          cartaoB: { token: 'tokB', bandeiraId: 'visa', parcelas: 1, valorCentavos: 6000 },
        },
      },
    })
    await prismaFake.pagamento.create({
      data: { pedidoId: pedido.id, tentativaMultiMetodoId: tentativa.id, perna: 'A', mpPaymentId: 'mpA', mpStatus: 'pending', metodo: 'credit_card', valor: 4000 },
    })

    const deps = mockDeps({
      buscarPagamento: vi.fn().mockResolvedValue({ status: 'approved' }), // webhook nunca chegou, mas a MP já tinha aprovado
      criarPagamento: vi.fn().mockResolvedValue({ id: 'mpB', status: 'approved' }),
    })

    const resultado = await reconciliarMultiMetodo(deps, 5 * 60_000)

    expect(resultado.tentativasProcessadas).toBe(1)
    expect(deps.buscarPagamento).toHaveBeenCalledWith('mpA')
    expect(tentativas[tentativa.id].status).toBe('pago') // convergiu: cobrou B e fechou
  })

  it('ignora tentativas recentes (dentro do corte) — não interfere em request em andamento', async () => {
    const pedido = criarPedidoFake()
    await prismaFake.tentativaMultiMetodo.create({
      data: { pedidoId: pedido.id, tipo: 'dois_cartoes', totalCentavos: 10000, status: 'aguardando_confirmacao', updatedAt: new Date(), proximaAcao: {} },
    })
    const deps = mockDeps()
    const resultado = await reconciliarMultiMetodo(deps, 5 * 60_000)
    expect(resultado.tentativasProcessadas).toBe(0)
    expect(deps.buscarPagamento).not.toHaveBeenCalled()
  })

  it('retenta estornos que falharam antes, respeitando o teto de tentativas', async () => {
    const pedido = criarPedidoFake()
    await prismaFake.pagamento.create({
      data: { pedidoId: pedido.id, mpPaymentId: 'mp1', mpStatus: 'approved', metodo: 'credit_card', valor: 1000, estornoStatus: 'falhou_estorno', estornoTentativas: 1 },
    })
    const deps = mockDeps({ buscarPagamento: vi.fn().mockResolvedValue({ status: 'approved' }) })
    const resultado = await reconciliarMultiMetodo(deps, 5 * 60_000)
    expect(resultado.estornosRetentados).toBe(1)
    expect(Object.values(pagamentos)[0]).toMatchObject({ estornoStatus: 'estornado' })
  })
})
