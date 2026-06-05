import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolverFrete, cepParaUF } from '@/lib/frete-resolver'

export const dynamic = 'force-dynamic'

// Fonte única de frete: tabela produto × UF (FreteRegra).
// Aceita a UF direto (checkout já tem Endereco.estado) ou deriva do CEP via ViaCEP.
const frPostSchema = z.object({
  uf: z.string().length(2).optional(),
  cepDestino: z.string().regex(/^\d{8}$/).optional(),
  produtos: z
    .array(
      z.object({
        id: z.string(),
        quantidade: z.number().int().positive(),
      }),
    )
    .min(1),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = frPostSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { uf: ufBody, cepDestino, produtos } = parsed.data

  let uf = ufBody ?? ''
  if (!uf) {
    if (!cepDestino) {
      return Response.json({ error: 'Informe uf ou cepDestino' }, { status: 400 })
    }
    const resolvida = await cepParaUF(cepDestino)
    if (!resolvida) {
      return Response.json(
        { status: 'bloqueado', uf: null, opcoes: [], mensagem: 'CEP não encontrado.' },
        { status: 200 },
      )
    }
    uf = resolvida
  }

  const resultado = await resolverFrete(
    produtos.map((p) => ({ produtoId: p.id, quantidade: p.quantidade })),
    uf,
  )

  return Response.json(resultado)
}
