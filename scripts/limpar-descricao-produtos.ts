import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não definido')
const adapter = new PrismaMariaDb(process.env.DATABASE_URL)
const prisma = new PrismaClient({ adapter })

async function main() {
  const produtos = await prisma.produto.findMany({
    select: { id: true, nome: true, slug: true, descricao: true }
  })

  let count = 0
  for (const p of produtos) {
    if (!p.descricao) continue
    let desc = p.descricao

    // 1. Remover .economia-block (versão antiga dark)
    desc = desc.replace(
      /<div[^>]*class="economia-block"[^>]*>[\s\S]*?<\/div>/gi,
      ''
    )

    // 2. Remover seção "Especificações Técnicas" da descrição
    desc = desc.replace(
      /<h[23][^>]*>[\s]*Especifica[çc][õo]es?\s*T[eé]cnicas[\s\S]*?<\/h[23]>[\s\S]*?(?=<h[123]|$)/gi,
      ''
    )
    // Variação com div container
    desc = desc.replace(
      /<div[^>]*class="[^"]*especifica[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      ''
    )
    // Tabela de specs standalone
    desc = desc.replace(
      /<table[^>]*>[\s\S]*?(?:Especifica|Modelo|Voltagem|Potência|Tanque|Vasão)[\s\S]*?<\/table>/gi,
      ''
    )

    // 3. Remover emojis soltos no início de h3 de economia que sobraram
    desc = desc.replace(/<h3[^>]*>💰[^<]*<\/h3>/gi, '')

    // 4. Limpar tags vazias e espaços duplos
    desc = desc.replace(/<p[^>]*>\s*<\/p>/gi, '')
    desc = desc.replace(/<div[^>]*>\s*<\/div>/gi, '')
    desc = desc.replace(/\n{3,}/g, '\n\n')
    desc = desc.trim()

    if (desc !== p.descricao) {
      await prisma.produto.update({
        where: { id: p.id },
        data: { descricao: desc }
      })
      console.log(`✅ Limpo: ${p.nome} (${p.slug})`)
      count++
    } else {
      console.log(`⏭ Sem alteração: ${p.nome}`)
    }
  }

  console.log(`\n✅ ${count} produto(s) atualizado(s)`)
  await prisma.$disconnect()
}

main()
