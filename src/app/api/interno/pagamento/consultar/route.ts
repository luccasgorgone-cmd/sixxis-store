import { NextRequest } from 'next/server'
import { z } from 'zod'
import { autorizarInterno, HEADERS_INTERNOS } from '@/lib/interno-auth'
import { mpPayment } from '@/lib/mercadopago'

// ─── CONSULTA de pagamento (read-only) para o CRM ────────────────────────────
// POST /api/interno/pagamento/consultar
//
// Complementa /api/interno/pagamento/criar-cobranca. O token do Mercado Pago fica
// SÓ na Loja (decisão do dono), então o CRM — ao receber o webhook do MP, OU ao
// clicar "Verificar pagamento" quando o webhook não chegou — pergunta à Loja e a
// Loja responde com o status do MP.
//
// Dois modos (retrocompatível):
//   • { mpPaymentId }        → mpPayment.get()    (consulta direta por id)
//   • { externalReference }  → mpPayment.search() (acha o pagamento pela
//                              referência "crm-PED123" quando o CRM não tem o id)
//
// READ-ONLY absoluto: usa só Payment.get()/Payment.search() (MESMO token da Loja).
// NÃO importa @/lib/prisma, NÃO cria Pedido/Pagamento, NÃO toca estoque/cashback/
// email/CAPI. Só lê do MP e devolve.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z
  .object({
    // id de pagamento do MP: dígitos (às vezes com hífen), curto.
    mpPaymentId: z.string().trim().regex(/^[0-9-]{1,64}$/, 'mpPaymentId inválido').optional(),
    // external_reference gerado pela criar-cobranca (ex.: "crm-PED123").
    externalReference: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9._-]{1,128}$/, 'externalReference inválido')
      .optional(),
  })
  .refine((d) => d.mpPaymentId || d.externalReference, {
    message: 'informe mpPaymentId ou externalReference',
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

  const { mpPaymentId, externalReference } = parsed.data

  // ── Modo 1: por id (intacto, retrocompatível) ────────────────────────────────
  // Prioridade quando ambos vierem — mantém o comportamento antigo.
  if (mpPaymentId) {
    try {
      const pgto = await mpPayment.get({ id: mpPaymentId })
      return jsonInterno({
        ok: true,
        encontrado: true,
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
      console.error('[interno/consultar-pagamento] erro do Mercado Pago (get):', (err as Error).message)
      return jsonInterno({ ok: false, mensagem: 'falha ao consultar pagamento' }, 502)
    }
  }

  // ── Modo 2: por external_reference (busca) ───────────────────────────────────
  // ISOLAMENTO CONTÁBIL na leitura: só cobranças do CRM (prefixo "crm-"). Uma
  // referência sem o prefixo é de venda da Loja — NUNCA é buscada nem retornada.
  const ref = externalReference as string
  if (!ref.startsWith('crm-')) {
    return jsonInterno({ ok: true, encontrado: false, status: null })
  }

  try {
    // Busca ordenada do mais recente para o mais antigo; entre os retornados,
    // prioriza o approved; senão, o mais recente.
    const busca = await mpPayment.search({
      options: { external_reference: ref, sort: 'date_created', criteria: 'desc' },
    })
    // Defesa em profundidade: só resultados com external_reference "crm-*".
    const results = (busca.results ?? []).filter((r) => (r.external_reference ?? '').startsWith('crm-'))
    if (results.length === 0) {
      return jsonInterno({ ok: true, encontrado: false, status: null })
    }
    const escolhido = results.find((r) => r.status === 'approved') ?? results[0]
    return jsonInterno({
      ok: true,
      encontrado: true,
      status: escolhido.status ?? null,
      externalReference: escolhido.external_reference ?? ref,
      valor: escolhido.transaction_amount ?? null,
      mpPaymentId: escolhido.id ?? null,
    })
  } catch (err) {
    // Busca falhou → degrada para "não encontrado" (nunca 500). Logado sem segredo.
    console.error('[interno/consultar-pagamento] erro do Mercado Pago (search):', (err as Error).message)
    return jsonInterno({ ok: true, encontrado: false, status: null })
  }
}
