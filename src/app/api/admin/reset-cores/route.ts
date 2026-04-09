import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULTS = [
  { chave: 'cor_principal',  valor: '#3cbfb3' },
  { chave: 'cor_header',     valor: '#0f1f1e' },
  { chave: 'cor_botoes',     valor: '#3cbfb3' },
  { chave: 'cor_textos',     valor: '#0a0a0a' },
  { chave: 'cor_fundo',      valor: '#ffffff' },
  { chave: 'fonte_principal', valor: 'Inter' },
  { chave: 'logo_url',       valor: '/logo-sixxis.png' },
]

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  for (const { chave, valor } of DEFAULTS) {
    await prisma.configuracao.upsert({
      where:  { chave },
      create: { chave, valor },
      update: { valor },
    })
  }

  return Response.json({ ok: true, resetadas: DEFAULTS.map((d) => d.chave) })
}
