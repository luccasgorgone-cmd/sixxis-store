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

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin(req)
  if (unauthorized) return Response.json({ ok: false, erro: 'Não autorizado' }, { status: 401 })

  try {
    const sp = req.nextUrl.searchParams
    const horas = Math.max(0, Number(sp.get('horas') ?? HORAS_PADRAO) || HORAS_PADRAO)
    const ordenar = sp.get('ordenar') === 'valor' ? 'valor' : 'recencia'
    const limite = new Date(Date.now() - horas * 60 * 60 * 1000)

    const where = {
      status:       'ativo',
      valorTotal:   { gt: 0 },
      atualizadoEm: { lt: limite },
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

    return Response.json({
      ok: true,
      horas,
      ordenar,
      total: lista.length,
      valorTotalGeral,
      carrinhos: lista,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[admin/carrinhos-abandonados GET]', error)
    return Response.json({ ok: false, erro: 'Erro ao carregar carrinhos', detalhes: msg }, { status: 500 })
  }
}
