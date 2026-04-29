// Gera 4 avaliações distintas por produto (exceto SX040 que já tem suas
// próprias). Cada review menciona detalhes específicos do produto a partir das
// suas especificações (capacidade, cobertura, voltagem etc.) e varia em tópico
// (silêncio, eficiência, design, atendimento, entrega, instalação, durabilidade,
// custo-benefício). Distribui 4 estrelas ocasionais entre produtos.
//
// Uso:
//   npx tsx scripts/seed-reviews-realistas.ts          (substitui reviews)
//   npx tsx scripts/seed-reviews-realistas.ts --dry    (sem gravar)

import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

const DRY = process.argv.includes('--dry')
const PROTEGIDOS = new Set<string>(['sx040'])

interface EspecRow { label: string; valor: string }
function getSpec(specs: EspecRow[], term: string): string {
  const row = specs.find((s) => s.label.toLowerCase().includes(term.toLowerCase()))
  return row?.valor ?? ''
}

interface ReviewTpl {
  nome: string
  cidade: string
  topico: string
  build: (ctx: { nome: string; cap: string; cob: string; volt: string; vel: string }) => { titulo: string; comentario: string }
  nota: number
}

// Pools de autores únicos por produto — não reutilizar entre produtos.
// 10 produtos × 4 autores = 40 nomes distintos. SX040 fica de fora (já tem
// reviews próprias).
const AUTORES_POR_SLUG: Record<string, string[]> = {}

function autoresPara(slug: string): string[] {
  if (AUTORES_POR_SLUG[slug]) return AUTORES_POR_SLUG[slug]
  // Pool de 60 nomes — escolhemos 4 com hash do slug para ser determinístico
  const POOL = [
    'Henrique B.', 'Letícia M.', 'Diego R.', 'Patrícia V.',
    'Bruno H.', 'Carolina S.', 'Felipe T.', 'Aline G.',
    'Marcelo D.', 'Juliana K.', 'Eduardo P.', 'Vanessa N.',
    'Rafael Q.', 'Daniela A.', 'Vitor C.', 'Bianca L.',
    'Lucas E.', 'Tamires F.', 'Murilo Z.', 'Helena J.',
    'Igor W.', 'Carla I.', 'Anderson U.', 'Yasmin Y.',
    'Gustavo X.', 'Eliane B.', 'Caio P.', 'Nathália O.',
    'Otávio H.', 'Luciana D.', 'Samuel V.', 'Débora F.',
    'Renan C.', 'Adriana T.', 'Mateus G.', 'Cibele K.',
    'Hugo M.', 'Joana A.', 'Ítalo S.', 'Marta Q.',
    'Gilberto R.', 'Monique B.', 'Rogério C.', 'Tatiana J.',
    'Vinícius P.', 'Iara H.', 'Alex L.', 'Estela D.',
    'Antônio F.', 'Solange V.', 'Elias N.', 'Janaína R.',
    'Fábio K.', 'Mirella A.', 'Sérgio U.', 'Fátima B.',
    'Maurício T.', 'Cristina E.', 'Heitor I.', 'Sueli W.',
  ]
  // Hash determinístico do slug
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  const start = h % POOL.length
  const escolhidos = [
    POOL[start % POOL.length],
    POOL[(start + 7) % POOL.length],
    POOL[(start + 13) % POOL.length],
    POOL[(start + 19) % POOL.length],
  ]
  AUTORES_POR_SLUG[slug] = escolhidos
  return escolhidos
}

const TEMPLATES: ReviewTpl[] = [
  {
    nome: '', cidade: '', topico: 'silencio', nota: 5,
    build: ({ nome, vel }) => ({
      titulo: 'Silencioso até na velocidade máxima',
      comentario: `Comprei o ${nome} principalmente por causa do barulho dos modelos antigos que tinha em casa. Esse aqui é outro nível: rodo${vel ? ` nas ${vel} velocidades` : ''} e mal escuto, o que faz toda diferença pra dormir e pra trabalhar. Embalagem chegou íntegra e o painel é intuitivo.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'cobertura', nota: 5,
    build: ({ nome, cob }) => ({
      titulo: 'Cobre toda a sala sem dificuldade',
      comentario: `Tava na dúvida se o ${nome} daria conta da minha sala${cob ? ` (a ficha indica ${cob})` : ''}, mas refresca de canto a canto. A oscilação ajuda a distribuir o ar. O fluxo é forte sem ser agressivo. Recomendo medir o ambiente antes de comprar pra garantir.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'voltagem', nota: 5,
    build: ({ nome, volt }) => ({
      titulo: 'Voltagem certa e funcionou de primeira',
      comentario: `Já tinha tido problema com produto que veio na voltagem errada de outras marcas. ${volt ? `O ${nome} no ${volt} ` : `O ${nome} `}foi exatamente como pedi e ligou de cara, sem precisar adaptador. Etiqueta clara na caixa, saída de fábrica certinha. Atendimento da Sixxis confirmou tudo antes do envio.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'capacidade', nota: 5,
    build: ({ nome, cap }) => ({
      titulo: 'Tanque grande, autonomia muito boa',
      comentario: `Ponto alto pra mim foi a autonomia do tanque${cap ? ` (${cap})` : ''}. Encho de manhã com gelo e dura o dia inteiro, sem precisar reabastecer. O sistema de evaporação trabalha bem e não fica derramando água. ${nome} cumpre o que promete.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'entrega', nota: 5,
    build: ({ nome }) => ({
      titulo: 'Entrega em 3 dias, sem amassados',
      comentario: `O ${nome} chegou em 3 dias úteis, antes do prazo previsto no carrinho. A embalagem veio reforçada e nem o plástico de proteção saiu do lugar. Acompanhei pelo código de rastreio e foi sempre atualizado. Sixxis no caminho certo nesse quesito.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'design', nota: 5,
    build: ({ nome }) => ({
      titulo: 'Design discreto, combina com qualquer ambiente',
      comentario: `Comprei o ${nome} com receio de ficar feio na decoração, mas o acabamento é bem feito, sem aquele plástico barato. Painel touch responsivo, comandos claros. Visualmente discreto, não chama atenção mas faz o serviço.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'atendimento', nota: 5,
    build: ({ nome }) => ({
      titulo: 'Suporte da Sixxis ajudou na escolha',
      comentario: `Antes de fechar o pedido, mandei mensagem pelo WhatsApp tirando dúvida se o ${nome} era o ideal pro meu caso. Resposta rápida, sem aquele papo de vendedor empurrando. Recomendaram esse modelo e acertaram.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'instalacao', nota: 5,
    build: ({ nome }) => ({
      titulo: 'Saiu da caixa pronto pra usar',
      comentario: `Achei que ia precisar montar mil peças, mas o ${nome} veio praticamente pronto. Encaixei o painel, plugou e ligou. Manual em português ajuda mas nem precisei muito, é intuitivo. Levou uns 5 minutos do desembalar até estar funcionando.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'durabilidade', nota: 5,
    build: ({ nome }) => ({
      titulo: 'Tô usando há meses sem queixa',
      comentario: `Atualizando: já são alguns meses com o ${nome} ligado todo dia, e nem sinal de defeito. Motor mantém o mesmo desempenho do primeiro dia, sem barulho estranho ou perda de força. Vou voltar pra reportar se algo mudar, mas até agora, top.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'custo-beneficio', nota: 5,
    build: ({ nome }) => ({
      titulo: 'Pelo preço, é difícil achar igual',
      comentario: `Pesquisei bastante antes — modelos de marca famosa cobram bem mais por menos. O ${nome} entregou tudo o que precisava por um preço bem competitivo. Cupom da primeira compra ajudou também. Fechou conta certinho.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'consumo', nota: 4,
    build: ({ nome }) => ({
      titulo: 'Bom produto, conta de luz subiu pouco',
      comentario: `O ${nome} cumpre o prometido e refresca bem. Tirei uma estrela porque achei que ia gastar menos energia, mas no uso 24h o consumo aparece no mês. Pra uso intermitente fica ótimo, vale a pena.`,
    }),
  },
  {
    nome: '', cidade: '', topico: 'funcoes', nota: 4,
    build: ({ nome }) => ({
      titulo: 'Funciona bem, podia ter mais funções no controle',
      comentario: `O ${nome} faz o trabalho dele bem. Senti falta de timer mais granular no controle remoto e de modo automático que regule sozinho pela temperatura. No mais é um bom produto pelo preço.`,
    }),
  },
]

function pickTopicos(slug: string): ReviewTpl[] {
  // Mistura determinística baseada em hash do slug pra ter variação entre
  // produtos sem ser aleatório a cada execução.
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 17 + slug.charCodeAt(i)) >>> 0
  const escolhidos: ReviewTpl[] = []
  const usados = new Set<number>()
  // 3 cinco-estrelas + 1 quatro-estrelas = 4 reviews por produto
  const cincoEstrelas = TEMPLATES.filter((t) => t.nota === 5)
  const quatroEstrelas = TEMPLATES.filter((t) => t.nota === 4)
  for (let i = 0; i < 3; i++) {
    let idx = (h + i * 7) % cincoEstrelas.length
    while (usados.has(idx)) idx = (idx + 1) % cincoEstrelas.length
    usados.add(idx)
    escolhidos.push(cincoEstrelas[idx])
  }
  escolhidos.push(quatroEstrelas[h % quatroEstrelas.length])
  return escolhidos
}

async function main() {
  const produtos = await prisma.produto.findMany({
    select: { id: true, slug: true, nome: true, especificacoes: true },
  })

  let totalCriadas = 0
  let totalApagadas = 0

  for (const p of produtos) {
    if (PROTEGIDOS.has(p.slug)) continue

    let specs: EspecRow[] = []
    try {
      const raw = p.especificacoes as unknown
      specs = Array.isArray(raw) ? (raw as EspecRow[]) : (typeof raw === 'string' ? JSON.parse(raw) : [])
    } catch { specs = [] }

    const cap  = getSpec(specs, 'tanque') || getSpec(specs, 'capacidade')
    const cob  = getSpec(specs, 'cobertura') || getSpec(specs, 'área')
    const volt = getSpec(specs, 'voltag')
    const vel  = getSpec(specs, 'velocidade')

    const autores = autoresPara(p.slug)
    const topicos = pickTopicos(p.slug)

    if (!DRY) {
      const apagadas = await prisma.avaliacao.deleteMany({ where: { produtoId: p.id } })
      totalApagadas += apagadas.count
    }

    const baseDate = new Date('2025-09-01')
    const reviews = topicos.map((tpl, i) => {
      const built = tpl.build({ nome: p.nome, cap, cob, volt, vel })
      return {
        nomeAutor: autores[i % autores.length],
        nota: tpl.nota,
        titulo: built.titulo,
        comentario: built.comentario,
        aprovada: true,
        destaque: i === 0,
        createdAt: new Date(baseDate.getTime() + i * 11 * 86400000),
      }
    })

    if (!DRY) {
      for (const av of reviews) {
        await prisma.avaliacao.create({ data: { produtoId: p.id, ...av } })
      }
      const soma = reviews.reduce((s, r) => s + r.nota, 0)
      const media = Math.round((soma / reviews.length) * 10) / 10
      await prisma.produto.update({
        where: { id: p.id },
        data: { mediaAvaliacoes: media, totalAvaliacoes: reviews.length },
      })
    }
    totalCriadas += reviews.length
    console.log(`[${p.slug}] ${reviews.length} reviews ${DRY ? '(dry)' : 'criadas'} · autores: ${autores.join(', ')}`)
  }

  console.log(
    DRY
      ? `\n[dry-run] ${totalCriadas} reviews seriam criadas.`
      : `\n✅ ${totalApagadas} apagadas, ${totalCriadas} novas reviews criadas.`,
  )
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
