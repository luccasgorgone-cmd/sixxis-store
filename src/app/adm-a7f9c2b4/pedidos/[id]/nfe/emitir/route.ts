import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { isStatusPago } from '@/lib/pedido-status'
import { ancorarMeioDiaUtc } from '@/lib/data-nf'
import {
  emitirNfe,
  consultarNfe,
  ambienteNfe,
  SELECT_PEDIDO_NFE,
  type ResultadoNfe,
} from '@/lib/focusnfe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Emissão da NF-e de um pedido — acionamento MANUAL do admin ──────────────
//
// Autenticada por SESSÃO DE ADMIN. O token da Focus NFe vive só aqui no
// servidor: a resposta devolve número/chave/URLs, NUNCA a credencial.
//
// Duas travas que não dependem da UI:
//  1. Pagamento confirmado. O botão já fica desabilitado, mas a checagem é
//     refeita aqui — a UI é conveniência, não autorização.
//  2. Idempotência: pedido com nota JÁ AUTORIZADA não reemite. Reemitir criaria
//     uma segunda NF-e válida para a mesma venda, que só se desfaz com
//     cancelamento na SEFAZ. Devolve a nota existente e pronto.

/** Dia de HOJE em São Paulo, ancorado ao meio-dia UTC (ver src/lib/data-nf.ts). */
function dataAutorizacaoHoje(): Date | null {
  const dia = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  return ancorarMeioDiaUtc(dia)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const ambiente = ambienteNfe()

  const pedido = await prisma.pedido.findUnique({ where: { id }, select: SELECT_PEDIDO_NFE })
  if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  // (1) Sem pagamento confirmado, não há venda para documentar.
  if (!isStatusPago(pedido.status)) {
    return NextResponse.json(
      { error: 'A NF-e só pode ser emitida depois da confirmação do pagamento.' },
      { status: 400 },
    )
  }

  // (2) Já autorizada: devolve a que existe, sem falar com a Focus.
  if (pedido.nfeChave && pedido.nfeStatus === 'autorizado') {
    return NextResponse.json({
      ok: true,
      jaEmitida: true,
      ambiente,
      nfe: {
        status: pedido.nfeStatus,
        chave: pedido.nfeChave,
        numero: pedido.nfeNumero,
        serie: pedido.nfeSerie,
        danfeUrl: pedido.nfeDanfeUrl,
        xmlUrl: pedido.nfeXmlUrl,
        erro: null,
      },
    })
  }

  // Nota que ficou "processando" numa tentativa anterior: consultar, não
  // reemitir — o POST já foi aceito pela Focus com esta mesma referência.
  const r: ResultadoNfe =
    pedido.nfeStatus === 'processando'
      ? await consultarNfe(pedido.nfeRef ?? pedido.id)
      : await emitirNfe(pedido)

  // Persistência. Só a AUTORIZAÇÃO carimba `dataNotaFiscal` — é ela que faz a
  // garantia contar no CRM, e a data válida é a do documento que a SEFAZ aceitou.
  const dataNf = r.status === 'autorizado' ? dataAutorizacaoHoje() : null

  await prisma.pedido.update({
    where: { id },
    data: {
      nfeRef: pedido.id,
      nfeStatus: r.status,
      nfeChave: r.chave,
      nfeNumero: r.numero,
      nfeSerie: r.serie,
      nfeDanfeUrl: r.danfeUrl,
      nfeXmlUrl: r.xmlUrl,
      // Erro anterior some quando a emissão dá certo.
      nfeMensagemErro: r.erro,
      ...(dataNf ? { dataNotaFiscal: dataNf } : {}),
    },
  })

  return NextResponse.json(
    {
      ok: r.status === 'autorizado',
      ambiente,
      nfe: r,
      dataNotaFiscal: dataNf ? dataNf.toISOString() : undefined,
    },
    // Rejeição da SEFAZ não é erro de servidor: 200 com o motivo, para a UI
    // mostrar a mensagem e oferecer "Tentar de novo".
    { status: 200 },
  )
}
