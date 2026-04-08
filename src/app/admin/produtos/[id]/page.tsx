import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProdutoForm from '@/components/admin/ProdutoForm'

export const metadata = { title: 'Editar Produto' }

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const produto = await prisma.produto.findUnique({ where: { id } })

  if (!produto) notFound()

  return (
    <ProdutoForm
      mode="editar"
      produtoId={produto.id}
      initialData={{
        sku: produto.sku ?? '',
        nome: produto.nome,
        slug: produto.slug,
        descricao: produto.descricao ?? '',
        categoria: produto.categoria,
        modelo: produto.modelo ?? '',
        preco: String(produto.preco),
        precoPromocional: produto.precoPromocional ? String(produto.precoPromocional) : '',
        estoque: String(produto.estoque),
        ativo: produto.ativo,
        imagens: (produto.imagens as string[]) ?? [],
      }}
    />
  )
}
