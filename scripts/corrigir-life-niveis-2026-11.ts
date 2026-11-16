import { prisma } from '../src/lib/prisma'
import { normalizarNiveisLife } from '../src/lib/life-descricao'

const SLUG = 'spinning-sixxis-life'

async function main() {
  const aplicar = process.argv.includes('--apply')
  const produto = await prisma.produto.findUnique({
    where: { slug: SLUG },
    select: { id: true, descricao: true },
  })

  if (!produto?.descricao) {
    throw new Error(`Produto ${SLUG} não encontrado ou sem descrição`)
  }

  const descricaoCorrigida = normalizarNiveisLife(produto.descricao)
  if (descricaoCorrigida === produto.descricao) {
    console.log('Sixxis Life já está alinhada à ficha técnica oficial (8 níveis).')
    return
  }

  if (!aplicar) {
    console.log('DRY RUN: uma frase da Sixxis Life será corrigida de 10 para 8 níveis. Use --apply para aplicar.')
    return
  }

  await prisma.produto.update({
    where: { id: produto.id },
    data: { descricao: descricaoCorrigida },
  })
  console.log('Sixxis Life corrigida: descrição alinhada à ficha técnica oficial (8 níveis).')
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Falha ao corrigir a descrição da Sixxis Life')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
