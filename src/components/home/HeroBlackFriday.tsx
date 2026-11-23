import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

/**
 * Banner Black Friday 2026 — campanha "Essencial Black" (interim comercial).
 *
 * Design (pacote Drive, direção Essencial Black): fundo preto de campanha
 * (#080B0B) + turquesa Sixxis (#00CFB5). A fotografia de campanha ocupa a
 * direita; o texto "BLACK FRIDAY", a oferta e o CTA são HTML POR CIMA da foto
 * (os pixels da imagem não contêm esses textos). A condição do "menor valor"
 * fica discreta e legível (>=12px), nunca como título principal.
 *
 * Server component puro (sem estado) — seguro para a home SSR.
 */
export default function HeroBlackFriday() {
  return (
    <section
      aria-label="Black Friday Sixxis"
      className="relative isolate overflow-hidden"
      style={{ backgroundColor: '#080B0B' }}
    >
      {/* Fotografia de campanha — à direita; some atrás da copy no mobile */}
      <div className="absolute inset-0">
        <Image
          src="/black-friday/banner-colecao.webp"
          alt="Climatizadores e bike spinning Sixxis em ambiente de arquitetura"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[78%_center]"
        />
        {/* Scrim: escurece a esquerda (onde fica a copy) preservando a foto à direita */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #080B0B 0%, rgba(8,11,11,0.92) 34%, rgba(8,11,11,0.55) 55%, rgba(8,11,11,0.15) 78%, rgba(8,11,11,0) 100%)',
          }}
        />
        {/* Reforço inferior no mobile p/ legibilidade da condição */}
        <div
          aria-hidden
          className="absolute inset-0 sm:hidden"
          style={{ background: 'linear-gradient(180deg, rgba(8,11,11,0.1) 0%, rgba(8,11,11,0.85) 100%)' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="max-w-xl">
          <span
            className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] mb-3"
            style={{ color: '#00CFB5' }}
          >
            Black Friday Sixxis
          </span>

          <h1
            className="font-extrabold uppercase leading-[0.9] tracking-tight text-[15vw] sm:text-6xl lg:text-7xl"
            style={{ color: '#F4F7F6' }}
          >
            Black<br />Friday
          </h1>

          <p
            className="mt-4 sm:mt-5 text-2xl sm:text-3xl font-extrabold leading-tight"
            style={{ color: '#F4F7F6' }}
          >
            2ª unidade com{' '}
            <span style={{ color: '#00CFB5' }}>50% OFF</span>
          </p>

          <p className="mt-3 text-[12px] sm:text-sm leading-relaxed" style={{ color: '#B0BFBC' }}>
            A cada dupla, a unidade de menor valor sai pela metade — vale para produtos
            iguais ou diferentes. Cumulativo com 5% OFF no Pix. Válido até 30/11.
          </p>

          <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 font-extrabold text-[15px] px-6 py-3.5 rounded-[5px] transition-colors"
              style={{ backgroundColor: '#00CFB5', color: '#032E28' }}
            >
              Aproveitar a Black Friday <ArrowRight size={18} />
            </Link>
            <Link
              href="/produtos?categoria=climatizadores"
              className="inline-flex items-center gap-2 font-bold text-[15px] px-6 py-3.5 rounded-[5px] border transition-colors"
              style={{ borderColor: 'rgba(244,247,246,0.35)', color: '#F4F7F6' }}
            >
              Ver climatizadores
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
