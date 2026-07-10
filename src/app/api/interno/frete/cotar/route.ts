import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { autorizarInterno, HEADERS_INTERNOS } from '@/lib/interno-auth'
import { rateLimit, getClientIp } from '@/lib/ratelimit'
import { cepParaUF, montarItensCotacaoProdutos } from '@/lib/frete-resolver'
import {
  cotarComCarriersDetalhado,
  algumCarrierHabilitado,
  type CotacaoDetalhada,
  type ItemCotacao,
} from '@/lib/carriers'

// ─── API INTERNA de cotação de frete (CRM) ───────────────────────────────────
// POST /api/interno/frete/cotar
//
// Mesma auth do /api/interno/produtos (header x-internal-key = STORE_INTERNAL_KEY).
// DIFERENÇA-CHAVE vs /api/frete PÚBLICO: esta é para o ATENDENTE do CRM, então
// devolve as cotações POR TRANSPORTADORA, COM NOME (Braspress + Melhor Envio) —
// não só a mais barata. Reusa 100% a resolução de dimensões (montarItensCotacao
// Produtos) e o motor de carriers (cotarComCarriersDetalhado). Zero duplicação.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Cada item é UMA das duas formas:
//  a) referência de produto (a Loja resolve as dimensões) — aceita o MESMO
//     identificador do /api/interno/produtos: produtoId (id) e também sku /
//     chaveLoja (erpProdutoId).
//  b) dimensões avulsas (CAIXA/embalagem — pós-venda do CRM).
const dimensoesSchema = z.object({
  pesoKg: z.number().positive(),
  alturaCm: z.number().positive(),
  larguraCm: z.number().positive(),
  comprimentoCm: z.number().positive(),
})

const itemCaixaSchema = z.object({
  dimensoes: dimensoesSchema,
  quantidade: z.number().int().positive(),
  // Valor declarado da mercadoria (para seguro). Opcional — pós-venda pode enviar
  // uma caixa sem valor comercial.
  valorDeclarado: z.number().nonnegative().optional(),
})

const itemProdutoSchema = z
  .object({
    sku: z.string().trim().min(1).optional(),
    produtoId: z.string().trim().min(1).optional(),
    chaveLoja: z.string().trim().min(1).optional(),
    // slug é a chave que /api/interno/produtos devolve (junto do id) — aceita
    // também para o CRM casar produto pela mesma referência que já consome.
    slug: z.string().trim().min(1).optional(),
    quantidade: z.number().int().positive(),
  })
  .refine((d) => d.sku || d.produtoId || d.chaveLoja || d.slug, {
    message: 'Informe sku, produtoId, chaveLoja ou slug',
  })

const bodySchema = z.object({
  cepDestino: z.string(),
  itens: z.array(z.union([itemCaixaSchema, itemProdutoSchema])).min(1),
})

type ItemCaixa = z.infer<typeof itemCaixaSchema>
type ItemProduto = z.infer<typeof itemProdutoSchema>

const ehCaixa = (i: ItemCaixa | ItemProduto): i is ItemCaixa =>
  'dimensoes' in i && i.dimensoes != null

function jsonInterno(data: unknown, status = 200) {
  return Response.json(data, { status, headers: HEADERS_INTERNOS })
}

export async function POST(request: NextRequest) {
  // 1. Auth máquina-a-máquina — MESMO mecanismo do /api/interno/produtos.
  if (!autorizarInterno(request)) {
    return jsonInterno({ error: 'Não autorizado' }, 401)
  }

  // 2. Rate limit básico (por IP; cai para a chave interna se sem IP).
  const ip = getClientIp(request)
  const rl = await rateLimit('interno-frete', ip !== 'unknown' ? ip : 'interno')
  if (!rl.success) {
    return jsonInterno({ error: 'Muitas requisições, tente novamente em instantes.' }, 429)
  }

  // 3. Corpo.
  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return jsonInterno({ error: 'Dados inválidos', details: parsed.error.flatten() }, 400)
  }

  const cepDestino = parsed.data.cepDestino.replace(/\D/g, '')
  if (cepDestino.length !== 8) {
    return jsonInterno({
      ok: false,
      uf: null,
      cotacoes: [],
      maisBarata: null,
      status: 'bloqueado',
      mensagem: 'CEP de destino inválido.',
    })
  }

  // 4. UF a partir do CEP (mesma fonte do /api/frete).
  const uf = await cepParaUF(cepDestino)
  if (!uf) {
    return jsonInterno({
      ok: false,
      uf: null,
      cotacoes: [],
      maisBarata: null,
      status: 'bloqueado',
      mensagem: 'CEP não encontrado.',
    })
  }

  // 5. Separa referências de produto (forma a) das caixas avulsas (forma b).
  const refsProduto: ItemProduto[] = []
  const caixas: ItemCaixa[] = []
  for (const item of parsed.data.itens) {
    if (ehCaixa(item)) caixas.push(item)
    else refsProduto.push(item)
  }

  // 6. Resolve as referências de produto → produtoId (id), aceitando também
  //    sku e chaveLoja (erpProdutoId). Mesma identificação do /api/interno/produtos.
  const idsPedidos = refsProduto.map((r) => r.produtoId).filter(Boolean) as string[]
  const skusPedidos = refsProduto.map((r) => r.sku).filter(Boolean) as string[]
  const chavesPedidas = refsProduto.map((r) => r.chaveLoja).filter(Boolean) as string[]
  const slugsPedidos = refsProduto.map((r) => r.slug).filter(Boolean) as string[]

  const encontrados = refsProduto.length
    ? await prisma.produto.findMany({
        where: {
          OR: [
            { id: { in: idsPedidos } },
            { sku: { in: skusPedidos } },
            { erpProdutoId: { in: chavesPedidas } },
            { slug: { in: slugsPedidos } },
          ],
        },
        select: { id: true, sku: true, erpProdutoId: true, slug: true },
      })
    : []

  const porId = new Map(encontrados.map((p) => [p.id, p]))
  const porSku = new Map(encontrados.filter((p) => p.sku).map((p) => [p.sku as string, p]))
  const porChave = new Map(encontrados.map((p) => [p.erpProdutoId, p]))
  const porSlug = new Map(encontrados.map((p) => [p.slug, p]))

  // Soma quantidades por produtoId resolvido; guarda os que não casaram.
  const qtdPorProduto = new Map<string, number>()
  const naoEncontrados: string[] = []
  for (const ref of refsProduto) {
    const prod =
      (ref.produtoId && porId.get(ref.produtoId)) ||
      (ref.sku && porSku.get(ref.sku)) ||
      (ref.chaveLoja && porChave.get(ref.chaveLoja)) ||
      (ref.slug && porSlug.get(ref.slug)) ||
      null
    if (!prod) {
      naoEncontrados.push(ref.produtoId ?? ref.sku ?? ref.chaveLoja ?? ref.slug ?? '?')
      continue
    }
    qtdPorProduto.set(prod.id, (qtdPorProduto.get(prod.id) ?? 0) + ref.quantidade)
  }

  if (naoEncontrados.length > 0) {
    return jsonInterno({
      ok: false,
      uf,
      cotacoes: [],
      maisBarata: null,
      status: 'bloqueado',
      mensagem: `Itens não encontrados: ${naoEncontrados.join(', ')}`,
      naoEncontrados,
    })
  }

  // 7. Monta os ItemCotacao — produtos (dimensões resolvidas pela Loja) + caixas.
  const produtoIds = [...qtdPorProduto.keys()]
  const resolvido = produtoIds.length
    ? await montarItensCotacaoProdutos(produtoIds, qtdPorProduto)
    : { itens: [] as ItemCotacao[], valorMercadoria: 0, semDimensoes: [] as string[], naoEncontrados: [] as string[] }

  if (resolvido.semDimensoes.length > 0) {
    return jsonInterno({
      ok: false,
      uf,
      cotacoes: [],
      maisBarata: null,
      status: 'a_combinar',
      mensagem: `Produtos sem peso/dimensões cadastrados: ${resolvido.semDimensoes.join(', ')}. Cotação manual.`,
      semDimensoes: resolvido.semDimensoes,
    })
  }

  const itensCaixa: ItemCotacao[] = caixas.map((c) => ({
    pesoKg: c.dimensoes.pesoKg,
    alturaCm: c.dimensoes.alturaCm,
    larguraCm: c.dimensoes.larguraCm,
    comprimentoCm: c.dimensoes.comprimentoCm,
    quantidade: c.quantidade,
  }))
  const valorCaixas = caixas.reduce((s, c) => s + (c.valorDeclarado ?? 0), 0)

  const itens = [...resolvido.itens, ...itensCaixa]
  const valorMercadoria = resolvido.valorMercadoria + valorCaixas

  if (itens.length === 0) {
    return jsonInterno({
      ok: false,
      uf,
      cotacoes: [],
      maisBarata: null,
      status: 'a_combinar',
      mensagem: 'Nenhum item cotável no carrinho.',
    })
  }

  // 8. Nenhum carrier ativo → cotação automática indisponível (não é bloqueio).
  if (!algumCarrierHabilitado()) {
    return jsonInterno({
      ok: false,
      uf,
      cotacoes: [],
      maisBarata: null,
      status: 'a_combinar',
      mensagem: 'Cotação automática indisponível — nenhuma transportadora ativa.',
    })
  }

  // 9. Cota POR transportadora (mesmo motor do checkout, sem colapsar na mais barata).
  const detalhadas = await cotarComCarriersDetalhado({
    cepOrigem: '', // adapters usam a env de origem própria
    cepDestino,
    valorMercadoria,
    itens,
  })

  // Ordena: as que cotaram primeiro (mais barata → mais cara), falhas por último.
  const cotacoes = [...detalhadas].sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? -1 : 1
    if (a.ok && b.ok) return (a.preco ?? Infinity) - (b.preco ?? Infinity)
    return 0
  })

  const oks = cotacoes.filter((c): c is CotacaoDetalhada & { preco: number } => c.ok && c.preco != null)
  const maisBarataCot = oks.length
    ? oks.reduce((a, b) => (b.preco < a.preco ? b : a))
    : null
  const maisBarata = maisBarataCot
    ? {
        transportadora: maisBarataCot.transportadora,
        preco: maisBarataCot.preco,
        prazoDias: maisBarataCot.prazoDias,
      }
    : null

  const status = maisBarata ? 'ok' : 'a_combinar'
  const mensagem = maisBarata
    ? ''
    : 'Nenhuma transportadora cotou este envio — cotação manual.'

  return jsonInterno({
    ok: Boolean(maisBarata),
    uf,
    cotacoes,
    maisBarata,
    status,
    mensagem,
  })
}
