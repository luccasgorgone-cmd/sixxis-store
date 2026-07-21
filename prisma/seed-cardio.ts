// prisma/seed-cardio.ts
//
// Cria (ou atualiza) o produto "Bicicleta Ergométrica Spinning Sixxis Cardio".
// Nasce INATIVO (ativo: false) com preço PLACEHOLDER R$ 1,00 e sem imagens —
// o dono completa preço final e fotos pelo admin depois.
//
// Molde: espelha o produto "Bicicleta Spinning Sixxis Life"
// (slug spinning-sixxis-life) — mesma categoria "spinning", mesmo padrão de
// `modelo` ("linha + variante"), mesmas classes CSS na descrição
// (.produto-hero / .destaque / <section> / <h3>, definidas em
// src/app/globals.css sob .produto-descricao).
//
// IDEMPOTENTE: upsert por slug (@unique). Rodar N vezes não duplica.
// No caminho de UPDATE, campos que o dono edita pelo admin — preco,
// precoPromocional, ativo, estoque, imagens, videoUrl, custoProduto — NÃO são
// sobrescritos. Só o conteúdo editorial/técnico é reaplicado. Assim, re-rodar o
// seed depois que o dono publicar o produto não o derruba da loja.
//
// Frete: as dimensões saem dos CAMPOS do Produto (src/lib/frete-resolver.ts).
// Preencher pesoKg/alturaCm/larguraCm/comprimentoCm aqui basta — nada a mexer
// em src/lib/produto-dimensoes.ts.
//
// Rodar:  npx tsx prisma/seed-cardio.ts
//
// Bootstrap do client reaproveitado de scripts/_db.ts (Prisma 7 + adapter
// mariadb com TLS — exigido pelo proxy do Railway).
import { prisma } from '../scripts/_db'

const SLUG = 'spinning-sixxis-cardio'

const ESPECIFICACOES = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Linha', valor: 'Spinning' },
  { label: 'Modelo', valor: 'Cardio' },
  { label: 'Cor', valor: 'Preto' },
  { label: 'Tipo', valor: 'Bike Spinning Mecânica (Indoor)' },
  { label: 'Peso Máximo Suportado', valor: '120 kg' },
  { label: 'Altura Máxima do Usuário', valor: '1,80 m' },
  { label: 'Peso do Volante de Inércia', valor: '8 kg' },
  { label: 'Tipo de Resistência', valor: 'Mecânica (com freio de emergência)' },
  { label: 'Transmissão', valor: 'Correia' },
  { label: 'Material', valor: 'Aço, borracha e ABS' },
  { label: 'Pedais', valor: 'Reforçados com alça de segurança' },
  { label: 'Painel', valor: 'Velocidade, Tempo, Distância, Calorias, Odômetro' },
  { label: 'Alimentação do Painel', valor: '2 pilhas AAA (não inclusas)' },
  { label: 'Guidão', valor: 'Ajustável' },
  { label: 'Assento', valor: 'Ergonômico ajustável, com amortecedores' },
  { label: 'Carenagem', valor: 'Sim (proteção da correia)' },
  { label: 'Bluetooth', valor: 'Não' },
  { label: 'Peso do Produto', valor: '21 kg' },
  { label: 'Medidas Montada (A×L×C)', valor: '88 × 46 × 113 cm' },
  { label: 'Requer Montagem', valor: 'Sim' },
  { label: 'Garantia', valor: '12 meses' },
]

const FAQS = [
  {
    pergunta: 'O que a bicicleta ergométrica faz no corpo?',
    resposta:
      'A bicicleta ergométrica fortalece coração e pulmões, melhora a circulação, auxilia no emagrecimento e tonifica pernas e glúteos, com baixo impacto nas articulações — ótima para condicionamento físico, controle de peso e bem-estar mental.',
  },
  {
    pergunta: 'Qual bicicleta ergométrica é melhor para ter em casa?',
    resposta:
      'Para uso doméstico e iniciantes, a Sixxis Cardio é uma excelente escolha: resistência confortável e design que facilita a prática e a criação do hábito de treino.',
  },
  {
    pergunta: 'É possível perder barriga na bicicleta ergométrica?',
    resposta:
      'Sim. Por ser um exercício cardiovascular, ela queima calorias e gordura corporal, incluindo a gordura visceral abdominal.',
  },
  {
    pergunta: 'A bike vem montada?',
    resposta:
      'A bike requer montagem simples, com manual de acompanhamento. Contamos com peças de reposição e assistência técnica autorizada em todo o país.',
  },
]

const DESCRICAO = `<div class="produto-hero">
  <h2>Bicicleta Ergométrica Spinning Sixxis Cardio</h2>
  <p class="destaque">Treino cardio em casa, leve e eficiente — a bike de spinning que cabe na sua rotina.</p>
</div>

<section>
  <h3>Por que a Sixxis Cardio?</h3>
  <p>Roda de inércia de 8 kg, transmissão por correia e resistência mecânica com freio de emergência. Estrutura em aço, borracha e ABS, pedais reforçados com alça de segurança e carenagem que protege a correia (e crianças e pets).</p>
</section>

<section>
  <h3>Painel e regulagens</h3>
  <p>Painel com velocidade, tempo, distância, calorias e odômetro (2 pilhas AAA, não inclusas). Assento ergonômico com amortecedores e guidão ajustável para o máximo conforto em treinos longos.</p>
</section>

<section>
  <h3>Indicação de uso</h3>
  <p>Uso doméstico até 120 kg e usuários de até 1,80 m. Medidas montada: 88 × 46 × 113 cm. Peso: 21 kg. Garantia de 12 meses.</p>
</section>`

// Conteúdo editorial + ficha técnica: reaplicado a cada execução.
const CONTEUDO = {
  nome: 'Bicicleta Ergométrica Spinning Sixxis Cardio',
  descricao: DESCRICAO,
  categoria: 'spinning',
  modelo: 'Spinning Cardio',
  sku: 'BIKE-SIXXIS-CARDIO',
  temVariacoes: false,
  garantiaFabricaMeses: 12,
  especificacoes: ESPECIFICACOES,
  faqs: FAQS,
  pesoKg: 21,
  alturaCm: 88,
  larguraCm: 46,
  comprimentoCm: 113,
  volumes: 1,
}

async function main() {
  const existente = await prisma.produto.findUnique({ where: { slug: SLUG } })

  const produto = await prisma.produto.upsert({
    where: { slug: SLUG },
    // UPDATE: só conteúdo. Preço, imagens, estoque e o flag `ativo` ficam como o
    // dono deixou no admin.
    update: CONTEUDO,
    create: {
      ...CONTEUDO,
      erpProdutoId: 'ADMIN-CARDIO-001',
      slug: SLUG,
      preco: 1, // PLACEHOLDER — obrigatório (Decimal). O dono ajusta no admin.
      precoPromocional: null,
      custoProduto: null,
      ativo: false, // não vaza pra loja até o dono publicar
      estoque: 0,
      imagens: [],
      videoUrl: null,
    },
  })

  console.log(existente ? '[UPDATE] produto já existia — conteúdo reaplicado' : '[CREATE] produto criado')
  console.log({
    id: produto.id,
    slug: produto.slug,
    nome: produto.nome,
    categoria: produto.categoria,
    modelo: produto.modelo,
    ativo: produto.ativo,
    preco: String(produto.preco),
    estoque: produto.estoque,
    pesoKg: String(produto.pesoKg),
    dimensoesCm: `${produto.alturaCm} × ${produto.larguraCm} × ${produto.comprimentoCm}`,
    volumes: produto.volumes,
    garantiaFabricaMeses: produto.garantiaFabricaMeses,
  })
  if (produto.ativo) {
    console.warn('[ATENÇÃO] produto está ATIVO (publicado pelo dono). O seed não altera esse flag.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
