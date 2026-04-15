import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Params { slug: string }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    const limit = Number(req.nextUrl.searchParams.get('limit') || '4')

    // 1. Buscar o produto atual
    const produto = await prisma.produto.findFirst({
      where: { slug: { equals: slug }, ativo: true },
      select: {
        id: true,
        slug: true,
        categoria: true,
        preco: true,
        precoPromocional: true,
        especificacoes: true,
      },
    })

    if (!produto) return NextResponse.json({ similares: [] })

    const precoAtual = Number(produto.precoPromocional || produto.preco)
    const specs = produto.especificacoes as { label: string; valor: string }[] | null

    const getSpec = (termo: string) =>
      specs?.find(s => s.label.toLowerCase().includes(termo.toLowerCase()))?.valor || ''

    const coberturaAtual = parseInt(getSpec('cobertura') || getSpec('área')) || 0
    const tanqueAtual    = parseInt(getSpec('tanque') || getSpec('capacidade') || getSpec('reservatório')) || 0

    // 2. Buscar todos os outros produtos ativos
    const todos = await prisma.produto.findMany({
      where: { ativo: true, id: { not: produto.id } },
      select: {
        id: true,
        nome: true,
        slug: true,
        categoria: true,
        preco: true,
        precoPromocional: true,
        imagens: true,
        especificacoes: true,
        mediaAvaliacoes: true,
        totalAvaliacoes: true,
        variacoes: { where: { ativo: true }, select: { nome: true } },
      },
    })

    // 3. Score de similaridade
    const comScore = todos.map(p => {
      const pSpecs = p.especificacoes as { label: string; valor: string }[] | null
      const getPSpec = (t: string) =>
        pSpecs?.find(s => s.label.toLowerCase().includes(t.toLowerCase()))?.valor || ''

      let score = 0

      if (p.categoria === produto.categoria) score += 100

      const precoP = Number(p.precoPromocional || p.preco)
      const diffPreco = Math.abs(precoP - precoAtual) / precoAtual
      if (diffPreco <= 0.2)      score += 50
      else if (diffPreco <= 0.5) score += 30
      else if (diffPreco <= 1.0) score += 10

      if (coberturaAtual > 0) {
        const cobP = parseInt(getPSpec('cobertura') || getPSpec('área')) || 0
        if (cobP > 0) {
          const diffCob = Math.abs(cobP - coberturaAtual) / coberturaAtual
          if (diffCob <= 0.2)      score += 30
          else if (diffCob <= 0.5) score += 15
        }
      }

      if (tanqueAtual > 0) {
        const tanP = parseInt(getPSpec('tanque') || getPSpec('capacidade') || getPSpec('reservatório')) || 0
        if (tanP > 0 && Math.abs(tanP - tanqueAtual) <= 20) score += 20
      }

      const linhaAtual = produto.slug?.toLowerCase().includes('prime') ? 'prime' : 'trend'
      const linhaP     = p.slug?.toLowerCase().includes('prime') ? 'prime' : 'trend'
      if (linhaAtual === linhaP) score += 25

      return { ...p, score }
    })

    comScore.sort((a, b) => b.score - a.score)

    let similares = comScore.slice(0, limit)

    if (similares.length < limit) {
      const ids = new Set(similares.map(s => s.id))
      const extras = todos
        .filter(p => !ids.has(p.id))
        .slice(0, limit - similares.length)
        .map(p => ({ ...p, score: 0 }))
      similares = [...similares, ...extras]
    }

    // 4. Formatar resposta
    const formatado = similares.map(p => {
      const pSpecs = p.especificacoes as { label: string; valor: string }[] | null
      const getPSpec = (t: string) =>
        pSpecs?.find(s => s.label.toLowerCase().includes(t.toLowerCase()))?.valor || ''

      let especsDestaque: { label: string; valor: string }[] = []

      if (p.categoria === 'climatizadores') {
        const tanque   = getPSpec('tanque') || getPSpec('capacidade') || getPSpec('reservatório')
        const cobertura = getPSpec('cobertura') || getPSpec('área')
        const potencia  = getPSpec('potência') || getPSpec('potencia')
        if (tanque)    especsDestaque.push({ label: 'Tanque',    valor: tanque })
        if (cobertura) especsDestaque.push({ label: 'Cobertura', valor: cobertura })
        if (potencia)  especsDestaque.push({ label: 'Potência',  valor: potencia })
      } else if (p.categoria === 'aspiradores') {
        const succao   = getPSpec('sucção') || getPSpec('poder')
        const duracao  = getPSpec('duração') || getPSpec('bateria')
        const filtro   = getPSpec('filtro')
        if (succao)  especsDestaque.push({ label: 'Sucção',  valor: succao })
        if (duracao) especsDestaque.push({ label: 'Bateria', valor: duracao })
        if (filtro)  especsDestaque.push({ label: 'Filtro',  valor: filtro })
      } else if (p.categoria === 'spinning') {
        const pesoMax     = getPSpec('peso máximo') || getPSpec('suportado')
        const resistencia = getPSpec('resistência') || getPSpec('resistencia')
        const volante     = getPSpec('volante')
        if (pesoMax)     especsDestaque.push({ label: 'Suporta',    valor: pesoMax })
        if (resistencia) especsDestaque.push({ label: 'Resistência', valor: resistencia })
        if (volante)     especsDestaque.push({ label: 'Volante',     valor: volante })
      }

      const preco      = Number(p.preco)
      const precoPromo = p.precoPromocional ? Number(p.precoPromocional) : null
      const desconto   = precoPromo ? Math.round((1 - precoPromo / preco) * 100) : 0
      const precoFinal = precoPromo ?? preco

      return {
        id:               p.id,
        nome:             p.nome,
        slug:             p.slug,
        categoria:        p.categoria,
        preco:            String(p.preco),
        precoPromocional: p.precoPromocional ? String(p.precoPromocional) : null,
        pixPreco:         (precoFinal * 0.97).toFixed(2),
        parcelaValor:     (precoFinal / 6).toFixed(2),
        desconto:         desconto > 0 ? desconto : null,
        linha:            p.slug?.toLowerCase().includes('prime') ? 'Prime' : null,
        imagem:           (p.imagens as string[])?.[0] ?? null,
        voltagens:        p.variacoes.map(v => v.nome).filter(n => n.includes('V')),
        especsDestaque,
        mediaAvaliacoes:  p.mediaAvaliacoes,
        totalAvaliacoes:  p.totalAvaliacoes,
      }
    })

    return NextResponse.json({ similares: formatado })
  } catch (error) {
    console.error('[similares]', error)
    return NextResponse.json({ similares: [] }, { status: 500 })
  }
}
