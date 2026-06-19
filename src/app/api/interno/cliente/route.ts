import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizarInterno, HEADERS_INTERNOS } from '@/lib/interno-auth'

// API interna (read-only) para o CRM ler o histórico do cliente por telefone.
// GET /api/interno/cliente?telefone=55XXXXXXXXXXX
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function num(v: unknown): number {
  return v == null ? 0 : Number(v)
}

// Só dígitos.
function digitos(v: string): string {
  return (v ?? '').replace(/\D/g, '')
}

// Forma canônica BR: DDD(2) + número de 8 dígitos (sem o 9 de celular, sem o
// DDI 55). Tolera com/sem 55 e com/sem o 9. Retorna os dígitos crus se não der
// para normalizar (números curtos/estrangeiros).
function canonTelefone(raw: string): string {
  let d = digitos(raw)
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2) // 55 + DDD + 9 dígitos
  else if (d.length === 12 && d.startsWith('55')) d = d.slice(2) // 55 + DDD + 8 dígitos
  if (d.length === 11) return d.slice(0, 2) + d.slice(3) // DDD + 9 + 8 -> DDD + 8
  if (d.length === 10) return d // DDD + 8
  return d
}

const vazio = { cliente: null, pedidos: [], carrinho: null }

export async function GET(request: NextRequest) {
  if (!autorizarInterno(request)) {
    return Response.json(
      { error: 'Não autorizado' },
      { status: 401, headers: HEADERS_INTERNOS },
    )
  }

  const telefoneParam = request.nextUrl.searchParams.get('telefone') ?? ''
  const dInput = digitos(telefoneParam)
  if (dInput.length < 8) {
    return Response.json(vazio, { headers: HEADERS_INTERNOS })
  }

  const canonInput = canonTelefone(telefoneParam)
  const last8 = dInput.slice(-8)

  // Candidatos: clientes cujo telefone (só dígitos) termina nos mesmos 8 dígitos.
  // Filtra a formatacao livre via REGEXP_REPLACE (MariaDB).
  const candidatos = await prisma.$queryRaw<{ id: string; telefone: string | null }[]>`
    SELECT id, telefone FROM Cliente
    WHERE telefone IS NOT NULL
      AND RIGHT(REGEXP_REPLACE(telefone, '[^0-9]', ''), 8) = ${last8}
    LIMIT 20
  `

  // Confirma pelo canônico completo (DDD). Se o input não normalizou para 10
  // dígitos, aceita o primeiro candidato pelo final de 8 dígitos.
  const escolhido =
    canonInput.length === 10
      ? candidatos.find((c) => canonTelefone(c.telefone ?? '') === canonInput)
      : candidatos[0]

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
