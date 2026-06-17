import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

// Carrinhos abandonados POR CLIENTE CADASTRADO (Fase 4A — recuperação).
// "Abandonado" é DERIVADO aqui (sem cron): status='ativo' + valor>0 (logo itens>0)
// + atualizadoEm há mais de X horas. X é configurável via ?horas= (default 1h).
//
// NUNCA expõe custo interno / frete real — valorTotal é só o subtotal de produtos
// do carrinho; nenhum campo de custo de transportadora trafega por aqui.

const HORAS_PADRAO = 1

// Dia no fuso BRT (America/Sao_Paulo), no formato YYYY-MM-DD — mesma régua do
// resto do analytics. en-CA garante o formato ISO (ano-mês-dia).
function diaBRT(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

// Resolve o filtro de PERÍODO por data de CRIAÇÃO do carrinho ("de quando pra
// cá") — distinto do filtro de inatividade (atualizadoEm). Retorna um range
// Prisma { gte, lte? } ou null (sem filtro de período).
function resolverPeriodo(
  periodo: string | null,
  dataInicio: string | null,
  dataFim: string | null,
): { gte?: Date; lte?: Date } | null {
  const agora = Date.now()
  const dias: Record<string, number> = { '7': 7, '15': 15, '30': 30 }
  if (periodo && dias[periodo]) {
    return { gte: new Date(agora - dias[periodo] * 24 * 60 * 60 * 1000) }
  }
  if (periodo === 'custom' && (dataInicio || dataFim)) {
    const range: { gte?: Date; lte?: Date } = {}
    if (dataInicio) {
      const ini = new Date(`${dataInicio}T00:00:00`)
      if (!Number.isNaN(ini.getTime())) range.gte = ini
    }
    if (dataFim) {
      const fim = new Date(`${dataFim}T23:59:59.999`)
      if (!Number.isNaN(fim.getTime())) range.lte = fim
    }
    return Object.keys(range).length ? range : null
  }
  return null // "todos" / ausente → sem filtro de período
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return Response.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })

  try {
    const sp = req.nextUrl.searchParams
    // Honra ?horas=0 (todos os ativos com itens). Só cai no default se ausente/NaN.
    const horasRaw = Number(sp.get('horas'))
    const horas = sp.get('horas') !== null && !Number.isNaN(horasRaw) ? Math.max(0, horasRaw) : HORAS_PADRAO
    const ordenar = sp.get('ordenar') === 'valor' ? 'valor' : 'recencia'
    const limite = new Date(Date.now() - horas * 60 * 60 * 1000)

    // Filtro de PERÍODO (por criadoEm) — independente do filtro de inatividade.
    const periodo = sp.get('periodo')
    const dataInicio = sp.get('dataInicio')
    const dataFim = sp.get('dataFim')
    const periodoRange = resolverPeriodo(periodo, dataInicio, dataFim)

    const where = {
      status:       'ativo',
      valorTotal:   { gt: 0 },
      atualizadoEm: { lt: limite },
      ...(periodoRange ? { criadoEm: periodoRange } : {}),
    }

    const carrinhos = await prisma.carrinhoCliente.findMany({
      where,
      orderBy: ordenar === 'valor'
        ? { valorTotal: 'desc' }
        : { atualizadoEm: 'desc' },
      select: {
        id:           true,
        itens:        true,
        valorTotal:   true,
        etapaAtual:   true,
        atualizadoEm: true,
        criadoEm:     true,
        cliente: {
          select: { id: true, nome: true, email: true, telefone: true },
        },
      },
    })

    const lista = carrinhos.map((c) => {
      const itens = (Array.isArray(c.itens) ? c.itens : []) as Array<{ qtd?: number }>
      return {
        id:           c.id,
        clienteId:    c.cliente.id,
        nome:         c.cliente.nome,
        email:        c.cliente.email,
        telefone:     c.cliente.telefone,
        itens,
        totalItens:   itens.reduce((acc, i) => acc + (Number(i?.qtd) || 0), 0),
        valorTotal:   Number(c.valorTotal),
        etapaAtual:   c.etapaAtual,
        atualizadoEm: c.atualizadoEm,
        criadoEm:     c.criadoEm,
      }
    })

    const valorTotalGeral = lista.reduce((acc, c) => acc + c.valorTotal, 0)

    // Visão DIÁRIA — breakdown por dia (BRT) da DATA DE CRIAÇÃO do carrinho,
    // sobre o MESMO conjunto filtrado (os números batem com a lista/contagem).
    const porDiaMap = new Map<string, { count: number; valor: number }>()
    for (const c of lista) {
      const dia = diaBRT(new Date(c.criadoEm))
      const atual = porDiaMap.get(dia) ?? { count: 0, valor: 0 }
      atual.count += 1
      atual.valor += c.valorTotal
      porDiaMap.set(dia, atual)
    }
    const porDia = [...porDiaMap.entries()]
      .map(([dia, v]) => ({ dia, count: v.count, valor: v.valor }))
      .sort((a, b) => a.dia.localeCompare(b.dia))

    return Response.json({
      ok: true,
      horas,
      ordenar,
      periodo: periodo ?? '',
      dataInicio: dataInicio ?? '',
      dataFim: dataFim ?? '',
      total: lista.length,
      valorTotalGeral,
      porDia,
      carrinhos: lista,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/carrinhos-abandonados GET]', error)
    return Response.json({ ok: false, erro: 'Erro ao carregar carrinhos', detalhes: msg }, { status: 500 })
  }
}
