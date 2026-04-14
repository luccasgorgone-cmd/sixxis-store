'use client'

import Link from 'next/link'

interface Subcategoria {
  label: string
  href: string
  ativo?: boolean
}

const SUBCATS: Record<string, Subcategoria[]> = {
  climatizadores: [
    { label: 'Residencial',     href: '/produtos?categoria=climatizadores&tipo=residencial' },
    { label: 'Comercial',       href: '/produtos?categoria=climatizadores&tipo=comercial'   },
    { label: 'Tanque Grande',   href: '/produtos?categoria=climatizadores&min_litros=40'    },
    { label: 'Bivolt',          href: '/produtos?categoria=climatizadores&voltagem=bivolt'  },
    { label: 'Mais Vendidos',   href: '/produtos?categoria=climatizadores&ordem=vendidos'   },
    { label: 'Melhores Preços', href: '/produtos?categoria=climatizadores&ordem=preco-asc'  },
  ],
  aspiradores: [
    { label: 'Portátil',        href: '/produtos?categoria=aspiradores&tipo=portatil'  },
    { label: 'Robô',            href: '/produtos?categoria=aspiradores&tipo=robo'      },
    { label: 'Vertical',        href: '/produtos?categoria=aspiradores&tipo=vertical'  },
    { label: 'Mais Vendidos',   href: '/produtos?categoria=aspiradores&ordem=vendidos' },
    { label: 'Melhores Preços', href: '/produtos?categoria=aspiradores&ordem=preco-asc'},
  ],
  spinning: [
    { label: 'Profissional',    href: '/produtos?categoria=spinning&tipo=profissional' },
    { label: 'Residencial',     href: '/produtos?categoria=spinning&tipo=residencial'  },
    { label: 'Mais Vendidos',   href: '/produtos?categoria=spinning&ordem=vendidos'    },
    { label: 'Melhores Preços', href: '/produtos?categoria=spinning&ordem=preco-asc'   },
  ],
  '': [
    { label: 'Climatizadores',  href: '/produtos?categoria=climatizadores' },
    { label: 'Aspiradores',     href: '/produtos?categoria=aspiradores'    },
    { label: 'Spinning',        href: '/produtos?categoria=spinning'       },
    { label: 'Ofertas',         href: '/ofertas'                           },
    { label: 'Mais Vendidos',   href: '/produtos?ordem=vendidos'           },
    { label: 'Novidades',       href: '/produtos?ordem=recentes'           },
  ],
}

interface Props {
  categoria: string
}

export default function SubcategoriasCarrossel({ categoria }: Props) {
  const subcats = SUBCATS[categoria] ?? SUBCATS['']

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className="flex gap-2 overflow-x-auto py-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {subcats.map((sub) => (
            <Link
              key={sub.label}
              href={sub.href}
              className={`
                shrink-0 px-4 py-2.5 rounded-xl border-2 text-xs font-semibold
                whitespace-nowrap transition-all duration-150
                ${sub.ativo
                  ? 'bg-[#3cbfb3] border-[#3cbfb3] text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#3cbfb3] hover:text-[#3cbfb3]'
                }
              `}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
