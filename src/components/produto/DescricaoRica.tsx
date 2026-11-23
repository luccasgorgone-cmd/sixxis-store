import { FileText } from 'lucide-react'

interface Props {
  descricao: string | null | undefined
}

export default function DescricaoRica({ descricao }: Props) {
  if (!descricao) return null

  return (
    <div className="mb-12">
      <h2 className="text-xl font-extrabold text-[#F4F7F6] mb-6 flex items-center gap-2 border-b border-[#2A3937] pb-4">
        <FileText size={18} className="text-[#00cfb5]" />
        Descrição do produto
      </h2>
      <div
        className="produto-descricao"
        dangerouslySetInnerHTML={{ __html: descricao }}
      />
    </div>
  )
}
