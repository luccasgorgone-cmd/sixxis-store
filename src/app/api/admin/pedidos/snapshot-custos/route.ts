import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Backfill do snapshot de custo nos ItemPedido antigos (custoUnitario null).
//
//   POST /api/admin/pedidos/snapshot-custos
//
// Grava o `Produto.custoProduto` ATUAL. Para pedidos antigos o custo histórico
// real é desconhecido — esta é a melhor aproximação disponível, e é o motivo de
// a coluna existir daqui para frente (novas vendas congelam o custo do dia).
//
// Produtos ainda SEM custo cadastrado permanecem null: nunca gravamos zero, que
// inflaria o lucro. Por isso o botão no admin avisa para preencher os custos dos
// produtos ANTES de rodar isto.
//
// Idempotente: o filtro `custoUnitario: null` garante que reexecutar não
// sobrescreve snapshots já congelados (inclusive os de vendas novas).

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  // Um UPDATE por produto (poucos produtos), em vez de um por item.
  const produtos = await prisma.produto.findMany({
    where:  { custoProduto: { not: null } },
    select: { id: true, custoProduto: true },
  })

  let atualizados = 0
  for (const p of produtos) {
    const r = await prisma.itemPedido.updateMany({
      where: { produtoId: p.id, custoUnitario: null },
      data:  { custoUnitario: p.custoProduto },
    })
    atualizados += r.count
  }

  // O que sobrou = itens de produtos sem custo cadastrado.
  const pendentes = await prisma.itemPedido.count({ where: { custoUnitario: null } })
  const produtosSemCusto = await prisma.produto.count({ where: { custoProduto: null } })

  await auditLog({
    req: request,
    action: 'pedidos.snapshot-custos',
    target: 'itemPedido',
    metadata: { atualizados, pendentes, produtosSemCusto },
  })

  return NextResponse.json({
    ok: true,
    atualizados,
    /** Itens que seguem sem custo (o produto deles não tem custoProduto). */
    pendentes,
    /** Quantos produtos ainda precisam de custo cadastrado. */
    produtosSemCusto,
  })
}
