import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const niveis = await prisma.nivelFidelidade.findMany({ orderBy: { ordem: 'asc' } })
  return Response.json({ niveis })
}

export async function PATCH(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const body = await request.json()
  const { slug, ...data } = body
  if (!slug) return Response.json({ erro: 'slug obrigatório' }, { status: 400 })

  const nivel = await prisma.nivelFidelidade.update({
    where: { slug },
    data: {
      ...(data.nome        !== undefined && { nome:        data.nome }),
      ...(data.iconeUrl    !== undefined && { iconeUrl:    data.iconeUrl || null }),
      ...(data.iconeLucide !== undefined && { iconeLucide: data.iconeLucide || null }),
      ...(data.cor         !== undefined && { cor:         data.cor }),
      ...(data.gastoMin    !== undefined && { gastoMin:    Number(data.gastoMin) || 0 }),
      ...(data.gastoMax    !== undefined && { gastoMax:    data.gastoMax === null ? null : Number(data.gastoMax) }),
      ...(data.cashbackPc  !== undefined && { cashbackPc:  Number(data.cashbackPc) || 0 }),
    },
  })
  return Response.json({ ok: true, nivel })
}
