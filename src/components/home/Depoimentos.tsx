'use client'

const depoimentos = [
  {
    nome: 'Ana Paula M.',
    cidade: 'São Paulo, SP',
    nota: 5,
    texto: 'Climatizador chegou em perfeito estado e em 2 dias! Produto de qualidade, montagem simples. Super recomendo a Sixxis!',
    produto: 'Climatizador SX040',
  },
  {
    nome: 'Carlos Eduardo S.',
    cidade: 'Campinas, SP',
    nota: 5,
    texto: 'Atendimento excelente, me ajudaram com todas as dúvidas pelo WhatsApp. Produto chegou antes do prazo.',
    produto: 'Climatizador SX040',
  },
  {
    nome: 'Mariana F.',
    cidade: 'Ribeirão Preto, SP',
    nota: 5,
    texto: 'Comprei a bike spinning e a qualidade superou minha expectativa. Robusta, silenciosa e fácil de montar.',
    produto: 'Bike Spinning',
  },
  {
    nome: 'Roberto A.',
    cidade: 'Araçatuba, SP',
    nota: 5,
    texto: 'Melhor custo-benefício do mercado. A Sixxis tem um suporte técnico diferenciado, resolveram meu problema em menos de 24h.',
    produto: 'Climatizador SX040',
  },
]

export default function Depoimentos() {
  return (
    <section className="min-h-[260px] py-10 md:min-h-[340px] md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="mb-7 text-[26px] font-extrabold leading-[1.12] text-sx-text sm:text-[32px]">O que nossos clientes dizem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {depoimentos.map((d, i) => (
            <div
              key={i}
              className="border border-sx-line rounded-2xl p-5 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-[0_10px_26px_rgba(17,32,28,0.07)]"
              style={{ backgroundColor: 'var(--sx-surface)' }}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: d.nota }).map((_, s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-sx-muted leading-relaxed flex-1">&ldquo;{d.texto}&rdquo;</p>
              <div className="pt-2 border-t border-sx-line">
                <p className="text-xs font-bold text-sx-text">{d.nome}</p>
                <p className="text-xs text-sx-muted">{d.cidade} · {d.produto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
