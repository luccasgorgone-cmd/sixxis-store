import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ── Spec-based filter matching ─────────────────────────────────────────────────

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

function matchesSpecFilters(
  specs: EspecRow[],
  filters: Record<string, string>,
): boolean {
  for (const [key, valor] of Object.entries(filters)) {
    if (!valor) continue

    switch (key) {
      // ── Voltagem ───────────────────────────────────────────────────
      case 'voltagem': {
        // Check variants via variacoes, or specs
        // We check specs here; variant-level check happens outside
        const specVolt = getEspecValor(specs, 'voltag')
        if (valor === 'bivolt') {
          if (!specVolt.includes('bivolt') && !specVolt.includes('110') && !specVolt.includes('220')) return false
          // If it explicitly says bivolt or contains both 110 and 220, it's fine
          if (!specVolt.includes('bivolt') && !(specVolt.includes('110') && specVolt.includes('220'))) return false
        } else if (valor === '110V' || valor === '110v') {
          if (!specVolt.includes('110') && !specVolt.includes('bivolt')) return false
        } else if (valor === '220V' || valor === '220v') {
          if (!specVolt.includes('220') && !specVolt.includes('bivolt')) return false
        }
        break
      }

      // ── Capacidade do tanque (Litros) ──────────────────────────────
      case 'capacidade': {
        const capStr = getEspecValor(specs, 'tanque') || getEspecValor(specs, 'capacidade') || getEspecValor(specs, 'reservat')
        const cap = extractNumber(capStr)
        if (cap === 0) break
        // New exact-value format: '45', '60', '70', '100', '120', '175', '200' — ±5L tolerance
        if (/^\d+$/.test(valor)) {
          const alvo = parseInt(valor)
          if (Math.abs(cap - alvo) > 5) return false
          break
        }
        // Legacy range format
        if (valor === 'ate20'  && !(cap <= 20)) return false
        if (valor === '20-40'  && !(cap > 20 && cap <= 40)) return false
        if (valor === '40-60'  && !(cap > 40 && cap <= 60)) return false
        if (valor === 'mais60' && !(cap > 60)) return false
        break
      }

      // ── Cobertura (m²) ─────────────────────────────────────────────
      case 'cobertura': {
        const cobStr = getEspecValor(specs, 'cobertura') || getEspecValor(specs, 'área') || getEspecValor(specs, 'ambiente')
        const cob = extractNumber(cobStr)
        if (cob === 0) break
        // New format (predefined for climatizadores)
        if (valor === 'ate50'   && cob > 55)                      return false
        if (valor === 'ate60'   && cob > 65)                      return false
        if (valor === 'ate70'   && cob > 80)                      return false
        if (valor === 'ate100'  && (cob < 80  || cob > 125))      return false
        if (valor === 'ate120'  && (cob < 100 || cob > 150))      return false
        if (valor === 'ate200'  && (cob < 140 || cob > 220))      return false
        if (valor === 'mais200' && cob <= 200)                    return false
        // Legacy format
        if (valor === 'ate15'  && !(cob <= 15))                   return false
        if (valor === '15-25'  && !(cob > 15 && cob <= 25))       return false
        if (valor === '25-40'  && !(cob > 25 && cob <= 40))       return false
        if (valor === 'mais40' && !(cob > 40))                    return false
        break
      }

      // ── Vazão de Ar (m³/h) ─────────────────────────────────────────
      case 'vazao': {
        const vazStr = getEspecValor(specs, 'vazão') || getEspecValor(specs, 'vazao')
        const vaz = extractNumber(vazStr)
        if (vaz === 0) break
        // New exact-value format with ±500 m³/h tolerance
        if (/^\d+$/.test(valor)) {
          const alvo = parseInt(valor)
          if (Math.abs(vaz - alvo) > 500) return false
          break
        }
        // Legacy format
        if (valor === 'ate500'   && !(vaz <= 500))           return false
        if (valor === '500-1000' && !(vaz > 500 && vaz <= 1000)) return false
        if (valor === 'mais1000' && !(vaz > 1000))           return false
        break
      }

      // ── Velocidades ────────────────────────────────────────────────
      case 'velocidades': {
        const velStr = getEspecValor(specs, 'velocidade')
        const vel = extractNumber(velStr)
        if (vel === 0) break
        // New exact-number format: '3', '9'
        if (/^\d+$/.test(valor)) {
          const alvo = parseInt(valor)
          if (vel !== alvo) return false
          break
        }
        // Legacy format
        if (valor === '2vel' && !(vel === 2)) return false
        if (valor === '3vel' && !(vel === 3)) return false
        if (valor === '4vel' && !(vel >= 4)) return false
        break
      }

      // ── Resistência (spinning) ─────────────────────────────────────
      case 'resistencia': {
        const resStr = getEspecValor(specs, 'resistên') || getEspecValor(specs, 'resistenc')
        if (valor === 'magnetica'       && !resStr.includes('magnet')) return false
        if (valor === 'atrito'          && !resStr.includes('atrito')) return false
        if (valor === 'eletromagnetica' && !resStr.includes('eletro')) return false
        break
      }

      // ── Peso suportado (spinning) ──────────────────────────────────
      case 'peso_max': {
        const pesoStr = getEspecValor(specs, 'peso máximo') || getEspecValor(specs, 'peso max')
        const peso = extractNumber(pesoStr)
        if (peso === 0) break
        if (valor === 'ate100'  && !(peso <= 100)) return false
        if (valor === '100-120' && !(peso > 100 && peso <= 120)) return false
        if (valor === 'mais120' && !(peso > 120)) return false
        break
      }

      // ── Tipo aspirador ─────────────────────────────────────────────
      case 'tipo': {
        const tipoStr = getEspecValor(specs, 'tipo')
        if (valor === 'sem-fio'  && !tipoStr.includes('sem fio')) return false
        if (valor === 'com-fio'  && !tipoStr.includes('com fio')) return false
        if (valor === 'robo'     && !tipoStr.includes('rob')) return false
        break
      }

      default:
        break
    }
  }
  return true
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const categoria = searchParams.get('categoria')
  const q        = searchParams.get('q') || searchParams.get('busca')
  const ordem    = searchParams.get('ordem') || 'nome'
  const page     = Number(searchParams.get('page')  ?? '1')
  const limit    = Number(searchParams.get('limit') ?? '20')
  const precoMin = searchParams.get('precoMin')
  const precoMax = searchParams.get('precoMax')

  // Spec-based filters from URL (sent by FiltrosHorizontais)
  const SPEC_FILTER_KEYS = ['voltagem', 'capacidade', 'cobertura', 'vazao', 'velocidades', 'resistencia', 'peso_max', 'tipo']
  const specFilters: Record<string, string> = {}
  for (const key of SPEC_FILTER_KEYS) {
    const val = searchParams.get(key)
    if (val) specFilters[key] = val
  }

  // Price filter from filter groups (sent as e.g. preco=ate800)
  const precoFiltro = searchParams.get('preco')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    ativo: true,
    ...(categoria && { categoria }),
    ...(q && {
      OR: [
        { nome:      { contains: q } },
        { descricao: { contains: q } },
      ],
    }),
    ...((precoMin || precoMax) && {
      preco: {
        ...(precoMin                                && { gte: Number(precoMin) }),
        ...(precoMax && Number(precoMax) < 999999  && { lte: Number(precoMax) }),
      },
    }),
  }

  // Apply price filter from filter group pill
  if (precoFiltro && !precoMin && !precoMax) {
    const precoMap: Record<string, { min?: number; max?: number }> = {
      'ate500':    { max: 500 },
      '500-1500':  { min: 500, max: 1500 },
      'mais1500':  { min: 1500 },
      'ate800':    { max: 800 },
      '800-1500':  { min: 800, max: 1500 },
      '1500-2500': { min: 1500, max: 2500 },
      'mais2500':  { min: 2500 },
      'ate300':    { max: 300 },
      '300-600':   { min: 300, max: 600 },
      '600-1000':  { min: 600, max: 1000 },
      'mais1000':  { min: 1000 },
      'ate1000':   { max: 1000 },
      '1000-1500': { min: 1000, max: 1500 },
      'ate1500':   { max: 1500 },
      '1500-3000': { min: 1500, max: 3000 },
      '3000-6000': { min: 3000, max: 6000 },
      'mais6000':  { min: 6000 },
    }
    const range = precoMap[precoFiltro]
    if (range) {
      where.preco = {
        ...(range.min && { gte: range.min }),
        ...(range.max && { lte: range.max }),
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any =
    ordem === 'preco-asc'  ? { preco:     'asc'  } :
    ordem === 'preco-desc' ? { preco:     'desc' } :
    ordem === 'recentes'   ? { createdAt: 'desc' } :
    ordem === 'vendidos'   ? { vendidos:  'desc' } :
    ordem === 'nome'       ? { nome:      'asc'  } :
    /* relevancia default */ { createdAt: 'desc' }

  const hasSpecFilters = Object.keys(specFilters).length > 0

  if (hasSpecFilters) {
    // Fetch all products matching base criteria, then filter in-memory by specs
    const todosProdutos = await prisma.produto.findMany({
      where,
      orderBy,
      include: {
        variacoes: { where: { ativo: true }, orderBy: { createdAt: 'asc' } },
      },
    })

    const filtrados = todosProdutos.filter(p => {
      try {
        const raw = (p as unknown as { especificacoes?: unknown }).especificacoes
        if (!raw) return false
        const specs: EspecRow[] = Array.isArray(raw) ? raw : JSON.parse(raw as string)
        return matchesSpecFilters(specs, specFilters)
      } catch { return false }
    })

    const total = filtrados.length
    const produtos = filtrados.slice((page - 1) * limit, page * limit)
    return Response.json({ produtos, total, page, limit })
  }

  const [produtos, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        variacoes: {
          where: { ativo: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.produto.count({ where }),
  ])

  return Response.json({ produtos, total, page, limit })
}
