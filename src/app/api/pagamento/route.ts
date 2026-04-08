import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mpClient } from '@/lib/mercadopago'
import { Payment, Preference } from 'mercadopago'
import { z } from 'zod'

const pixSchema = z.object({
  pedidoId: z.string(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = pixSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id: parsed.data.pedidoId, clienteId: session.user.id },
    include: { itens: { include: { produto: true } } },
  })

  if (!pedido) {
    return Response.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  const preference = new Preference(mpClient)
  const result = await preference.create({
    body: {
      items: pedido.itens.map((item) => ({
        id: item.produtoId,
        title: item.produto.nome,
        quantity: item.quantidade,
        unit_price: Number(item.precoUnitario),
        currency_id: 'BRL',
      })),
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/pedidos`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/pedidos`,
      },
      auto_return: 'approved',
      external_reference: pedido.id,
    },
  })

  await prisma.pedido.update({
    where: { id: pedido.id },
    data: { mpPaymentId: result.id?.toString() },
  })

  return Response.json({ preferenceId: result.id, initPoint: result.init_point })
}
