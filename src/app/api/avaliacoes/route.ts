import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const produtoId = searchParams.get('produtoId')
  if (!produtoId) return Response.json({ error: 'produtoId obrigatório' }, { status: 400 })

  const avaliacoes = await prisma.avaliacao.findMany({
    where: { produtoId, aprovada: true },
    include: {
      fotos: true,
      cliente: { select: { nome: true } },
    },
    orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
  })

  const total = avaliacoes.length
  const media = total > 0 ? avaliacoes.reduce((s, a) => s + a.nota, 0) / total : 0
  const distribuicao = [5, 4, 3, 2, 1].map((nota) => ({
    nota,
    count: avaliacoes.filter((a) => a.nota === nota).length,
  }))

  return Response.json({ avaliacoes, media, total, distribuicao })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { produtoId, nota, titulo, comentario, nomeAutor, emailAutor } = body

  if (!produtoId || !nota || !comentario || !nomeAutor) {
    return Response.json({ erro: 'Campos obrigatórios: produtoId, nota, comentario, nomeAutor' }, { status: 400 })
  }
  if (nota < 1 || nota > 5) {
    return Response.json({ erro: 'Nota inválida' }, { status: 400 })
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      produtoId,
      nota: Number(nota),
      titulo: titulo || null,
      comentario,
      nomeAutor,
      emailAutor: emailAutor || null,
      aprovada: false,
    },
  })

  return Response.json({ ok: true, avaliacao }, { status: 201 })
}
