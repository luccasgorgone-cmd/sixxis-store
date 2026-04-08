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
  const produto = await prisma.produto.findUnique({
    where: { id },
    include: { variacoes: { orderBy: { createdAt: 'asc' } } },
  })

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
        temVariacoes: produto.temVariacoes,
        variacoes: produto.variacoes.map((v) => ({
          id: v.id,
          nome: v.nome,
          sku: v.sku,
          preco: v.preco != null ? String(v.preco) : '',
          estoque: String(v.estoque),
          ativo: v.ativo,
        })),
      }}
    />
  )
}
