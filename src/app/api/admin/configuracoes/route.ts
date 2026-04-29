import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { isSecretKey, isPublicKey } from '@/lib/config-secrets'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  // Quando ?publica=1, devolve apenas as chaves do allowlist público.
  // Em qualquer caso, secrets (anthropic_api_key, mp_*, *_token, *_secret etc.)
  // são SEMPRE removidas da resposta — devem viver só em variáveis de ambiente.
  const apenasPublicas = request.nextUrl.searchParams.get('publica') === '1'

  const rows = await prisma.configuracao.findMany()
  const result: Record<string, string> = {}
  for (const r of rows) {
    if (isSecretKey(r.chave)) continue
    if (apenasPublicas && !isPublicKey(r.chave)) continue
    result[r.chave] = r.valor
  }
  return NextResponse.json(result, { headers: NO_CACHE })
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json()

  // Suporta { chave, valor } ou { configs: { chave: valor } }
  const entries: [string, string][] =
    body.configs
      ? Object.entries(body.configs as Record<string, string>)
      : [[body.chave as string, String(body.valor)]]

  // Filtra silenciosamente qualquer tentativa de gravar uma chave sensível.
  // Secrets são gerenciadas exclusivamente via variáveis de ambiente.
  const aceitas: [string, string][] = []
  const rejeitadas: string[] = []
  for (const [chave, valor] of entries) {
    if (!chave) continue
    if (isSecretKey(chave)) {
      rejeitadas.push(chave)
      continue
    }
    aceitas.push([chave, valor])
  }

  await Promise.all(
    aceitas.map(([chave, valor]) =>
      prisma.configuracao.upsert({
        where:  { chave },
        create: { chave, valor },
        update: { valor },
      }),
    ),
  )

  return NextResponse.json(
    { ok: true, atualizadas: aceitas.length, rejeitadas },
    { headers: NO_CACHE },
  )
}
