'use client'

export default function FooterAtendimentoBtn() {
  return (
    <button
      onClick={() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window !== 'undefined' && (window as any).sixxisRestaurarBotoes) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(window as any).sixxisRestaurarBotoes()
        }
      }}
      className="text-sm text-white/60 hover:text-white transition-colors text-left"
    >
      Atendimento ao vivo
    </button>
  )
}
