import { describe, expect, it, vi } from 'vitest'
import {
  MAX_TENTATIVAS_ESTORNO,
  avaliarTentativaDoisCartoes,
  avaliarTentativaPixMaisCartao,
  classificarStatusPerna,
  cobrarPernaCartao,
  cobrarPernaPix,
  capturarPernaCartao,
  detalheDoErro,
  idempotencyKeyPerna,
  reverterPerna,
  type PaymentsClientDeps,
} from './checkout-multi-metodo'

function mockDeps(overrides: Partial<PaymentsClientDeps> = {}): PaymentsClientDeps {
  return {
    criarPagamento: vi.fn(),
    buscarPagamento: vi.fn(),
    capturarPagamento: vi.fn(),
    estornarPagamento: vi.fn().mockResolvedValue(undefined),
    cancelarPagamento: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('classificarStatusPerna', () => {
  it('approved => aprovado', () => expect(classificarStatusPerna('approved')).toBe('aprovado'))
  it.each(['pending', 'in_process', 'authorized'])('%s => pendente (requisito 2)', (s) =>
    expect(classificarStatusPerna(s)).toBe('pendente'),
  )
  it.each(['rejected', 'cancelled', 'refunded', 'charged_back', null, undefined])(
    '%s => recusado',
    (s) => expect(classificarStatusPerna(s)).toBe('recusado'),
  )
})

// ─── requisito 4: idempotência ───────────────────────────────────────────────
describe('idempotencyKeyPerna', () => {
  it('é determinística — mesma tentativa+perna sempre gera a mesma key', () => {
    expect(idempotencyKeyPerna('t1', 'A')).toBe(idempotencyKeyPerna('t1', 'A'))
  })
  it('difere por perna e por tentativa', () => {
    expect(idempotencyKeyPerna('t1', 'A')).not.toBe(idempotencyKeyPerna('t1', 'B'))
    expect(idempotencyKeyPerna('t1', 'A')).not.toBe(idempotencyKeyPerna('t2', 'A'))
  })
})

describe('cobrarPernaCartao / cobrarPernaPix', () => {
  it('cobrarPernaCartao passa a idempotencyKey pro deps.criarPagamento (retry nunca cobra 2x)', async () => {
    const deps = mockDeps({ criarPagamento: vi.fn().mockResolvedValue({ id: 123, status: 'approved' }) })
    await cobrarPernaCartao(deps, {
      idempotencyKey: 'mm:t1:A',
      externalReference: 'ped_1',
      payerEmail: 'a@b.com',
      notificationUrl: 'https://x/webhook',
      metadata: {},
      cartao: { token: 'tok', bandeiraId: 'master', parcelas: 1, valorCentavos: 1000 },
    })
    expect(deps.criarPagamento).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: 'mm:t1:A' }),
    )
  })

  it('cobrarPernaCartao nunca crasha quando a API lança erro — devolve erro no resultado', async () => {
    const deps = mockDeps({ criarPagamento: vi.fn().mockRejectedValue({ code: 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES' }) })
    const r = await cobrarPernaCartao(deps, {
      idempotencyKey: 'mm:t1:A',
      externalReference: 'ped_1',
      payerEmail: 'a@b.com',
      notificationUrl: 'https://x/webhook',
      metadata: {},
      cartao: { token: 'tok', bandeiraId: 'master', parcelas: 1, valorCentavos: 1000 },
    })
    expect(r.erro).toContain('PA_UNAUTHORIZED_RESULT_FROM_POLICIES')
    expect(r.mpPaymentId).toBeNull()
  })

  it('cobrarPernaPix devolve o qrCode e nunca crasha em erro', async () => {
    const deps = mockDeps({
      criarPagamento: vi.fn().mockResolvedValue({
        id: 9, status: 'pending',
        point_of_interaction: { transaction_data: { qr_code: 'copia-e-cola', qr_code_base64: 'base64' } },
      }),
    })
    const r = await cobrarPernaPix(deps, {
      idempotencyKey: 'mm:t1:pix',
      externalReference: 'ped_1',
      payerEmail: 'a@b.com',
      notificationUrl: 'https://x/webhook',
      metadata: {},
      valorCentavos: 3000,
    })
    expect(r.qrCodeCopiaECola).toBe('copia-e-cola')
    expect(r.status).toBe('pending')
  })

  it('capturarAoCriar=false manda capture:false no corpo (2 cartões — só autoriza)', async () => {
    const deps = mockDeps({ criarPagamento: vi.fn().mockResolvedValue({ id: 1, status: 'authorized' }) })
    await cobrarPernaCartao(deps, {
      idempotencyKey: 'mm:t1:A', externalReference: 'ped_1', payerEmail: 'a@b.com',
      notificationUrl: 'https://x/webhook', metadata: {},
      cartao: { token: 'tok', bandeiraId: 'master', parcelas: 1, valorCentavos: 1000 },
      capturarAoCriar: false,
    })
    expect(deps.criarPagamento).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ capture: false }) }),
    )
  })

  it('sem capturarAoCriar (default) manda capture:true (restante do pix — captura na hora)', async () => {
    const deps = mockDeps({ criarPagamento: vi.fn().mockResolvedValue({ id: 1, status: 'approved' }) })
    await cobrarPernaCartao(deps, {
      idempotencyKey: 'mm:t1:restante', externalReference: 'ped_1', payerEmail: 'a@b.com',
      notificationUrl: 'https://x/webhook', metadata: {},
      cartao: { token: 'tok', bandeiraId: 'master', parcelas: 1, valorCentavos: 1000 },
    })
    expect(deps.criarPagamento).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ capture: true }) }),
    )
  })
})

describe('capturarPernaCartao', () => {
  it('chama deps.capturarPagamento com o mpPaymentId e devolve o status', async () => {
    const deps = mockDeps({ capturarPagamento: vi.fn().mockResolvedValue({ status: 'approved' }) })
    const r = await capturarPernaCartao(deps, 'mp_1')
    expect(deps.capturarPagamento).toHaveBeenCalledWith('mp_1')
    expect(r).toMatchObject({ mpPaymentId: 'mp_1', status: 'approved' })
  })

  it('nunca crasha quando a captura lança erro — devolve erro no resultado', async () => {
    const deps = mockDeps({ capturarPagamento: vi.fn().mockRejectedValue(new Error('timeout')) })
    const r = await capturarPernaCartao(deps, 'mp_1')
    expect(r.erro).toContain('timeout')
    expect(r.status).toBeNull()
  })
})

// ─── requisitos 1, 6, 7: reversão ─────────────────────────────────────────────
describe('reverterPerna', () => {
  it('status real approved => refund (nunca cancel)', async () => {
    const deps = mockDeps({ buscarPagamento: vi.fn().mockResolvedValue({ status: 'approved' }) })
    const r = await reverterPerna(deps, { mpPaymentId: 'pay_1', estornoStatus: null, estornoTentativas: 0 })
    expect(r.estornoStatus).toBe('estornado')
    expect(deps.estornarPagamento).toHaveBeenCalledWith('pay_1')
    expect(deps.cancelarPagamento).not.toHaveBeenCalled()
  })

  it('status real authorized => cancel (nunca refund) — requisito 1 literal', async () => {
    const deps = mockDeps({ buscarPagamento: vi.fn().mockResolvedValue({ status: 'authorized' }) })
    const r = await reverterPerna(deps, { mpPaymentId: 'pay_1', estornoStatus: null, estornoTentativas: 0 })
    expect(r.estornoStatus).toBe('cancelado')
    expect(deps.cancelarPagamento).toHaveBeenCalledWith('pay_1')
    expect(deps.estornarPagamento).not.toHaveBeenCalled()
  })

  it.each(['rejected', 'pending', 'in_process', 'cancelled', 'refunded', undefined])(
    'status real %s => nao_aplicavel — nunca chama refund nem cancel (dinheiro nunca moveu)',
    async (status) => {
      const deps = mockDeps({ buscarPagamento: vi.fn().mockResolvedValue({ status }) })
      const r = await reverterPerna(deps, { mpPaymentId: 'pay_1', estornoStatus: null, estornoTentativas: 0 })
      expect(r.estornoStatus).toBe('nao_aplicavel')
      expect(deps.estornarPagamento).not.toHaveBeenCalled()
      expect(deps.cancelarPagamento).not.toHaveBeenCalled()
    },
  )

  it('nunca decide em cima do status LOCAL — sempre confirma o status REAL primeiro (requisito 1)', async () => {
    const deps = mockDeps({ buscarPagamento: vi.fn().mockResolvedValue({ status: 'rejected' }) })
    // localmente marcado como se tivesse ido bem, mas a MP diz que na verdade recusou
    await reverterPerna(deps, { mpPaymentId: 'pay_1', estornoStatus: null, estornoTentativas: 0 })
    expect(deps.buscarPagamento).toHaveBeenCalledWith('pay_1')
    expect(deps.estornarPagamento).not.toHaveBeenCalled()
  })

  it('sem mpPaymentId (nunca chegou a cobrar) => nao_aplicavel sem chamar a API', async () => {
    const deps = mockDeps()
    const r = await reverterPerna(deps, { mpPaymentId: null, estornoStatus: null, estornoTentativas: 0 })
    expect(r.estornoStatus).toBe('nao_aplicavel')
    expect(deps.buscarPagamento).not.toHaveBeenCalled()
  })

  it.each(['estornado', 'cancelado', 'nao_aplicavel'])(
    'requisito 7 — já em estado terminal (%s): nunca chama a API de novo (nunca estorna 2x)',
    async (estornoStatus) => {
      const deps = mockDeps()
      const r = await reverterPerna(deps, { mpPaymentId: 'pay_1', estornoStatus, estornoTentativas: 1 })
      expect(r.estornoStatus).toBe(estornoStatus)
      expect(deps.buscarPagamento).not.toHaveBeenCalled()
      expect(deps.estornarPagamento).not.toHaveBeenCalled()
      expect(deps.cancelarPagamento).not.toHaveBeenCalled()
    },
  )

  it('requisito 6 — falha ao confirmar status real: nunca engole, marca falhou_estorno e incrementa tentativa', async () => {
    const deps = mockDeps({ buscarPagamento: vi.fn().mockRejectedValue(new Error('timeout')) })
    const r = await reverterPerna(deps, { mpPaymentId: 'pay_1', estornoStatus: null, estornoTentativas: 0 })
    expect(r.estornoStatus).toBe('falhou_estorno')
    expect(r.estornoTentativas).toBe(1)
    expect(r.estornoErro).toContain('timeout')
  })

  it('requisito 6 — falha no refund em si (status real approved, mas o refund lança): marca falhou_estorno', async () => {
    const deps = mockDeps({
      buscarPagamento: vi.fn().mockResolvedValue({ status: 'approved' }),
      estornarPagamento: vi.fn().mockRejectedValue({ message: 'refund indisponível' }),
    })
    const r = await reverterPerna(deps, { mpPaymentId: 'pay_1', estornoStatus: null, estornoTentativas: 0 })
    expect(r.estornoStatus).toBe('falhou_estorno')
    expect(r.estornoErro).toContain('refund indisponível')
  })

  it('requisito 6 — alerta alto só dispara ao bater o teto de tentativas, nunca antes', async () => {
    const deps = mockDeps({ buscarPagamento: vi.fn().mockRejectedValue(new Error('falhou')) })
    const antes = await reverterPerna(deps, {
      mpPaymentId: 'pay_1',
      estornoStatus: 'falhou_estorno',
      estornoTentativas: MAX_TENTATIVAS_ESTORNO - 2,
    })
    expect(antes.precisaAlertar).toBe(false)
    const noTeto = await reverterPerna(deps, {
      mpPaymentId: 'pay_1',
      estornoStatus: 'falhou_estorno',
      estornoTentativas: MAX_TENTATIVAS_ESTORNO - 1,
    })
    expect(noTeto.precisaAlertar).toBe(true)
    expect(noTeto.estornoTentativas).toBe(MAX_TENTATIVAS_ESTORNO)
  })

  it('retry depois de falhou_estorno tenta de novo (não é terminal)', async () => {
    const deps = mockDeps({ buscarPagamento: vi.fn().mockResolvedValue({ status: 'approved' }) })
    const r = await reverterPerna(deps, { mpPaymentId: 'pay_1', estornoStatus: 'falhou_estorno', estornoTentativas: 1 })
    expect(deps.buscarPagamento).toHaveBeenCalled()
    expect(r.estornoStatus).toBe('estornado')
  })
})

// ─── requisitos 2, 3, 5: decisão pura da tentativa ────────────────────────────
describe('avaliarTentativaDoisCartoes', () => {
  it('sem nenhuma perna ainda => cobrar A (primeira chamada, síncrono)', () => {
    const d = avaliarTentativaDoisCartoes(10000, undefined, undefined)
    expect(d).toEqual({ acao: 'cobrar_proxima', perna: 'A' })
  })

  it('A recusado => falhou, sem reverter nada (nunca cobrou)', () => {
    const d = avaliarTentativaDoisCartoes(10000, { status: 'rejected', valorCentavos: 4000 }, undefined)
    expect(d).toMatchObject({ acao: 'falhou', erro: 'cartao_a_recusado', pernasParaReverter: [] })
  })

  it('requisito 2 — A pending => aguardar, NUNCA decide falha nem cobra B ainda', () => {
    const d = avaliarTentativaDoisCartoes(10000, { status: 'pending', valorCentavos: 4000 }, undefined)
    expect(d).toEqual({ acao: 'aguardar' })
  })

  it('A autorizado (não capturado ainda), sem B ainda => cobrar B', () => {
    const d = avaliarTentativaDoisCartoes(10000, { status: 'authorized', valorCentavos: 4000 }, undefined)
    expect(d).toEqual({ acao: 'cobrar_proxima', perna: 'B' })
  })

  it('requisito 2 — A autorizado, B pending => aguardar (nunca decide em cima de pending)', () => {
    const d = avaliarTentativaDoisCartoes(
      10000,
      { status: 'authorized', valorCentavos: 4000 },
      { status: 'in_process', valorCentavos: 6000 },
    )
    expect(d).toEqual({ acao: 'aguardar' })
  })

  it('A autorizado, B recusado => falhou e reverte A (cancel, nunca chegou a capturar)', () => {
    const d = avaliarTentativaDoisCartoes(
      10000,
      { status: 'authorized', valorCentavos: 4000 },
      { status: 'rejected', valorCentavos: 6000 },
    )
    expect(d).toMatchObject({ acao: 'falhou', erro: 'cartao_b_recusado', pernasParaReverter: ['A'] })
  })

  it('modelo autoriza-depois-captura — as 2 autorizadas: captura A primeiro, nunca as 2 juntas', () => {
    const d = avaliarTentativaDoisCartoes(
      10000,
      { status: 'authorized', valorCentavos: 4000 },
      { status: 'authorized', valorCentavos: 6000 },
    )
    expect(d).toEqual({ acao: 'capturar_proxima', perna: 'A' })
  })

  it('A já capturado (retomada), B ainda só autorizado => captura B', () => {
    const d = avaliarTentativaDoisCartoes(
      10000,
      { status: 'approved', valorCentavos: 4000 },
      { status: 'authorized', valorCentavos: 6000 },
    )
    expect(d).toEqual({ acao: 'capturar_proxima', perna: 'B' })
  })

  it('A autorizado, B já capturado (retomada) => captura A', () => {
    const d = avaliarTentativaDoisCartoes(
      10000,
      { status: 'authorized', valorCentavos: 4000 },
      { status: 'approved', valorCentavos: 6000 },
    )
    expect(d).toEqual({ acao: 'capturar_proxima', perna: 'A' })
  })

  it('ambos aprovados e soma bate => pago', () => {
    const d = avaliarTentativaDoisCartoes(
      10000,
      { status: 'approved', valorCentavos: 4000 },
      { status: 'approved', valorCentavos: 6000 },
    )
    expect(d).toEqual({ acao: 'pago' })
  })

  it('requisito 5 — ambos aprovados mas a SOMA REAL não bate => falhou e reverte as 2, mesmo com as 2 aprovadas', () => {
    const d = avaliarTentativaDoisCartoes(
      10000,
      { status: 'approved', valorCentavos: 4000 },
      { status: 'approved', valorCentavos: 5999 }, // MP cobrou 1 centavo a menos por algum motivo
    )
    expect(d).toMatchObject({ acao: 'falhou', erro: 'soma_nao_bate_pos_cobranca', pernasParaReverter: ['A', 'B'] })
  })
})

describe('avaliarTentativaPixMaisCartao', () => {
  it('sem pix ainda => cobrar pix', () => {
    expect(avaliarTentativaPixMaisCartao(10000, undefined, undefined, false)).toEqual({
      acao: 'cobrar_proxima', perna: 'pix',
    })
  })

  it('requisito 3 — pix pending e dentro do prazo => aguardar (espera o webhook)', () => {
    const d = avaliarTentativaPixMaisCartao(10000, { status: 'pending', valorCentavos: 3000 }, undefined, false)
    expect(d).toEqual({ acao: 'aguardar' })
  })

  it('requisito 3 — pix pending e prazo esgotado => falhou, reverte pix E cartão restante (timeout)', () => {
    const d = avaliarTentativaPixMaisCartao(10000, { status: 'pending', valorCentavos: 3000 }, undefined, true)
    expect(d).toMatchObject({ acao: 'falhou', erro: 'pix_expirou', pernasParaReverter: ['pix', 'restante'] })
  })

  it('pix recusado => falhou imediatamente, mesmo dentro do prazo', () => {
    const d = avaliarTentativaPixMaisCartao(10000, { status: 'rejected', valorCentavos: 3000 }, undefined, false)
    expect(d).toMatchObject({ acao: 'falhou', erro: 'pix_recusado' })
  })

  it('pix aprovado, sem cartão restante ainda => cobrar restante', () => {
    const d = avaliarTentativaPixMaisCartao(10000, { status: 'approved', valorCentavos: 3000 }, undefined, false)
    expect(d).toEqual({ acao: 'cobrar_proxima', perna: 'restante' })
  })

  it('requisito 2 — pix aprovado, cartão restante pending => aguardar', () => {
    const d = avaliarTentativaPixMaisCartao(
      10000,
      { status: 'approved', valorCentavos: 3000 },
      { status: 'pending', valorCentavos: 7000 },
      false,
    )
    expect(d).toEqual({ acao: 'aguardar' })
  })

  it('pix aprovado, cartão restante recusado => falhou MAS NÃO reverte o pix (decisão de negócio)', () => {
    const d = avaliarTentativaPixMaisCartao(
      10000,
      { status: 'approved', valorCentavos: 3000 },
      { status: 'rejected', valorCentavos: 7000 },
      false,
    )
    expect(d).toMatchObject({ acao: 'falhou', erro: 'cartao_restante_recusado', pernasParaReverter: [] })
  })

  it('ambos aprovados e soma bate => pago', () => {
    const d = avaliarTentativaPixMaisCartao(
      10000,
      { status: 'approved', valorCentavos: 3000 },
      { status: 'approved', valorCentavos: 7000 },
      false,
    )
    expect(d).toEqual({ acao: 'pago' })
  })

  it('requisito 5 — soma real não bate mesmo com os 2 aprovados => falhou, reverte os 2', () => {
    const d = avaliarTentativaPixMaisCartao(
      10000,
      { status: 'approved', valorCentavos: 3000 },
      { status: 'approved', valorCentavos: 7001 },
      false,
    )
    expect(d).toMatchObject({ acao: 'falhou', erro: 'soma_nao_bate_pos_cobranca', pernasParaReverter: ['pix', 'restante'] })
  })
})

describe('detalheDoErro', () => {
  it('extrai code+message de um erro bruto do SDK MP (objeto, não Error)', () => {
    expect(detalheDoErro({ code: 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES', message: 'blocked' })).toBe(
      'PA_UNAUTHORIZED_RESULT_FROM_POLICIES: blocked',
    )
  })
  it('funciona com Error nativo (falha de rede)', () => {
    expect(detalheDoErro(new Error('timeout'))).toBe('timeout')
  })
  it('nunca lança pra string/undefined esquisito', () => {
    expect(detalheDoErro(undefined)).toBe('undefined')
  })
})
