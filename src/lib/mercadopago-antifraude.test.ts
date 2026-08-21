import { describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const findFirstMock = vi.fn()
vi.mock('./prisma', () => ({
  prisma: { pedido: { findFirst: (...args: unknown[]) => findFirstMock(...args) } },
}))

import { construirSinaisAntifraude, type PedidoParaAntifraude } from './mercadopago-antifraude'

function fakeReq(ip?: string): NextRequest {
  return {
    headers: new Headers(ip ? { 'x-forwarded-for': ip } : {}),
  } as unknown as NextRequest
}

function basePedido(overrides: Partial<PedidoParaAntifraude> = {}): PedidoParaAntifraude {
  return {
    id: 'ped_1',
    clienteId: 'cli_1',
    cliente: {
      nome: 'Fulano da Silva',
      cpf: '11144477735',
      telefone: '11987654321',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    endereco: {
      logradouro: 'Rua Teste',
      numero: '100',
      cep: '01310-100',
      cidade: 'São Paulo',
      estado: 'SP',
    },
    itens: [
      {
        produtoId: 'prod_1',
        quantidade: 2,
        precoUnitario: 150.5,
        variacaoNome: 'Branco',
        produto: { sku: 'SKU-1', nome: 'Climatizador X', descricao: 'Descrição do produto' },
      },
    ],
    ...overrides,
  }
}

describe('construirSinaisAntifraude', () => {
  it('monta payer (nome/CPF/telefone/endereço) e additional_info (items/IP/payer/shipments)', async () => {
    findFirstMock.mockResolvedValue(null) // nenhuma compra paga anterior
    const { payer, additionalInfo } = await construirSinaisAntifraude(fakeReq('203.0.113.9'), basePedido())

    expect(payer).toEqual({
      first_name: 'Fulano',
      last_name: 'da Silva',
      identification: { type: 'CPF', number: '11144477735' },
      phone: { area_code: '11', number: '987654321' },
      address: { zip_code: '01310100', street_name: 'Rua Teste', street_number: '100' },
    })

    expect(additionalInfo.ip_address).toBe('203.0.113.9')
    expect(additionalInfo.items).toEqual([
      {
        id: 'SKU-1',
        title: 'Climatizador X — Branco',
        description: 'Descrição do produto',
        category_id: 'home_appliances',
        quantity: 2,
        unit_price: 150.5,
      },
    ])
    expect(additionalInfo.payer).toMatchObject({
      first_name: 'Fulano',
      last_name: 'da Silva',
      registration_date: '2026-01-01T00:00:00.000Z',
      is_first_purchase_online: true,
    })
    expect(additionalInfo.payer).not.toHaveProperty('last_purchase')
    expect(additionalInfo.shipments).toEqual({
      receiver_address: {
        zip_code: '01310100',
        street_name: 'Rua Teste',
        street_number: '100',
        city_name: 'São Paulo',
        state_name: 'SP',
      },
    })
  })

  it('is_first_purchase_online=false e last_purchase quando há compra paga anterior', async () => {
    findFirstMock.mockResolvedValue({ pagoEm: new Date('2026-06-15T12:00:00.000Z') })
    const { additionalInfo } = await construirSinaisAntifraude(fakeReq(), basePedido())

    expect(additionalInfo.payer).toMatchObject({
      is_first_purchase_online: false,
      last_purchase: '2026-06-15T12:00:00.000Z',
    })
    // exclui o próprio pedido e só considera status pagos — cobrado via where do mock
    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clienteId: 'cli_1', id: { not: 'ped_1' } }) }),
    )
  })

  it('overrides de nome/CPF (client input) têm prioridade sobre os dados do cliente', async () => {
    findFirstMock.mockResolvedValue(null)
    const { payer } = await construirSinaisAntifraude(fakeReq(), basePedido(), {
      nome: 'Outro Nome',
      cpf: '52998224725',
    })
    expect(payer.first_name).toBe('Outro')
    expect(payer.last_name).toBe('Nome')
    expect(payer.identification).toEqual({ type: 'CPF', number: '52998224725' })
  })

  it('sem telefone/endereço/CPF válidos, não quebra e omite os campos opcionais', async () => {
    findFirstMock.mockResolvedValue(null)
    const pedido = basePedido({
      cliente: { nome: 'Sem Dados', cpf: null, telefone: null, createdAt: new Date('2026-01-01T00:00:00.000Z') },
      endereco: null,
    })
    const { payer, additionalInfo } = await construirSinaisAntifraude(fakeReq(), pedido)

    expect(payer).toEqual({ first_name: 'Sem', last_name: 'Dados' })
    expect(additionalInfo).not.toHaveProperty('shipments')
    expect(additionalInfo.payer).not.toHaveProperty('phone')
    expect(additionalInfo.payer).not.toHaveProperty('address')
  })
})
