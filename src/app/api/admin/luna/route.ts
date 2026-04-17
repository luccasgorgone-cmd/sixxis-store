import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CONFIG_KEYS = [
  'agente_nome', 'agente_avatar_url', 'agente_avatar_tipo', 'agente_saudacao',
  'agente_status', 'agente_cor_primaria', 'agente_cor_fundo', 'agente_modelo',
  'agente_temperatura', 'agente_max_tokens', 'agente_ativo', 'agente_delay_resposta',
  'agente_system_prompt', 'agente_horario_inicio', 'agente_horario_fim',
  'agente_msg_fora_horario', 'agente_placeholder', 'agente_whatsapp_fallback',
  'agente_cor_secundaria', 'agente_whatsapp_vendas', 'agente_whatsapp_suporte',
  'agente_followup_ativo', 'agente_followup_delay_1', 'agente_followup_mensagem_1',
  'agente_followup_delay_2', 'agente_followup_mensagem_2',
  'agente_encerramento_auto', 'agente_mensagem_encerramento',
]

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const { searchParams } = req.nextUrl
  const tipo    = searchParams.get('tipo') || 'dashboard'
  const periodo = searchParams.get('periodo') || '7d'
  const pagina  = Math.max(1, parseInt(searchParams.get('pagina') || '1'))
  const limite  = Math.min(100, Math.max(1, parseInt(searchParams.get('limite') || '20')))
  const busca   = searchParams.get('busca')?.trim() || ''
  const status  = searchParams.get('status') || ''

  const periodos: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 }
  const dias = periodos[periodo] ?? 7
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - dias)
  dataInicio.setHours(0, 0, 0, 0)

  if (tipo === 'dashboard') {
    const hojeStart = new Date()
    hojeStart.setHours(0, 0, 0, 0)
    const dezMinAtras = new Date(Date.now() - 10 * 60 * 1000)

    const [totalConversas, hoje, aoVivo, configs, stats] = await Promise.all([
      prisma.lunaConversa.count({ where: { createdAt: { gte: dataInicio } } }),
      prisma.lunaConversa.count({ where: { createdAt: { gte: hojeStart } } }),
      prisma.lunaConversa.count({
        where: { ultimaMensagem: { gte: dezMinAtras }, status: 'ativa' },
      }),
      prisma.configuracao.findMany({ where: { chave: { in: CONFIG_KEYS } } }),
      prisma.lunaConversa.aggregate({
        where: { createdAt: { gte: dataInicio } },
        _avg: { totalMensagens: true, duracaoSegundos: true },
        _count: { id: true },
      }),
    ])

    const config: Record<string, string> = {}
    configs.forEach((c) => { config[c.chave] = c.valor })

    return NextResponse.json({
      tipo: 'dashboard',
      metricas: {
        totalConversas,
        hoje,
        aoVivo,
        mediaMensagens: Math.round(stats._avg.totalMensagens || 0),
        mediaDuracaoMin: Math.round((stats._avg.duracaoSegundos || 0) / 60),
      },
      config,
    })
  }

  if (tipo === 'conversas') {
    const skip = (pagina - 1) * limite
    const where: Prisma.LunaConversaWhereInput = { createdAt: { gte: dataInicio } }
    if (status) where.status = status
    if (busca) {
      where.OR = [
        { sessaoId: { contains: busca } },
        { mensagens: { some: { conteudo: { contains: busca } } } },
      ]
    }

    const [conversas, total] = await Promise.all([
      prisma.lunaConversa.findMany({
        where, skip, take: limite,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { mensagens: true } },
          mensagens: {
            take: 1,
            where: { role: 'user' },
            orderBy: { createdAt: 'asc' },
            select: { id: true, conteudo: true, createdAt: true },
          },
        },
      }),
      prisma.lunaConversa.count({ where }),
    ])

    return NextResponse.json({
      tipo: 'conversas',
      conversas,
      total,
      paginas: Math.max(1, Math.ceil(total / limite)),
    })
  }

  if (tipo === 'conversa-detalhe') {
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 })

    const conversa = await prisma.lunaConversa.findFirst({
      where: { OR: [{ id }, { sessaoId: id }] },
      include: {
        mensagens: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ tipo: 'conversa-detalhe', conversa })
  }

  return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return unauthorized

  const body = await req.json()
  const { configuracoes } = body

  if (!Array.isArray(configuracoes)) {
    return NextResponse.json({ error: 'configuracoes deve ser array' }, { status: 400 })
  }

  const validos = configuracoes.filter(
    (c: { chave: string; valor: string }) => c?.chave && CONFIG_KEYS.includes(c.chave),
  )

  const results = await Promise.all(
    validos.map(({ chave, valor }: { chave: string; valor: string }) =>
      prisma.configuracao.upsert({
        where:  { chave },
        create: { chave, valor: String(valor ?? '') },
        update: { valor: String(valor ?? '') },
      }),
    ),
  )

  return NextResponse.json({ atualizado: results.length })
}
