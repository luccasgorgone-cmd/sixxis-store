import { FileText } from 'lucide-react'

interface Props {
  descricao: string | null | undefined
}

export default function DescricaoRica({ descricao }: Props) {
  if (!descricao) return null

  return (
    <div className="mb-12">
      <h2 className="text-xl font-extrabold text-sx-text mb-6 flex items-center gap-2 border-b border-sx-line pb-4">
        <FileText size={18} className="text-sx-accent-text" />
        Descrição do produto
      </h2>
      <div
        className="produto-descricao"
        dangerouslySetInnerHTML={{ __html: descricao }}
      />
    </div>
  )
}
