import { NextRequest } from 'next/server'
import { calcularFrete } from '@/lib/melhorenvio'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const freteSchema = z.object({
  cepDestino: z.string().regex(/^\d{8}$/, 'CEP inválido'),
  produtos: z.array(
    z.object({
      id: z.string(),
      quantidade: z.number().int().positive(),
      peso: z.number().optional(),
    }),
  ),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = freteSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const opcoes = await calcularFrete(parsed.data.cepDestino, parsed.data.produtos)
    return Response.json({ opcoes })
  } catch (err) {
    console.error('[frete]', err)
    return Response.json({ error: 'Erro ao calcular frete' }, { status: 500 })
  }
}
