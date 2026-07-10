import { NextRequest } from 'next/server'
import { z } from 'zod'
import { autorizarInterno, HEADERS_INTERNOS } from '@/lib/interno-auth'
import { mpPreference, MP_ENV } from '@/lib/mercadopago'

// ─── LINK DE PAGAMENTO (Checkout Pro) para o CRM ─────────────────────────────
// POST /api/interno/pagamento/criar-cobranca
//
// Gera uma PREFERÊNCIA do Mercado Pago (Checkout Pro / link) para o CRM cobrar
// peças de assistência, e devolve o init_point. É STATELESS do lado da Loja:
//
//   • NÃO cria Pedido nem Pagamento (o Pagamento da Loja é atrelado a Pedido).
//   • NÃO toca estoque, cashback, e-mail de compra nem CAPI/conversão.
//   • Usa mpPreference.create() (Preference), NÃO mpPayment.create() — o checkout
//     da Loja (Checkout Transparente) continua sendo o único que cria venda.
//
// O external_reference sai com PREFIXO "crm-" e a notificação aponta pro webhook
// DO CRM — o webhook da Loja (que só processa Pagamento+Pedido por mpPaymentId)
// nunca casa com essas cobranças. O registro do pagamento vive no CRM.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// external_reference simples (ex.: "PED-000123"): letras/dígitos/._- , curto.
const referenciaRegex = /^[A-Za-z0-9._-]{1,64}$/

const bodySchema = z.object({
  referencia: z.string().trim().regex(referenciaRegex, 'referência inválida'),
  descricao: z.string().trim().min(1).max(256),
  // > 0 e 2 casas decimais (totalFinal do orçamento).
  valor: z
    .number()
    .positive()
    .finite()
    .transform((v) => Math.round(v * 100) / 100)
    .refine((v) => v > 0, 'valor deve ser maior que zero'),
  // URL ABSOLUTA https do webhook DO CRM.
  notificationUrl: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), 'notificationUrl deve ser https'),
  pagador: z
    .object({
      nome: z.string().trim().min(1).max(120).optional(),
      email: z.string().trim().email().optional(),
    })
    .optional(),
})

function jsonInterno(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS_INTERNOS })
}

export async function POST(request: NextRequest) {
  // Auth interna obrigatória — mesmo mecanismo das demais rotas /api/interno/*.
  if (!autorizarInterno(request)) {
    return jsonInterno({ error: 'Não autorizado' }, 401)
  }

  // Sem token do MP → serviço indisponível (não é erro do cliente).
  if (!mpPreference) {
    return jsonInterno({ ok: false, mensagem: 'pagamento indisponivel' }, 503)
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return jsonInterno(
      { ok: false, mensagem: 'Dados inválidos', details: parsed.error.flatten() },
      400,
    )
  }

  const { referencia, descricao, valor, notificationUrl, pagador } = parsed.data
  const externalReference = `crm-${referencia}`

  // URL neutra de retorno visual (sem efeito contábil). Só se houver site URL.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  const backUrls = siteUrl ? { success: siteUrl, pending: siteUrl, failure: siteUrl } : undefined

  try {
    const pref = await mpPreference.create({
      body: {
        items: [
          {
            id: externalReference,
            title: descricao,
            quantity: 1,
            unit_price: valor,
            currency_id: 'BRL',
          },
        ],
        external_reference: externalReference,
        notification_url: notificationUrl,
        payer: pagador?.email ? { name: pagador.nome, email: pagador.email } : undefined,
        metadata: { origem: 'crm-assistencia', referencia },
        ...(backUrls ? { back_urls: backUrls } : {}),
      },
    })

    // Em produção usa init_point; em sandbox prefere sandbox_init_point.
    const initPoint =
      MP_ENV === 'production'
        ? pref.init_point
        : pref.sandbox_init_point ?? pref.init_point

    if (!pref.id || !initPoint) {
      console.error('[interno/criar-cobranca] preferência sem id/init_point')
      return jsonInterno({ ok: false, mensagem: 'falha ao gerar link de pagamento' }, 502)
    }

    return jsonInterno({
      ok: true,
      preferenceId: pref.id,
      initPoint,
      externalReference,
    })
  } catch (err) {
    // Loga sem vazar segredo (só a mensagem do erro).
    console.error('[interno/criar-cobranca] erro do Mercado Pago:', (err as Error).message)
    return jsonInterno({ ok: false, mensagem: 'falha ao gerar link de pagamento' }, 502)
  }
}
