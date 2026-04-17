import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

interface Alvo {
  slugPrefer: string
  matchers: string[]  // substrings para fallback no slug/nome/sku
  nome: string
  descricao: string
}

// ── Descrições HTML completas — sem emojis ────────────────────────────────────

const DESCRICOES: Alvo[] = [
  // ── M45 Trend ────────────────────────────────────────────────────────────
  {
    slugPrefer: 'm45-trend',
    matchers: ['m45'],
    nome: 'Climatizador M45 Trend',
    descricao: `<h2>Climatizador Sixxis M45 Trend</h2>
<p>Conforto acessível sem abrir mão da qualidade Sixxis. O M45 Trend foi criado para quem quer climatizar ambientes de até 45m² com eficiência energética real e zero instalação.</p>

<h3>Por que o M45 Trend é a escolha certa?</h3>
<ul>
<li>Tanque de 45 litros para longas horas de uso sem reabastecimento</li>
<li>Refresca e umidifica ao mesmo tempo — combate o ressecamento do ar seco</li>
<li>3 velocidades de ventilação para cada momento do dia</li>
<li>Oscilação automática para distribuição uniforme do ar fresco</li>
<li>Filtro lavável e reutilizável — sem custo com descartáveis</li>
<li>Rodízios com trava para posicionar onde precisar</li>
<li>Bivolt 110V/220V — funciona em qualquer tomada do Brasil</li>
<li>Consumo de apenas 180W — até 80% mais econômico que ar-condicionado</li>
</ul>

<h3>Ideal para</h3>
<p>Quartos, escritórios, salas pequenas, consultórios e qualquer ambiente de até 45m². Perfeito para regiões de clima seco como o interior de São Paulo, Minas Gerais, Goiás e Centro-Oeste, onde a umidade do ar é baixa e o climatizador evaporativo entrega o máximo de performance.</p>

<h3>Sem instalação. Sem obra. Sem complicação.</h3>
<p>Liga na tomada, abastece o reservatório e já está funcionando. Mova de quarto para sala quando quiser. Leve para o escritório ou para outra residência. A liberdade que um ar-condicionado nunca vai te dar.</p>

<h3>Garantia Sixxis</h3>
<p>O M45 Trend possui 12 meses de garantia contra defeitos de fabricação, com suporte técnico especializado via WhatsApp. Para acionar a garantia, guarde a nota fiscal e entre em contato com nossa equipe.</p>`,
  },

  // ── SX040 ────────────────────────────────────────────────────────────────
  {
    slugPrefer: 'sx040',
    matchers: ['sx040'],
    nome: 'Climatizador SX040',
    descricao: `<h2>Climatizador Sixxis SX040</h2>
<p>O mais vendido da Sixxis — e não é por acaso. O SX040 entrega o equilíbrio perfeito entre desempenho, economia e custo-benefício para ambientes de até 45m².</p>

<h3>O que faz do SX040 o preferido dos brasileiros</h3>
<ul>
<li>Tanque de 45 litros — até 11 horas de uso contínuo sem reabastecer</li>
<li>Vazão de ar de 5.500 m³/h distribui o ar fresco por todo o ambiente</li>
<li>Umidifica e refresca simultaneamente — combate o ar seco de forma eficaz</li>
<li>3 velocidades + oscilação automática para personalizar seu conforto</li>
<li>Timer programável: configure para desligar enquanto você dorme</li>
<li>Filtro antibacteriano lavável — sem custo mensal com reposição</li>
<li>Painel digital com display LED de fácil leitura</li>
<li>Rodízios com trava para mobilidade total — leve para qualquer cômodo</li>
<li>Bivolt 110V/220V — conecta em qualquer tomada, sem adaptador</li>
<li>Consumo de 180W — economize até R$1.689 por ano vs ar-condicionado</li>
</ul>

<h3>Climatizador ou ar-condicionado: qual a diferença real?</h3>
<p>O ar-condicionado filtra e circula o mesmo ar do ambiente, ressecando as vias respiratórias, pele e mucosas. O SX040 usa a evaporação da água para resfriar o ar externo e devolvê-lo umidificado — mais saudável para toda a família, especialmente crianças, idosos e quem sofre de problemas respiratórios.</p>

<h3>Ideal para</h3>
<p>Quartos, salas, escritórios, recepções, espaços de estudo e home office até 45m². Máximo desempenho em regiões de clima seco — interior de SP, MG, GO, MT, MS, DF e toda a região Centro-Oeste e Sudeste continental.</p>

<h3>Zero instalação. Pronto para usar.</h3>
<p>Sem furos na parede, sem técnico, sem obra. Liga na tomada, coloca água no tanque e em segundos o ar fresco já está circulando. Pode levar para qualquer ambiente, qualquer andar, qualquer cidade.</p>

<h3>Garantia Sixxis</h3>
<p>O SX040 possui 12 meses de garantia contra defeitos de fabricação, com suporte técnico especializado via WhatsApp (18) 99747-4701. Para acionar a garantia, guarde a nota fiscal e entre em contato. Atendemos de segunda a sexta, 8h às 18h.</p>`,
  },

  // ── SX060 Prime ──────────────────────────────────────────────────────────
  {
    slugPrefer: 'sx060-prime',
    matchers: ['sx060'],
    nome: 'Climatizador SX060 Prime',
    descricao: `<h2>Climatizador Sixxis SX060 Prime</h2>
<p>A linha Prime da Sixxis foi desenvolvida para quem exige o melhor. O SX060 Prime combina tecnologia de inversor com climatização evaporativa premium — mais eficiência, menos ruído, mais conforto.</p>

<h3>Tecnologia Prime: o que muda na prática</h3>
<ul>
<li>Motor com tecnologia Inversor CA — ajuste contínuo de velocidade sem solavancos</li>
<li>Consumo de apenas 125W com o motor Inversor — o mais eficiente da linha Sixxis</li>
<li>Menor nível de ruído da categoria — funciona quase em silêncio</li>
<li>Maior vida útil do motor — tecnologia comprovada em equipamentos premium</li>
<li>Controle remoto com display digital de alta precisão</li>
<li>Filtro HEPA antibacteriano de alta eficiência — captura partículas ultrafinas</li>
<li>Sistema de umidificação premium com evaporação uniforme</li>
<li>Bivolt automático 110V/220V</li>
</ul>

<h3>Para quem é o SX060 Prime</h3>
<p>Para quem não aceita compromisso: quem trabalha em home office e precisa de silêncio, quem tem bebê em casa, quem sofre de alergias respiratórias, quem busca o menor consumo de energia possível. O Prime não é o mais barato — é o mais inteligente.</p>

<h3>Garantia Sixxis</h3>
<p>12 meses de garantia contra defeitos de fabricação. Suporte técnico especializado via WhatsApp (18) 99747-4701.</p>`,
  },

  // ── SX070 Trend ──────────────────────────────────────────────────────────
  {
    slugPrefer: 'sx070-trend',
    matchers: ['sx070'],
    nome: 'Climatizador SX070 Trend',
    descricao: `<h2>Climatizador Sixxis SX070 Trend</h2>
<p>Quando o ambiente é grande e o calor é sério, o SX070 Trend entra em cena. Com tanque de 70 litros e potência de 280W, foi projetado para climatizar ambientes amplos com eficiência e autonomia de uso prolongado.</p>

<h3>Feito para ambientes exigentes</h3>
<ul>
<li>Tanque de 70 litros — mais de 14 horas de autonomia sem reabastecer</li>
<li>280W de potência para maior vazão de ar e resfriamento mais rápido</li>
<li>Ideal para salas grandes, salões de beleza, clínicas, escritórios open space e galpões leves</li>
<li>3 velocidades de ventilação com oscilação automática horizontal e vertical</li>
<li>Filtro lavável de alta capacidade para ambientes com mais fluxo de pessoas</li>
<li>Painel digital com timer e controle remoto incluso</li>
<li>Rodízios robustos para movimentação fácil mesmo com tanque cheio</li>
<li>Bivolt 110V/220V</li>
</ul>

<h3>Quando usar o SX070 ao invés do SX040</h3>
<p>Se o seu ambiente tem mais de 45m², se há muitas pessoas no espaço, se o calor é intenso e você precisa de maior potência de resfriamento — o SX070 é a escolha certa. O tanque de 70 litros também significa menos interrupções para abastecimento durante o dia.</p>

<h3>Garantia Sixxis</h3>
<p>12 meses de garantia contra defeitos de fabricação. Suporte via WhatsApp (18) 99747-4701. Seg–Sex 8h às 18h.</p>`,
  },

  // ── SX100 Trend ──────────────────────────────────────────────────────────
  {
    slugPrefer: 'sx100-trend',
    matchers: ['sx100'],
    nome: 'Climatizador SX100 Trend',
    descricao: `<h2>Climatizador Sixxis SX100 Trend</h2>
<p>Potência industrial, uso residencial e comercial. O SX100 Trend foi projetado para dominar ambientes grandes — e fazer isso com a economia que só a Sixxis entrega.</p>

<h3>A força do SX100 em números</h3>
<ul>
<li>Tanque de 100 litros — autonomia de até 20 horas sem reabastecer</li>
<li>400W de potência — o maior fluxo de ar da linha Trend</li>
<li>Ideal para: salões de eventos, galpões industriais leves, ginásios, restaurantes, mercados e grandes escritórios</li>
<li>Sistema de climatização evaporativa de alta performance</li>
<li>Filtragem multistágio com filtros laváveis de fácil manutenção</li>
<li>Rodízios industriais para movimentação em qualquer tipo de piso</li>
<li>Painel digital completo com timer, velocidades e controle remoto</li>
<li>Bivolt 110V/220V</li>
</ul>

<h3>Por que não simplesmente instalar mais ar-condicionado?</h3>
<p>Um ar-condicionado de 60.000 BTU para um galpão consome mais de 6.000W por hora — um custo mensal absurdo. O SX100 consome apenas 400W, climatizando espaços similares com até 93% de economia energética. Para usos comerciais, a diferença na conta de luz paga o equipamento em poucos meses.</p>

<h3>Garantia Sixxis</h3>
<p>12 meses de garantia contra defeitos de fabricação. Suporte técnico especializado para uso comercial via WhatsApp (18) 99747-4701.</p>`,
  },

  // ── SX120 Prime ──────────────────────────────────────────────────────────
  {
    slugPrefer: 'sx120-prime',
    matchers: ['sx120'],
    nome: 'Climatizador SX120 Prime',
    descricao: `<h2>Climatizador Sixxis SX120 Prime</h2>
<p>O topo de linha da família Prime. Para ambientes onde apenas o melhor é aceitável — o SX120 Prime une capacidade máxima com a tecnologia e refinamento da linha premium Sixxis.</p>

<h3>Especificações Prime de alto nível</h3>
<ul>
<li>Maior capacidade da linha Prime Sixxis</li>
<li>Motor Inversor CA de alta eficiência — consumo otimizado mesmo na potência máxima</li>
<li>Sistema de filtragem HEPA Prime com eficiência máxima contra partículas, ácaros e fungos</li>
<li>Nível de ruído ultra-baixo mesmo na velocidade máxima</li>
<li>Painel LCD de alta resolução com controle total das funções</li>
<li>Controle remoto de longo alcance com retroiluminação</li>
<li>Estrutura reforçada para uso intenso em ambientes comerciais</li>
<li>Bivolt automático 110V/220V</li>
</ul>

<h3>Para quem busca o máximo</h3>
<p>SPA, clínicas de estética, estúdios de gravação, hotéis boutique, espaços corporativos de alto padrão — onde conforto, silêncio e qualidade do ar são requisitos inegociáveis. O SX120 Prime não é um produto comum. É um compromisso com a excelência.</p>

<h3>Garantia Sixxis</h3>
<p>12 meses de garantia Prime com atendimento prioritário. Suporte via WhatsApp (18) 99747-4701.</p>`,
  },

  // ── SX200 Trend ──────────────────────────────────────────────────────────
  {
    slugPrefer: 'sx200-trend',
    matchers: ['sx200-trend', 'sx200 trend'],
    nome: 'Climatizador SX200 Trend',
    descricao: `<h2>Climatizador Sixxis SX200 Trend</h2>
<p>Escala industrial com praticidade Sixxis. O SX200 Trend foi desenvolvido para climatização de grandes espaços — armazéns, galpões, centros logísticos, quadras cobertas e espaços de eventos.</p>

<h3>Potência para grandes desafios</h3>
<ul>
<li>Capacidade máxima da linha Trend — para os maiores ambientes</li>
<li>Alto fluxo de ar para circulação eficiente em espaços amplos</li>
<li>Tanque de grande capacidade para máxima autonomia operacional</li>
<li>Construção robusta para uso industrial contínuo</li>
<li>Sistema de filtragem de alta capacidade com manutenção simplificada</li>
<li>Movimentação facilitada por rodízios industriais de alta resistência</li>
<li>Painel de controle intuitivo com indicadores visuais de nível e operação</li>
</ul>

<h3>A matemática do SX200 para uso comercial</h3>
<p>Climatizar 1.000m² com ar-condicionado convencional pode custar R$8.000 ou mais por mês em energia. Com climatizadores evaporativos Sixxis SX200, esse custo cai drasticamente — mantendo o ambiente agradável para funcionários e clientes com uma fração do investimento energético.</p>

<h3>Garantia Sixxis</h3>
<p>12 meses de garantia contra defeitos de fabricação. Suporte técnico para uso industrial via WhatsApp (18) 99747-4701.</p>`,
  },

  // ── SX200 Prime ──────────────────────────────────────────────────────────
  {
    slugPrefer: 'sx200-prime',
    matchers: ['sx200-prime', 'sx200 prime'],
    nome: 'Climatizador SX200 Prime',
    descricao: `<h2>Climatizador Sixxis SX200 Prime</h2>
<p>O equipamento mais avançado da Sixxis. O SX200 Prime une a máxima capacidade da linha Prime com tecnologia de ponta para climatização de grandes ambientes onde excelência não é opcional.</p>

<h3>O Prime mais poderoso da Sixxis</h3>
<ul>
<li>Máxima capacidade de climatização com tecnologia Inversor CA</li>
<li>Consumo energético otimizado mesmo na mais alta potência</li>
<li>Sistema HEPA Prime de última geração — filtração de nível hospitalar</li>
<li>Controle digital avançado com conectividade e automação</li>
<li>Estrutura premium com acabamento de alto padrão</li>
<li>Nível de ruído controlado mesmo em operação de máxima capacidade</li>
<li>Manutenção preventiva simplificada com alertas automáticos no display</li>
</ul>

<h3>Onde o SX200 Prime faz sentido</h3>
<p>Hospitais, hotéis de luxo, centros de convenções, aeroportos privados, grandes clínicas e instalações que exigem qualidade do ar e conforto térmico de nível superior. O SX200 Prime é o único equipamento da linha Sixxis que combina capacidade industrial com requinte premium.</p>

<h3>Garantia Sixxis</h3>
<p>12 meses de garantia Prime com atendimento prioritário e SLA reduzido. Suporte especializado via WhatsApp (18) 99747-4701. Seg–Sex 8h às 18h.</p>`,
  },
]

async function localizarProduto(alvo: Alvo) {
  // 1. Slug exato
  let produto = await prisma.produto.findUnique({ where: { slug: alvo.slugPrefer } })
  if (produto) return produto

  // 2. Fallback por qualquer matcher em slug/nome/sku
  for (const m of alvo.matchers) {
    produto = await prisma.produto.findFirst({
      where: {
        OR: [
          { slug: { contains: m } },
          { nome: { contains: m } },
          { sku:  { contains: m } },
        ],
      },
    })
    if (produto) return produto
  }
  return null
}

async function main() {
  let atualizados = 0
  let naoEncontrados: string[] = []

  for (const alvo of DESCRICOES) {
    const produto = await localizarProduto(alvo)
    if (!produto) {
      console.warn(`[skip] Produto ${alvo.slugPrefer} (${alvo.nome}) não encontrado`)
      naoEncontrados.push(alvo.slugPrefer)
      continue
    }

    await prisma.produto.update({
      where: { id: produto.id },
      data: {
        nome: alvo.nome,
        descricao: alvo.descricao,
      },
    })
    console.log(`[ok]   ${alvo.slugPrefer} -> ${produto.nome} (id ${produto.id})`)
    atualizados++
  }

  console.log(`\n${atualizados}/${DESCRICOES.length} produto(s) atualizado(s).`)
  if (naoEncontrados.length > 0) {
    console.log(`Não encontrados: ${naoEncontrados.join(', ')}`)
  }
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
