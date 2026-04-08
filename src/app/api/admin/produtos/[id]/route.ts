import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFromR2 } from '@/lib/r2'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const produto = await prisma.produto.findUnique({
    where: { id },
    include: { variacoes: { orderBy: { createdAt: 'asc' } } },
  })

  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ produto })
}

interface VariacaoInput {
  id?: string
  nome: string
  sku: string
  preco?: string | number | null
  estoque: string | number
  ativo: boolean
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()

  const {
    sku,
    nome,
    slug,
    descricao,
    categoria,
    modelo,
    preco,
    precoPromocional,
    estoque,
    ativo,
    imagens,
    temVariacoes,
    variacoes,
  } = body

  // Validar SKUs únicos das variações
  const variacoesInput: VariacaoInput[] = temVariacoes ? (variacoes ?? []) : []
  const skusVariacoes = variacoesInput.map((v) => v.sku).filter(Boolean)
  if (new Set(skusVariacoes).size !== skusVariacoes.length) {
    return NextResponse.json({ error: 'SKUs das variações devem ser únicos' }, { status: 400 })
  }

  // Estoque pai = soma das variações quando temVariacoes
  const estoqueTotal = temVariacoes
    ? variacoesInput.reduce((s, v) => s + Number(v.estoque || 0), 0)
    : Number(estoque) || 0

  // Fazer upsert das variações: apaga as que não estão mais na lista, cria/atualiza as demais
  // Estratégia: deleteMany as existentes sem id (novas) e replace todas
  await prisma.$transaction(async (tx) => {
    // Deletar variações removidas (não presentes no payload)
    const idsKeep = variacoesInput.filter((v) => v.id).map((v) => v.id!)
    await tx.variacaoProduto.deleteMany({
      where: {
        produtoId: id,
        ...(idsKeep.length > 0 ? { id: { notIn: idsKeep } } : {}),
      },
    })

    // Upsert cada variação
    for (const v of variacoesInput) {
      if (v.id) {
        await tx.variacaoProduto.update({
          where: { id: v.id },
          data: {
            nome: v.nome,
            sku: v.sku,
            preco: v.preco ? Number(v.preco) : null,
            estoque: Number(v.estoque || 0),
            ativo: v.ativo !== false,
          },
        })
      } else {
        await tx.variacaoProduto.create({
          data: {
            produtoId: id,
            nome: v.nome,
            sku: v.sku,
            preco: v.preco ? Number(v.preco) : null,
            estoque: Number(v.estoque || 0),
            ativo: v.ativo !== false,
          },
        })
      }
    }

    await tx.produto.update({
      where: { id },
      data: {
        sku: sku || null,
        nome,
        slug,
        descricao: descricao || null,
        categoria,
        modelo: modelo || null,
        preco: Number(preco),
        precoPromocional: precoPromocional ? Number(precoPromocional) : null,
        estoque: estoqueTotal,
        ativo: ativo !== false,
        imagens: imagens ?? [],
        temVariacoes: Boolean(temVariacoes),
      },
    })
  })

  const produto = await prisma.produto.findUnique({
    where: { id },
    include: { variacoes: { orderBy: { createdAt: 'asc' } } },
  })

  return NextResponse.json({ produto })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const produto = await prisma.produto.findUnique({ where: { id } })

  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  // Delete images from R2
  const imagens = (produto.imagens as string[]) ?? []
  const publicUrl = process.env.R2_PUBLIC_URL ?? ''

  await Promise.allSettled(
    imagens.map((url) => {
      const key = url.replace(`${publicUrl}/`, '')
      return deleteFromR2(key)
    }),
  )

  await prisma.produto.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
