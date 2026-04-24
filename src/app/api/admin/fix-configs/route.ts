import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  const { prisma } = await import('@/lib/prisma')

  const deleted = await prisma.configuracao.deleteMany({
    where: {
      chave: {
        in: [
          'aparencia_cor_primaria',
          'aparencia_cor_secundaria',
          'aparencia_banner_titulo',
          'aparencia_banner_subtitulo',
          'aparencia_banner_cta',
        ],
      },
    },
  })

  return Response.json({
    ok: true,
    message: `${deleted.count} chave(s) duplicada(s) removida(s) do banco.`,
  })
}
