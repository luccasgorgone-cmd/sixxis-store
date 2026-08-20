import type { MetadataRoute } from 'next'
import { ADMIN_BASE } from '@/lib/admin-path'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sixxis.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /admin/ é honeypot (sempre 404, src/app/admin/[[...all]]) — o painel
      // real vive em ADMIN_BASE (rotacionável via NEXT_PUBLIC_ADMIN_PATH), que
      // antes NÃO estava bloqueado aqui e ficava exposto pro Google indexar.
      disallow: ['/admin/', `${ADMIN_BASE}/`, '/api/', '/minha-conta/', '/checkout/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
