import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      where: { ativo: true },
      select: {
        nome: true,
        slug: true,
        preco: true,
        precoPromocional: true,
        categoria: true,
        mediaAvaliacoes: true,
        totalAvaliacoes: true,
        variacoes: {
          where: { ativo: true },
          select: { nome: true, preco: true },
        },
      },
      orderBy: { categoria: 'asc' },
    })

    const ofertasAtivas = produtos.filter((p) => p.precoPromocional !== null)

    const agora = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'full',
      timeStyle: 'short',
    })

    let resumoOfertas = ''
    if (ofertasAtivas.length === 0) {
      resumoOfertas = 'Nenhuma oferta relâmpago ativa no momento.'
    } else {
      resumoOfertas = ofertasAtivas
        .map((p) => {
          const desconto = Math.round(
            (1 - Number(p.precoPromocional) / Number(p.preco)) * 100,
          )
          const pixPreco = (Number(p.precoPromocional) * 0.97).toFixed(2)
          return `• ${p.nome}: DE R$ ${Number(p.preco).toLocaleString('pt-BR')} POR R$ ${Number(p.precoPromocional).toLocaleString('pt-BR')} (${desconto}% OFF) | PIX: R$ ${pixPreco}`
        })
        .join('\n')
    }

    let catalogo = ''
    const cats = ['climatizadores', 'aspiradores', 'spinning']
    for (const cat of cats) {
      const prodsCat = produtos.filter((p) => p.categoria === cat)
      if (!prodsCat.length) continue
      catalogo += `\n[${cat.toUpperCase()}]\n`
      for (const p of prodsCat) {
        const precoBase = Number(p.preco).toLocaleString('pt-BR')
        const temPromo = p.precoPromocional !== null
        const precoExibir = temPromo
          ? `R$ ${Number(p.precoPromocional).toLocaleString('pt-BR')} (OFERTA! De R$ ${precoBase})`
          : `R$ ${precoBase}`
        const vars = p.variacoes.map((v) => v.nome).join(' ou ')
        const voltagem = vars ? ` | Voltagem: ${vars}` : ''
        catalogo += `• ${p.nome}: ${precoExibir}${voltagem} | Nota: ${p.mediaAvaliacoes}/5 (${p.totalAvaliacoes} avs)\n`
      }
    }

    return NextResponse.json({
      timestamp: agora,
      ofertasAtivas: ofertasAtivas.length,
      resumoOfertas,
      catalogo,
      raw: produtos,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar contexto' }, { status: 500 })
  }
}
