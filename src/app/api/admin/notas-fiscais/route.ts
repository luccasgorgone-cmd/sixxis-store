import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// ─── Listagem de TODAS as NF-e emitidas (controle fiscal) ────────────────────
//
// Um pedido entra aqui assim que TENTOU emitir: basta ter nfeChave OU nfeStatus.
// Tentativas rejeitadas pela SEFAZ (status "erro", sem chave) precisam aparecer
// — são justamente as que exigem ação do admin.
//
// Só leitura. Nada aqui reprocessa nota nem fala com a Focus: as URLs de DANFE e
// XML são as que a Focus já hospeda, gravadas no momento da emissão.

/** Ambiente exibido quando a nota é anterior ao campo nfeAmbiente. */
const AMBIENTE_LEGADO = 'homologacao-legado'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const sp = request.nextUrl.searchParams
  const ambiente = sp.get('ambiente') || ''   // '' | homologacao | producao
  const status   = sp.get('status') || ''     // '' | autorizado | erro | processando | cancelado
  const limit    = Math.min(Number(sp.get('limit') ?? 200), 500)

  // Nota emitida = tem chave OU status. Um dos dois basta.
  const temNota = {
    OR: [
      { nfeChave:  { not: null } },
      { nfeStatus: { not: null } },
    ],
  }

  // nfeAmbiente null = nota anterior ao campo. Tudo até então foi homologação,
  // então o filtro "homologação" a inclui — senão ela sumiria dos dois filtros.
  const filtroAmbiente =
    ambiente === 'producao'
      ? { nfeAmbiente: 'producao' }
      : ambiente === 'homologacao'
        ? { OR: [{ nfeAmbiente: 'homologacao' }, { nfeAmbiente: null }] }
        : {}

  const pedidos = await prisma.pedido.findMany({
    where: {
      AND: [
        temNota,
        filtroAmbiente,
        status ? { nfeStatus: status } : {},
      ],
    },
    // Mais recentes primeiro. No MySQL o DESC joga NULL para o fim, então nota
    // sem data (erro/processando) cai depois das autorizadas, desempatada pela
    // data do pedido.
    orderBy: [{ dataNotaFiscal: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    select: {
      id: true,
      total: true,
      createdAt: true,
      dataNotaFiscal: true,
      nfeNumero: true,
      nfeSerie: true,
      nfeStatus: true,
      nfeAmbiente: true,
      nfeChave: true,
      nfeDanfeUrl: true,
      nfeXmlUrl: true,
      nfeMensagemErro: true,
      cliente: { select: { nome: true, cpf: true, cnpj: true, razaoSocial: true } },
    },
  })

  const notas = pedidos.map((p) => ({
    pedidoId: p.id,
    // Mesmo código curto que o admin já usa para identificar pedido.
    codigo: p.id.slice(-8).toUpperCase(),
    cliente: {
      nome: p.cliente?.razaoSocial || p.cliente?.nome || null,
      documento: p.cliente?.cnpj || p.cliente?.cpf || null,
    },
    nfeNumero: p.nfeNumero,
    nfeSerie: p.nfeSerie,
    nfeStatus: p.nfeStatus,
    nfeAmbiente: p.nfeAmbiente ?? AMBIENTE_LEGADO,
    dataNotaFiscal: p.dataNotaFiscal ? p.dataNotaFiscal.toISOString() : null,
    dataPedido: p.createdAt.toISOString(),
    nfeChave: p.nfeChave,
    nfeDanfeUrl: p.nfeDanfeUrl,
    nfeXmlUrl: p.nfeXmlUrl,
    nfeMensagemErro: p.nfeMensagemErro,
    valorTotal: Number(p.total),
  }))

  return NextResponse.json({
    notas,
    total: notas.length,
    stats: {
      autorizadas: notas.filter((n) => n.nfeStatus === 'autorizado').length,
      comErro:     notas.filter((n) => n.nfeStatus === 'erro').length,
      producao:    notas.filter((n) => n.nfeAmbiente === 'producao').length,
    },
  })
}
