import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE = 'https://sixxis-store-production.up.railway.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let produtos: { slug: string; createdAt: Date }[] = []
  try {
    produtos = await prisma.produto.findMany({
      where: { ativo: true },
      select: { slug: true, createdAt: true },
    })
  } catch {}

  const rotas = ['', '/produtos', '/ofertas', '/sobre', '/contato', '/garantia', '/seja-revendedor']

  return [
    ...rotas.map(r => ({
      url: `${BASE}${r}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: r === '' ? 1 : 0.8,
    })),
    ...produtos.map(p => ({
      url: `${BASE}/produtos/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ]
}
