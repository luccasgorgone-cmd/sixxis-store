'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Sub {
  label: string
  href: string
}

interface Props {
  subcategorias: Sub[]
}

export default function SubcategoriasCarrossel({ subcategorias }: Props) {
  const searchParams = useSearchParams()

  if (!subcategorias?.length) return null

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className="flex gap-2 overflow-x-auto py-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {subcategorias.map((sub) => {
            const url = new URL(sub.href, 'http://x')
            const params = url.searchParams
            const isAtivo = Array.from(params.entries()).every(
              ([k, v]) => searchParams.get(k) === v
            )

            return (
              <Link
                key={sub.label}
                href={sub.href}
                className={[
                  'shrink-0 px-4 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all duration-150',
                  isAtivo
                    ? 'bg-[#0f2e2b] border-[#0f2e2b] text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#3cbfb3] hover:text-[#3cbfb3]',
                ].join(' ')}
              >
                {sub.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
