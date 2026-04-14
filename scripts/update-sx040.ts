import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

// ── Descrição HTML completa do SX040 ──────────────────────────────────────────
const DESCRICAO_SX040 = `
<div class="produto-hero">
  <h2>Climatizador Sixxis SX040</h2>
  <p>Potência, silêncio e economia em um único produto.<br>O aliado perfeito para o seu conforto em todas as estações.</p>
  <p class="destaque">40 Litros · 3 Velocidades · Controle Remoto</p>
</div>

<h2>Sobre o Produto</h2>
<p>
  O <strong>Climatizador Sixxis SX040</strong> foi desenvolvido para oferecer máximo conforto térmico com o menor consumo de energia possível.
  Com reservatório de <strong>40 litros</strong>, ideal para ambientes de até <strong>50 m²</strong>, ele combina tecnologia de ponta
  com design elegante e funcional.
</p>
<p>
  Diferente do ar-condicionado convencional, o climatizador umidifica e refresca o ar ao mesmo tempo, sendo ideal para regiões com
  clima seco. Com apenas <strong>3% do consumo de energia de um ar-condicionado split</strong>, você mantém o ambiente agradável
  sem pesar na conta de luz.
</p>

<h2>Principais Benefícios</h2>
<ul>
  <li>Refresca e umidifica o ar simultaneamente, combatendo o ressecamento</li>
  <li>Consumo até 97% menor que ar-condicionado convencional</li>
  <li>Reservatório de 40 litros com indicador de nível</li>
  <li>3 velocidades de ventilação (baixa, média, alta)</li>
  <li>Controle remoto incluso para operação à distância</li>
  <li>Timer programável de até 7,5 horas</li>
  <li>Filtros antibacterianos laváveis e reutilizáveis</li>
  <li>Rodízios com trava para mobilidade total</li>
  <li>Painel de controle digital com display LED</li>
  <li>Modo natural (ION) que simula a brisa da natureza</li>
</ul>

<div class="economia-block">
  <h3>💰 Quanto você economiza por mês?</h3>
  <p>Comparando o SX040 com um ar-condicionado split de 9.000 BTUs em uso diário de 8 horas:</p>
  <ul>
    <li><strong>Ar-condicionado split:</strong> ~R$ 180/mês na conta de luz</li>
    <li><strong>Climatizador SX040:</strong> ~R$ 12/mês na conta de luz</li>
    <li><strong>Economia mensal: R$ 168 · Economia anual: R$ 2.016</strong></li>
  </ul>
  <p>Em menos de 6 meses o produto já se paga com a economia gerada.</p>
</div>

<h2>Especificações Técnicas</h2>
<table>
  <thead>
    <tr>
      <th>Especificação</th>
      <th>Valor</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Modelo</td><td>SX040</td></tr>
    <tr><td>Capacidade do reservatório</td><td>40 litros</td></tr>
    <tr><td>Área de cobertura recomendada</td><td>Até 50 m²</td></tr>
    <tr><td>Velocidades</td><td>3 (baixa, média, alta)</td></tr>
    <tr><td>Consumo de energia</td><td>200W</td></tr>
    <tr><td>Vazão de ar</td><td>750 m³/h</td></tr>
    <tr><td>Nível de ruído</td><td>≤ 65 dB</td></tr>
    <tr><td>Timer</td><td>Sim (até 7,5 h)</td></tr>
    <tr><td>Controle remoto</td><td>Incluso</td></tr>
    <tr><td>Painel de controle</td><td>Digital com display LED</td></tr>
    <tr><td>Filtro</td><td>Antibacteriano lavável</td></tr>
    <tr><td>Rodízios</td><td>Sim (com trava)</td></tr>
    <tr><td>Dimensões (L×A×P)</td><td>43 × 92 × 43 cm</td></tr>
    <tr><td>Peso líquido</td><td>~14 kg</td></tr>
    <tr><td>Voltagem</td><td>110V ou 220V (selecione abaixo)</td></tr>
  </tbody>
</table>

<h2>Perguntas Frequentes</h2>

<details>
  <summary>O climatizador refresca tanto quanto um ar-condicionado?</summary>
  <p>
    O climatizador funciona de forma diferente: ele usa a evaporação da água para reduzir a temperatura do ar,
    sendo mais eficaz em ambientes com baixa umidade. Em dias secos, a sensação de frescor pode ser equivalente
    à de um ar-condicionado de pequeno porte, com a vantagem de também umidificar o ambiente.
  </p>
</details>

<details>
  <summary>Precisa de instalação ou obra?</summary>
  <p>
    Não! O SX040 é um equipamento portátil. Basta ligar na tomada (110V ou 220V conforme o modelo),
    abastecer o reservatório com água e ligar. Nenhuma instalação é necessária.
  </p>
</details>

<details>
  <summary>Com que frequência devo limpar o filtro?</summary>
  <p>
    Recomendamos limpar o filtro antibacteriano a cada 15 dias de uso regular. A limpeza é simples:
    retire o filtro, lave com água corrente e detergente neutro, deixe secar completamente antes de reinstalar.
  </p>
</details>

<details>
  <summary>Qual o tamanho ideal de ambiente?</summary>
  <p>
    O SX040 é ideal para ambientes de até 50 m². Para ambientes maiores, recomendamos posicionar o climatizador
    próximo às pessoas ou usar dois aparelhos em pontos estratégicos do ambiente.
  </p>
</details>

<details>
  <summary>Posso usar gelo no reservatório para refriar mais?</summary>
  <p>
    Sim! Adicionar pedras de gelo ao reservatório aumenta a eficiência de resfriamento do ar por algumas horas.
    O compartimento é projetado para isso e não causa danos ao equipamento.
  </p>
</details>

<details>
  <summary>A entrega é para todo o Brasil?</summary>
  <p>
    Sim! Entregamos para todo o Brasil via Correios e transportadoras parceiras. O prazo varia conforme
    a região. Calculamos o frete e o prazo exato na página do produto. Pedidos acima de R$ 500 têm frete grátis.
  </p>
</details>

<div class="garantia-block">
  <h3>🛡️ Garantia Sixxis</h3>
  <p>O <strong>Climatizador SX040</strong> possui <strong>12 meses de garantia</strong> contra defeitos de fabricação,
  contados a partir da data de entrega.</p>
  <ul>
    <li>Suporte técnico especializado via WhatsApp</li>
    <li>Rede de assistência técnica autorizada em todo o Brasil</li>
    <li>Peças originais Sixxis disponíveis</li>
    <li>Troca imediata em caso de defeito nos primeiros 7 dias</li>
  </ul>
  <p>Para acionar a garantia, guarde a nota fiscal e entre em contato com nosso suporte.</p>
</div>
`

async function main() {
  // Encontra o produto pelo slug
  let produto = await prisma.produto.findUnique({ where: { slug: 'sx040' } })

  if (!produto) {
    // Tenta variações comuns do slug
    produto = await prisma.produto.findFirst({
      where: {
        OR: [
          { slug: { contains: 'sx040' } },
          { nome: { contains: 'SX040' } },
          { sku: { contains: 'SX040' } },
        ],
      },
    })
  }

  if (!produto) {
    console.error('❌ Produto SX040 não encontrado. Verifique o slug no banco de dados.')
    process.exit(1)
  }

  console.log(`✅ Produto encontrado: ${produto.nome} (slug: ${produto.slug}, id: ${produto.id})`)

  // Atualiza a descrição e ativa variações
  await prisma.produto.update({
    where: { id: produto.id },
    data: {
      descricao: DESCRICAO_SX040.trim(),
      temVariacoes: true,
    },
  })
  console.log('✅ Descrição atualizada')

  // Upsert das variações de voltagem
  const variacoes = [
    { nome: '110V', sku: `${produto.sku ?? produto.slug}-110V`, estoque: 10 },
    { nome: '220V', sku: `${produto.sku ?? produto.slug}-220V`, estoque: 10 },
  ]

  for (const v of variacoes) {
    const existente = await prisma.variacaoProduto.findFirst({
      where: { produtoId: produto.id, nome: v.nome },
    })

    if (existente) {
      await prisma.variacaoProduto.update({
        where: { id: existente.id },
        data: { sku: v.sku, estoque: v.estoque, ativo: true },
      })
      console.log(`✅ Variação ${v.nome} atualizada`)
    } else {
      await prisma.variacaoProduto.create({
        data: {
          produtoId: produto.id,
          nome: v.nome,
          sku: v.sku,
          estoque: v.estoque,
          ativo: true,
        },
      })
      console.log(`✅ Variação ${v.nome} criada`)
    }
  }

  console.log('\n🎉 SX040 atualizado com sucesso!')
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
