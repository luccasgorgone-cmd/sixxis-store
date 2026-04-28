import { NextRequest } from 'next/server'
import { calcularFrete } from '@/lib/melhorenvio'
import { calcularFreteFallback } from '@/lib/frete'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema novo (POST com produtos detalhados — usado pelo checkout)
const frPostSchema = z.object({
  cepDestino: z.string().regex(/^\d{8}$/, 'CEP inválido'),
  produtos: z.array(
    z.object({
      id: z.string(),
      quantidade: z.number().int().positive(),
      peso: z.number().optional(),
      preco: z.number().optional(), // em reais
    }),
  ),
})

function subtotalDeProdutos(produtos: Array<{ preco?: number; quantidade: number }>) {
  return produtos.reduce((acc, p) => acc + (p.preco ?? 0) * p.quantidade, 0)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = frPostSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { cepDestino, produtos } = parsed.data
  const subtotal = subtotalDeProdutos(produtos)

  try {
    const opcoes = await calcularFrete(cepDestino, produtos)
    if (opcoes && opcoes.length > 0) {
      return Response.json({ opcoes, fonte: 'melhorenvio' })
    }
    // sem opções vindas do parceiro — cai pro fallback
    throw new Error('melhorenvio sem opções')
  } catch (err) {
    console.error('[frete] fallback ativado:', (err as Error).message)
    const opcoes = calcularFreteFallback(cepDestino, subtotal)
    return Response.json({ opcoes, fonte: 'fallback' })
  }
}

// GET de retrocompatibilidade — alguns componentes chamam /api/frete?cep=&total=
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const cep = (url.searchParams.get('cep') ?? '').replace(/\D/g, '')
  const total = Number(url.searchParams.get('total') ?? '0')
  if (!/^\d{8}$/.test(cep)) {
    return Response.json({ error: 'CEP inválido' }, { status: 400 })
  }
  const opcoes = calcularFreteFallback(cep, total)
  return Response.json({ opcoes, fonte: 'fallback' })
}
