import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

const adapter = new PrismaMariaDb(process.env.DATABASE_URL)
const prisma = new PrismaClient({ adapter })

const avaliacoes = [
  {
    nomeCompleto: 'Roberto Mendonça',
    empresa: 'Climatech Soluções',
    cargo: 'Diretor Comercial',
    cidade: 'São Paulo - SP',
    nota: 5,
    titulo: 'Parceria que transformou nosso negócio',
    comentario: 'Tornamo-nos parceiros da Sixxis há 8 anos e foi uma das melhores decisões estratégicas da empresa. A qualidade dos climatizadores é incomparável no segmento — clientes voltam para comprar mais. O suporte pós-venda é ágil e eficiente, o que nos dá confiança para revender com tranquilidade. Faturamento cresceu 40% desde o início da parceria.',
    avatarInicial: 'R',
    corAvatar: '#0f2e2b',
    aprovada: true,
    destaque: true,
    ordem: 1,
  },
  {
    nomeCompleto: 'Fernanda Castellano',
    empresa: 'Casa & Conforto LTDA',
    cargo: 'Proprietária',
    cidade: 'Campinas - SP',
    nota: 5,
    titulo: 'Produto que se vende sozinho',
    comentario: 'Trabalho com varejo há 15 anos e raramente vejo um produto gerar tanta recomendação espontânea. Nossos clientes compram um climatizador Sixxis e indicam para toda a família. A margem é excelente, a entrega é pontual e o suporte técnico resolve qualquer dúvida rapidamente. Parceria sólida e de longo prazo.',
    avatarInicial: 'F',
    corAvatar: '#3cbfb3',
    aprovada: true,
    destaque: true,
    ordem: 2,
  },
  {
    nomeCompleto: 'Carlos Eduardo Teixeira',
    empresa: 'TechFrio Distribuidora',
    cargo: 'Gerente de Vendas',
    cidade: 'Ribeirão Preto - SP',
    nota: 5,
    titulo: 'Suporte excepcional e produto de primeira linha',
    comentario: 'O que me surpreendeu foi a dedicação da equipe Sixxis ao nos ajudar a treinar nossa equipe de vendas. Disponibilizaram materiais, fizeram treinamentos online e sempre estiveram presentes. Isso faz diferença! Hoje somos o principal distribuidor da região e temos orgulho de representar uma marca tão comprometida com a qualidade.',
    avatarInicial: 'C',
    corAvatar: '#1a4f4a',
    aprovada: true,
    destaque: false,
    ordem: 3,
  },
  {
    nomeCompleto: 'Mariana Oliveira Santos',
    empresa: 'Bem Estar Eletros',
    cargo: 'CEO',
    cidade: 'Belo Horizonte - MG',
    nota: 5,
    titulo: 'A melhor decisão de 2019',
    comentario: 'Incluímos a linha Sixxis no nosso mix de produtos em 2019 e hoje ela representa 35% do nosso faturamento total. Os climatizadores têm zero índice de devoluções por defeito — simplesmente funcionam. Clientes satisfeitos geram mais negócio e a Sixxis entende isso melhor do que ninguém.',
    avatarInicial: 'M',
    corAvatar: '#8b5cf6',
    aprovada: true,
    destaque: true,
    ordem: 4,
  },
  {
    nomeCompleto: 'Paulo Henrique Vieira',
    empresa: 'Clima Norte Comércio',
    cargo: 'Sócio-Fundador',
    cidade: 'Fortaleza - CE',
    nota: 5,
    titulo: 'Produto ideal para o clima nordestino',
    comentario: 'No Nordeste, um bom climatizador não é luxo — é necessidade. A Sixxis entende isso e criou produtos que realmente funcionam no nosso clima. A demanda aqui é altíssima e eles sempre nos abasteceram pontualmente. Nunca faltou produto em estoque para nossas vendas sazonais, que são intensas.',
    avatarInicial: 'P',
    corAvatar: '#f59e0b',
    aprovada: true,
    destaque: false,
    ordem: 5,
  },
  {
    nomeCompleto: 'Luciana Ferreira Campos',
    empresa: 'Fitness Pro Equipamentos',
    cargo: 'Diretora de Compras',
    cidade: 'Curitiba - PR',
    nota: 5,
    titulo: 'Bikes Spinning que encantam os clientes',
    comentario: 'Adicionamos as bikes spinning Sixxis ao nosso catálogo e o resultado foi imediato. Qualidade de equipamento profissional a um preço acessível — nossos clientes percebem o valor. Em menos de 6 meses, as bikes já representam 20% das nossas vendas de fitness. Parceria incrível!',
    avatarInicial: 'L',
    corAvatar: '#16a34a',
    aprovada: true,
    destaque: false,
    ordem: 6,
  },
]

try {
  await prisma.avaliacaoParceiro.deleteMany()
  for (const av of avaliacoes) {
    await prisma.avaliacaoParceiro.create({ data: av })
  }
  console.log(`✅ ${avaliacoes.length} avaliações de parceiros criadas`)
} catch (e) {
  console.error('Erro:', e.message)
} finally {
  await prisma.$disconnect()
}
