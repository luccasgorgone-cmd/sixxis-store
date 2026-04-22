'use client'

import { useRef, useState, useEffect } from 'react'
import { Award, Package, ShieldCheck, TrendingDown, Truck, Headphones, type LucideIcon } from 'lucide-react'

interface Razao {
  icone: LucideIcon
  titulo: string
  desc: string
}

const RAZOES: Razao[] = [
  {
    icone: Award,
    titulo: '30 anos de mercado brasileiro',
    desc: 'Desde 1993 levando tecnologia de climatização e fitness para mais de 1 milhão de lares. Tradição que vira confiança.',
  },
  {
    icone: Package,
    titulo: 'Importadora oficial',
    desc: 'Somos nós que trazemos o produto para o Brasil. Sem intermediários, sem marca reembalada. Você compra direto da fonte.',
  },
  {
    icone: ShieldCheck,
    titulo: 'Garantia real de 12 meses',
    desc: 'Assistência técnica própria em Araçatuba-SP. Peças originais em estoque. Defeito? Trocamos ou consertamos sem burocracia.',
  },
  {
    icone: TrendingDown,
    titulo: 'Economia comprovada em conta',
    desc: 'Nossos climatizadores reduzem até 79% do consumo de um ar-condicionado tradicional. Prova real, não marketing.',
  },
  {
    icone: Truck,
    titulo: 'Entrega para todo o Brasil',
    desc: 'De Roraima ao Rio Grande do Sul. Frete grátis em compras acima de R$ 500. Rastreamento em tempo real.',
  },
  {
    icone: Headphones,
    titulo: 'Suporte humano, não robô',
    desc: 'Fala com gente. WhatsApp, telefone, email. Equipe treinada no produto, atendimento de segunda a sábado.',
  },
]

export function PorQueComprarSixxis() {
  const [visiveis, setVisiveis] = useState<boolean[]>(() => RAZOES.map(() => false))
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    refs.current.forEach((el, i) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisiveis((prev) => {
                const next = [...prev]
                next[i] = true
                return next
              })
            }, i * 100)
            obs.disconnect()
          }
        },
        { threshold: 0.15 },
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <section className="mt-12 mb-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <h2 className="text-xl font-black whitespace-nowrap px-2" style={{ color: '#0f2e2b' }}>
          Por que comprar na Sixxis?
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RAZOES.map((r, i) => {
          const Icone = r.icone
          const visivel = visiveis[i]
          return (
            <div
              key={i}
              ref={(el) => { refs.current[i] = el }}
              className="p-8 rounded-[20px] border transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: '#0f2e2b',
                borderColor: 'transparent',
                borderWidth: '1px',
                opacity: visivel ? 1 : 0,
                transform: visivel ? 'translateY(0)' : 'translateY(16px)',
                transitionProperty: 'opacity, transform, border-color',
                transitionDuration: '300ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3cbfb3' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent' }}
            >
              <div
                className="flex items-center justify-center rounded-full mb-5"
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: 'rgba(60, 191, 179, 0.10)',
                }}
              >
                <Icone size={48} color="#3cbfb3" strokeWidth={1.75} />
              </div>
              <h3 className="font-bold mb-2" style={{ color: '#ffffff', fontSize: 20 }}>
                {r.titulo}
              </h3>
              <p style={{ color: '#d1d5db', fontSize: 14, lineHeight: 1.6 }}>
                {r.desc}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
