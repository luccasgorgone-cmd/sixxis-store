import Link from 'next/link'
import { ArrowRight, ChevronDown, Headphones, MessageCircle, ShieldCheck } from 'lucide-react'
import WhatsAppTrackedLink from '@/components/analytics/WhatsAppTrackedLink'
import { DESCONTO_PIX_PCT } from '@/lib/preco-pix'
import { PROMO_BF, promoAtiva } from '@/lib/promo-segunda-unidade'

const PASSOS = [
  {
    titulo: 'Escolha dois produtos',
    texto: PROMO_BF.ressalva ? `Podem ser iguais ou diferentes, ${PROMO_BF.ressalva}.` : 'Podem ser iguais ou diferentes.',
  },
  { titulo: 'Ganhe 50% no de menor valor', texto: 'O desconto entra sozinho no carrinho.' },
  { titulo: `Pague no Pix com mais ${DESCONTO_PIX_PCT}%`, texto: 'Aplicado sobre o total já promocional.' },
]

const DUVIDAS = [
  {
    pergunta: 'Posso escolher dois produtos diferentes?',
    resposta: 'Sim. Você pode combinar produtos diferentes ou levar duas unidades do mesmo modelo.',
  },
  {
    pergunta: 'Em qual produto entra o desconto?',
    resposta: 'Os 50% entram sempre na unidade de menor valor de cada par do carrinho.',
  },
  {
    pergunta: 'O desconto no Pix continua valendo?',
    resposta: `Sim. Os ${DESCONTO_PIX_PCT}% no Pix são aplicados sobre o total já com a promoção.`,
  },
  {
    pergunta: 'Todos os produtos participam?',
    resposta: 'Todos participam, exceto o Climatizador SX200 Prime.',
  },
  {
    pergunta: 'Posso usar cupom junto com a promoção?',
    resposta: 'Não. Quando a promoção da 2ª unidade se aplica ao carrinho, o cupom não é acumulado.',
  },
  {
    pergunta: 'Até quando vale?',
    resposta: 'A Black Friday Sixxis vale até 30/11/2026, às 23h59, horário de Brasília.',
  },
]

function Titulo({ titulo, apoio }: { titulo: React.ReactNode; apoio: string }) {
  return (
    <div className="mb-7 max-w-2xl md:mb-9">
      <h2 className="text-[26px] font-extrabold leading-[1.12] text-sx-text sm:text-[32px] lg:text-[38px]">{titulo}</h2>
      <p className="mt-2.5 text-sm leading-relaxed text-sx-muted sm:text-base">{apoio}</p>
    </div>
  )
}

export function OfertaDupla() {
  if (!promoAtiva()) return null
  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="sx-escuro grid gap-8 rounded-2xl bg-[#0b1413] px-6 py-9 sm:px-10 md:py-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:px-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sx-accent-text">Black Friday Sixxis</p>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] text-white sm:text-[36px] lg:text-[42px]">
              Uma escolha é boa.<br />Duas, melhor ainda.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-sx-muted sm:text-base">
              Leve dois produtos e a 2ª unidade sai com {PROMO_BF.percentual}% OFF
              {PROMO_BF.ressalva ? <> ({PROMO_BF.ressalva})</> : null}. Válido até 30/11.
            </p>
            <Link
              href="/produtos"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-sx-accent px-6 text-sm font-bold text-sx-ink transition-colors hover:bg-sx-accent-hover"
            >
              Montar minha dupla <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ol className="divide-y divide-sx-line border-y border-sx-line">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo} className="flex items-start gap-4 py-4">
                <span className="w-7 shrink-0 text-lg font-extrabold leading-6 text-sx-accent-text tabular-nums">{i + 1}</span>
                <span>
                  <span className="block text-[15px] font-bold leading-6 text-white">{passo.titulo}</span>
                  <span className="block text-[13px] leading-5 text-sx-muted">{passo.texto}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export function SuporteSixxis({ whatsappVendas, whatsappSuporte }: { whatsappVendas: string; whatsappSuporte: string }) {
  const classeCard = 'group flex h-full flex-col rounded-xl border border-sx-line bg-sx-surface p-5 transition-[border-color,box-shadow] duration-200 hover:border-sx-accent/60 hover:shadow-[0_10px_26px_rgba(17,32,28,0.07)] sm:p-6'
  const classeIcone = 'mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sx-tint text-sx-accent-text'
  const classeAcao = 'mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-sx-accent-text'
  return (
    <section className="border-t border-sx-line bg-sx-raised py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Titulo
          titulo={<>Uma boa compra.<br />Suporte de verdade.</>}
          apoio="Converse com a equipe Sixxis antes de escolher e conte com os canais de apoio depois da compra."
        />
        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          <WhatsAppTrackedLink
            telefone={whatsappVendas}
            texto="Olá! Vim pelo site Sixxis e quero ajuda para escolher um produto."
            target="_blank"
            rel="noopener noreferrer"
            className={classeCard}
          >
            <span className={classeIcone}><MessageCircle size={20} aria-hidden="true" /></span>
            <span className="text-base font-bold text-sx-text">Ajuda para escolher</span>
            <span className="mt-1 text-sm leading-relaxed text-sx-muted">Fale com o atendimento comercial pelo WhatsApp.</span>
            <span className={classeAcao}>Falar com vendas <ArrowRight size={14} aria-hidden="true" /></span>
          </WhatsAppTrackedLink>
          <WhatsAppTrackedLink
            telefone={whatsappSuporte}
            texto="Olá! Vim pelo site Sixxis e preciso de suporte técnico."
            target="_blank"
            rel="noopener noreferrer"
            className={classeCard}
          >
            <span className={classeIcone}><Headphones size={20} aria-hidden="true" /></span>
            <span className="text-base font-bold text-sx-text">Assistência técnica</span>
            <span className="mt-1 text-sm leading-relaxed text-sx-muted">Suporte para instalação, uso e manutenção.</span>
            <span className={classeAcao}>Falar com o suporte <ArrowRight size={14} aria-hidden="true" /></span>
          </WhatsAppTrackedLink>
          <Link href="/garantia" className={classeCard}>
            <span className={classeIcone}><ShieldCheck size={20} aria-hidden="true" /></span>
            <span className="text-base font-bold text-sx-text">Garantia Sixxis</span>
            <span className="mt-1 text-sm leading-relaxed text-sx-muted">Entenda a cobertura de 12 meses e como acionar.</span>
            <span className={classeAcao}>Ver garantia <ArrowRight size={14} aria-hidden="true" /></span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export function DuvidasBlackFriday() {
  if (!promoAtiva()) return null
  return (
    <section className="border-t border-sx-line py-12 md:py-16">
      <div className="mx-auto grid max-w-7xl gap-2 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <Titulo titulo={<>Black Friday.<br />Sem complicar.</>} apoio="Entenda a promoção e escolha com tranquilidade." />
        <div className="border-t border-sx-line">
          {DUVIDAS.map((item) => (
            <details key={item.pergunta} className="group border-b border-sx-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[15px] font-bold text-sx-text [&::-webkit-details-marker]:hidden">
                {item.pergunta}
                <ChevronDown size={18} className="shrink-0 text-sx-subtle transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="max-w-2xl pb-4 pr-8 text-sm leading-relaxed text-sx-muted">{item.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
