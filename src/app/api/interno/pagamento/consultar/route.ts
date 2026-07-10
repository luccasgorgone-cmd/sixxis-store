import { NextRequest } from 'next/server'
import { z } from 'zod'
import { autorizarInterno, HEADERS_INTERNOS } from '@/lib/interno-auth'
import { mpPayment } from '@/lib/mercadopago'

// ─── CONSULTA de pagamento (read-only) para o CRM ────────────────────────────
// POST /api/interno/pagamento/consultar
//
// Complementa /api/interno/pagamento/criar-cobranca. O token do Mercado Pago fica
// SÓ na Loja (decisão do dono), então o CRM — ao receber o webhook do MP — não
// consegue consultar o pagamento sozinho. Esta rota expõe uma leitura: o CRM
// pergunta "esse pagamento está aprovado?" e a Loja responde com o status do MP.
//
// READ-ONLY absoluto: usa mpPayment.get() (Payment do SDK, MESMO token da Loja).
// NÃO importa @/lib/prisma, NÃO cria Pedido/Pagamento, NÃO toca estoque/cashback/
// email/CAPI. Só lê do MP e devolve.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  // id de pagamento do MP: dígitos (às vezes com hífen), curto.
  mpPaymentId: z.string().trim().regex(/^[0-9-]{1,64}$/, 'mpPaymentId inválido'),
})

function jsonInterno(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS_INTERNOS })
}

// O SDK lança um erro com `status` (ex.: 404) quando o pagamento não existe.
function statusDoErro(err: unknown): number | null {
  const s = (err as { status?: unknown })?.status
  return typeof s === 'number' ? s : null
}

export async function POST(request: NextRequest) {
  // Auth interna obrigatória — mesmo mecanismo das demais rotas /api/interno/*.
  if (!autorizarInterno(request)) {
    return jsonInterno({ error: 'Não autorizado' }, 401)
  }

  // Sem token do MP → serviço indisponível (não é erro do cliente).
  if (!mpPayment) {
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

  const { mpPaymentId } = parsed.data

  try {
    const pgto = await mpPayment.get({ id: mpPaymentId })

    return jsonInterno({
      ok: true,
      status: pgto.status ?? null,
      externalReference: pgto.external_reference ?? null,
      valor: pgto.transaction_amount ?? null,
      mpPaymentId,
    })
  } catch (err) {
    // Pagamento inexistente no MP → 404 claro.
    if (statusDoErro(err) === 404) {
      return jsonInterno({ ok: false, mensagem: 'pagamento nao encontrado' }, 404)
    }
    // Loga sem vazar segredo (só a mensagem do erro).
    console.error('[interno/consultar-pagamento] erro do Mercado Pago:', (err as Error).message)
    return jsonInterno({ ok: false, mensagem: 'falha ao consultar pagamento' }, 502)
  }
}
