'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Home, Building2, Droplets, Zap, Trophy, Tag,
  Hand, Bot, ArrowUp, Wind, Fan, Bike, Flame, Sparkles, Medal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Subcategoria {
  label: string
  href: string
  Icon: LucideIcon
  img?: string
}

const SUBCATS: Record<string, Subcategoria[]> = {
  climatizadores: [
    { label: 'Residencial',    href: '/produtos?categoria=climatizadores&tipo=residencial', Icon: Home      },
    { label: 'Comercial',      href: '/produtos?categoria=climatizadores&tipo=comercial',   Icon: Building2 },
    { label: 'Tanque Grande',  href: '/produtos?categoria=climatizadores&min_litros=40',    Icon: Droplets  },
    { label: 'Bivolt',         href: '/produtos?categoria=climatizadores&voltagem=bivolt',  Icon: Zap       },
    { label: 'Mais Vendidos',  href: '/produtos?categoria=climatizadores&ordem=vendidos',   Icon: Trophy    },
    { label: 'Melhores Preços',href: '/produtos?categoria=climatizadores&ordem=preco-asc',  Icon: Tag       },
  ],
  aspiradores: [
    { label: 'Portátil',       href: '/produtos?categoria=aspiradores&tipo=portatil',       Icon: Hand      },
    { label: 'Robô',           href: '/produtos?categoria=aspiradores&tipo=robo',           Icon: Bot       },
    { label: 'Vertical',       href: '/produtos?categoria=aspiradores&tipo=vertical',       Icon: ArrowUp   },
    { label: 'Mais Vendidos',  href: '/produtos?categoria=aspiradores&ordem=vendidos',      Icon: Trophy    },
    { label: 'Melhores Preços',href: '/produtos?categoria=aspiradores&ordem=preco-asc',     Icon: Tag       },
  ],
  spinning: [
    { label: 'Profissional',   href: '/produtos?categoria=spinning&tipo=profissional',      Icon: Medal     },
    { label: 'Residencial',    href: '/produtos?categoria=spinning&tipo=residencial',       Icon: Home      },
    { label: 'Mais Vendidos',  href: '/produtos?categoria=spinning&ordem=vendidos',         Icon: Trophy    },
    { label: 'Melhores Preços',href: '/produtos?categoria=spinning&ordem=preco-asc',        Icon: Tag       },
  ],
  '': [
    { label: 'Climatizadores', href: '/produtos?categoria=climatizadores', Icon: Wind     },
    { label: 'Aspiradores',    href: '/produtos?categoria=aspiradores',    Icon: Fan      },
    { label: 'Spinning',       href: '/produtos?categoria=spinning',       Icon: Bike     },
    { label: 'Ofertas',        href: '/ofertas',                           Icon: Tag      },
    { label: 'Mais Vendidos',  href: '/produtos?ordem=vendidos',           Icon: Flame    },
    { label: 'Novidades',      href: '/produtos?ordem=recentes',           Icon: Sparkles },
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
        <div className="flex gap-1 overflow-x-auto py-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {subcats.map(sub => (
            <Link
              key={sub.label}
              href={sub.href}
              className="flex flex-col items-center gap-2 shrink-0 group px-3"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-all duration-200 bg-gray-50 border-gray-100 group-hover:border-[#3cbfb3]/50 group-hover:bg-[#f0fffe]">
                {sub.img ? (
                  <Image src={sub.img} alt={sub.label} width={64} height={64} className="object-contain p-2" unoptimized />
                ) : (
                  <sub.Icon size={24} className="text-gray-500 group-hover:text-[#3cbfb3] transition-colors" />
                )}
              </div>
              <span className="text-xs font-semibold text-center leading-tight max-w-[70px] text-gray-600 group-hover:text-[#3cbfb3] transition-colors">
                {sub.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
