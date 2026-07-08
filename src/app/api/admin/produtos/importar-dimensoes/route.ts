import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'
import {
  resolverDeParaDimensoes,
  aplicarDimensoes,
  MEDIDAS_PRODUTO,
} from '@/lib/produto-dimensoes'

export const dynamic = 'force-dynamic'

// POST { modo: 'preview' | 'aplicar' }
//   - preview (default): NÃO grava. Retorna o de-para (casados + não casados).
//   - aplicar: grava as dimensões nos produtos casados (idempotente).
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => ({}))
  const modo = body?.modo === 'aplicar' ? 'aplicar' : 'preview'

  if (modo === 'aplicar') {
    const r = await aplicarDimensoes(prisma)
    await auditLog({
      req: request,
      action: 'produto.importar-dimensoes',
      metadata: {
        atualizados: r.atualizados,
        jaEstavam: r.jaEstavam,
        naoCasaram: r.naoCasaram,
        total: MEDIDAS_PRODUTO.length,
      },
    })
    return Response.json({
      ok: true,
      modo,
      atualizados: r.atualizados,
      jaEstavam: r.jaEstavam,
      naoCasaram: r.naoCasaram,
      total: MEDIDAS_PRODUTO.length,
      linhas: r.linhas,
    })
  }

  const dePara = await resolverDeParaDimensoes(prisma)
  return Response.json({
    ok: true,
    modo,
    casados: dePara.casados.length,
    naoCasaram: dePara.naoCasados.length,
    total: MEDIDAS_PRODUTO.length,
    linhas: dePara.linhas,
  })
}
