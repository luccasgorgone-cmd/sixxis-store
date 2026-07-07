import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { formatarPagamento, formatarMpStatus } from '@/lib/pedido-status'
import { feedId } from '@/lib/feed-id'
import { gerarNfPdf, type NfItem } from '@/lib/nf-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Converte "12,50" / "12.50" / "" em número (ou null).
function parseNum(v: string | null): number | null {
  if (v == null) return null
  const t = v.trim().replace(/\./g, '').replace(',', '.')
  // ↑ trata pt-BR "1.234,56"; se vier "12.50" (ponto decimal), o replace acima
  // quebraria — então tentamos o parse direto primeiro.
  const direto = Number(v.trim())
  if (v.trim() !== '' && !Number.isNaN(direto)) return direto
  const n = Number(t)
  return Number.isNaN(n) ? null : n
}

let logoCache: Uint8Array | null | undefined

async function carregarLogo(): Promise<Uint8Array | null> {
  if (logoCache !== undefined) return logoCache
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'logo-sixxis.png'))
    logoCache = new Uint8Array(buf)
  } catch {
    logoCache = null
  }
  return logoCache
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await params
  const sp = request.nextUrl.searchParams

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: { select: { nome: true, email: true, telefone: true, cpf: true } },
      endereco: true,
      itens: {
        include: {
          produto: {
            select: {
              nome: true, slug: true, sku: true,
              variacoes: { select: { id: true, sku: true, preco: true } },
            },
          },
        },
      },
      pagamentos: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  const codigo = `#${pedido.id.slice(-8).toUpperCase()}`

  // ── Documento do cliente: CPF do pagamento (payerCpf) tem prioridade, senão
  //    o CPF cadastrado. Pode ser CPF ou CNPJ — formatação decide no PDF.
  const documento =
    pedido.pagamentos.find((p) => p.payerCpf)?.payerCpf ?? pedido.cliente.cpf ?? null

  // ── SKU exibido = g:id do feed (mesma regra do merchant-feed / CAPI). ────────
  const itens: NfItem[] = pedido.itens.map((i) => {
    const v = i.variacaoId ? i.produto.variacoes.find((x) => x.id === i.variacaoId) : null
    const sku = feedId(
      { sku: i.produto.sku, slug: i.produto.slug },
      v ? { sku: v.sku, preco: v.preco } : null,
      i.produto.variacoes.map((x) => ({ sku: x.sku, preco: x.preco })),
    )
    return {
      nome: i.variacaoNome ? `${i.produto.nome} (${i.variacaoNome})` : i.produto.nome,
      sku,
      quantidade: i.quantidade,
      precoUnitario: Number(i.precoUnitario),
    }
  })

  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0)
  const desconto = Number(pedido.desconto)

  // ── "Valor do frete" vem do modal (fallback: custoFreteReal). ───────────────
  const freteModal = parseNum(sp.get('frete'))
  const valorFrete =
    freteModal != null
      ? freteModal
      : pedido.custoFreteReal != null
        ? Number(pedido.custoFreteReal)
        : null

  // ── "Frete por conta do cliente?" (toggle do modal). Default: Sim se o pedido
  //    cobrou frete. ───────────────────────────────────────────────────────────
  //  • Sim → frete entra nos TOTAIS e soma ao Total (subtotal − desconto + frete)
  //          e também aparece na Logística.
  //  • Não → NÃO entra nos totais (Total = subtotal − desconto); o valor aparece
  //          só na Logística, como custo interno não faturado.
  const freteClienteParam = sp.get('freteCliente')
  const freteCliente =
    freteClienteParam != null ? freteClienteParam === '1' : Number(pedido.frete) > 0

  const freteTotais = freteCliente ? valorFrete ?? 0 : null
  const total = Math.max(0, subtotal - desconto + (freteTotais ?? 0))

  // ── Pagamento: prioriza o aprovado; senão o mais recente. ───────────────────
  const pgAprovado =
    pedido.pagamentos.find((p) => p.mpStatus === 'approved') ?? pedido.pagamentos[0] ?? null
  const statusPg = pgAprovado
    ? `${formatarMpStatus(pgAprovado.mpStatus)}${pgAprovado.mpStatusDetail ? ` (${pgAprovado.mpStatusDetail})` : ''}`
    : pedido.status
  const aprovadoEm = pgAprovado?.aprovadoEm ?? pedido.pagoEm ?? null

  // ── Logística: valores do modal, fallback pro que está salvo. ───────────────
  const transportadora = sp.get('transportadora')?.trim() || pedido.transportadora || null
  const codigoRastreio = sp.get('rastreio')?.trim() || pedido.codigoRastreio || null
  const prazoModal = sp.get('prazo')?.trim()
  const prazo =
    prazoModal ||
    (pedido.fretePrazo ? `cerca de ${pedido.fretePrazo} dias úteis` : null)

  const logoBytes = await carregarLogo()

  const pdf = await gerarNfPdf({
    pedidoCodigo: codigo,
    emitidoEm: new Date(),
    pedidoCriadoEm: pedido.createdAt,
    cliente: {
      nome: pedido.cliente.nome,
      email: pedido.cliente.email,
      telefone: pedido.cliente.telefone,
      documento,
    },
    entrega: {
      logradouro: pedido.endereco.logradouro,
      numero: pedido.endereco.numero,
      complemento: pedido.endereco.complemento,
      bairro: pedido.endereco.bairro,
      cidade: pedido.endereco.cidade,
      estado: pedido.endereco.estado,
      cep: pedido.endereco.cep,
    },
    itens,
    subtotal,
    desconto,
    frete: freteTotais,
    total,
    cupomCodigo: pedido.cupomCodigo,
    pagamento: {
      metodo: formatarPagamento(pedido.formaPagamento),
      mpPaymentId: pgAprovado?.mpPaymentId ?? pedido.mpPaymentId ?? null,
      status: statusPg,
      aprovadoEm,
    },
    logistica: { transportadora, codigoRastreio, prazo, valorFrete, freteFaturado: freteCliente },
    logoBytes,
  })

  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="espelho-pedido-${pedido.id.slice(-8).toUpperCase()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
