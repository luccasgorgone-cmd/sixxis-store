import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isStatusPendente } from '@/lib/pedido-status'
import RetomarClient from './RetomarClient'

export const dynamic = 'force-dynamic'

interface Params { id: string }

export default async function RetomarCheckoutPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?next=/checkout/retomar/${id}`)
  }

  const pedido = await prisma.pedido.findFirst({
    where: { id, clienteId: session.user.id },
    include: {
      cliente: { select: { nome: true, email: true, cpf: true } },
      itens:   { include: { produto: { select: { nome: true, imagens: true } } } },
    },
  })
  if (!pedido) notFound()

  // Se já foi pago/enviado/entregue, manda pra página de sucesso/detalhe.
  if (!isStatusPendente(pedido.status)) {
    redirect(`/minha-conta/pedidos/${pedido.id}`)
  }

  return (
    <RetomarClient
      pedidoId={pedido.id}
      total={Number(pedido.total)}
      payerEmail={pedido.cliente.email}
      payerNome={pedido.cliente.nome ?? ''}
      payerCpf={pedido.cliente.cpf ?? ''}
      itens={pedido.itens.map((i) => ({
        nome: i.produto.nome,
        variacao: i.variacaoNome,
        quantidade: i.quantidade,
        preco: Number(i.precoUnitario),
        imagem: (i.produto.imagens as string[])?.[0] ?? null,
      }))}
    />
  )
}
