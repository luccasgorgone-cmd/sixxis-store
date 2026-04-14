import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { recalcularMediaProduto } from '@/lib/recalcularMedia'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const { id } = await params
  const body = await request.json()

  const avaliacao = await prisma.avaliacao.update({
    where: { id },
    data: {
      ...(body.nota        !== undefined && { nota:       Number(body.nota) }),
      ...(body.titulo      !== undefined && { titulo:     body.titulo }),
      ...(body.comentario  !== undefined && { comentario: body.comentario }),
      ...(body.nomeAutor   !== undefined && { nomeAutor:  body.nomeAutor }),
      ...(body.aprovada    !== undefined && { aprovada:   Boolean(body.aprovada) }),
      ...(body.destaque    !== undefined && { destaque:   Boolean(body.destaque) }),
      ...(body.resposta    !== undefined && {
        resposta:   body.resposta || null,
        respostaEm: body.resposta ? new Date() : null,
      }),
    },
  })

  // Recalcular média quando aprovação muda
  if (body.aprovada !== undefined) {
    await recalcularMediaProduto(avaliacao.produtoId)
  }

  return Response.json({ ok: true, avaliacao })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const { id } = await params
  const avaliacao = await prisma.avaliacao.findUnique({ where: { id }, select: { produtoId: true } })
  await prisma.avaliacao.delete({ where: { id } })
  if (avaliacao) await recalcularMediaProduto(avaliacao.produtoId)
  return Response.json({ ok: true })
}
