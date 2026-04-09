import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

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
