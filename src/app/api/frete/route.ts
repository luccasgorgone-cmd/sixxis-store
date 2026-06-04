import { NextRequest } from 'next/server'
import { calcularFrete } from '@/lib/melhorenvio'
import { calcularFreteFallback } from '@/lib/frete'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema POST — usado por CalcFrete (página do produto) e pelo checkout
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

// Forma normalizada que TODA rota de frete retorna ao cliente.
// Mantém um shape único entre Melhor Envio e fallback regional.
interface OpcaoFreteNormalizada {
  id: string
  nome: string
  prazo: string
  preco: number
}

function formatarPrazo(dias: number): string {
  if (!dias || dias <= 0) return 'a combinar'
  if (dias === 1) return '1 dia útil'
  return `até ${dias} dias úteis`
}

function subtotalDeProdutos(
  produtos: Array<{ preco?: number; quantidade: number }>,
) {
  return produtos.reduce(
    (acc, p) => acc + (p.preco ?? 0) * p.quantidade,
    0,
  )
}

function normalizarMelhorEnvio(
  opcoes: Array<{
    id: number
    name: string
    price: number | string
    delivery_time: number
  }>,
): OpcaoFreteNormalizada[] {
  return opcoes.map((o) => ({
    id: String(o.id),
    nome: o.name,
    prazo: formatarPrazo(Number(o.delivery_time)),
    preco: typeof o.price === 'number' ? o.price : Number(o.price),
  }))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = frPostSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { cepDestino, produtos } = parsed.data
  const subtotal = subtotalDeProdutos(produtos)

  try {
    const opcoesME = await calcularFrete(cepDestino, produtos)
    if (opcoesME && opcoesME.length > 0) {
      return Response.json({
        opcoes: normalizarMelhorEnvio(opcoesME),
        fonte: 'melhorenvio',
      })
    }
    throw new Error('melhorenvio sem opções')
  } catch (err) {
    console.error('[frete] fallback ativado:', (err as Error).message)
    const opcoes = calcularFreteFallback(cepDestino, subtotal)
    return Response.json({ opcoes, fonte: 'fallback' })
  }
}

// GET de retrocompatibilidade — usado por /carrinho (?cep=&total=)
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
