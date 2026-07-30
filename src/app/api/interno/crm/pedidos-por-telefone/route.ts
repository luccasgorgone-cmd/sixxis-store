import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizarInterno, HEADERS_INTERNOS } from '@/lib/interno-auth'
import { digitosTelefone, acharClientesPorTelefone } from '@/lib/telefone-busca'
import { formatarDiaISO } from '@/lib/data-nf'

// ─── Pedidos por telefone — insumo do "Ganho" do CRM ─────────────────────────
// POST /api/interno/crm/pedidos-por-telefone   body: { telefone: string }
//
// O operador do CRM fecha um atendimento como venda e hoje redigita à mão dados
// que já estão no pedido do site. Esta rota devolve os pedidos daquele telefone
// no shape acordado com o CRM, para o Ganho pré-preencher.
//
// SOMENTE LEITURA. Mesma auth das demais rotas internas (x-internal-key =
// STORE_INTERNAL_KEY, comparação em tempo constante) — nenhuma env nova.
//
// O shape é FECHADO: nada fora dele sai daqui. Em particular, custoFreteReal
// (custo interno) só aparece agregado em frete.valor quando a empresa absorveu
// o frete — nunca cru, e nunca junto do que o cliente pagou.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Teto de segurança. Volume real por telefone é de unidades, não centenas. */
const MAX_PEDIDOS = 100

// Categoria: valor cru do banco -> rótulo do CRM. Categoria desconhecida passa
// direto (o CRM mostra o que veio em vez de um campo vazio).
const CATEGORIA_CRM: Record<string, string> = {
  climatizadores: 'Climatizador',
  spinning:       'Bike Spinning',
  aspiradores:    'Aspirador',
}

// Método do Pagamento aprovado -> rótulo do CRM (grafia exata do contrato).
const PAGAMENTO_CRM: Record<string, string> = {
  pix:         'PIX',
  credit_card: 'Cartão de crédito',
  debit_card:  'Cartão de débito',
}

/** Cores conhecidas — o resto de variacaoNome não vira cor. */
const CORES = new Set([
  'preto', 'branco', 'azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'cinza',
  'laranja', 'roxo', 'marrom', 'bege', 'prata', 'dourado', 'grafite',
])

/**
 * Um produto tem no máximo UM tipo de variação: ou voltagem, ou cor. Nunca
 * preencher os dois — mandar cor="110V" faria o CRM registrar a venda errada.
 */
function separarVariacao(nome: string | null): { voltagem: string | null; cor: string | null } {
  if (!nome) return { voltagem: null, cor: null }
  const limpo = nome.trim()
  if (/^\d+\s*V$/i.test(limpo)) return { voltagem: limpo.toUpperCase().replace(/\s+/g, ''), cor: null }
  if (CORES.has(limpo.toLowerCase())) return { voltagem: null, cor: limpo }
  return { voltagem: null, cor: null }
}

export async function POST(request: NextRequest) {
  if (!autorizarInterno(request)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401, headers: HEADERS_INTERNOS })
  }

  const body = await request.json().catch(() => null)
  const telefone = typeof body?.telefone === 'string' ? body.telefone : ''

  // Telefone impossível de casar não é erro: o CRM simplesmente cai no Ganho
  // manual. Mesma resposta de "nenhum pedido encontrado".
  if (digitosTelefone(telefone).length < 8) {
    return Response.json({ pedidos: [] }, { headers: HEADERS_INTERNOS })
  }

  const clientes = await acharClientesPorTelefone(telefone)
  if (clientes.length === 0) {
    return Response.json({ pedidos: [] }, { headers: HEADERS_INTERNOS })
  }

  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: { in: clientes.map((c) => c.id) } },
    orderBy: { createdAt: 'desc' },
    take: MAX_PEDIDOS,
    select: {
      id: true,
      createdAt: true,
      frete: true,
      custoFreteReal: true,
      notaFiscal: true,
      dataNotaFiscal: true,
      codigoRastreio: true,
      transportadora: true,
      itens: {
        select: {
          quantidade: true,
          precoUnitario: true,
          variacaoNome: true,
          produto: { select: { nome: true, modelo: true, categoria: true } },
        },
      },
      pagamentos: {
        where: { mpStatus: 'approved' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { metodo: true },
      },
    },
  })

  const resposta = pedidos.map((p) => {
    // Frete pelo ponto de vista de QUEM PAGOU:
    //  - cliente pagou (frete > 0)            -> valor = o que ele pagou, empresa = false
    //  - grátis pro cliente, mas teve custo   -> valor = o que a empresa absorveu, true
    //  - grátis e sem custo registrado        -> 0 / false
    const fretePago = Number(p.frete)
    const custoAbsorvido = p.custoFreteReal != null ? Number(p.custoFreteReal) : 0
    const frete =
      fretePago > 0
        ? { valor: fretePago, pagoPelaEmpresa: false }
        : custoAbsorvido > 0
          ? { valor: custoAbsorvido, pagoPelaEmpresa: true }
          : { valor: 0, pagoPelaEmpresa: false }

    const metodo = p.pagamentos[0]?.metodo?.toLowerCase()

    return {
      pedidoId: p.id,
      codigo: p.id.slice(-8).toUpperCase(),
      data: p.createdAt.toISOString(),
      itens: p.itens.map((it) => {
        const { voltagem, cor } = separarVariacao(it.variacaoNome)
        return {
          nome: it.produto.nome,
          modelo: it.produto.modelo ?? null,
          categoria: CATEGORIA_CRM[it.produto.categoria] ?? it.produto.categoria,
          quantidade: it.quantidade,
          // Decimal(10,2) do banco -> número em REAIS (2950.00), nunca centavos.
          valorUnitario: Number(it.precoUnitario),
          voltagem,
          cor,
        }
      }),
      frete,
      // Sem pagamento aprovado identificável, null: o CRM pergunta em vez de
      // registrar um método que a Loja não confirmou.
      formaPagamento: metodo ? (PAGAMENTO_CRM[metodo] ?? null) : null,
      nf: p.notaFiscal
        ? { numero: p.notaFiscal, data: formatarDiaISO(p.dataNotaFiscal) }
        : null,
      rastreio: p.codigoRastreio
        ? { codigo: p.codigoRastreio, transportadora: p.transportadora ?? null }
        : null,
    }
  })

  return Response.json({ pedidos: resposta }, { headers: HEADERS_INTERNOS })
}
