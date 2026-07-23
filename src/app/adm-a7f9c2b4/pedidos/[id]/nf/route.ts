import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { formatarPagamento, formatarMpStatus, getStatusInfo } from '@/lib/pedido-status'
import { feedId } from '@/lib/feed-id'
import { obterConfig } from '@/lib/fidelidade'
import { gerarNfPdf, type NfItem, type NfPagamento, type NfTentativa } from '@/lib/nf-pdf'

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

let logoLocalCache: Uint8Array | null | undefined

// Logo padrão bundlada (texto branco) — fallback quando não há logo dedicada.
async function carregarLogoLocal(): Promise<Uint8Array | null> {
  if (logoLocalCache !== undefined) return logoLocalCache
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'logo-sixxis.png'))
    logoLocalCache = new Uint8Array(buf)
  } catch {
    logoLocalCache = null
  }
  return logoLocalCache
}

// Logo da NF: prioriza a dedicada (config nf_logo_url, texto escuro p/ fundo
// claro), buscada do R2. Fallback SEMPRE para a logo local — nunca quebra.
async function carregarLogoNf(): Promise<Uint8Array | null> {
  try {
    const url = await obterConfig('nf_logo_url', '')
    if (url) {
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) {
        const buf = await res.arrayBuffer()
        if (buf.byteLength > 0) return new Uint8Array(buf)
      }
    }
  } catch (e) {
    console.error('[nf] logo dedicada falhou, usando fallback:', (e as Error).message)
  }
  return carregarLogoLocal()
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

  // ── Pagamento: prioriza o aprovado; senão o mais recente. Valor é Int (cents).
  const pgAprovado =
    pedido.pagamentos.find((p) => p.mpStatus === 'approved') ?? pedido.pagamentos[0] ?? null
  const pagamento: NfPagamento = {
    metodo: formatarPagamento(pgAprovado?.metodo ?? pedido.formaPagamento),
    bandeira: pgAprovado?.bandeira ?? null,
    ultimosDigitos: pgAprovado?.ultimosDigitos ?? null,
    parcelas: pgAprovado?.parcelas ?? null,
    valor: pgAprovado ? pgAprovado.valor / 100 : null,
    status: pgAprovado ? formatarMpStatus(pgAprovado.mpStatus) : getStatusInfo(pedido.status).label,
    statusDetalhe: pgAprovado?.mpStatusDetail ?? null,
    aprovadoEm: pgAprovado?.aprovadoEm ?? pedido.pagoEm ?? null,
    mpPaymentId: pgAprovado?.mpPaymentId ?? pedido.mpPaymentId ?? null,
    mpPreferenceId: pgAprovado?.mpPreferenceId ?? null,
    payerNome: pgAprovado?.payerNome ?? null,
    payerEmail: pgAprovado?.payerEmail ?? null,
    payerCpf: pgAprovado?.payerCpf ?? pedido.cliente.cpf ?? null,
  }

  // ── Tentativas de pagamento (todas) — vira mini-tabela no PDF se houver >1. ──
  const tentativas: NfTentativa[] = pedido.pagamentos.map((pg) => ({
    data: pg.createdAt,
    metodo: formatarPagamento(pg.metodo),
    valor: pg.valor / 100,
    status: formatarMpStatus(pg.mpStatus),
  }))

  // ── Logística: valores do modal, fallback pro que está salvo. ───────────────
  const transportadora = sp.get('transportadora')?.trim() || pedido.transportadora || null
  const codigoRastreio = sp.get('rastreio')?.trim() || pedido.codigoRastreio || null
  const prazoModal = sp.get('prazo')?.trim()
  const prazo =
    prazoModal ||
    (pedido.fretePrazo ? `cerca de ${pedido.fretePrazo} dias úteis` : null)

  const logoBytes = await carregarLogoNf()

  const pdf = await gerarNfPdf({
    pedidoCodigo: codigo,
    pedidoStatus: getStatusInfo(pedido.status).label,
    emitidoEm: new Date(),
    pedidoCriadoEm: pedido.createdAt,
    pagoEm: pedido.pagoEm,
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
    pagamento,
    tentativas,
    logistica: { transportadora, codigoRastreio, prazo, valorFrete, freteFaturado: freteCliente },
    logoBytes,
  })

  // ── Nome do arquivo: "Pedido - {Cliente} - {COD}.pdf". ──────────────────────
  const cod = pedido.id.slice(-8).toUpperCase() // sem o "#"
  const nomeLimpo =
    (pedido.cliente.nome ?? '')
      .replace(/[/\\:*?"<>|]/g, '') // proibidos em nome de arquivo (inclui aspas duplas)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x7f]/g, '') // caracteres de controle
      .replace(/\s+/g, ' ') // colapsa espaços múltiplos
      .trim()
      .slice(0, 60)
      .trim() || 'Cliente'
  const nomeFinal = `Pedido - ${nomeLimpo} - ${cod}.pdf`
  // RFC 5987: fallback ASCII (sem acento) + versão UTF-8 codificada. Nomes com
  // acento em Content-Disposition cru quebram em vários navegadores.
  const asciiFallback = nomeFinal
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos
    .replace(/[^\x20-\x7e]/g, '_') // troca qualquer não-ASCII restante

  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(nomeFinal)}`,
      'Cache-Control': 'no-store',
    },
  })
}
