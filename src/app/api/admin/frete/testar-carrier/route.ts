import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { diagnosticarBraspress } from '@/lib/carriers/braspress'

export const dynamic = 'force-dynamic'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

// Diagnóstico de cotação (SÓ leitura, requireAdmin). Não grava nada.
//
// GET /api/admin/frete/testar-carrier?produtoId=<id>&cepDestino=<cep>&carrier=braspress
//
// Retorno JSON sempre:
//   { ok, produto:{id,nome,sku,pesoKg,alturaCm,larguraCm,comprimentoCm,volumes},
//     payloadEnviado:{cepOrigem,cepDestino,peso,volumes,cubagem,vlrMercadoria},
//     resultado:{preco,prazoDias}|null, erro:{status,mensagem}|null }
export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { searchParams } = request.nextUrl
  const produtoId = (searchParams.get('produtoId') ?? '').trim()
  const cepDestino = (searchParams.get('cepDestino') ?? '').replace(/\D/g, '')
  const carrier = (searchParams.get('carrier') ?? 'braspress').toLowerCase()

  if (!produtoId) {
    return NextResponse.json(
      { ok: false, produto: null, payloadEnviado: null, resultado: null, erro: { status: 400, mensagem: 'Informe produtoId' } },
      { status: 400, headers: NO_CACHE },
    )
  }

  // MESMA query que /api/frete e /api/produtos usam: findUnique no model Produto
  // pelo id, sem filtro de ativo/deletedAt — só existe/não existe.
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: {
      id: true, nome: true, sku: true,
      preco: true, precoPromocional: true,
      pesoKg: true, alturaCm: true, larguraCm: true, comprimentoCm: true, volumes: true,
    },
  })

  if (!produto) {
    return NextResponse.json(
      { ok: false, produto: null, payloadEnviado: null, resultado: null, erro: { status: 404, mensagem: 'Produto não encontrado' } },
      { status: 404, headers: NO_CACHE },
    )
  }

  const produtoOut = {
    id: produto.id,
    nome: produto.nome,
    sku: produto.sku,
    pesoKg: produto.pesoKg != null ? Number(produto.pesoKg) : null,
    alturaCm: produto.alturaCm != null ? Number(produto.alturaCm) : null,
    larguraCm: produto.larguraCm != null ? Number(produto.larguraCm) : null,
    comprimentoCm: produto.comprimentoCm != null ? Number(produto.comprimentoCm) : null,
    volumes: produto.volumes != null ? Number(produto.volumes) : null,
  }

  if (carrier !== 'braspress') {
    return NextResponse.json(
      { ok: false, produto: produtoOut, payloadEnviado: null, resultado: null, erro: { status: 400, mensagem: `Carrier não suportado: ${carrier}` } },
      { status: 400, headers: NO_CACHE },
    )
  }

  if (cepDestino.length !== 8) {
    return NextResponse.json(
      { ok: false, produto: produtoOut, payloadEnviado: null, resultado: null, erro: { status: 400, mensagem: 'cepDestino inválido (8 dígitos)' } },
      { status: 400, headers: NO_CACHE },
    )
  }

  // Sem peso/dimensões completas não dá para cotar.
  const faltando = (['pesoKg', 'alturaCm', 'larguraCm', 'comprimentoCm'] as const).filter(
    (k) => !produtoOut[k] || Number(produtoOut[k]) <= 0,
  )
  if (faltando.length) {
    return NextResponse.json(
      {
        ok: false,
        produto: produtoOut,
        payloadEnviado: null,
        resultado: null,
        erro: { status: 422, mensagem: `Produto sem medidas: ${faltando.join(', ')}` },
      },
      { status: 200, headers: NO_CACHE },
    )
  }

  const valorMercadoria = Number(produto.precoPromocional ?? produto.preco)

  const diag = await diagnosticarBraspress({
    cepOrigem: '', // adapter usa BRASPRESS_CEP_ORIGEM da env
    cepDestino,
    valorMercadoria,
    itens: [
      {
        pesoKg: produtoOut.pesoKg!,
        alturaCm: produtoOut.alturaCm!,
        larguraCm: produtoOut.larguraCm!,
        comprimentoCm: produtoOut.comprimentoCm!,
        quantidade: 1,
      },
    ],
  })

  return NextResponse.json(
    {
      ok: diag.resultado != null,
      produto: produtoOut,
      payloadEnviado: diag.payload,
      resultado: diag.resultado,
      erro: diag.erro,
    },
    { headers: NO_CACHE },
  )
}
