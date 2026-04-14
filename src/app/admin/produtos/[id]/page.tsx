import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProdutoForm from '@/components/admin/ProdutoForm'
import AvaliacoesAdminProduto from '@/components/admin/AvaliacoesAdminProduto'

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
    <div className="space-y-6">
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
          videoUrl: (produto as unknown as { videoUrl?: string | null }).videoUrl ?? '',
          especificacoes: (produto as unknown as { especificacoes?: unknown }).especificacoes as import('@/components/admin/ProdutoForm').EspecificacaoRow[] | null ?? null,
          faqs: (produto as unknown as { faqs?: unknown }).faqs as import('@/components/admin/ProdutoForm').FaqRow[] | null ?? null,
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
      <AvaliacoesAdminProduto produtoId={produto.id} />
    </div>
  )
}
