import ProdutoForm from '@/components/admin/ProdutoForm'

export const metadata = { title: 'Novo Produto' }

export default function NovoProdutoPage() {
  return <ProdutoForm mode="novo" />
}
