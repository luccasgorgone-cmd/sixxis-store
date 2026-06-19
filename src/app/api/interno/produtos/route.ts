import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizarInterno, HEADERS_INTERNOS } from '@/lib/interno-auth'

// API interna (read-only) para o CRM ler o catálogo de produtos.
// GET /api/interno/produtos?busca=
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// URL pública absoluta do produto na loja.
function urlProduto(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  return `${base}/produtos/${slug}`
}

// Primeira imagem como URL absoluta. As imagens já são salvas como URLs
// absolutas (R2); se vier uma chave relativa, prefixa com R2_PUBLIC_URL.
function imagemAbsoluta(imagens: unknown): string | null {
  if (!Array.isArray(imagens)) return null
  const primeira = imagens.find((i) => typeof i === 'string') as
    | string
    | undefined
  if (!primeira) return null
  if (/^https?:\/\//i.test(primeira)) return primeira
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  return base ? `${base}/${primeira.replace(/^\//, '')}` : primeira
}

function num(v: unknown): number {
  return v == null ? 0 : Number(v)
}

export async function GET(request: NextRequest) {
  if (!autorizarInterno(request)) {
    return Response.json(
      { error: 'Não autorizado' },
      { status: 401, headers: HEADERS_INTERNOS },
    )
  }

  const busca = request.nextUrl.searchParams.get('busca')?.trim() ?? ''

  const produtos = await prisma.produto.findMany({
    where: busca
      ? {
          OR: [
            { nome: { contains: busca } },
            { categoria: { contains: busca } },
            { sku: { contains: busca } },
            { modelo: { contains: busca } },
          ],
        }
      : undefined,
    orderBy: { nome: 'asc' },
    take: 1000,
    select: {
      id: true,
      nome: true,
      slug: true,
      preco: true,
      precoPromocional: true,
      imagens: true,
      categoria: true,
      ativo: true,
    },
  })

  const lista = produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    slug: p.slug,
    url: urlProduto(p.slug),
    preco: num(p.preco),
    precoPromo: p.precoPromocional != null ? num(p.precoPromocional) : null,
    imagem: imagemAbsoluta(p.imagens),
    categoria: p.categoria,
    ativo: p.ativo,
  }))

  return Response.json({ produtos: lista }, { headers: HEADERS_INTERNOS })
}
