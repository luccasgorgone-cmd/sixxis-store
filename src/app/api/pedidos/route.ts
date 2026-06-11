import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { criarGarantiasPedido } from '@/lib/garantia'
import { resolverFrete } from '@/lib/frete-resolver'
import { resgatarCashback } from '@/lib/cashback'
import { avaliarCupom } from '@/lib/cupom'

const itemSchema = z.object({
  produtoId:    z.string(),
  quantidade:   z.number().int().positive(),
  variacaoId:   z.string().optional(),
  variacaoNome: z.string().optional(),
})

const garantiaSchema = z.object({
  produtoId: z.string(),
  mesesAdicionais: z.union([z.literal(12), z.literal(24)]),
  valorPago: z.number().nonnegative(),
})

const criarPedidoSchema = z.object({
  enderecoId:     z.string(),
  formaPagamento: z.string(),
  frete:          z.number().nonnegative(),
  // Modalidade escolhida pelo cliente. O preço/prazo é sempre re-resolvido no
  // servidor a partir da UF do endereço (fonte única) — o frete do client é só
  // referência. 'a_combinar' nunca é aceito do client: é o servidor que decide.
  freteTipo:      z.enum(['normal', 'expresso']).optional(),
  itens:          z.array(itemSchema).min(1),
  cupomCodigo:    z.string().optional(),
  desconto:       z.number().nonnegative().optional(),
  garantias:      z.array(garantiaSchema).optional(),
  // Cashback que o cliente quer resgatar. É só um PEDIDO: o servidor cap a
  // min(saldo disponível, 10% do subtotal de produtos). Nunca confiar no client.
  cashbackUsar:   z.number().nonnegative().optional(),
  // Idempotência: 1 key por tentativa de checkout. Repetir a key retorna o mesmo
  // pedido (não cria duplicado).
  idempotencyKey: z.string().min(8).max(100).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // ⚠️ SELECT explícito — NUNCA inclui custoFreteReal (custo interno da
  // transportadora). Este payload vai para o cliente.
  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: session.user.id },
    select: {
      id: true,
      status: true,
      total: true,
      frete: true,
      desconto: true,
      freteTipo: true,
      fretePrazo: true,
      formaPagamento: true,
      cupomCodigo: true,
      codigoRastreio: true,
      transportadora: true,
      linkRastreio: true,
      enviadoEm: true,
      entregueEm: true,
      createdAt: true,
      pagoEm: true,
      itens: {
        include: { produto: { select: { nome: true, imagens: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ pedidos })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = criarPedidoSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  // desconto do client é IGNORADO — recomputado no servidor a partir do cupom.
  const { enderecoId, formaPagamento, freteTipo, itens, cupomCodigo, garantias, cashbackUsar, idempotencyKey } = parsed.data

  // ── Idempotência: cliques repetidos com a MESMA key retornam o mesmo pedido ──
  // (não cria pedido/cobrança duplicado). Checagem antecipada; a condição de
  // corrida é coberta pelo índice @unique + catch P2002 na criação abaixo.
  if (idempotencyKey) {
    const jaCriado = await prisma.pedido.findFirst({
      where:  { clienteId: session.user.id, idempotencyKey },
      select: { id: true, status: true, total: true, cashbackUsado: true },
    })
    if (jaCriado) {
      return Response.json(
        {
          pedido: jaCriado,
          freteStatus: jaCriado.status === 'aguardando_frete' ? 'a_combinar' : 'ok',
          cashbackAplicado: Number(jaCriado.cashbackUsado),
          idempotente: true,
        },
        { status: 200 },
      )
    }
  }

  // Endereço deve pertencer ao cliente — e dele extraímos a UF de destino.
  const endereco = await prisma.endereco.findUnique({
    where: { id: enderecoId },
    select: { clienteId: true, estado: true },
  })
  if (!endereco || endereco.clienteId !== session.user.id) {
    return Response.json({ error: 'Endereço inválido' }, { status: 400 })
  }

  // Buscar produtos e variações para calcular preços
  const produtoIds = [...new Set(itens.map((i) => i.produtoId))]
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
    include: { variacoes: true },
  })

  const produtoMap = new Map(produtos.map((p) => [p.id, p]))

  let subtotal = 0
  const itensPedido: {
    produtoId:    string
    quantidade:   number
    precoUnitario: number
    variacaoId?:  string
    variacaoNome?: string
  }[] = []

  for (const item of itens) {
    const produto = produtoMap.get(item.produtoId)
    if (!produto || !produto.ativo) {
      return Response.json({ error: `Produto ${item.produtoId} não encontrado` }, { status: 400 })
    }

    let precoUnitario = Number(produto.precoPromocional ?? produto.preco)

    if (item.variacaoId) {
      const variacao = produto.variacoes.find((v) => v.id === item.variacaoId)
      if (!variacao || !variacao.ativo) {
        return Response.json({ error: `Variação ${item.variacaoId} não encontrada` }, { status: 400 })
      }
      if (variacao.preco != null) {
        precoUnitario = Number(variacao.preco)
      }
    }

    subtotal += precoUnitario * item.quantidade
    itensPedido.push({
      produtoId:    item.produtoId,
      quantidade:   item.quantidade,
      precoUnitario,
      variacaoId:   item.variacaoId,
      variacaoNome: item.variacaoNome,
    })
  }

  // ── Barreira final do cupom (server-side, autoritativa) ────────────────────
  // Revalida o cupom (inclui a regra de 1ª compra) e RECOMPUTA o desconto sobre
  // o subtotal. Se a regra falhar, zera o desconto e NÃO grava o cupom — assim
  // nem o desconto nem o registro de uso acontecem para um cupom indevido.
  let descontoFinal = 0
  let cupomCodigoFinal: string | null = null
  if (cupomCodigo) {
    const cupom = await prisma.cupom.findUnique({ where: { codigo: cupomCodigo.toUpperCase().trim() } })
    const avaliacao = await avaliarCupom(cupom, subtotal, session.user.id)
    if (avaliacao.valido && cupom) {
      descontoFinal = avaliacao.desconto ?? 0
      cupomCodigoFinal = cupom.codigo
    }
  }

  // Validar e calcular custo das garantias contratadas (se houver)
  const garantiasItens = garantias ?? []
  let totalGarantias = 0
  if (garantiasItens.length > 0) {
    const garantiaProdutos = await prisma.produto.findMany({
      where: { id: { in: garantiasItens.map((g) => g.produtoId) } },
      select: {
        id: true,
        garantiaEstendida12Preco: true,
        garantiaEstendida24Preco: true,
      },
    })
    const garantiaPorId = new Map(garantiaProdutos.map((p) => [p.id, p]))
    for (const g of garantiasItens) {
      const p = garantiaPorId.get(g.produtoId)
      const precoOferecido = g.mesesAdicionais === 12
        ? p?.garantiaEstendida12Preco
        : p?.garantiaEstendida24Preco
      if (!p || precoOferecido == null) {
        return Response.json(
          { error: `Garantia +${g.mesesAdicionais}m não disponível para o produto ${g.produtoId}` },
          { status: 400 },
        )
      }
      // Confiar no servidor — sobrescreve qualquer valor que tenha vindo do client.
      g.valorPago = Number(precoOferecido)
      totalGarantias += g.valorPago
    }
  }

  // ── Resolver frete no servidor (fonte única: tabela produto × UF) ──────────
  // O cliente não controla preço nem status: tudo deriva da UF + tabela.
  const resultadoFrete = await resolverFrete(
    itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
    endereco.estado,
  )

  if (resultadoFrete.status === 'bloqueado') {
    return Response.json(
      { error: resultadoFrete.mensagem || 'Não entregamos nesse estado.', freteStatus: 'bloqueado' },
      { status: 400 },
    )
  }

  let freteValor = 0
  let freteTipoFinal: string
  let fretePrazoFinal: number | null = null
  let statusPedido: string

  if (resultadoFrete.status === 'a_combinar') {
    // Vira orçamento: sem pagamento, frete a cotar manualmente.
    freteTipoFinal = 'a_combinar'
    statusPedido = 'aguardando_frete'
  } else {
    // status 'ok' — escolhe a modalidade pedida pelo client (ou a 1ª disponível).
    const escolhida =
      resultadoFrete.opcoes.find((o) => o.id === freteTipo) ?? resultadoFrete.opcoes[0]
    freteValor = escolhida.preco
    freteTipoFinal = escolhida.id
    fretePrazoFinal = escolhida.prazoDiasMax
    statusPedido = 'pendente'
  }

  let pedido
  try {
    pedido = await prisma.pedido.create({
      data: {
        clienteId:      session.user.id,
        enderecoId,
        formaPagamento,
        frete:          freteValor,
        freteTipo:      freteTipoFinal,
        fretePrazo:     fretePrazoFinal,
        desconto:       descontoFinal,
        cupomCodigo:    cupomCodigoFinal,
        total:          Math.max(0, subtotal + freteValor + totalGarantias - descontoFinal),
        status:         statusPedido,
        idempotencyKey: idempotencyKey ?? null,
        itens: {
          create: itensPedido.map((item) => ({
            produtoId:    item.produtoId,
            quantidade:   item.quantidade,
            precoUnitario: item.precoUnitario,
            variacaoId:   item.variacaoId ?? null,
            variacaoNome: item.variacaoNome ?? null,
          })),
        },
      },
    })
  } catch (e) {
    // Corrida: 2ª requisição com a mesma key chega após a 1ª criar → @unique
    // dispara P2002. Retorna o pedido já criado, sem duplicar nem debitar de novo.
    if ((e as { code?: string }).code === 'P2002' && idempotencyKey) {
      const jaCriado = await prisma.pedido.findFirst({
        where:  { clienteId: session.user.id, idempotencyKey },
        select: { id: true, status: true, total: true, cashbackUsado: true },
      })
      if (jaCriado) {
        return Response.json(
          {
            pedido: jaCriado,
            freteStatus: jaCriado.status === 'aguardando_frete' ? 'a_combinar' : 'ok',
            cashbackAplicado: Number(jaCriado.cashbackUsado),
            idempotente: true,
          },
          { status: 200 },
        )
      }
    }
    throw e
  }

  // Abater estoque das variações ou do produto pai
  for (const item of itensPedido) {
    if (item.variacaoId) {
      await prisma.variacaoProduto.update({
        where: { id: item.variacaoId },
        data: { estoque: { decrement: item.quantidade } },
      })
      // Recomputar estoque do produto pai como soma das variações
      const variacoes = await prisma.variacaoProduto.findMany({
        where: { produtoId: item.produtoId },
        select: { estoque: true },
      })
      const totalEstoque = variacoes.reduce((s, v) => s + Math.max(0, v.estoque), 0)
      await prisma.produto.update({
        where: { id: item.produtoId },
        data: { estoque: totalEstoque },
      })
    } else {
      await prisma.produto.update({
        where: { id: item.produtoId },
        data: { estoque: { decrement: item.quantidade } },
      })
    }
  }

  // Criar garantias estendidas vinculadas ao pedido
  if (garantiasItens.length > 0) {
    await criarGarantiasPedido(
      pedido.id,
      pedido.createdAt,
      garantiasItens.map((g) => ({
        produtoId: g.produtoId,
        mesesAdicionais: g.mesesAdicionais as 12 | 24,
        valorPago: g.valorPago,
      })),
    )
  }

  // ── Resgate de cashback (server-side, com teto de 10% do subtotal) ─────────
  // Só em pedido real (não em orçamento 'aguardando_frete'). O valor é capado
  // em min(solicitado, saldo disponível, 10% do subtotal de produtos) e abatido
  // do total. Idempotente por natureza (roda 1x na criação do pedido).
  let cashbackAplicado = 0
  if (statusPedido === 'pendente' && cashbackUsar && cashbackUsar > 0) {
    cashbackAplicado = await resgatarCashback(session.user.id, cashbackUsar, subtotal, pedido.id)
    if (cashbackAplicado > 0) {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data:  { cashbackUsado: cashbackAplicado, total: { decrement: cashbackAplicado } },
      })
    }
  }

  // ── Carrinho do cliente vira "convertido" (Fase 4A) ────────────────────────
  // Concluiu a compra → o carrinho persistido não conta mais como abandonado.
  // updateMany não lança se o cliente não tiver um CarrinhoCliente. Best-effort:
  // nunca quebra a criação do pedido.
  try {
    await prisma.carrinhoCliente.updateMany({
      where: { clienteId: session.user.id },
      data:  { status: 'convertido' },
    })
  } catch (e) {
    console.error('[pedidos] falha ao marcar carrinho convertido:', e)
  }

  return Response.json(
    {
      pedido: { ...pedido, cashbackUsado: cashbackAplicado, total: Number(pedido.total) - cashbackAplicado },
      freteStatus: resultadoFrete.status,
      cashbackAplicado,
    },
    { status: 201 },
  )
}
