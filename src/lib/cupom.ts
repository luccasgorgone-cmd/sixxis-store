// ─── Cupom — validação autoritativa (server-side) + registro de uso ──────────
// Fonte única usada por /api/cupons/validar (UX) E /api/pedidos (barreira final),
// e pelo registro de uso ao pedido virar pago (webhook + aprovação inline).
import type { Cupom } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { STATUS_PAGO_TODOS } from '@/lib/pedido-status'

export interface ResultadoCupom {
  valido: boolean
  erro?: string
  tipo?: string
  valor?: number
  desconto?: number
  codigo?: string
}

/** Cliente já tem alguma compra paga/enviada/entregue? (define "não é 1ª compra") */
export async function clienteTemCompraAnterior(clienteId: string): Promise<boolean> {
  const n = await prisma.pedido.count({
    where: { clienteId, status: { in: STATUS_PAGO_TODOS } },
  })
  return n > 0
}

/** Cliente já resgatou algum cupom de primeira compra (em qualquer pedido)? */
export async function clienteJaUsouCupomPrimeiraCompra(clienteId: string): Promise<boolean> {
  const uso = await prisma.cupomUso.findFirst({
    where:  { clienteId, cupom: { primeiraCompra: true } },
    select: { id: true },
  })
  return !!uso
}

function calcularDesconto(cupom: Cupom, total: number): number {
  const valor = Number(cupom.valor)
  if (cupom.tipo === 'PERCENTUAL') return Math.min(total * (valor / 100), total)
  if (cupom.tipo === 'VALOR_FIXO') return Math.min(valor, total)
  return 0 // FRETE_GRATIS — desconto é no frete, não no subtotal
}

/**
 * Avalia um cupom já carregado para um cliente. `clienteId` null = guest/anônimo.
 * Regra de 1ª compra: exige login + nenhum pedido pago anterior + nunca ter
 * resgatado um cupom de primeira compra.
 */
export async function avaliarCupom(
  cupom: Cupom | null,
  total: number,
  clienteId: string | null,
): Promise<ResultadoCupom> {
  if (!cupom || !cupom.ativo) return { valido: false, erro: 'Cupom inválido ou inativo' }
  if (cupom.validade && new Date() > cupom.validade) return { valido: false, erro: 'Cupom expirado' }
  if (cupom.usoMaximo != null && cupom.totalUsos >= cupom.usoMaximo) {
    return { valido: false, erro: 'Cupom atingiu o limite de uso' }
  }
  if (cupom.pedidoMinimo > 0 && total < cupom.pedidoMinimo) {
    return { valido: false, erro: `Pedido mínimo de R$${Number(cupom.pedidoMinimo).toFixed(2)} para usar este cupom` }
  }

  if (cupom.primeiraCompra) {
    // Guests não podem: sem login não dá pra garantir que é a primeira compra.
    if (!clienteId) return { valido: false, erro: 'Faça login para usar o cupom de primeira compra.' }
    if (await clienteTemCompraAnterior(clienteId)) {
      return { valido: false, erro: 'Cupom válido apenas na primeira compra.' }
    }
    if (await clienteJaUsouCupomPrimeiraCompra(clienteId)) {
      return { valido: false, erro: 'Você já utilizou um cupom de primeira compra.' }
    }
  }

  return {
    valido:   true,
    tipo:     cupom.tipo,
    valor:    Number(cupom.valor),
    desconto: calcularDesconto(cupom, total),
    codigo:   cupom.codigo,
  }
}

/**
 * Registra o uso do cupom quando o pedido vira pago. Idempotente por pedido:
 * cria CupomUso 1x e incrementa totalUsos 1x. Chamado pelo webhook e pela
 * aprovação inline de cartão.
 */
export async function registrarUsoCupom(pedidoId: string): Promise<void> {
  const pedido = await prisma.pedido.findUnique({
    where:  { id: pedidoId },
    select: {
      cupomCodigo: true, clienteId: true, total: true, desconto: true,
      cliente: { select: { email: true, nome: true } },
    },
  })
  if (!pedido?.cupomCodigo) return

  // Idempotência: já existe registro p/ este pedido?
  const existente = await prisma.cupomUso.findFirst({ where: { pedidoId }, select: { id: true } })
  if (existente) return

  const cupom = await prisma.cupom.findUnique({
    where:  { codigo: pedido.cupomCodigo },
    select: { id: true },
  })
  if (!cupom) return

  await prisma.$transaction([
    prisma.cupomUso.create({
      data: {
        cupomId:       cupom.id,
        clienteId:     pedido.clienteId,
        pedidoId,
        emailCliente:  pedido.cliente?.email ?? null,
        nomeCliente:   pedido.cliente?.nome ?? null,
        valorDesconto: Number(pedido.desconto),
        valorPedido:   Number(pedido.total),
      },
    }),
    prisma.cupom.update({ where: { id: cupom.id }, data: { totalUsos: { increment: 1 } } }),
  ])
}
