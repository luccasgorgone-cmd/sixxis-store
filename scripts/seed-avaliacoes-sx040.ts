import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  const produto = await prisma.produto.findUnique({ where: { slug: 'sx040' } })
  if (!produto) { console.log('Produto sx040 não encontrado'); return }

  await prisma.avaliacao.deleteMany({ where: { produtoId: produto.id } })

  const avaliacoes = [
    // 5 estrelas (20)
    { nomeAutor: 'Marcos Antônio S.', nota: 5, titulo: 'Melhor compra que fiz esse ano!', comentario: 'Comprei para o meu escritório que é bem quente e a diferença foi imediata. O climatizador chegou bem embalado, em 3 dias úteis. Instalei sozinho sem dificuldade nenhuma. O nível de ruído é realmente baixo, dá pra trabalhar tranquilo com ele ligado. Recomendo demais!', aprovada: true, destaque: true, createdAt: new Date('2025-11-14') },
    { nomeAutor: 'Fernanda C.', nota: 5, titulo: 'Superou minhas expectativas', comentario: 'Minha sala estava insuportável no verão. Comprei o SX040 e que diferença! Refresca muito bem, o tanque dura o dia todo. A entrega foi rápida e o produto chegou perfeito. Atendimento da Sixxis muito bom também, tiraram todas as minhas dúvidas pelo WhatsApp antes de comprar.', aprovada: true, destaque: true, createdAt: new Date('2025-12-02') },
    { nomeAutor: 'Ricardo P.', nota: 5, titulo: 'Produto de qualidade', comentario: 'Já é o segundo que compro. O primeiro durou 3 anos sem nenhum problema, aí comprei o SX040 que é maior. Encaixou perfeitamente no meu quarto. O filtro anti-pó faz diferença real, o ar fica mais limpo. Vale cada centavo.', aprovada: true, destaque: false, createdAt: new Date('2025-10-28') },
    { nomeAutor: 'Ana Paula M.', nota: 5, titulo: 'Amei demais!', comentario: 'Recebi em 2 dias, achei que ia demorar mais. Vim direto pro meu quarto e já montei. É muito fácil de usar, o controle remoto funciona muito bem. O barulho é quase nenhum, durmo com ele ligado toda noite. Altamente recomendo pra quem mora em cidade quente.', aprovada: true, destaque: false, createdAt: new Date('2025-09-15') },
    { nomeAutor: 'José Carlos B.', nota: 5, titulo: 'Vale muito o investimento', comentario: 'Coloquei no meu salão de beleza. Clientes adoraram, disseram que o ambiente ficou muito mais agradável. Consumo de energia muito baixo comparado ao ar condicionado que tinha antes. Ótimo produto, entrega rápida e bem embalado.', aprovada: true, destaque: false, createdAt: new Date('2025-08-22') },
    { nomeAutor: 'Priscila R.', nota: 5, titulo: 'Chegou antes do prazo!', comentario: 'Fiz o pedido na sexta e chegou na segunda. Perfeito! O produto é exatamente como descrito. Estou usando no quarto do meu filho e ele adorou. Fácil de encher o tanque, fácil de limpar. Muito satisfeita com a compra.', aprovada: true, destaque: false, createdAt: new Date('2025-11-30') },
    { nomeAutor: 'Thiago L.', nota: 5, titulo: 'Produto incrível', comentario: 'Comprei depois de pesquisar muito e não me arrependi. A vazão de ar é poderosa, sente que refresca de verdade. O tanque de 45L dura umas 8 horas na velocidade média. Recomendo para quem quer economizar na conta de luz.', aprovada: true, destaque: false, createdAt: new Date('2025-07-10') },
    { nomeAutor: 'Camila F.', nota: 5, titulo: 'Muito bom mesmo', comentario: 'Tô usando na sala e ficou ótimo. O design é bonito, combinou com a decoração. Funciona no 110V que é a voltagem da minha casa. Chegou em perfeito estado, embalagem muito boa. 5 estrelas com certeza.', aprovada: true, destaque: false, createdAt: new Date('2025-10-05') },
    { nomeAutor: 'Roberto A.', nota: 5, titulo: 'Refresca de verdade', comentario: 'Já tinha comprado climatizador de outra marca e não ficava satisfeito. O SX040 é outro nível. A oscilação automática distribui o ar por todo o ambiente. Silencioso, econômico e eficiente. Entrega em 4 dias para o interior de SP.', aprovada: true, destaque: false, createdAt: new Date('2025-12-18') },
    { nomeAutor: 'Larissa O.', nota: 5, titulo: 'Adorei a compra', comentario: 'Minha primeira compra na Sixxis e já virei cliente fiel. Produto chegou bem protegido, sem nenhuma avaria. Liguei de primeira e funcionou perfeitamente. O controle remoto é bem completo. Nota 10!', aprovada: true, destaque: false, createdAt: new Date('2026-01-08') },
    { nomeAutor: 'Douglas M.', nota: 5, titulo: 'Excelente custo-benefício', comentario: 'Pra quem não quer gastar uma fortuna com ar condicionado, esse climatizador é a solução. Economizo muito na conta de luz. No meu quarto de 20m² fica bem fresquinho mesmo no calor de 40 graus daqui.', aprovada: true, destaque: false, createdAt: new Date('2025-06-25') },
    { nomeAutor: 'Beatriz S.', nota: 5, titulo: 'Top demais', comentario: 'Comprei pra minha mãe que tava sofrendo com o calor. Ela amou! Fácil de usar, o painel touch é intuitivo. O tanque grande não precisa encher toda hora. Entrega foi rápida e bem cuidada. Obrigada Sixxis!', aprovada: true, destaque: false, createdAt: new Date('2025-11-03') },
    { nomeAutor: 'Alessandro P.', nota: 5, titulo: 'Produto conforme anunciado', comentario: 'Recebi exatamente o que estava descrito. Bem embalado, com nota fiscal e manual em português. Funcionou de primeira. Uso no escritório em casa e diminuiu bastante o calor. Vendedor confiável.', aprovada: true, destaque: false, createdAt: new Date('2025-09-28') },
    { nomeAutor: 'Renata C.', nota: 5, titulo: 'Perfeito!', comentario: 'Que produto maravilhoso! Aqui em Araçatuba o verão é terrível e esse climatizador salvou minha vida. O nível de ruído é mesmo muito baixo, meu bebê dorme com ele ligado sem acordar. Muito satisfeita com a compra e com o atendimento.', aprovada: true, destaque: true, createdAt: new Date('2026-02-14') },
    { nomeAutor: 'Fábio N.', nota: 5, titulo: 'Chegou intacto', comentario: 'Embalagem reforçada, produto sem nenhum problema. Já tô usando há 2 meses sem nenhuma queixa. Ótima compra.', aprovada: true, destaque: false, createdAt: new Date('2026-01-22') },
    { nomeAutor: 'Viviane K.', nota: 5, titulo: 'Muito melhor que esperava', comentario: 'Estava receosa em comprar online mas o suporte da Sixxis foi excelente, me explicaram tudo antes da compra. O produto chegou rápido e funciona perfeitamente. O filtro anti-pó faz diferença pra quem tem alergia como eu.', aprovada: true, destaque: false, createdAt: new Date('2025-08-07') },
    { nomeAutor: 'Paulo H.', nota: 5, titulo: 'Recomendo sem hesitar', comentario: 'Terceira vez que compro produto Sixxis. Qualidade consistente, entrega rápida e suporte sempre disponível. O SX040 é robusto e potente. Ótimo para ambientes comerciais também.', aprovada: true, destaque: false, createdAt: new Date('2025-12-30') },
    { nomeAutor: 'Mariana T.', nota: 5, titulo: 'Show de bola', comentario: 'Produto show! Fiz o pedido num domingo e chegou na quarta. Já instalei e tô adorando. O ar que sai é bem fresquinho e úmido, diferente do ar condicionado que resseca demais. Nota 10 pra Sixxis.', aprovada: true, destaque: false, createdAt: new Date('2026-03-05') },
    { nomeAutor: 'Cláudio E.', nota: 5, titulo: 'Produto de primeira linha', comentario: 'Qualidade excelente. Acabamento impecável, sem nenhuma rebarba ou defeito estético. Funciona silenciosamente mesmo na velocidade máxima. Entrega foi dentro do prazo. Sixxis entrega o que promete.', aprovada: true, destaque: false, createdAt: new Date('2025-07-19') },
    { nomeAutor: 'Simone V.', nota: 5, titulo: 'Satisfeita demais', comentario: 'Comprei para o quarto do meu marido que sofria muito com calor. Ele ficou super satisfeito. O produto é lindo, moderno e funciona muito bem. Entrega foi ágil. Com certeza comprarei mais produtos Sixxis.', aprovada: true, destaque: false, createdAt: new Date('2025-10-11') },
    // 4 estrelas (4)
    { nomeAutor: 'Guilherme A.', nota: 4, titulo: 'Bom produto, entrega demorou um pouco', comentario: 'O climatizador é muito bom, refresca bem e é silencioso como prometido. Tirei uma estrela porque a entrega demorou 6 dias úteis. Mas o produto em si é excelente, sem nenhuma reclamação.', aprovada: true, destaque: false, createdAt: new Date('2025-09-02') },
    { nomeAutor: 'Sandra L.', nota: 4, titulo: 'Produto ótimo, manual poderia ser melhor', comentario: 'O climatizador funciona muito bem e refresca o ambiente. A minha única observação é que o manual de instruções poderia ser mais detalhado. Mas no geral é um ótimo produto e o atendimento foi impecável.', aprovada: true, destaque: false, createdAt: new Date('2025-11-20') },
    { nomeAutor: 'Wellington R.', nota: 4, titulo: 'Boa compra', comentario: 'Produto funciona bem, cumpre o que promete. Uso no escritório e o ambiente ficou mais agradável. Poderia ter mais opções de velocidade mas no geral estou satisfeito. Entrega foi rápida.', aprovada: true, destaque: false, createdAt: new Date('2026-02-01') },
    { nomeAutor: 'Tatiane M.', nota: 4, titulo: 'Muito bom, quase perfeito', comentario: 'Gostei bastante do produto. Refresca bem meu quarto de casal. O tanque é grande e dura bastante. Só achei que poderia vir com uma mangueirinha para facilitar o enchimento do tanque. Mas no geral é ótimo!', aprovada: true, destaque: false, createdAt: new Date('2025-08-30') },
    // 3 estrelas (1)
    { nomeAutor: 'Leandro F.', nota: 3, titulo: 'Bom mas esperava mais para o meu espaço', comentario: 'O produto funciona bem para ambientes menores. No meu caso a sala é grande (mais de 50m²) então o refresco foi limitado. Recomendo para quem vai usar em quartos ou escritórios menores. A qualidade de construção é boa e o atendimento foi ótimo.', aprovada: true, destaque: false, createdAt: new Date('2025-10-18') },
  ]

  let count = 0
  for (const av of avaliacoes) {
    await prisma.avaliacao.create({
      data: {
        produtoId: produto.id,
        nomeAutor: av.nomeAutor,
        nota: av.nota,
        titulo: av.titulo,
        comentario: av.comentario,
        aprovada: av.aprovada,
        destaque: av.destaque,
        createdAt: av.createdAt,
        updatedAt: av.createdAt,
      },
    })
    count++
  }

  const soma = avaliacoes.reduce((s, a) => s + a.nota, 0)
  const media = Math.round((soma / avaliacoes.length) * 10) / 10

  await prisma.produto.update({
    where: { id: produto.id },
    data: { mediaAvaliacoes: media, totalAvaliacoes: avaliacoes.length },
  })

  console.log(`✅ ${count} avaliações criadas. Média: ${media}`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
