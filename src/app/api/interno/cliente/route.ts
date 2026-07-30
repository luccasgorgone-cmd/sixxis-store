import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizarInterno, HEADERS_INTERNOS } from '@/lib/interno-auth'
import { digitosTelefone, acharClientesPorTelefone } from '@/lib/telefone-busca'

// API interna (read-only) para o CRM ler o histórico do cliente por telefone.
// GET /api/interno/cliente?telefone=55XXXXXXXXXXX
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function num(v: unknown): number {
  return v == null ? 0 : Number(v)
}

// Normalização e casamento por telefone vivem em @/lib/telefone-busca — o mesmo
// helper que /api/interno/crm/pedidos-por-telefone usa, para os dois acharem
// sempre o mesmo cliente.

const vazio = { cliente: null, pedidos: [], carrinho: null }

export async function GET(request: NextRequest) {
  if (!autorizarInterno(request)) {
    return Response.json(
      { error: 'Não autorizado' },
      { status: 401, headers: HEADERS_INTERNOS },
    )
  }

  const telefoneParam = request.nextUrl.searchParams.get('telefone') ?? ''
  if (digitosTelefone(telefoneParam).length < 8) {
    return Response.json(vazio, { headers: HEADERS_INTERNOS })
  }

  // Esta rota trabalha com UM cliente: o casamento mais provável.
  const [escolhido] = await acharClientesPorTelefone(telefoneParam)

  if (!escolhido) {
    return Response.json(vazio, { headers: HEADERS_INTERNOS })
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: escolhido.id },
    select: {
      nome: true,
      email: true,
      telefone: true,
      pedidos: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          erpPedidoId: true,
          status: true,
          total: true,
          createdAt: true,
          transportadora: true,
          linkRastreio: true,
          codigoRastreio: true,
          itens: {
            select: {
              quantidade: true,
              precoUnitario: true,
              variacaoNome: true,
              produto: { select: { nome: true } },
            },
          },
        },
      },
      carrinho: {
        select: {
          itens: {
            select: {
              quantidade: true,
              produto: {
                select: { nome: true, preco: true, precoPromocional: true },
              },
            },
          },
        },
      },
    },
  })

  if (!cliente) {
    return Response.json(vazio, { headers: HEADERS_INTERNOS })
  }

  const pedidos = cliente.pedidos.map((p) => {
    const temRastreio = Boolean(p.transportadora || p.linkRastreio)
    return {
      id: p.id,
      numero: p.erpPedidoId ?? p.id,
      status: p.status,
      total: num(p.total),
      criadoEm: p.createdAt,
      itens: p.itens.map((it) => ({
        nome: it.variacaoNome
          ? `${it.produto.nome} - ${it.variacaoNome}`
          : it.produto.nome,
        qtd: it.quantidade,
        preco: num(it.precoUnitario),
      })),
      rastreio: temRastreio
        ? {
            transportadora: p.transportadora ?? undefined,
            link: p.linkRastreio ?? undefined,
          }
        : null,
    }
  })

  const itensCarrinho = cliente.carrinho?.itens ?? []
  const carrinho =
    itensCarrinho.length > 0
      ? itensCarrinho.map((it) => ({
          nome: it.produto.nome,
          qtd: it.quantidade,
          preco: num(it.produto.precoPromocional ?? it.produto.preco),
        }))
      : null

  return Response.json(
    {
      cliente: {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
      },
      pedidos,
      carrinho,
    },
    { headers: HEADERS_INTERNOS },
  )
}
