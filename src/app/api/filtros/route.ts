import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { GrupoFiltro } from '@/components/produtos/FiltrosHorizontais'

export const dynamic = 'force-dynamic'

// ── Spec helpers (mirror of /api/produtos logic) ──────────────────────────────

interface EspecRow { label: string; valor: string }

function getEspecValor(specs: EspecRow[], labelContains: string): string {
  const row = specs.find(s => s.label.toLowerCase().includes(labelContains.toLowerCase()))
  return row?.valor?.toLowerCase() ?? ''
}

function extractNumber(str: string): number {
  const match = str.replace(/\./g, '').match(/[\d]+([.,]\d+)?/)
  if (!match) return 0
  return parseFloat(match[0].replace(',', '.'))
}

function parseSpecs(raw: unknown): EspecRow[] {
  try {
    if (!raw) return []
    const arr: unknown[] = Array.isArray(raw) ? raw : JSON.parse(raw as string)
    return arr.map(item => {
      if (Array.isArray(item)) return { label: String(item[0] ?? ''), valor: String(item[1] ?? '') }
      const o = item as Record<string, unknown>
      return { label: String(o.label ?? ''), valor: String(o.valor ?? '') }
    })
  } catch { return [] }
}

// ── Option checkers ───────────────────────────────────────────────────────────

type ProdutoRow = {
  preco: unknown
  precoPromocional: unknown | null
  especificacoes: unknown
  variacoes: { nome: string }[]
}

function hasVoltagem(produtos: ProdutoRow[], valor: string): boolean {
  return produtos.some(p => {
    const specs = parseSpecs(p.especificacoes)
    const specVolt = getEspecValor(specs, 'voltag')
    const temVariacao = p.variacoes.some(v => v.nome.toLowerCase().includes(valor.toLowerCase()))
    if (temVariacao) return true
    if (valor === 'bivolt') return specVolt.includes('bivolt') || (specVolt.includes('110') && specVolt.includes('220'))
    if (valor === '110V') return specVolt.includes('110') || specVolt.includes('bivolt')
    if (valor === '220V') return specVolt.includes('220') || specVolt.includes('bivolt')
    if (valor === 'bateria') return specVolt.includes('bater') || specVolt.includes('recarreg')
    return false
  })
}

function hasCapacidade(produtos: ProdutoRow[], valor: string): boolean {
  return produtos.some(p => {
    const specs = parseSpecs(p.especificacoes)
    const capStr = getEspecValor(specs, 'tanque') || getEspecValor(specs, 'capacidade') || getEspecValor(specs, 'reservat')
    const cap = extractNumber(capStr)
    if (cap === 0) return false
    if (valor === 'ate20' && cap <= 20) return true
    if (valor === '20-40' && cap > 20 && cap <= 40) return true
    if (valor === '40-60' && cap > 40 && cap <= 60) return true
    if (valor === 'mais60' && cap > 60) return true
    return false
  })
}

function hasCobertura(produtos: ProdutoRow[], valor: string): boolean {
  return produtos.some(p => {
    const specs = parseSpecs(p.especificacoes)
    const cobStr = getEspecValor(specs, 'cobertura') || getEspecValor(specs, 'área') || getEspecValor(specs, 'ambiente')
    const cob = extractNumber(cobStr)
    if (cob === 0) return false
    if (valor === 'ate15' && cob <= 15) return true
    if (valor === '15-25' && cob > 15 && cob <= 25) return true
    if (valor === '25-40' && cob > 25 && cob <= 40) return true
    if (valor === 'mais40' && cob > 40) return true
    return false
  })
}

function hasVazao(produtos: ProdutoRow[], valor: string): boolean {
  return produtos.some(p => {
    const specs = parseSpecs(p.especificacoes)
    const vazStr = getEspecValor(specs, 'vazão') || getEspecValor(specs, 'vazao')
    const vaz = extractNumber(vazStr)
    if (vaz === 0) return false
    if (valor === 'ate500' && vaz <= 500) return true
    if (valor === '500-1000' && vaz > 500 && vaz <= 1000) return true
    if (valor === 'mais1000' && vaz > 1000) return true
    return false
  })
}

function hasVelocidades(produtos: ProdutoRow[], valor: string): boolean {
  return produtos.some(p => {
    const specs = parseSpecs(p.especificacoes)
    const vel = extractNumber(getEspecValor(specs, 'velocidade'))
    if (vel === 0) return false
    if (valor === '2vel' && vel === 2) return true
    if (valor === '3vel' && vel === 3) return true
    if (valor === '4vel' && vel >= 4) return true
    return false
  })
}

function hasPreco(produtos: ProdutoRow[], valor: string): boolean {
  return produtos.some(p => {
    const preco = parseFloat(String(p.precoPromocional || p.preco))
    const precoMap: Record<string, [number, number]> = {
      'ate500':    [0,    500],
      '500-1500':  [500,  1500],
      'mais1500':  [1500, Infinity],
      'ate800':    [0,    800],
      '800-1500':  [800,  1500],
      '1500-2500': [1500, 2500],
      'mais2500':  [2500, Infinity],
      'ate300':    [0,    300],
      '300-600':   [300,  600],
      '600-1000':  [600,  1000],
      'mais1000':  [1000, Infinity],
    }
    const range = precoMap[valor]
    if (!range) return false
    return preco >= range[0] && preco < range[1]
  })
}

function hasTipoAspirador(produtos: ProdutoRow[], valor: string): boolean {
  return produtos.some(p => {
    const specs = parseSpecs(p.especificacoes)
    const tipo = getEspecValor(specs, 'tipo')
    if (valor === 'sem-fio'  && (tipo.includes('sem fio') || tipo.includes('sem-fio') || tipo.includes('bateria'))) return true
    if (valor === 'com-fio'  && (tipo.includes('com fio') || tipo.includes('com-fio') || tipo.includes('cabo'))) return true
    if (valor === 'robo'     && tipo.includes('rob')) return true
    if (valor === 'multiuso' && tipo.includes('multiuso')) return true
    return false
  })
}

function hasResistencia(produtos: ProdutoRow[], valor: string): boolean {
  return produtos.some(p => {
    const specs = parseSpecs(p.especificacoes)
    const res = getEspecValor(specs, 'resistên') || getEspecValor(specs, 'resistenc')
    if (valor === 'magnetica'       && res.includes('magnet')) return true
    if (valor === 'atrito'          && res.includes('atrito')) return true
    if (valor === 'eletromagnetica' && res.includes('eletro')) return true
    return false
  })
}

function hasPesoMax(produtos: ProdutoRow[], valor: string): boolean {
  return produtos.some(p => {
    const specs = parseSpecs(p.especificacoes)
    const peso = extractNumber(getEspecValor(specs, 'peso máximo') || getEspecValor(specs, 'peso max') || getEspecValor(specs, 'suportado'))
    if (peso === 0) return false
    if (valor === 'ate100'  && peso <= 100) return true
    if (valor === '100-120' && peso > 100 && peso <= 120) return true
    if (valor === 'mais120' && peso > 120) return true
    return false
  })
}

// ── Categoria-specific builders ───────────────────────────────────────────────

function buildClimatizadores(_produtos: ProdutoRow[]): GrupoFiltro[] {
  // Opções fixas e predefinidas para climatizadores Sixxis
  return [
    {
      id: 'voltagem',
      label: 'Voltagem',
      opcoes: [
        { label: '110V',   valor: '110v'   },
        { label: '220V',   valor: '220v'   },
        { label: 'Bivolt', valor: 'bivolt' },
      ],
    },
    {
      id: 'capacidade',
      label: 'Capacidade (Tanque)',
      opcoes: [
        { label: '45 Litros',  valor: '45'  },
        { label: '60 Litros',  valor: '60'  },
        { label: '70 Litros',  valor: '70'  },
        { label: '100 Litros', valor: '100' },
        { label: '120 Litros', valor: '120' },
        { label: '175 Litros', valor: '175' },
        { label: '200 Litros', valor: '200' },
      ],
    },
    {
      id: 'cobertura',
      label: 'Cobertura (m²)',
      opcoes: [
        { label: 'Até 50 m²',       valor: 'ate50'   },
        { label: 'Até 60 m²',       valor: 'ate60'   },
        { label: 'Até 70 m²',       valor: 'ate70'   },
        { label: 'Até 100 m²',      valor: 'ate100'  },
        { label: 'Até 120 m²',      valor: 'ate120'  },
        { label: 'Até 200 m²',      valor: 'ate200'  },
        { label: 'Acima de 200 m²', valor: 'mais200' },
      ],
    },
    {
      id: 'velocidades',
      label: 'Velocidades',
      opcoes: [
        { label: '3 velocidades', valor: '3' },
        { label: '9 velocidades', valor: '9' },
      ],
    },
    {
      id: 'vazao',
      label: 'Vazão de Ar',
      opcoes: [
        { label: '5.500 m³/h',  valor: '5500'  },
        { label: '6.000 m³/h',  valor: '6000'  },
        { label: '8.000 m³/h',  valor: '8000'  },
        { label: '12.000 m³/h', valor: '12000' },
        { label: '14.000 m³/h', valor: '14000' },
        { label: '20.000 m³/h', valor: '20000' },
        { label: '25.000 m³/h', valor: '25000' },
      ],
    },
    {
      id: 'preco',
      label: 'Faixa de Preço',
      opcoes: [
        { label: 'Até R$ 1.500',         valor: 'ate1500'   },
        { label: 'R$ 1.500 a R$ 3.000',  valor: '1500-3000' },
        { label: 'R$ 3.000 a R$ 6.000',  valor: '3000-6000' },
        { label: 'Acima de R$ 6.000',    valor: 'mais6000'  },
      ],
    },
  ]
}

function buildAspiradores(produtos: ProdutoRow[]): GrupoFiltro[] {
  const grupos: GrupoFiltro[] = []

  const optsTipo: GrupoFiltro['opcoes'] = [
    { label: 'Sem fio',  valor: 'sem-fio'  },
    { label: 'Com fio',  valor: 'com-fio'  },
    { label: 'Robô',     valor: 'robo'     },
    { label: 'Multiuso', valor: 'multiuso' },
  ].filter(o => hasTipoAspirador(produtos, o.valor))
  if (optsTipo.length) grupos.push({ id: 'tipo', label: 'Tipo', opcoes: optsTipo })

  const optsVoltagem: GrupoFiltro['opcoes'] = [
    { label: '110V',    valor: '110V'    },
    { label: '220V',    valor: '220V'    },
    { label: 'Bivolt',  valor: 'bivolt'  },
    { label: 'Bateria', valor: 'bateria' },
  ].filter(o => hasVoltagem(produtos, o.valor))
  if (optsVoltagem.length) grupos.push({ id: 'voltagem', label: 'Voltagem', opcoes: optsVoltagem })

  const optsPreco: GrupoFiltro['opcoes'] = [
    { label: 'Até R$ 300',        valor: 'ate300'   },
    { label: 'R$ 300 a R$ 600',   valor: '300-600'  },
    { label: 'R$ 600 a R$ 1.000', valor: '600-1000' },
    { label: 'Acima de R$ 1.000', valor: 'mais1000' },
  ].filter(o => hasPreco(produtos, o.valor))
  if (optsPreco.length) grupos.push({ id: 'preco', label: 'Preço', opcoes: optsPreco })

  return grupos
}

function buildSpinning(produtos: ProdutoRow[]): GrupoFiltro[] {
  const grupos: GrupoFiltro[] = []

  const optsRes: GrupoFiltro['opcoes'] = [
    { label: 'Magnética',       valor: 'magnetica'       },
    { label: 'Por Atrito',      valor: 'atrito'          },
    { label: 'Eletromagnética', valor: 'eletromagnetica' },
  ].filter(o => hasResistencia(produtos, o.valor))
  if (optsRes.length) grupos.push({ id: 'resistencia', label: 'Resistência', opcoes: optsRes })

  const optsPeso: GrupoFiltro['opcoes'] = [
    { label: 'Até 100kg',      valor: 'ate100'   },
    { label: '100 a 120kg',    valor: '100-120'  },
    { label: 'Acima de 120kg', valor: 'mais120'  },
  ].filter(o => hasPesoMax(produtos, o.valor))
  if (optsPeso.length) grupos.push({ id: 'peso_max', label: 'Peso Suportado', opcoes: optsPeso })

  const optsPreco: GrupoFiltro['opcoes'] = [
    { label: 'Até R$ 800',          valor: 'ate800'    },
    { label: 'R$ 800 a R$ 1.500',   valor: '800-1500'  },
    { label: 'R$ 1.500 a R$ 2.500', valor: '1500-2500' },
    { label: 'Acima de R$ 2.500',   valor: 'mais2500'  },
  ].filter(o => hasPreco(produtos, o.valor))
  if (optsPreco.length) grupos.push({ id: 'preco', label: 'Preço', opcoes: optsPreco })

  return grupos
}

function buildGeral(produtos: ProdutoRow[]): GrupoFiltro[] {
  return [
    {
      id: 'categoria', label: 'Categoria', opcoes: [
        { label: 'Climatizadores',   valor: 'climatizadores' },
        { label: 'Aspiradores',      valor: 'aspiradores'    },
        { label: 'Spinning',         valor: 'spinning'       },
      ],
    },
    {
      id: 'preco', label: 'Preço', opcoes: [
        { label: 'Até R$ 500',        valor: 'ate500'     },
        { label: 'R$ 500 a R$ 1.500', valor: '500-1500'   },
        { label: 'Acima de R$ 1.500', valor: 'mais1500'   },
      ].filter(o => hasPreco(produtos, o.valor)),
    },
  ]
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const categoria = req.nextUrl.searchParams.get('categoria') || ''

    const produtos = await prisma.produto.findMany({
      where: { ativo: true, ...(categoria ? { categoria } : {}) },
      select: {
        preco: true,
        precoPromocional: true,
        especificacoes: true,
        variacoes: { where: { ativo: true }, select: { nome: true } },
      },
    }) as ProdutoRow[]

    let grupos: GrupoFiltro[]
    if (categoria === 'climatizadores') grupos = buildClimatizadores(produtos)
    else if (categoria === 'aspiradores')  grupos = buildAspiradores(produtos)
    else if (categoria === 'spinning')     grupos = buildSpinning(produtos)
    else                                   grupos = buildGeral(produtos)

    return NextResponse.json({ grupos })
  } catch (err) {
    console.error('[/api/filtros]', err)
    return NextResponse.json({ grupos: [] }, { status: 500 })
  }
}
