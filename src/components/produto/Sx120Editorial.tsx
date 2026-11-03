import Image from 'next/image'

const EDITORIAIS = [
  {
    src: '/produtos/sx120-prime/editorial/01-hero-sx120-prime-branco-1080x1350.png',
    alt: 'SX120 Prime Branco em vista frontal, peça editorial Grande por natureza',
  },
  {
    src: '/produtos/sx120-prime/editorial/02-angulo-traseiro-sx120-prime-branco-1080x1350.png',
    alt: 'SX120 Prime Branco em ângulo traseiro, com filtros e especificações técnicas visíveis',
  },
  {
    src: '/produtos/sx120-prime/editorial/03-reservatorio-abastecimento-frontal-sx120-1080x1350.png',
    alt: 'Abertura frontal do reservatório do SX120 Prime Branco para abastecimento',
  },
  {
    src: '/produtos/sx120-prime/editorial/04-painel-touchscreen-controle-sx120-1080x1350.png',
    alt: 'Painel digital touchscreen e controle remoto do SX120 Prime Branco',
  },
  {
    src: '/produtos/sx120-prime/editorial/05-contexto-apresentador-sixxis-sx120-1080x1350.png',
    alt: 'Apresentador Sixxis ao lado do SX120 Prime Branco, mostrando a escala real do produto',
  },
  {
    src: '/produtos/sx120-prime/editorial/06-fluxo-9-velocidades-sx120-1080x1350.png',
    alt: 'Grade frontal e fluxo ajustável com nove velocidades do SX120 Prime Branco',
  },
] as const

export default function Sx120Editorial() {
  return (
    <section
      id="produto-real"
      aria-labelledby="sx120-editorial-title"
      className="my-12 overflow-hidden rounded-[2rem] bg-[#0f1513] px-4 py-16 text-white sm:px-8 lg:px-12 lg:py-20"
    >
      <div className="mb-10 grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#3cbfb3] lg:col-span-4 lg:self-start">
          SX120 Prime Branco · produto real
        </p>
        <h2
          id="sx120-editorial-title"
          className="max-w-[13ch] text-4xl font-black leading-[0.92] tracking-[-0.05em] text-balance sm:text-5xl lg:col-span-5 lg:text-6xl"
        >
          6 vistas. Nenhum detalhe inventado.
        </h2>
        <p className="max-w-[38ch] text-sm leading-relaxed text-[#d9e0dd] sm:text-base lg:col-span-3">
          Uma leitura editorial do aparelho em uso, construída exclusivamente com frames dos vídeos oficiais aprovados pela Sixxis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {EDITORIAIS.map((imagem) => (
          <figure key={imagem.src} className="overflow-hidden bg-[#222b28]">
            <Image
              src={imagem.src}
              alt={imagem.alt}
              width={1080}
              height={1350}
              sizes="(min-width: 1024px) 29vw, (min-width: 640px) 46vw, 92vw"
              className="h-auto w-full"
            />
          </figure>
        ))}
      </div>

      <p className="mt-6 max-w-[62ch] text-xs leading-relaxed text-[#c7d0cc] sm:text-sm">
        Imagens preservadas em 4:5, sem recorte automático, reconstrução, recoloração ou geração por IA.
      </p>
    </section>
  )
}
