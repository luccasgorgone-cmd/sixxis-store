import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

// ── REGRAS DE CÁLCULO (espelham EconomiaBloco) ──────────────────────────────
const TARIFA   = 0.85
const HORAS    = 8
const DIAS     = 30
const CONSUMO_AC_9K_BTU = 870 // W

function custoMes(watts: number): number {
  return (watts / 1000) * HORAS * DIAS * TARIFA
}
function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Especificações oficiais ─────────────────────────────────────────────────
interface Climatizador {
  slug: string
  nome: string
  modelo: string
  w: number
  area: number
  vazao: number
  tanque: number
  dB: number
  contexto: string
}

const CLIMATIZADORES: Climatizador[] = [
  { slug: 'm45-trend',   nome: 'Climatizador M45 Trend',   modelo: 'M45 Trend',   w: 180,  area: 45,  vazao: 5500,  tanque: 45,  dB: 55, contexto: 'quarto, escritório home-office ou sala pequena' },
  { slug: 'sx040',       nome: 'Climatizador SX040',       modelo: 'SX040',       w: 180,  area: 45,  vazao: 5500,  tanque: 45,  dB: 55, contexto: 'quarto, escritório home-office ou sala pequena' },
  { slug: 'sx060-prime', nome: 'Climatizador SX060 Prime', modelo: 'SX060 Prime', w: 350,  area: 60,  vazao: 8500,  tanque: 60,  dB: 58, contexto: 'sala + cozinha integradas ou quarto master' },
  { slug: 'sx070-trend', nome: 'Climatizador SX070 Trend', modelo: 'SX070 Trend', w: 280,  area: 70,  vazao: 9500,  tanque: 70,  dB: 58, contexto: 'sala + cozinha integradas ou quarto master' },
  { slug: 'sx100-trend', nome: 'Climatizador SX100 Trend', modelo: 'SX100 Trend', w: 400,  area: 100, vazao: 12000, tanque: 100, dB: 62, contexto: 'salão comercial, oficina ou área gourmet' },
  { slug: 'sx120-prime', nome: 'Climatizador SX120 Prime', modelo: 'SX120 Prime', w: 500,  area: 120, vazao: 14000, tanque: 120, dB: 62, contexto: 'salão comercial, oficina ou área gourmet' },
  { slug: 'sx200-trend', nome: 'Climatizador SX200 Trend', modelo: 'SX200 Trend', w: 750,  area: 175, vazao: 20000, tanque: 175, dB: 65, contexto: 'galpão, indústria, academia ou espaço amplo com pé-direito alto' },
  { slug: 'sx200-prime', nome: 'Climatizador SX200 Prime', modelo: 'SX200 Prime', w: 1100, area: 200, vazao: 24000, tanque: 200, dB: 65, contexto: 'galpão, indústria, academia ou espaço amplo com pé-direito alto' },
]

function htmlClimatizador(c: Climatizador): string {
  const consumoMes   = custoMes(c.w)
  const custoAC      = custoMes(CONSUMO_AC_9K_BTU)
  const economiaAno  = (custoAC - consumoMes) * 12
  const consumoMesFmt  = fmt(consumoMes)
  const economiaAnoFmt = fmt(economiaAno)

  return `<div class="produto-hero">
  <h2>Climatizador Sixxis ${c.modelo}</h2>
  <p class="destaque">Potência, silêncio e economia em um único produto.<br/>O aliado perfeito para o seu conforto em todas as estações.</p>
</div>

<section>
  <h3>Por que escolher o ${c.modelo}?</h3>

  <h4>Economia de até 79% na conta de luz</h4>
  <p>Enquanto um ar-condicionado split 9.000 BTU consome cerca de R$ 177/mês (8h/dia), o ${c.modelo} gasta apenas R$ ${consumoMesFmt}/mês. Você economiza mais de R$ ${economiaAnoFmt} por ano — sem abrir mão do frescor.</p>

  <h4>Ar mais saudável para toda a família</h4>
  <p>Ao contrário do ar-condicionado, que resseca o ambiente, o climatizador umidifica o ar naturalmente. Resultado: menos alergias, crises de rinite e bronquite, irritação na pele e mucosas. Ideal para crianças, idosos e quem sofre com problemas respiratórios.</p>

  <h4>Instalação plug-and-play</h4>
  <p>Zero obra. Zero instalação profissional. Ligue na tomada e pronto — você já está refrescando o ambiente. Rodízios nas quatro rodas para mover de cômodo em cômodo.</p>

  <h4>Até ${c.area} m² de cobertura</h4>
  <p>Tecnologia de vazão de ar de ${c.vazao} m³/h e reservatório de ${c.tanque} litros para horas de uso contínuo. Perfeito para ${c.contexto}.</p>
</section>

<section>
  <h3>Características técnicas</h3>
  <ul>
    <li>Potência: ${c.w} W</li>
    <li>Vazão de ar: ${c.vazao} m³/h</li>
    <li>Capacidade do tanque: ${c.tanque} L</li>
    <li>Nível de ruído: abaixo de ${c.dB} dB (mais silencioso que uma geladeira)</li>
    <li>3 velocidades + oscilação vertical automática</li>
    <li>Controle remoto incluso</li>
    <li>Voltagem: 110V ou 220V</li>
  </ul>
</section>

<section>
  <h3>Ideal para quem busca:</h3>
  <ul>
    <li>Reduzir drasticamente a conta de luz sem abrir mão do conforto</li>
    <li>Ar respirável e saudável em casa</li>
    <li>Solução para cômodos sem possibilidade de instalar split</li>
    <li>Alívio rápido nos dias quentes do verão brasileiro</li>
    <li>Portabilidade: usar em vários cômodos sem complicação</li>
  </ul>
</section>

<section>
  <h3>Você compra com segurança</h3>
  <p>12 meses de garantia oficial Sixxis, importadora direta. Assistência técnica especializada, peças originais e suporte humano via WhatsApp. Em 30 anos, já ajudamos mais de 1 milhão de brasileiros a economizar.</p>
</section>`
}

const HTML_BRAVO = `<div class="produto-hero">
  <h2>Aspirador Vertical Sixxis Bravo S2</h2>
  <p class="destaque">Potência de aspirador industrial. Praticidade de vertical sem fio.</p>
</div>

<section>
  <h3>Por que o Bravo S2 é diferente?</h3>

  <h4>Aspira o que outros deixam passar</h4>
  <p>Motor de alta rotação com sucção constante até a bateria zerar. Não perde força com o tanque cheio.</p>

  <h4>Filtro HEPA que retém ácaros e pólen</h4>
  <p>Filtragem de 99,9% das partículas alérgenas. Ar mais limpo em toda a casa — aliado para quem sofre com rinite, asma ou convive com pets.</p>

  <h4>Leve, silencioso e sem fio</h4>
  <p>Menos de 2,5 kg. Você limpa escadas, sofá, cortinas e carro sem esforço. Bateria lítio dura até 40 minutos.</p>

  <h4>Converte em aspirador de mão</h4>
  <p>Destaque o corpo e use como portátil para cantos difíceis, dentro do carro ou para migalhas na mesa.</p>
</section>

<section>
  <h3>Características técnicas</h3>
  <ul>
    <li>Potência de sucção: alta performance com motor digital</li>
    <li>Filtro HEPA lavável (99,9% de retenção)</li>
    <li>Autonomia: até 40 minutos por carga</li>
    <li>Peso: menos de 2,5 kg</li>
    <li>Bateria: lítio recarregável com indicador de nível</li>
    <li>Acessórios: escova motorizada, bocal fino, escova para estofados</li>
    <li>Voltagem do carregador: bivolt 110V/220V</li>
  </ul>
</section>

<section>
  <h3>Ideal para quem busca:</h3>
  <ul>
    <li>Limpeza rápida sem precisar desenrolar fio a cada cômodo</li>
    <li>Ar mais puro em casa — aliado contra rinite e alergias</li>
    <li>Manter pelos de pet sob controle sem esforço</li>
    <li>Higienização de carro, sofá, cortinas e cantos difíceis</li>
    <li>Um aspirador leve o bastante para usar todo dia</li>
  </ul>
</section>

<section>
  <h3>Você compra com segurança</h3>
  <p>12 meses de garantia oficial Sixxis, importadora direta. Assistência técnica especializada, peças originais e suporte humano via WhatsApp. Em 30 anos, já ajudamos mais de 1 milhão de brasileiros.</p>
</section>`

const HTML_SPINNING = `<div class="produto-hero">
  <h2>Bicicleta Spinning Sixxis Life</h2>
  <p class="destaque">Treino profissional de cardio sem sair de casa.</p>
</div>

<section>
  <h3>Por que a Sixxis Life?</h3>

  <h4>Queima até 600 calorias por hora</h4>
  <p>Pedalada com resistência magnética ajustável em 8 níveis. Treino de alta intensidade ou recuperação ativa — você controla.</p>

  <h4>Baixo impacto nas articulações</h4>
  <p>Diferente da corrida, o spinning preserva joelhos e tornozelos. Ideal para pessoas com lesões, sobrepeso ou que estão voltando a treinar.</p>

  <h4>Painel digital com métricas ao vivo</h4>
  <p>Tempo, velocidade, distância, calorias e batimentos. Suporte para celular/tablet — treina com vídeo aula, Peloton ou playlist no Spotify.</p>

  <h4>Roda de inércia de 18 kg</h4>
  <p>Pedalada suave e silenciosa. Toda a vizinhança agradece — você treina até nas primeiras horas da manhã sem incomodar ninguém.</p>
</section>

<section>
  <h3>Características técnicas</h3>
  <ul>
    <li>Roda de inércia: 18 kg</li>
    <li>Resistência: magnética com 8 níveis ajustáveis</li>
    <li>Painel digital: tempo, velocidade, distância, calorias, batimentos</li>
    <li>Suporte para celular/tablet integrado</li>
    <li>Assento e guidão com ajuste vertical e horizontal</li>
    <li>Pedais com firma-pé e correias de segurança</li>
    <li>Capacidade de peso: até 120 kg</li>
  </ul>
</section>

<section>
  <h3>Ideal para quem busca:</h3>
  <ul>
    <li>Treino cardiovascular de alto rendimento em casa</li>
    <li>Emagrecimento com baixo impacto nas articulações</li>
    <li>Continuidade no treino em dias de chuva, frio ou agenda apertada</li>
    <li>Reabilitação física orientada por profissional</li>
    <li>Condicionamento complementar para ciclistas de estrada</li>
  </ul>
</section>

<section>
  <h3>Você compra com segurança</h3>
  <p>12 meses de garantia oficial Sixxis, importadora direta. Assistência técnica especializada, peças originais e suporte humano via WhatsApp. Em 30 anos, já ajudamos mais de 1 milhão de brasileiros a cuidar da saúde.</p>
</section>`

// ── Execução ────────────────────────────────────────────────────────────────
async function atualizar(slug: string, nome: string, descricao: string) {
  const p = await prisma.produto.findUnique({ where: { slug } })
  if (!p) {
    console.warn(`[skip] ${slug} não encontrado`)
    return false
  }
  await prisma.produto.update({
    where: { slug },
    data: { nome, descricao },
  })
  console.log(`[ok]   ${slug} atualizado (${descricao.length} chars)`)
  return true
}

async function main() {
  let ok = 0
  let total = 0

  for (const c of CLIMATIZADORES) {
    total++
    if (await atualizar(c.slug, c.nome, htmlClimatizador(c))) ok++
  }

  total++
  if (await atualizar('asp-bravo', 'Aspirador Vertical Sixxis Bravo S2', HTML_BRAVO)) ok++

  total++
  if (await atualizar('spinning-sixxis-life', 'Bicicleta Spinning Sixxis Life', HTML_SPINNING)) ok++

  console.log(`\n${ok}/${total} descrições atualizadas.`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
