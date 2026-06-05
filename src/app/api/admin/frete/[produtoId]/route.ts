import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { auditLog } from '@/lib/audit'
import { isUF } from '@/lib/ufs'
import { z } from 'zod'

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

export const dynamic = 'force-dynamic'

// number | null a partir de um campo que pode vir como '', null ou número.
const precoField = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number().nonnegative().nullable(),
)
const prazoField = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number().int().positive().nullable(),
)

const regraSchema = z
  .object({
    uf: z.string().length(2).refine(isUF, 'UF inválida'),
    precoNormal: precoField.optional(),
    prazoNormal: prazoField.optional(),
    precoExpresso: precoField.optional(),
    prazoExpresso: prazoField.optional(),
    aCombinar: z.boolean().optional(),
    bloqueado: z.boolean().optional(),
  })
  .transform((r) => ({
    uf: r.uf.toUpperCase(),
    precoNormal: r.precoNormal ?? null,
    prazoNormal: r.prazoNormal ?? null,
    precoExpresso: r.precoExpresso ?? null,
    prazoExpresso: r.prazoExpresso ?? null,
    aCombinar: r.aCombinar ?? false,
    bloqueado: r.bloqueado ?? false,
  }))

const putSchema = z.object({ regras: z.array(regraSchema) })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ produtoId: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { produtoId } = await params

  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: { id: true, nome: true, sku: true },
  })
  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  const regras = await prisma.freteRegra.findMany({
    where: { produtoId },
    orderBy: { uf: 'asc' },
  })

  return NextResponse.json({ produto, regras }, { headers: NO_CACHE })
}

// Salva em lote as regras de um produto (uma ou várias UFs de uma vez).
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ produtoId: string }> },
) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const { produtoId } = await params

  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: { id: true },
  })
  if (!produto) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { regras } = parsed.data
  const ufsPayload = regras.map((r) => r.uf)

  // A grade do admin é autoritativa: UFs ausentes do payload são removidas
  // (UF sem regra = venda bloqueada, mesma semântica de bloqueado=true).
  await prisma.$transaction([
    ...regras.map((r) =>
      prisma.freteRegra.upsert({
        where: { produtoId_uf: { produtoId, uf: r.uf } },
        update: {
          precoNormal: r.precoNormal,
          prazoNormal: r.prazoNormal,
          precoExpresso: r.precoExpresso,
          prazoExpresso: r.prazoExpresso,
          aCombinar: r.aCombinar,
          bloqueado: r.bloqueado,
        },
        create: {
          produtoId,
          uf: r.uf,
          precoNormal: r.precoNormal,
          prazoNormal: r.prazoNormal,
          precoExpresso: r.precoExpresso,
          prazoExpresso: r.prazoExpresso,
          aCombinar: r.aCombinar,
          bloqueado: r.bloqueado,
        },
      }),
    ),
    prisma.freteRegra.deleteMany({
      where: { produtoId, uf: { notIn: ufsPayload } },
    }),
  ])

  await auditLog({
    req: request,
    action: 'frete.regras.update',
    target: produtoId,
    metadata: { totalRegras: regras.length, ufs: regras.map((r) => r.uf) },
  })

  return NextResponse.json({ ok: true, salvos: regras.length }, { headers: NO_CACHE })
}
