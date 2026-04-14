import { FileText } from 'lucide-react'

interface Props {
  descricao: string | null | undefined
}

export default function DescricaoRica({ descricao }: Props) {
  if (!descricao) return null

  return (
    <div className="mb-12">
      <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
        <FileText size={18} className="text-[#3cbfb3]" />
        Descrição do produto
      </h2>
      <div
        className="prose prose-gray max-w-none
          prose-h2:text-xl prose-h2:font-extrabold prose-h2:text-gray-900
          prose-h3:text-lg prose-h3:font-bold prose-h3:text-[#1a4f4a]
          prose-p:text-gray-600 prose-p:leading-relaxed
          prose-strong:text-gray-900 prose-strong:font-bold
          prose-ul:text-gray-600 prose-li:mb-1
          prose-img:rounded-2xl prose-img:shadow-sm prose-img:w-full"
        dangerouslySetInnerHTML={{ __html: descricao }}
      />
    </div>
  )
}
