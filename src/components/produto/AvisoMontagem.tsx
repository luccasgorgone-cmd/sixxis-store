import { PackageCheck } from 'lucide-react'
import { textoMontagemProduto } from '@/lib/produto-montagem'

export default function AvisoMontagem({ categoria }: { categoria?: string | null }) {
  const texto = textoMontagemProduto(categoria)
  if (!texto) return null

  return (
    <aside className="mb-8 rounded-2xl border border-[#3cbfb3]/25 bg-[#f0fffe] px-5 py-4" aria-label="Informação de montagem">
      <div className="flex items-start gap-3">
        <PackageCheck className="mt-0.5 shrink-0 text-[#238f85]" size={22} aria-hidden="true" />
        <div>
          <p className="font-bold text-[#0f2e2b]">Montagem do produto</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">{texto}</p>
        </div>
      </div>
    </aside>
  )
}
