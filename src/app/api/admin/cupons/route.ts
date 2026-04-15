import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const busca  = req.nextUrl.searchParams.get('busca')  || ''
  const status = req.nextUrl.searchParams.get('status') || ''
  const tipo   = req.nextUrl.searchParams.get('tipo')   || ''
  const page   = Math.max(1, Number(req.nextUrl.searchParams.get('page')  || 1))
  const limit  = Math.max(1, Number(req.nextUrl.searchParams.get('limit') || 20))

  const where: Record<string, unknown> = {}
  if (busca) where.codigo = { contains: busca.toUpperCase() }
  if (status === 'ativo')    where.ativo = true
  if (status === 'inativo')  where.ativo = false
  if (status === 'expirado') { where.validade = { lt: new Date() }; where.ativo = true }
  if (tipo) where.tipo = tipo

  const [cupons, total, totalAtivos, totalInativos, totalEconomia] = await Promise.all([
    prisma.cupom.findMany({
      where,
      include: {
        _count: { select: { usos: true } },
        usos: {
          orderBy: { usadoEm: 'desc' },
          take: 3,
          include: {
            cliente: { select: { nome: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cupom.count({ where }),
    prisma.cupom.count({ where: { ativo: true } }),
    prisma.cupom.count({ where: { ativo: false } }),
    prisma.cupomUso.aggregate({ _sum: { valorDesconto: true } }),
  ])

  return NextResponse.json({
    cupons: cupons.map((c) => ({
      ...c,
      totalUsos:    c._count.usos,
      recentesUsos: c.usos,
      expirado:     c.validade ? new Date(c.validade) < new Date() : false,
      esgotado:     c.usoMaximo ? c._count.usos >= c.usoMaximo : false,
    })),
    total,
    stats: {
      totalAtivos,
      totalInativos,
      totalEconomia: Number(totalEconomia._sum.valorDesconto ?? 0),
      totalCupons:   totalAtivos + totalInativos,
    },
  })
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const body = await req.json()
  const { codigo, tipo, valor, usoMaximo, pedidoMinimo, validade, ativo, descricao, primeiraCompra } = body

  if (!codigo || !tipo || valor === undefined) {
    return NextResponse.json({ error: 'Campos obrigatórios: codigo, tipo, valor' }, { status: 400 })
  }

  const existe = await prisma.cupom.findUnique({ where: { codigo: codigo.toUpperCase() } })
  if (existe) {
    return NextResponse.json({ error: 'Já existe um cupom com este código' }, { status: 409 })
  }

  const cupom = await prisma.cupom.create({
    data: {
      codigo:         codigo.toUpperCase().trim(),
      tipo,
      valor:          Number(valor),
      usoMaximo:      usoMaximo ? Number(usoMaximo) : null,
      pedidoMinimo:   Number(pedidoMinimo || 0),
      validade:       validade ? new Date(validade) : null,
      ativo:          ativo !== false,
      descricao:      descricao || null,
      primeiraCompra: primeiraCompra || false,
    },
  })
  return NextResponse.json(cupom, { status: 201 })
}
