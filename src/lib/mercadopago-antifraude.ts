import type { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { STATUS_PEDIDO_PAGO } from './pedido-status'
import { getClientIp } from './ratelimit'

// Sinais de antifraude do Mercado Pago pro POST /v1/payments: payer
// enriquecido (nome/CPF/telefone/endereço) + additional_info (items + IP +
// histórico de compra + endereço de entrega). ÚNICO ponto que monta isso —
// extraído de criar-pagamento/route.ts pra evitar o drift que causou o
// cc_rejected_high_risk no checkout multi-método (ele só mandava o Device
// ID, nem o nome do payer). Todo fluxo de pagamento novo deve chamar isto,
// nunca remontar na mão.
const MP_CATEGORY = 'home_appliances'

export interface PedidoParaAntifraude {
  id: string
  clienteId: string
  cliente: {
    nome: string
    cpf: string | null
    cnpj: string | null
    telefone: string | null
    createdAt: Date
  }
  endereco: {
    logradouro: string | null
    numero: string | null
    cep: string | null
    cidade: string | null
    estado: string | null
  } | null
  itens: Array<{
    produtoId: string
    quantidade: number
    precoUnitario: unknown
    variacaoNome: string | null
    produto: { sku: string | null; nome: string; descricao: string | null }
  }>
}

export interface SinaisAntifraude {
  /** Campos extras pro payer de topo do payload (some com { email } de quem chama). */
  payer: Record<string, unknown>
  additionalInfo: Record<string, unknown>
}

export async function construirSinaisAntifraude(
  req: NextRequest,
  pedido: PedidoParaAntifraude,
  overrides?: { nome?: string; cpf?: string },
): Promise<SinaisAntifraude> {
  const nomePayer = overrides?.nome ?? pedido.cliente.nome ?? ''
  const [firstName, ...rest] = nomePayer.trim().split(/\s+/)
  const lastName = rest.join(' ') || firstName
  // Documento: override do checkout (CPF ou CNPJ, um campo só) tem prioridade;
  // sem override, cai pro que estiver salvo no cliente — CPF (PF) ou CNPJ (PJ,
  // nunca os dois ao mesmo tempo — ver /api/conta/perfil).
  const documento = overrides?.cpf || pedido.cliente.cpf || pedido.cliente.cnpj || ''
  const cpfDigits = documento.replace(/\D/g, '')

  const telDigits = (pedido.cliente.telefone ?? '').replace(/\D/g, '')
  const telLocal =
    telDigits.length > 11 && telDigits.startsWith('55') ? telDigits.slice(2) : telDigits
  const phone =
    telLocal.length >= 10
      ? { area_code: telLocal.slice(0, 2), number: telLocal.slice(2) }
      : undefined

  const end = pedido.endereco
  const zipCode = (end?.cep ?? '').replace(/\D/g, '')
  const address =
    end && (end.logradouro || zipCode)
      ? {
          zip_code: zipCode || undefined,
          street_name: end.logradouro || undefined,
          street_number: end.numero || undefined,
        }
      : undefined

  const payer: Record<string, unknown> = {
    first_name: firstName || 'Cliente',
    last_name: lastName,
  }
  if (cpfDigits.length === 11) payer.identification = { type: 'CPF', number: cpfDigits }
  else if (cpfDigits.length === 14) payer.identification = { type: 'CNPJ', number: cpfDigits }
  if (phone) payer.phone = phone
  if (address) payer.address = address

  const itemsMP = pedido.itens.map((i) => ({
    id: i.produto.sku || i.produtoId,
    title: i.variacaoNome ? `${i.produto.nome} — ${i.variacaoNome}` : i.produto.nome,
    description: (i.produto.descricao || i.produto.nome).replace(/\s+/g, ' ').trim().slice(0, 256),
    category_id: MP_CATEGORY,
    quantity: i.quantidade,
    unit_price: Number(i.precoUnitario),
  }))

  // Compra anterior PAGA deste cliente — alimenta is_first_purchase_online/
  // last_purchase. Consulta em tempo real (Cliente.totalPedidos nunca é
  // atualizado pelo app hoje, não é fonte confiável).
  const pedidoAnterior = await prisma.pedido.findFirst({
    where: {
      clienteId: pedido.clienteId,
      id: { not: pedido.id },
      status: { in: [...STATUS_PEDIDO_PAGO] },
    },
    orderBy: { pagoEm: 'desc' },
    select: { pagoEm: true },
  })

  const additionalInfo: Record<string, unknown> = {
    items: itemsMP,
    ip_address: getClientIp(req),
  }
  const aiPayer: Record<string, unknown> = {
    first_name: firstName || 'Cliente',
    last_name: lastName,
    registration_date: pedido.cliente.createdAt.toISOString(),
    is_first_purchase_online: !pedidoAnterior,
  }
  if (pedidoAnterior?.pagoEm) aiPayer.last_purchase = pedidoAnterior.pagoEm.toISOString()
  if (phone) aiPayer.phone = phone
  if (address) aiPayer.address = address
  additionalInfo.payer = aiPayer

  if (end) {
    additionalInfo.shipments = {
      receiver_address: {
        zip_code: zipCode || undefined,
        street_name: end.logradouro || undefined,
        street_number: end.numero || undefined,
        city_name: end.cidade || undefined,
        state_name: end.estado || undefined,
      },
    }
  }

  return { payer, additionalInfo }
}
