import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSegmentFilter(filtro: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (filtro.comCompras) where.pedidos = { some: {} }
  if (filtro.semCompras) where.pedidos = { none: {} }
  if (filtro.nivel) {
    const limites: Record<string, [number, number]> = {
      Cristal: [0, 999], Topázio: [1000, 2999], Safira: [3000, 7999],
      Diamante: [8000, 14999], Esmeralda: [15000, 9999999],
    }
    const [min, max] = limites[filtro.nivel] || [0, 9999999]
    where.totalGasto = { gte: min, lte: max }
  }
  if (filtro.ultimaCompraDias) {
    const data = new Date()
    data.setDate(data.getDate() - Number(filtro.ultimaCompraDias))
    where.pedidos = { some: { createdAt: { gte: data } } }
  }
  return where
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth) return auth

  const tipo   = req.nextUrl.searchParams.get('tipo')   || ''
  const status = req.nextUrl.searchParams.get('status') || ''
  const page   = Number(req.nextUrl.searchParams.get('page')  || 1)
  const limit  = Number(req.nextUrl.searchParams.get('limit') || 20)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (tipo)   where.tipo   = tipo
  if (status) where.status = status

  const [campanhas, total] = await Promise.all([
    prisma.campanha.findMany({
      where,
      include: {
        _count: { select: { destinatarios: true } },
        whatsappNumero: { select: { nome: true, numero: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campanha.count({ where }),
  ])

  const statsRaw = await prisma.campanha.groupBy({ by: ['status'], _count: { id: true } })

  return NextResponse.json({
    campanhas: campanhas.map(c => ({
      ...c,
      totalDestinatarios: c._count.destinatarios || c.totalDestinatarios,
    })),
    total,
    stats: Object.fromEntries(statsRaw.map(s => [s.status, s._count.id])),
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth) return auth

  const body = await req.json()
  const {
    tipo, nome, assunto, mensagem, agendadoPara, destinatariosIds, filtroSegmento, whatsappNumeroId,
    publicoAlvo, tituloCopy, corpoCopy, ctaTexto, ctaUrl, produtoDestaqueId, cupomId,
    canais, emailAssunto, whatsappTexto, dataAgendamento, status,
  } = body

  if (!tipo || !nome || !mensagem) {
    return NextResponse.json({ error: 'tipo, nome e mensagem são obrigatórios' }, { status: 400 })
  }

  // Buscar destinatários
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let destinatarios: any[] = []

  if (destinatariosIds?.length > 0) {
    const clientes = await prisma.cliente.findMany({
      where: { id: { in: destinatariosIds } },
      select: { id: true, nome: true, email: true, telefone: true },
    })
    destinatarios = clientes.map((c) => ({
      clienteId: c.id, nome: c.nome || 'Cliente', email: c.email || null, telefone: c.telefone || null,
    }))
  } else if (filtroSegmento) {
    const segWhere = buildSegmentFilter(filtroSegmento)
    const clientes = await prisma.cliente.findMany({
      where: segWhere,
      select: { id: true, nome: true, email: true, telefone: true },
    })
    destinatarios = clientes.map((c) => ({
      clienteId: c.id, nome: c.nome || 'Cliente', email: c.email || null, telefone: c.telefone || null,
    }))
  }

  const campanha = await prisma.campanha.create({
    data: {
      tipo: String(tipo),
      nome,
      assunto: assunto || emailAssunto || null,
      mensagem,
      agendadoPara: agendadoPara ? new Date(agendadoPara) : (dataAgendamento ? new Date(dataAgendamento) : null),
      status: status ?? (agendadoPara || dataAgendamento ? 'agendada' : 'rascunho'),
      totalDestinatarios: destinatarios.length,
      totalAlvo: destinatarios.length,
      filtroSegmento: filtroSegmento || publicoAlvo || null,
      whatsappNumeroId: whatsappNumeroId || null,
      destinatarios: { create: destinatarios },
      publicoAlvo:       publicoAlvo       ?? null,
      tituloCopy:        tituloCopy        ?? null,
      corpoCopy:         corpoCopy         ?? null,
      ctaTexto:          ctaTexto          ?? null,
      ctaUrl:            ctaUrl            ?? null,
      produtoDestaqueId: produtoDestaqueId ?? null,
      cupomId:           cupomId           ?? null,
      canais:            canais            ?? null,
      emailAssunto:      emailAssunto      ?? null,
      whatsappTexto:     whatsappTexto     ?? null,
      dataAgendamento:   dataAgendamento ? new Date(dataAgendamento) : null,
    },
    include: { _count: { select: { destinatarios: true } } },
  })

  return NextResponse.json(campanha, { status: 201 })
}
