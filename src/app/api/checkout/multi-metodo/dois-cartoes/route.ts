import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { auditLog } from '@/lib/audit'
import { isStatusPendente } from '@/lib/pedido-status'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { isClienteBloqueado, MSG_CONTA_BLOQUEADA } from '@/lib/cliente-bloqueio'
import { calcularTotalBaseReais } from '@/lib/checkout-total'
import { paymentsClientDeps } from '@/lib/mercadopago-payments-deps'
import { processarTentativa } from '@/lib/checkout-multi-metodo-orquestrador'
import { construirSinaisAntifraude } from '@/lib/mercadopago-antifraude'

// STATUS (ver checkout-multi-metodo.ts): reconstruído sobre a Payments API
// clássica em 2026-08-20 depois de confirmar em produção que a Orders API
// está bloqueada pra conta da Sixxis (403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES,
// sem previsão de desbloqueio).

const cartaoSchema = z.object({
  token: z.string().min(1),
  bandeiraId: z.string().min(1),
  parcelas: z.number().int().positive(),
  valorCentavos: z.number().int().positive(),
})

const schema = z.object({
  pedidoId: z.string().min(1),
  payerEmail: z.string().email().optional(),
  cartaoA: cartaoSchema,
  cartaoB: cartaoSchema,
  deviceId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (await isClienteBloqueado(session.user.id)) {
    return NextResponse.json({ error: MSG_CONTA_BLOQUEADA, bloqueado: true }, { status: 403 })
  }

  const rl = await rateLimit('checkout-multi-metodo', session.user.id ?? getClientIp(req))
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas de pagamento. Aguarde alguns minutos.' },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { pedidoId, payerEmail, cartaoA, cartaoB, deviceId } = parsed.data

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, clienteId: session.user.id },
    include: {
      garantias: { select: { valorPago: true } },
      itens: { include: { produto: { select: { sku: true, nome: true, descricao: true } } } },
      cliente: { select: { email: true, nome: true, cpf: true, cnpj: true, telefone: true, createdAt: true } },
      endereco: true,
    },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (!isStatusPendente(pedido.status)) {
    return NextResponse.json({ error: 'Pedido em status inválido' }, { status: 400 })
  }

  const totalBaseReais = calcularTotalBaseReais(pedido)
  const totalCentavos = Math.round(totalBaseReais * 100)

  // Requisito 5 (soma exata): valida ANTES de criar qualquer coisa. A
  // revalidação PÓS-cobrança (com os valores REAIS que a MP confirmou) fica
  // dentro de avaliarTentativaDoisCartoes, chamada por processarTentativa.
  if (cartaoA.valorCentavos + cartaoB.valorCentavos !== totalCentavos) {
    return NextResponse.json(
      { error: 'Pagamento não aprovado', erro: 'soma_nao_bate', detalhe: `${cartaoA.valorCentavos}+${cartaoB.valorCentavos}!=${totalCentavos}` },
      { status: 402 },
    )
  }

  const { payer: payerExtra, additionalInfo } = await construirSinaisAntifraude(req, pedido)

  const tentativa = await prisma.tentativaMultiMetodo.create({
    data: {
      pedidoId: pedido.id,
      tipo: 'dois_cartoes',
      totalCentavos,
      proximaAcao: {
        payerEmail: payerEmail ?? pedido.cliente.email,
        cartaoA,
        cartaoB,
        deviceId,
        payerExtra,
        additionalInfo,
      } as Prisma.InputJsonValue,
    },
  })

  await processarTentativa(paymentsClientDeps, tentativa.id)

  const final = await prisma.tentativaMultiMetodo.findUniqueOrThrow({ where: { id: tentativa.id } })

  await auditLog({
    req,
    actor: session.user.id,
    action: `checkout.multi_metodo.dois_cartoes.${final.status}`,
    target: pedido.id,
    metadata: { tentativaId: tentativa.id, erro: final.erro },
  })

  if (final.status === 'pago') {
    return NextResponse.json({ ok: true, tentativaId: tentativa.id, status: 'pago' })
  }
  if (final.status === 'falhou' || final.status === 'cancelado') {
    return NextResponse.json(
      { error: 'Pagamento não aprovado', erro: final.erro, status: final.status },
      { status: 402 },
    )
  }
  // aguardando_confirmacao — MP ainda avaliando (ex.: revisão antifraude).
  // Cliente faz polling em /api/checkout/multi-metodo/status/[pedidoId].
  return NextResponse.json({ ok: true, tentativaId: tentativa.id, status: final.status }, { status: 202 })
}
