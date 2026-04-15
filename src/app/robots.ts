import type { MetadataRoute } from 'next'

const BASE = 'https://sixxis-store-production.up.railway.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/minha-conta/', '/checkout/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
