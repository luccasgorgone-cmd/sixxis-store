import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULTS = [
  { chave: 'cor_principal',      valor: '#3cbfb3' },
  { chave: 'cor_principal_dark', valor: '#2a9d8f' },
  { chave: 'cor_destaque',       valor: '#f59e0b' },
  { chave: 'cor_header',         valor: '#1a4f4a' },
  { chave: 'cor_header_texto',   valor: '#ffffff' },
  { chave: 'cor_anuncio_fundo',  valor: '#0f2e2b' },
  { chave: 'cor_anuncio_texto',  valor: '#ffffff' },
  { chave: 'cor_fundo',          valor: '#ffffff' },
  { chave: 'cor_fundo_alt',      valor: '#f9fafb' },
  { chave: 'cor_stats_fundo',    valor: '#3cbfb3' },
  { chave: 'cor_wa_fundo',       valor: '#111827' },
  { chave: 'cor_footer_fundo',   valor: '#111827' },
  { chave: 'cor_botoes',         valor: '#3cbfb3' },
  { chave: 'cor_botoes_texto',   valor: '#ffffff' },
  { chave: 'cor_botoes_hover',   valor: '#2a9d8f' },
  { chave: 'cor_textos',         valor: '#1f2937' },
  { chave: 'cor_textos_sec',     valor: '#4b5563' },
  { chave: 'cor_titulos',        valor: '#0a0a0a' },
  { chave: 'logo_url',           valor: '/logo-sixxis.png' },
  { chave: 'fonte_principal',    valor: 'Inter' },
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
