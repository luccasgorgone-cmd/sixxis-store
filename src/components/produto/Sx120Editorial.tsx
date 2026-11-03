'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './Sx120Editorial.module.css'

const BASE = '/produtos/sx120-prime/editorial-v3'
const COBERTURA_MAXIMA = 140

const ESPECIFICACOES = [
  ['Marca', 'Sixxis'],
  ['Modelo', 'SX120 Prime'],
  ['Capacidade do tanque', '120 L'],
  ['Vazão de ar', '14.000 m³/h'],
  ['Potência', '450 W'],
  ['Tensão / frequência', '220 V / 60 Hz'],
  ['Cobertura', 'Até 140 m²'],
  ['Alcance do fluxo', '16 m'],
  ['Velocidades', '9'],
  ['Consumo de água', '6 a 15 L/h'],
  ['Nível de ruído', '60 dB'],
  ['Ventilação', 'Hélice'],
  ['Oscilação vertical', 'Manual'],
  ['Oscilação horizontal', 'Automática'],
  ['Eficiência energética', 'A'],
  ['Peso', '38 kg'],
  ['Dimensões', '92 × 49 × 141 cm'],
  ['Acabamento desta página', 'Branco'],
  ['Garantia', '12 meses'],
  ['Painel evaporativo', '4 cm'],
  ['Filtro anti-pó', 'Sim'],
  ['Controle', 'Digital + remoto'],
] as const

const FAQS = [
  {
    pergunta: 'O SX120 Prime precisa de instalação?',
    resposta: 'Não. É plug-and-play: escolha a versão 220 V, conecte à tomada compatível, abasteça o reservatório e opere.',
  },
  {
    pergunta: 'Qual área ele atende?',
    resposta: 'A cobertura publicada é de até 140 m². O resultado depende de ventilação, incidência solar, layout e condições do ambiente.',
  },
  {
    pergunta: 'Ele substitui o ar-condicionado?',
    resposta: 'São tecnologias diferentes. O climatizador promove circulação e umidificação do ar e não usa compressor para refrigerar um ambiente fechado.',
  },
  {
    pergunta: 'O controle remoto está incluso?',
    resposta: 'Sim. A ficha oficial informa controle digital com controle remoto.',
  },
  {
    pergunta: 'Qual é a voltagem?',
    resposta: 'Este produto é 220 V / 60 Hz. A seleção é obrigatória antes da compra.',
  },
  {
    pergunta: 'Qual é a garantia?',
    resposta: 'A garantia oficial publicada é de 12 meses, com assistência e peças Sixxis.',
  },
] as const

interface Props {
  precoCartao: number
  precoPix: number
  mediaAvaliacoes: number
  totalAvaliacoes: number
}

function moeda(valor: number, casas = 2) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

export default function Sx120Editorial({
  precoCartao,
  precoPix,
  mediaAvaliacoes,
  totalAvaliacoes,
}: Props) {
  const [area, setArea] = useState(80)
  const dentroDaCobertura = area <= COBERTURA_MAXIMA
  const nota = totalAvaliacoes > 0 ? mediaAvaliacoes : 0

  return (
    <main className={styles.root} aria-label="Conteúdo editorial do SX120 Prime Branco">
      <section className={`${styles.storyScene} ${styles.storyIntro}`} id="desempenho" aria-labelledby="sx120-story-title">
        <Image className={styles.sceneBackground} src={`${BASE}/scenes/terrace-warm-empty-v1.png`} alt="" fill sizes="100vw" aria-hidden="true" />
        <figure className={styles.storyProduct}>
          <Image src={`${BASE}/product/sx120-prime-branco-official-cutout-v2.png`} alt="Climatizador Sixxis SX120 Prime Branco em ângulo frontal" width={1254} height={1254} sizes="(max-width: 820px) 82vw, 46vw" />
        </figure>
        <div className={styles.storyCopy}>
          <h2 id="sx120-story-title">Conforto em escala.</h2>
          <p>Vazão e autonomia para áreas amplas, com cobertura informada de até 140 m².</p>
          <dl className={styles.storyFacts}>
            <div><dt>Cobertura</dt><dd>até 140 m²</dd></div>
            <div><dt>Vazão</dt><dd>14.000 m³/h</dd></div>
            <div><dt>Reservatório</dt><dd>120 L</dd></div>
          </dl>
        </div>
      </section>

      <section className={styles.airflowStory} aria-labelledby="airflow-title">
        <figure className={styles.airflowProduct}>
          <Image src={`${BASE}/product/sx120-prime-branco-official-cutout-v2.png`} alt="SX120 Prime Branco com grelhas frontal e lateral visíveis" width={1254} height={1254} sizes="(max-width: 820px) 86vw, 48vw" />
        </figure>
        <div className={styles.airflowCopy}>
          <h2 id="airflow-title">Alto fluxo.</h2>
          <p className={styles.airflowNumber}><strong>14.000</strong><span>m³/h de vazão</span></p>
          <p className={styles.airflowNote}>Distribuição ajustável para adaptar o fluxo à rotina do ambiente.</p>
          <dl className={styles.airflowSpecs}>
            <div><dt>Velocidades</dt><dd>9</dd></div>
            <div><dt>Alcance</dt><dd>16 m</dd></div>
            <div><dt>Ruído informado</dt><dd>60 dB</dd></div>
          </dl>
        </div>
      </section>

      <section className={`${styles.featureStory} ${styles.featureControl}`} id="controle" aria-labelledby="control-title">
        <figure className={styles.featureMedia}>
          <Image src={`${BASE}/macros/sx120-prime-branco-02-controles-1600-canonical-v3.jpg`} alt="Painel digital touchscreen oficial do SX120 Prime Branco" width={1600} height={1600} sizes="(max-width: 820px) 100vw, 59vw" />
        </figure>
        <div className={styles.featureCopy}>
          <h2 id="control-title">Controle direto.</h2>
          <p>Painel digital touchscreen e controle remoto para ajustar o conforto sem complicação.</p>
          <ul className={styles.featureList}>
            <li>9 velocidades de operação</li>
            <li>Oscilação horizontal automática</li>
            <li>Oscilação vertical manual</li>
            <li>Filtro anti-pó</li>
          </ul>
        </div>
      </section>

      <section className={`${styles.featureStory} ${styles.featureWater}`} aria-labelledby="water-title">
        <figure className={styles.featureMedia}>
          <Image src={`${BASE}/macros/sx120-prime-branco-03-reservatorio-1600-canonical-v3.jpg`} alt="Abertura frontal de abastecimento e indicador do reservatório do SX120 Prime" width={1600} height={1600} sizes="(max-width: 820px) 100vw, 59vw" />
        </figure>
        <div className={styles.featureCopy}>
          <h2 id="water-title">Abastecimento frontal.</h2>
          <p>Abasteça pela abertura frontal, sem deslocar o climatizador.</p>
          <p className={styles.featureProof}><strong>120 L</strong><span>manual ou com engate rápido</span></p>
          <p className={styles.featureFootnote}>Consumo de água informado entre 6 e 15 L/h, conforme as condições de uso.</p>
        </div>
      </section>

      <section className={styles.coverageSection} aria-labelledby="coverage-title">
        <div className={styles.coverageCopy}>
          <h2 id="coverage-title">Cabe no seu espaço?</h2>
          <p>Escolha a área aproximada. O medidor compara o valor com a cobertura oficial de até 140 m².</p>
        </div>
        <div className={styles.coverageTool}>
          <div className={styles.coverageReadout}>
            <p>Seu ambiente</p>
            <output htmlFor="coverage-range">{area} m²</output>
          </div>
          <input id="coverage-range" name="area" type="range" min="20" max="180" value={area} step="10" autoComplete="off" aria-label="Tamanho do ambiente em metros quadrados" onChange={(event) => setArea(Number(event.target.value))} />
          <div className={styles.coverageScale} aria-hidden="true"><span>20 m²</span><span>140 m²</span><span>180 m²</span></div>
          <p className={`${styles.coverageResult} ${dentroDaCobertura ? styles.covered : styles.over}`} aria-live="polite">
            <strong>{dentroDaCobertura ? 'Dentro da cobertura indicada.' : 'Acima da cobertura indicada.'}</strong>{' '}
            {dentroDaCobertura ? 'O SX120 Prime atende ambientes de até 140 m².' : 'Para esta área, compare um modelo de maior capacidade com a equipe Sixxis.'}
          </p>
        </div>
      </section>

      <section className={styles.economySection} aria-labelledby="economy-title">
        <div className={styles.economyLead}>
          <h2 id="economy-title">Consumo eficiente.</h2>
          <p className={styles.economyAmount}><strong>R$ 1.683</strong><span>de economia estimada por mês</span></p>
          <p>Comparação publicada pela Sixxis contra três aparelhos de ar-condicionado de 30.000 BTU para climatizar uma área de 140 m².</p>
        </div>
        <div className={styles.comparison}>
          <div className={styles.comparisonHead}><span></span><strong>Ar-condicionado</strong><strong>SX120 Prime</strong></div>
          <div><span>Consumo</span><strong>8.700 W</strong><strong>450 W</strong></div>
          <div><span>Custo mensal</span><strong>R$ 1.774,80</strong><strong>R$ 91,80</strong></div>
          <div><span>Custo anual</span><strong>R$ 21.297,60</strong><strong>R$ 1.101,60</strong></div>
          <p className={styles.comparisonNote}>Base informada: 8 h/dia × 30 dias × R$ 0,85/kWh. O consumo real varia conforme uso, ambiente e tarifa.</p>
        </div>
      </section>

      <section className={styles.specsSection} id="especificacoes" aria-labelledby="specs-title">
        <div className={styles.sectionHeading}>
          <h2 id="specs-title">Ficha completa</h2>
          <p>Todos os dados técnicos publicados no produto, organizados para comparação rápida.</p>
        </div>
        <dl className={styles.specsList}>
          {ESPECIFICACOES.map(([label, valor]) => <div key={label}><dt>{label}</dt><dd>{valor}</dd></div>)}
        </dl>
      </section>

      <section className={styles.reviewsSection} id="avaliacoes" aria-labelledby="reviews-title">
        <div className={styles.reviewsHeading}>
          <h2 id="reviews-title">Avaliação publicada.</h2>
          <p>Avaliação agregada publicada na página oficial do SX120 Prime.</p>
        </div>
        <div className={styles.reviewsScore}>
          <strong>{nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong>
          <div>
            <span className={styles.stars} aria-hidden="true">★★★★★</span>
            <span className={styles.srOnly}>{nota.toFixed(1)} de 5 estrelas.</span>
            <p>{totalAvaliacoes > 0 ? `${totalAvaliacoes} avaliações verificadas` : 'Ainda sem avaliações publicadas'}</p>
          </div>
        </div>
        <a className={styles.reviewsLink} href="#produto">Voltar à compra</a>
      </section>

      <section className={styles.trustSection} id="suporte" aria-labelledby="trust-title">
        <div className={styles.sectionHeading}>
          <h2 id="trust-title">Suporte que continua.</h2>
          <p>Suporte humano antes, durante e depois da entrega.</p>
        </div>
        <div className={styles.trustLines}>
          <p><strong>30 anos</strong><span>de mercado brasileiro</span></p>
          <p><strong>12 meses</strong><span>de garantia oficial Sixxis</span></p>
          <p><strong>Fábrica</strong><span>assistência e peças oficiais</span></p>
          <p><strong>Brasil</strong><span>entrega para todo o país</span></p>
        </div>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title">
        <h2 id="faq-title">Dúvidas de compra</h2>
        <div className={styles.faqReading}>
          {FAQS.map((item) => <p key={item.pergunta}><strong>{item.pergunta}</strong> {item.resposta}</p>)}
        </div>
      </section>

      <section className={`${styles.storyScene} ${styles.finalCta}`} aria-labelledby="final-title">
        <Image className={`${styles.sceneBackground} ${styles.finalBackground}`} src={`${BASE}/scenes/hospitality-pool-empty-v1.png`} alt="" fill sizes="100vw" aria-hidden="true" />
        <figure className={styles.storyProduct}>
          <Image src={`${BASE}/product/sx120-prime-branco-official-cutout-v2.png`} alt="Climatizador Sixxis SX120 Prime Branco em ambiente amplo" width={1254} height={1254} sizes="(max-width: 820px) 82vw, 46vw" />
        </figure>
        <div className={styles.finalCopy}>
          <h2 id="final-title">Conforto em escala.</h2>
          <p>14.000 m³/h, reservatório de 120 L e cobertura de até 140 m².</p>
          <p className={styles.finalPrice}>10x de R$ {moeda(precoCartao / 10)} sem juros<br /><strong>R$ {moeda(precoPix)} no Pix</strong></p>
          <a className={styles.finalButton} href="#produto">Escolher 220V</a>
        </div>
      </section>
    </main>
  )
}
