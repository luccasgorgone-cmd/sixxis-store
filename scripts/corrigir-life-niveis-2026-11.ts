import { prisma } from '../src/lib/prisma'
import {
  normalizarEspecificacoesLife,
  normalizarFaqsLife,
  normalizarNiveisLife,
  normalizarTextoPublicoLife,
  type EspecificacaoLife,
  type FaqLife,
} from '../src/lib/life-descricao'

const SLUG = 'spinning-sixxis-life'

async function main() {
  const aplicar = process.argv.includes('--apply')
  const produto = await prisma.produto.findUnique({
    where: { slug: SLUG },
    select: {
      id: true,
      descricao: true,
      especificacoes: true,
      faqs: true,
      avaliacoes: { select: { id: true, titulo: true, comentario: true } },
    },
  })

  if (!produto?.descricao) {
    throw new Error(`Produto ${SLUG} não encontrado ou sem descrição`)
  }

  const descricaoCorrigida = normalizarNiveisLife(produto.descricao)
  const especificacoesAtuais = (Array.isArray(produto.especificacoes)
    ? produto.especificacoes
    : []) as EspecificacaoLife[]
  const especificacoesCorrigidas = normalizarEspecificacoesLife(especificacoesAtuais)
  const faqsAtuais = (Array.isArray(produto.faqs) ? produto.faqs : []) as FaqLife[]
  const faqsCorrigidas = normalizarFaqsLife(faqsAtuais)
  const avaliacoesCorrigidas = produto.avaliacoes
    .map((avaliacao) => ({
      id: avaliacao.id,
      titulo: avaliacao.titulo == null ? null : normalizarTextoPublicoLife(avaliacao.titulo),
      comentario: avaliacao.comentario == null ? null : normalizarTextoPublicoLife(avaliacao.comentario),
    }))
    .filter((avaliacao, indice) => {
      const atual = produto.avaliacoes[indice]
      return avaliacao.titulo !== atual.titulo || avaliacao.comentario !== atual.comentario
    })
  const produtoMudou =
    descricaoCorrigida !== produto.descricao ||
    JSON.stringify(especificacoesCorrigidas) !== JSON.stringify(especificacoesAtuais) ||
    JSON.stringify(faqsCorrigidas) !== JSON.stringify(faqsAtuais)

  if (!produtoMudou && avaliacoesCorrigidas.length === 0) {
    console.log('Sixxis Life já está alinhada ao upgrade oficial (32 níveis).')
    return
  }

  if (!aplicar) {
    console.log(
      `DRY RUN: produto=${produtoMudou ? 'alterar' : 'sem mudança'}; avaliações=${avaliacoesCorrigidas.length}. Use --apply para aplicar.`,
    )
    return
  }

  await prisma.$transaction([
    ...(produtoMudou
      ? [prisma.produto.update({
          where: { id: produto.id },
          data: {
            descricao: descricaoCorrigida,
            especificacoes: especificacoesCorrigidas,
            faqs: faqsCorrigidas.length > 0 ? faqsCorrigidas : produto.faqs,
          },
        })]
      : []),
    ...avaliacoesCorrigidas.map((avaliacao) =>
      prisma.avaliacao.update({
        where: { id: avaliacao.id },
        data: { titulo: avaliacao.titulo, comentario: avaliacao.comentario },
      }),
    ),
  ])
  console.log(`Sixxis Life atualizada para 32 níveis; avaliações ajustadas=${avaliacoesCorrigidas.length}.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Falha ao corrigir a descrição da Sixxis Life')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
