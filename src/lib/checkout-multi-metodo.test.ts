import { describe, expect, it, vi } from 'vitest'
import {
  completarCheckoutPixMaisCartao,
  executarCheckoutDoisCartoes,
  iniciarCheckoutPixMaisCartao,
  type OrdersClientDeps,
} from './checkout-multi-metodo'

const APROVADO = { status: 'processed', status_detail: 'accredited' }
const RECUSADO = { status: 'rejected', status_detail: 'cc_rejected_insufficient_amount' }

function cartao(valorCentavos: number, token = 'tok') {
  return { token, bandeiraId: 'master', parcelas: 1, valorCentavos }
}

function mockDeps(overrides: Partial<OrdersClientDeps> = {}): OrdersClientDeps {
  return {
    criarOrderManual: vi.fn().mockResolvedValue({ id: 'order_1' }),
    adicionarTransacao: vi.fn(),
    removerTransacao: vi.fn().mockResolvedValue(undefined),
    processarOrder: vi.fn().mockResolvedValue({ status: 'processed' }),
    cancelarOrder: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    ...overrides,
  }
}

describe('executarCheckoutDoisCartoes', () => {
  it('rejeita antes de criar order quando a soma dos 2 cartões não bate com o total', async () => {
    const deps = mockDeps()
    const r = await executarCheckoutDoisCartoes(deps, {
      externalReference: 'ped_1',
      payerEmail: 'a@b.com',
      totalCentavos: 10000,
      cartaoA: cartao(4000),
      cartaoB: cartao(5000),
    })
    expect(r).toMatchObject({ status: 'falhou', erro: 'soma_nao_bate' })
    expect(deps.criarOrderManual).not.toHaveBeenCalled()
  })

  it('aprova quando os 2 cartões e o process são aceitos', async () => {
    const deps = mockDeps({
      adicionarTransacao: vi
        .fn()
        .mockResolvedValueOnce({ payments: [{ id: 'txA', ...APROVADO }] })
        .mockResolvedValueOnce({ payments: [{ id: 'txB', ...APROVADO }] }),
    })
    const r = await executarCheckoutDoisCartoes(deps, {
      externalReference: 'ped_2',
      payerEmail: 'a@b.com',
      totalCentavos: 10000,
      cartaoA: cartao(4000),
      cartaoB: cartao(6000),
    })
    expect(r).toEqual({ status: 'pago', orderId: 'order_1' })
    expect(deps.adicionarTransacao).toHaveBeenCalledTimes(2)
    expect(deps.cancelarOrder).not.toHaveBeenCalled()
  })

  it('cancela a order e não tenta o cartão B se o cartão A for recusado', async () => {
    const deps = mockDeps({
      adicionarTransacao: vi.fn().mockResolvedValueOnce({ payments: [{ id: 'txA', ...RECUSADO }] }),
    })
    const r = await executarCheckoutDoisCartoes(deps, {
      externalReference: 'ped_3',
      payerEmail: 'a@b.com',
      totalCentavos: 10000,
      cartaoA: cartao(4000),
      cartaoB: cartao(6000),
    })
    expect(r).toMatchObject({ status: 'falhou', erro: 'cartao_a_recusado', orderId: 'order_1' })
    expect(deps.adicionarTransacao).toHaveBeenCalledTimes(1)
    expect(deps.cancelarOrder).toHaveBeenCalledWith('order_1')
  })

  it('tenta remover a transação A e cancela a order se o cartão B for recusado depois de A aprovado', async () => {
    const deps = mockDeps({
      adicionarTransacao: vi
        .fn()
        .mockResolvedValueOnce({ payments: [{ id: 'txA', ...APROVADO }] })
        .mockResolvedValueOnce({ payments: [{ id: 'txB', ...RECUSADO }] }),
    })
    const r = await executarCheckoutDoisCartoes(deps, {
      externalReference: 'ped_4',
      payerEmail: 'a@b.com',
      totalCentavos: 10000,
      cartaoA: cartao(4000),
      cartaoB: cartao(6000),
    })
    expect(r).toMatchObject({ status: 'falhou', erro: 'cartao_b_recusado' })
    expect(deps.removerTransacao).toHaveBeenCalledWith('order_1', 'txA')
    expect(deps.cancelarOrder).toHaveBeenCalledWith('order_1')
  })

  it('reporta falha se o process final não confirmar mesmo com os 2 cartões aprovados', async () => {
    const deps = mockDeps({
      adicionarTransacao: vi
        .fn()
        .mockResolvedValueOnce({ payments: [{ id: 'txA', ...APROVADO }] })
        .mockResolvedValueOnce({ payments: [{ id: 'txB', ...APROVADO }] }),
      processarOrder: vi.fn().mockResolvedValue({ status: 'action_required' }),
    })
    const r = await executarCheckoutDoisCartoes(deps, {
      externalReference: 'ped_5',
      payerEmail: 'a@b.com',
      totalCentavos: 10000,
      cartaoA: cartao(4000),
      cartaoB: cartao(6000),
    })
    expect(r).toMatchObject({ status: 'falhou', erro: 'process_nao_confirmou' })
  })
})

describe('iniciarCheckoutPixMaisCartao', () => {
  it('cria a order e adiciona só a transação pix, retorna aguardando_pix', async () => {
    const deps = mockDeps({
      adicionarTransacao: vi.fn().mockResolvedValue({ payments: [{ id: 'txPix', status: 'pending' }] }),
    })
    const r = await iniciarCheckoutPixMaisCartao(deps, {
      externalReference: 'ped_6',
      payerEmail: 'a@b.com',
      valorPixCentavos: 3000,
    })
    expect(r.status).toBe('aguardando_pix')
    expect(r.orderId).toBe('order_1')
    expect(deps.adicionarTransacao).toHaveBeenCalledWith(
      'order_1',
      expect.objectContaining({ payment_method: { id: 'pix', type: 'bank_transfer' } }),
    )
  })
})

describe('completarCheckoutPixMaisCartao', () => {
  it('marca pago quando o cartão do restante é aprovado e o process confirma', async () => {
    const deps = mockDeps({
      adicionarTransacao: vi.fn().mockResolvedValue({ payments: [{ id: 'txCard', ...APROVADO }] }),
    })
    const r = await completarCheckoutPixMaisCartao(deps, {
      orderId: 'order_1',
      valorRestanteCentavos: 7000,
      cartao: cartao(7000),
    })
    expect(r).toEqual({ status: 'pago', orderId: 'order_1' })
  })

  it('NÃO tenta estornar o pix quando o cartão do restante falha — vira aguardando_pagamento_restante', async () => {
    const deps = mockDeps({
      adicionarTransacao: vi.fn().mockResolvedValue({ payments: [{ id: 'txCard', ...RECUSADO }] }),
    })
    const r = await completarCheckoutPixMaisCartao(deps, {
      orderId: 'order_1',
      valorRestanteCentavos: 7000,
      cartao: cartao(7000),
    })
    expect(r).toMatchObject({ status: 'aguardando_pagamento_restante', erro: 'cartao_recusado_apos_pix' })
    expect(deps.cancelarOrder).not.toHaveBeenCalled()
    expect(deps.removerTransacao).not.toHaveBeenCalled()
  })
})
