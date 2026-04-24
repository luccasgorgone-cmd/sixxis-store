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
  // Novas: Background global
  { chave: 'bg_body_url',        valor: '' },
  { chave: 'bg_body_ativo',      valor: 'false' },
  { chave: 'bg_body_size',       valor: 'cover' },
  { chave: 'bg_body_attachment', valor: 'fixed' },
  { chave: 'bg_body_repeat',     valor: 'no-repeat' },
  { chave: 'bg_body_position',   valor: 'center center' },
  { chave: 'bg_body_overlay',    valor: '0' },
  // Novas: Cores header (esquema v2: announcement e nav mais claros, principal mais escuro)
  { chave: 'bg_header_cor',      valor: '#0f2e2b' },
  { chave: 'bg_header_nav_cor',  valor: '#1a4f4a' },
  { chave: 'bg_anuncio_cor',     valor: '#1a4f4a' },
  { chave: 'bg_anuncio_texto',   valor: '#ffffff' },
  // Novas: Cores footer
  { chave: 'bg_footer_cor',      valor: '#111827' },
  { chave: 'bg_footer_texto',    valor: '#9ca3af' },
  { chave: 'bg_footer_titulo',   valor: '#ffffff' },
  { chave: 'bg_footer_hover',    valor: '#3cbfb3' },
]

export async function POST(request: NextRequest) {
  const { requireAdmin } = await import('@/lib/adminAuth')
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  for (const { chave, valor } of DEFAULTS) {
    await prisma.configuracao.upsert({
      where:  { chave },
      create: { chave, valor },
      update: { valor },
    })
  }

  return Response.json({ ok: true, resetadas: DEFAULTS.map((d) => d.chave) })
}
