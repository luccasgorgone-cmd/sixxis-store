import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { montarItensCotacaoProdutos } from '@/lib/frete-resolver'
import { cotarTransportadoras } from '@/lib/cotacao-transportadoras'

// ─── Cotação POR transportadora de um PEDIDO (admin) ─────────────────────────
// POST /api/admin/pedidos/[id]/cotar-transportadoras
//
// Auth por SESSÃO (requireAdmin — cookie admin_token), NÃO a chave interna do CRM.
// SOB DEMANDA (o front só chama ao clicar "Cotar transportadoras"). Recota o
// pedido a partir dos PRODUTOS do pedido + CEP de destino do endereço e devolve
// Braspress e Melhor Envio (nome, preço, prazo, erro quando falha) + a mais
// barata. NÃO grava nada — a escolha/gravação é um passo separado (PATCH).
// Mesmo shape da rota interna, pelo mesmo helper (zero duplicação).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    select: {
      endereco: { select: { cep: true, estado: true } },
      itens: { select: { produtoId: true, quantidade: true } },
    },
  })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  const uf = pedido.endereco?.estado ?? null
  const cepDestino = (pedido.endereco?.cep ?? '').replace(/\D/g, '')
  if (cepDestino.length !== 8) {
    return NextResponse.json({
      ok: false,
      uf,
      cotacoes: [],
      maisBarata: null,
      status: 'bloqueado',
      mensagem: 'CEP de destino do pedido inválido ou ausente.',
    })
  }

  // Soma as quantidades por produto (frete é por unidade — mesma regra do checkout).
  const qtdPorProduto = new Map<string, number>()
  for (const item of pedido.itens) {
    const q = Math.max(1, Math.floor(Number(item.quantidade)) || 0)
    qtdPorProduto.set(item.produtoId, (qtdPorProduto.get(item.produtoId) ?? 0) + q)
  }
  const produtoIds = [...qtdPorProduto.keys()]

  // Resolve dimensões dos produtos (mesma fonte do checkout). Não reimplementa nada.
  const resolvido = produtoIds.length
    ? await montarItensCotacaoProdutos(produtoIds, qtdPorProduto)
    : { itens: [], valorMercadoria: 0, semDimensoes: [] as string[], naoEncontrados: [] as string[] }

  if (resolvido.semDimensoes.length > 0) {
    return NextResponse.json({
      ok: false,
      uf,
      cotacoes: [],
      maisBarata: null,
      status: 'a_combinar',
      mensagem:
        'Produtos sem peso/dimensões cadastrados — cotação automática indisponível. Preencha as dimensões do produto para cotar.',
      semDimensoes: resolvido.semDimensoes,
    })
  }

  const resposta = await cotarTransportadoras({
    uf,
    cepDestino,
    itens: resolvido.itens,
    valorMercadoria: resolvido.valorMercadoria,
  })

  return NextResponse.json(resposta)
}
