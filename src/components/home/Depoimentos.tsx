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
    <section className="bg-white border-b border-gray-100 py-10 min-h-[260px] md:min-h-[340px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">O que nossos clientes dizem</h2>
          <div className="w-12 h-0.5 bg-[#3cbfb3] mt-1 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {depoimentos.map((d, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200/80 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: d.nota }).map((_, s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">&ldquo;{d.texto}&rdquo;</p>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-900">{d.nome}</p>
                <p className="text-xs text-gray-400">{d.cidade} · {d.produto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
