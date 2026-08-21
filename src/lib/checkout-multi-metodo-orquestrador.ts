import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { auditLog } from './audit'
import { calcularPontos, creditarPontos } from './fidelidade'
import { creditarCashback } from './cashback'
import { registrarUsoCupom } from './cupom'
import { enviarEmailConfirmacaoPedido } from './email'
import { enviarPurchaseCapi } from './analytics/meta-capi'
import { enviarPurchaseGa4 } from './analytics/ga4-measurement-protocol'
import { gIdItemPedido } from './feed-id'
import { somarTaxaMp } from './mercadopago'
import {
  avaliarTentativaDoisCartoes,
  avaliarTentativaPixMaisCartao,
  classificarStatusPerna,
  cobrarPernaCartao,
  cobrarPernaPix,
  capturarPernaCartao,
  reverterPerna,
  idempotencyKeyPerna,
  detalheDoErro,
  MAX_TENTATIVAS_ESTORNO,
  type PaymentsClientDeps,
  type EstadoPerna,
  type PernaCartao,
} from './checkout-multi-metodo'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sixxis.com.br'
const NOTIFICATION_URL = `${APP_URL}/api/webhooks/mercado-pago`

type ProximaAcao = {
  payerEmail: string
  cartaoA?: PernaCartao
  cartaoB?: PernaCartao
  valorPixCentavos?: number
  cartaoRestante?: PernaCartao
  /** Device ID capturado no navegador na submissão original — reaproveitado
   *  em toda perna desta tentativa (inclusive as cobradas depois, via webhook). */
  deviceId?: string
  /** Sinais de antifraude (payer enriquecido + additional_info), montados 1x
   *  na rota que cria/atualiza a tentativa (mercadopago-antifraude.ts) e
   *  reaproveitados em toda perna — mesmo padrão do checkout de 1 método. */
  payerExtra?: Record<string, unknown>
  additionalInfo?: Record<string, unknown>
}

// Máximo de iterações do laço abaixo: no pior caso (2 cartões) são 4 ações
// sequenciais — cobrar A, cobrar B, capturar A, capturar B — cada uma reavaliada
// antes da próxima; 6 dá folga.
const MAX_ITERACOES = 6

/**
 * Ponto ÚNICO de decisão do checkout multi-método — chamado tanto no caminho
 * síncrono (logo após o cliente enviar os dados) quanto no webhook (quando
 * uma perna que ficou "pending" resolve) quanto na reconciliação (crash
 * recovery / retomada de timeout). Os 3 caminhos NUNCA duplicam a lógica de
 * decisão — só esta função decide o que fazer; ela só lê o estado das pernas
 * já persistidas no banco (nunca chama a MP pra "descobrir" status — quem
 * atualiza mpStatus é sempre o webhook ou a reconciliação, que fazem a
 * chamada de rede explicitamente antes de invocar isto).
 */
export async function processarTentativa(deps: PaymentsClientDeps, tentativaId: string): Promise<void> {
  for (let iter = 0; iter < MAX_ITERACOES; iter++) {
    const tentativa = await prisma.tentativaMultiMetodo.findUnique({
      where: { id: tentativaId },
      include: { pagamentos: true },
    })
    if (!tentativa) return
    if (['pago', 'falhou', 'cancelado'].includes(tentativa.status)) return

    const pernaPor = (nome: string) => tentativa.pagamentos.find((p) => p.perna === nome)
    const aEstado = (p?: { mpStatus: string; valor: number }): EstadoPerna | undefined =>
      p ? { status: p.mpStatus, valorCentavos: p.valor } : undefined

    const proximaAcao = tentativa.proximaAcao as unknown as ProximaAcao | null

    const decisao =
      tentativa.tipo === 'dois_cartoes'
        ? avaliarTentativaDoisCartoes(tentativa.totalCentavos, aEstado(pernaPor('A')), aEstado(pernaPor('B')))
        : avaliarTentativaPixMaisCartao(
            tentativa.totalCentavos,
            aEstado(pernaPor('pix')),
            aEstado(pernaPor('restante')),
            tentativa.prazoExpiracao != null && tentativa.prazoExpiracao.getTime() < Date.now(),
          )

    if (decisao.acao === 'aguardar') {
      await persistirSubEstadoAguardando(tentativaId, tentativa.pedidoId, tentativa.tipo, pernaPor('pix'))
      return
    }

    if (decisao.acao === 'cobrar_proxima') {
      const cobrada = await cobrarProximaPerna(deps, tentativaId, tentativa.pedidoId, decisao.perna, proximaAcao)
      if (cobrada === 'aguardando_dados') {
        // pix aprovado, cliente ainda não mandou o cartão do restante — mesmo
        // sub-estado do 'aguardar' normal, só a origem da espera é diferente.
        await persistirSubEstadoAguardando(tentativaId, tentativa.pedidoId, tentativa.tipo, pernaPor('pix'))
        return
      }
      if (!cobrada) return // marcou falhou dentro de cobrarProximaPerna
      continue // perna nova persistida — reavalia com estado fresco
    }

    if (decisao.acao === 'capturar_proxima') {
      const capturada = await capturarProximaPerna(deps, tentativaId, tentativa.pedidoId, decisao.perna, pernaPor)
      if (!capturada) return // marcou falhou e reverteu dentro de capturarProximaPerna
      continue
    }

    if (decisao.acao === 'falhou') {
      await marcarFalhou(tentativaId, tentativa.pedidoId, decisao.erro)
      for (const nome of decisao.pernasParaReverter) {
        const p = pernaPor(nome)
        if (p) await reverterPernaComClaim(deps, p.id)
      }
      return
    }

    // decisao.acao === 'pago'
    await marcarPagoEDispararEfeitos(tentativa.pedidoId, tentativaId, tentativa.totalCentavos)
    return
  }

  // Nunca deveria chegar aqui (2 pernas no máximo) — anomalia real, não chuta.
  await marcarFalhou(tentativaId, undefined, 'loop_nao_convergiu')
  console.error('[checkout-multi-metodo] processarTentativa não convergiu em', MAX_ITERACOES, 'iterações:', tentativaId)
}

function subEstadoAguardando(tipo: string, pernaPix: { mpStatus: string } | undefined): string {
  if (tipo !== 'pix_mais_cartao') return 'aguardando_confirmacao'
  if (!pernaPix || classificarStatusPerna(pernaPix.mpStatus) !== 'aprovado') return 'aguardando_pix'
  return 'aguardando_pagamento_restante'
}

async function persistirSubEstadoAguardando(
  tentativaId: string,
  pedidoId: string,
  tipo: string,
  pernaPix: { mpStatus: string } | undefined,
): Promise<void> {
  const subEstado = subEstadoAguardando(tipo, pernaPix)
  await prisma.$transaction([
    prisma.tentativaMultiMetodo.update({ where: { id: tentativaId }, data: { status: subEstado } }),
    prisma.pedido.update({ where: { id: pedidoId }, data: { multiMetodoStatus: subEstado } }),
  ])
}

async function cobrarProximaPerna(
  deps: PaymentsClientDeps,
  tentativaId: string,
  pedidoId: string,
  perna: string,
  proximaAcao: ProximaAcao | null,
): Promise<boolean | 'aguardando_dados'> {
  if (!proximaAcao) {
    await marcarFalhou(tentativaId, pedidoId, `${perna}_sem_dados`)
    return false
  }

  const idempotencyKey = idempotencyKeyPerna(tentativaId, perna)
  const metadata = { pedido_id: pedidoId, loja: 'sixxis-store', tentativa_multi_metodo_id: tentativaId, perna }

  if (perna === 'pix') {
    const r = await cobrarPernaPix(deps, {
      idempotencyKey,
      externalReference: pedidoId,
      payerEmail: proximaAcao.payerEmail,
      notificationUrl: NOTIFICATION_URL,
      metadata,
      valorCentavos: proximaAcao.valorPixCentavos!,
      meliSessionId: proximaAcao.deviceId,
      payerExtra: proximaAcao.payerExtra,
      additionalInfo: proximaAcao.additionalInfo,
    })
    if (r.erro || !r.mpPaymentId) {
      await marcarFalhou(tentativaId, pedidoId, `pix_falhou: ${r.erro ?? 'sem id'}`)
      return false
    }
    const pixExpiraEm = new Date(Date.now() + 30 * 60_000) // 30min, mesma janela do QR clássico
    await prisma.$transaction([
      prisma.pagamento.create({
        data: {
          pedidoId, tentativaMultiMetodoId: tentativaId, perna, idempotencyKey,
          mpPaymentId: r.mpPaymentId, mpStatus: r.status ?? 'pending', mpStatusDetail: r.statusDetail,
          metodo: 'pix', valor: proximaAcao.valorPixCentavos!, payerEmail: proximaAcao.payerEmail,
          qrCodeBase64: r.qrCodeBase64 ?? null, qrCodeCopiaECola: r.qrCodeCopiaECola ?? null, pixExpiraEm,
        },
      }),
      prisma.tentativaMultiMetodo.update({ where: { id: tentativaId }, data: { prazoExpiracao: pixExpiraEm } }),
    ])
    return true
  }

  // 'restante' sem cartaoRestante ainda salvo: cliente não completou a etapa
  // 2 — não é falha, é estado normal de espera (não confundir com erro).
  if (perna === 'restante' && !proximaAcao.cartaoRestante) return 'aguardando_dados'

  const cartao: PernaCartao | undefined =
    perna === 'A' ? proximaAcao.cartaoA : perna === 'B' ? proximaAcao.cartaoB : proximaAcao.cartaoRestante
  if (!cartao) {
    await marcarFalhou(tentativaId, pedidoId, `${perna}_sem_dados`)
    return false
  }

  const r = await cobrarPernaCartao(deps, {
    idempotencyKey,
    externalReference: pedidoId,
    payerEmail: proximaAcao.payerEmail,
    notificationUrl: NOTIFICATION_URL,
    metadata,
    cartao,
    // 'A'/'B' (2 cartões): só autoriza — captura de verdade só depois que as
    // 2 autorizarem (ver capturarProximaPerna). 'restante': captura na hora,
    // igual o checkout de 1 método (o Pix já confirmou antes desta perna existir).
    capturarAoCriar: perna === 'restante',
    meliSessionId: proximaAcao.deviceId,
    payerExtra: proximaAcao.payerExtra,
    additionalInfo: proximaAcao.additionalInfo,
  })
  if (r.erro || !r.mpPaymentId) {
    await marcarFalhou(tentativaId, pedidoId, `${perna}_falhou: ${r.erro ?? 'sem id'}`)
    if (perna === 'B') {
      const pernaA = await prisma.pagamento.findFirst({ where: { tentativaMultiMetodoId: tentativaId, perna: 'A' } })
      if (pernaA) await reverterPernaComClaim(deps, pernaA.id)
    }
    return false
  }
  await prisma.pagamento.create({
    data: {
      pedidoId, tentativaMultiMetodoId: tentativaId, perna, idempotencyKey,
      mpPaymentId: r.mpPaymentId, mpStatus: r.status ?? 'pending', mpStatusDetail: r.statusDetail,
      metodo: 'credit_card', valor: cartao.valorCentavos, parcelas: cartao.parcelas,
      bandeira: cartao.bandeiraId, payerEmail: proximaAcao.payerEmail,
    },
  })
  return true
}

/**
 * Etapa 2 do fluxo "2 cartões": captura uma perna já autorizada. Se a
 * captura falhar (rede, ou a MP recusar) DEPOIS que as 2 já autorizaram,
 * reverte as 2 pelo status REAL de cada uma (reverterPerna decide sozinho se
 * é cancel — ainda só autorizada — ou refund — já chegou a capturar antes de
 * falhar no meio do caminho).
 */
async function capturarProximaPerna(
  deps: PaymentsClientDeps,
  tentativaId: string,
  pedidoId: string,
  perna: string,
  pernaPor: (nome: string) => { id: string; mpPaymentId: string | null } | undefined,
): Promise<boolean> {
  const alvo = pernaPor(perna)
  if (!alvo?.mpPaymentId) {
    await marcarFalhou(tentativaId, pedidoId, `${perna}_sem_mpPaymentId_para_capturar`)
    return false
  }

  const r = await capturarPernaCartao(deps, alvo.mpPaymentId)
  if (r.erro || r.status !== 'approved') {
    await marcarFalhou(tentativaId, pedidoId, `${perna}_falhou_captura: ${r.erro ?? r.status ?? 'sem status'}`)
    const outraA = pernaPor('A')
    const outraB = pernaPor('B')
    if (outraA) await reverterPernaComClaim(deps, outraA.id)
    if (outraB) await reverterPernaComClaim(deps, outraB.id)
    return false
  }

  await prisma.pagamento.update({
    where: { id: alvo.id },
    data: { mpStatus: r.status, mpStatusDetail: r.statusDetail, aprovadoEm: new Date() },
  })
  return true
}

async function marcarFalhou(tentativaId: string, pedidoId: string | undefined, erro: string): Promise<void> {
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.tentativaMultiMetodo.update({ where: { id: tentativaId }, data: { status: 'falhou', erro } }),
  ]
  if (pedidoId) {
    ops.push(prisma.pedido.update({ where: { id: pedidoId }, data: { multiMetodoStatus: 'falhou' } }))
  }
  await prisma.$transaction(ops)
}

// ─── Reversão com claim atômico (requisito 7 — nunca reverte a mesma perna 2x,
// mesmo com gatilhos concorrentes: webhook + reconciliação, por exemplo) ─────
export async function reverterPernaComClaim(deps: PaymentsClientDeps, pagamentoId: string): Promise<void> {
  const claim = await prisma.pagamento.updateMany({
    where: {
      id: pagamentoId,
      OR: [{ estornoStatus: null }, { estornoStatus: 'falhou_estorno' }],
    },
    data: { estornoStatus: 'pendente' },
  })
  if (claim.count !== 1) return // já em andamento ou já terminal — no-op

  const pagamento = await prisma.pagamento.findUniqueOrThrow({ where: { id: pagamentoId } })
  const resultado = await reverterPerna(deps, {
    mpPaymentId: pagamento.mpPaymentId,
    estornoStatus: 'pendente', // já reclamado acima — reverterPerna só usa isso pra short-circuit em terminal
    estornoTentativas: pagamento.estornoTentativas,
  })

  await prisma.pagamento.update({
    where: { id: pagamentoId },
    data: {
      estornoStatus: resultado.estornoStatus,
      estornoTentativas: resultado.estornoTentativas,
      estornoErro: resultado.estornoErro,
    },
  })

  if (resultado.precisaAlertar) {
    await dispararAlertaEstornoFalhou(pagamento.id, pagamento.pedidoId, resultado.estornoErro)
  }
}

async function dispararAlertaEstornoFalhou(pagamentoId: string, pedidoId: string, erro: string | null): Promise<void> {
  console.error(
    `[ALERTA-ALTO][checkout-multi-metodo] estorno falhou ${MAX_TENTATIVAS_ESTORNO}x — ação manual necessária. ` +
      `pagamento=${pagamentoId} pedido=${pedidoId} erro=${erro}`,
  )
  try {
    await prisma.auditLog.create({
      data: {
        actor: 'sistema',
        action: 'checkout.multi_metodo.estorno_falhou_alerta',
        target: pagamentoId,
        metadata: { pedidoId, erro, tentativas: MAX_TENTATIVAS_ESTORNO },
      },
    })
  } catch (e) {
    console.error('[checkout-multi-metodo] falha ao gravar audit log do alerta:', e)
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('[checkout-multi-metodo] ADMIN_EMAIL não configurado — alerta de estorno falhou só ficou no log/audit.')
    return
  }
  try {
    const { getResend } = await import('./email-resend')
    await getResend().emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@sixxis.com.br',
      to: adminEmail,
      subject: `🚨 Estorno falhou (${MAX_TENTATIVAS_ESTORNO}x) — ação manual necessária — pedido ${pedidoId}`,
      text:
        `O estorno/cancelamento de uma perna do checkout multi-método falhou ${MAX_TENTATIVAS_ESTORNO} vezes seguidas.\n\n` +
        `Pedido: ${pedidoId}\nPagamento (perna): ${pagamentoId}\nErro: ${erro}\n\n` +
        `Verifique manualmente no painel do Mercado Pago se algum dinheiro ficou cobrado sem o estorno confirmar.`,
    })
  } catch (e) {
    console.error('[checkout-multi-metodo] falha ao enviar e-mail de alerta:', e)
  }
}

// ─── Efeitos de "pedido pago" via multi-método — espelha o bloco genérico do
// webhook (cashback/cupom/e-mail/pontos/CAPI/GA4/taxa), mas com o TOTAL da
// tentativa (soma das pernas), não o valor de 1 pagamento só. Duplicado de
// propósito em vez de refatorar o bloco genérico do webhook: aquele já roda
// em produção pro checkout de 1 método (não pode arriscar regressão nele por
// causa desta feature nova) — mas compõe as MESMAS funções importadas
// (creditarCashback, enviarPurchaseCapi, etc.), não reimplementa a lógica. ──
async function marcarPagoEDispararEfeitos(pedidoId: string, tentativaId: string, totalCentavos: number): Promise<void> {
  const claim = await prisma.pedido.updateMany({
    where: { id: pedidoId, status: { not: 'pago' } },
    data: { status: 'pago', pagoEm: new Date(), total: totalCentavos / 100, multiMetodoStatus: null },
  })
  await prisma.tentativaMultiMetodo.update({ where: { id: tentativaId }, data: { status: 'pago' } })

  if (claim.count !== 1) return // pedido já estava pago (webhook duplicado) — nada novo a disparar

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      cliente: true,
      endereco: true,
      itens: { include: { produto: { select: { nome: true, slug: true, sku: true, variacoes: { select: { id: true, sku: true, preco: true } } } } } },
      pagamentos: { where: { tentativaMultiMetodoId: tentativaId } },
    },
  })
  if (!pedido) return

  const totalPago = totalCentavos / 100

  await auditLog({
    req: new Request(APP_URL),
    actor: 'mercado-pago',
    action: 'pedido.multi_metodo.pago',
    target: pedido.id,
    metadata: { tentativaMultiMetodoId: tentativaId, totalCentavos },
  })

  try {
    const pontos = await calcularPontos(totalPago)
    if (pontos > 0) {
      await creditarPontos(pedido.clienteId, pontos, `Compra #${pedido.id.slice(-8).toUpperCase()}`, pedido.id).catch(() => {})
    }
  } catch (e) {
    console.error('[checkout-multi-metodo] pontos:', e)
  }

  try {
    const subtotalProdutos = pedido.itens.reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0)
    await creditarCashback(pedido.clienteId, subtotalProdutos, pedido.id)
  } catch (e) {
    console.error('[checkout-multi-metodo] cashback:', e)
  }

  await registrarUsoCupom(pedido.id).catch((e) => console.error('[checkout-multi-metodo] registrar uso cupom:', (e as Error).message))

  try {
    const end = pedido.endereco
    await enviarEmailConfirmacaoPedido(pedido.cliente.email, {
      nomeCliente: pedido.cliente.nome,
      pedidoId: pedido.id,
      itens: pedido.itens.map((i) => ({
        nome: i.produto.nome, variacaoNome: i.variacaoNome, quantidade: i.quantidade, precoUnitario: Number(i.precoUnitario),
      })),
      frete: Number(pedido.frete),
      desconto: Number(pedido.desconto),
      total: totalPago,
      formaPagamento: pedido.formaPagamento,
      endereco: `${end.logradouro}, ${end.numero} — ${end.bairro}, ${end.cidade}/${end.estado}`,
    })
  } catch (e) {
    console.error('[checkout-multi-metodo] email:', e)
  }

  // Tarifa real do MP: soma o fee de TODAS as pernas (cada Pagamento guarda
  // seu próprio rawResponse.fee_details).
  try {
    let taxaTotal = 0
    let algumaTaxaConhecida = false
    for (const p of pedido.pagamentos) {
      const t = somarTaxaMp((p.rawResponse as { fee_details?: unknown } | null)?.fee_details)
      if (t != null) {
        taxaTotal += t
        algumaTaxaConhecida = true
      }
    }
    if (algumaTaxaConhecida) {
      await prisma.pedido.updateMany({ where: { id: pedido.id, mpTaxaReal: null }, data: { mpTaxaReal: taxaTotal } })
    }
  } catch (e) {
    console.error('[checkout-multi-metodo] mp-taxa:', e)
  }

  if (process.env.META_CAPI_ACCESS_TOKEN) {
    try {
      const claimCapi = await prisma.pedido.updateMany({ where: { id: pedido.id, capiPurchaseEnviadoEm: null }, data: { capiPurchaseEnviadoEm: new Date() } })
      if (claimCapi.count === 1) {
        const resultado = await enviarPurchaseCapi({
          eventId: pedido.id,
          eventTime: Math.floor(Date.now() / 1000),
          eventSourceUrl: `${APP_URL}/pedido/${pedido.id}/sucesso`,
          userData: {
            email: pedido.cliente.email, telefone: pedido.cliente.telefone, nome: pedido.cliente.nome,
            cidade: pedido.endereco.cidade, estado: pedido.endereco.estado, cep: pedido.endereco.cep,
            country: 'br', externalId: pedido.clienteId,
          },
          fbp: pedido.fbp, fbc: pedido.fbc, clientIp: pedido.clientIp, clientUserAgent: pedido.clientUserAgent,
          value: totalPago, currency: 'BRL',
          contentIds: pedido.itens.map((i) => gIdItemPedido(i)),
          contents: pedido.itens.map((i) => ({ id: gIdItemPedido(i), quantity: i.quantidade, item_price: Number(i.precoUnitario) })),
          numItems: pedido.itens.reduce((s, i) => s + i.quantidade, 0),
        })
        if (!resultado.ok) {
          await prisma.pedido.update({ where: { id: pedido.id }, data: { capiPurchaseEnviadoEm: null } }).catch(() => {})
          console.error('[checkout-multi-metodo] CAPI Purchase falhou:', resultado.error)
        }
      }
    } catch (e) {
      console.error('[checkout-multi-metodo] CAPI Purchase:', (e as Error).message)
    }
  }

  try {
    const claimGa4 = await prisma.pedido.updateMany({ where: { id: pedido.id, ga4PurchaseEnviadoEm: null }, data: { ga4PurchaseEnviadoEm: new Date() } })
    if (claimGa4.count === 1) {
      const resultadoGa4 = await enviarPurchaseGa4({
        clientId: pedido.gaClientId,
        transactionId: pedido.id,
        value: totalPago,
        currency: 'BRL',
        items: pedido.itens.map((i) => ({ item_id: gIdItemPedido(i), price: Number(i.precoUnitario), quantity: i.quantidade })),
        shipping: Number(pedido.frete),
        coupon: pedido.cupomCodigo ?? undefined,
      })
      if (!resultadoGa4.ok && !resultadoGa4.skipped) {
        await prisma.pedido.update({ where: { id: pedido.id }, data: { ga4PurchaseEnviadoEm: null } }).catch(() => {})
        console.error('[checkout-multi-metodo] GA4 Purchase falhou:', resultadoGa4.error)
      }
    }
  } catch (e) {
    console.error('[checkout-multi-metodo] GA4 Purchase:', (e as Error).message)
  }
}

// ─── Reconciliação (requisito 8) — retoma tentativas travadas (crash, webhook
// perdido) e reitenta estornos que falharam antes. Chamada no boot do server
// (instrumentation.ts, "crash: reconcilia no restart") e exposta como rota
// interna pra reagendamento periódico externo (Railway Cron Job / etc.). ────
export async function reconciliarMultiMetodo(
  deps: PaymentsClientDeps,
  corteMs = 5 * 60_000,
): Promise<{ tentativasProcessadas: number; estornosRetentados: number }> {
  const limite = new Date(Date.now() - corteMs)
  const tentativas = await prisma.tentativaMultiMetodo.findMany({
    where: {
      status: { in: ['em_andamento', 'aguardando_confirmacao', 'aguardando_pix', 'aguardando_pagamento_restante'] },
      updatedAt: { lt: limite },
    },
    include: { pagamentos: true },
  })

  for (const t of tentativas) {
    for (const p of t.pagamentos) {
      if (!p.mpPaymentId) continue
      if (!['pending', 'in_process', 'authorized'].includes(p.mpStatus)) continue
      try {
        const atual = await deps.buscarPagamento(p.mpPaymentId)
        if (atual.status && atual.status !== p.mpStatus) {
          await prisma.pagamento.update({
            where: { id: p.id },
            data: { mpStatus: atual.status, mpStatusDetail: atual.status_detail ?? null },
          })
        }
      } catch (e) {
        console.error('[checkout-multi-metodo:reconciliacao] falha ao refrescar perna', p.id, detalheDoErro(e))
      }
    }
    await processarTentativa(deps, t.id)
  }

  const estornosParaRetentar = await prisma.pagamento.findMany({
    where: { estornoStatus: 'falhou_estorno', estornoTentativas: { lt: MAX_TENTATIVAS_ESTORNO } },
  })
  for (const p of estornosParaRetentar) {
    await reverterPernaComClaim(deps, p.id)
  }

  return { tentativasProcessadas: tentativas.length, estornosRetentados: estornosParaRetentar.length }
}
