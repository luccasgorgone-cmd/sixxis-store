import type { Metadata } from 'next'
import Link from 'next/link'
import { Home, Search, Wind, Fan, Bike } from 'lucide-react'

export const metadata: Metadata = {
  // O title.template do RootLayout adiciona "| Sixxis Store" automaticamente,
  // então usar string literal aqui causaria duplicação caso o template seja
  // aplicado em algum render (ex.: prefetch). Mantemos só o nome da página.
  title: 'Página não encontrada',
  description: 'A página que você buscou não existe. Explore nossos produtos e categorias.',
}

export default function NotFound() {
  return (
    <main
      className="min-h-[80vh] flex items-center justify-center px-4 py-16"
      style={{ backgroundColor: 'var(--color-fundo-alt, #f9fafb)' }}
    >
      <div className="w-full max-w-lg text-center">
        {/* Big 404 */}
        <div
          className="text-[120px] sm:text-[160px] font-black leading-none mb-2 select-none"
          style={{ color: '#3cbfb3', opacity: 0.15 }}
          aria-hidden="true"
        >
          404
        </div>

        <div className="relative -mt-8 sm:-mt-12">
          <div className="w-20 h-20 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-6">
            <Search size={32} className="text-[#3cbfb3]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] mb-3 tracking-tight">
            Página não encontrada
          </h1>
          <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            A página que você buscou não existe ou foi movida. Que tal explorar nossos produtos?
          </p>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-xs mx-auto">
            {[
              { href: '/produtos?categoria=climatizadores', label: 'Climatizadores', Icon: Wind  },
              { href: '/produtos?categoria=aspiradores',    label: 'Aspiradores',    Icon: Fan   },
              { href: '/produtos?categoria=spinning',       label: 'Spinning',       Icon: Bike  },
            ].map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-100 rounded-xl hover:border-[#3cbfb3] hover:shadow-md transition-all group"
              >
                <div className="w-9 h-9 rounded-full bg-[#e8f8f7] group-hover:bg-[#3cbfb3] flex items-center justify-center transition-colors">
                  <Icon size={16} className="text-[#3cbfb3] group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs font-medium text-gray-600 group-hover:text-[#3cbfb3] transition-colors">
                  {label}
                </span>
              </Link>
            ))}
          </div>

          {/* Main CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Home size={16} />
              Ir para o início
            </Link>
            <Link
              href="/produtos"
              className="flex items-center justify-center gap-2 border border-gray-200 hover:border-[#3cbfb3] text-gray-600 hover:text-[#3cbfb3] font-medium px-6 py-3 rounded-xl transition-all"
            >
              Ver todos os produtos
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
