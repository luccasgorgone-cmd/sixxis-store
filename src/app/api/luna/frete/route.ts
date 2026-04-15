import { NextRequest, NextResponse } from 'next/server'

// Tabela de frete simplificada por prefixo de CEP
// (substituir por integração real com Correios futuramente)
const REGIOES: Record<string, { prazo: string; frete: number; gratis: boolean }> = {
  '01': { prazo: '3-5 dias úteis', frete: 25.90, gratis: false },
  '02': { prazo: '3-5 dias úteis', frete: 25.90, gratis: false },
  '03': { prazo: '3-5 dias úteis', frete: 25.90, gratis: false },
  '04': { prazo: '3-5 dias úteis', frete: 25.90, gratis: false },
  '05': { prazo: '3-5 dias úteis', frete: 25.90, gratis: false },
  '06': { prazo: '3-5 dias úteis', frete: 25.90, gratis: false },
  '07': { prazo: '3-5 dias úteis', frete: 25.90, gratis: false },
  '08': { prazo: '3-5 dias úteis', frete: 25.90, gratis: false },
  '09': { prazo: '3-5 dias úteis', frete: 25.90, gratis: false },
  '13': { prazo: '3-5 dias úteis', frete: 22.90, gratis: false }, // Campinas/Interior SP
  '14': { prazo: '3-5 dias úteis', frete: 22.90, gratis: false }, // Ribeirão Preto
  '15': { prazo: '1-2 dias úteis', frete: 18.90, gratis: false }, // Araçatuba região
  '16': { prazo: '1-2 dias úteis', frete: 0,     gratis: true  }, // Araçatuba (cidade sede)
  '17': { prazo: '2-3 dias úteis', frete: 20.90, gratis: false }, // Bauru
  '18': { prazo: '3-5 dias úteis', frete: 22.90, gratis: false }, // Presidente Prudente
  '19': { prazo: '3-5 dias úteis', frete: 22.90, gratis: false }, // Interior SP Oeste
  '20': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false }, // RJ Capital
  '21': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false },
  '22': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false },
  '23': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false },
  '24': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false },
  '25': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false },
  '26': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false },
  '27': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false },
  '28': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false },
  '29': { prazo: '5-8 dias úteis', frete: 32.90, gratis: false },
  '30': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false }, // MG
  '31': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false },
  '32': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false },
  '33': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false },
  '34': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false },
  '35': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false },
  '36': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false },
  '37': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false },
  '38': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false },
  '39': { prazo: '4-7 dias úteis', frete: 28.90, gratis: false },
  '40': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false }, // BA
  '41': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '42': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '44': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '45': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '48': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '49': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '50': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false }, // PE
  '51': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false },
  '52': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false },
  '53': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false },
  '54': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false },
  '55': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false },
  '56': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false },
  '57': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false },
  '58': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false },
  '59': { prazo: '7-10 dias úteis', frete: 36.90, gratis: false },
  '60': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false }, // CE
  '61': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '62': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '63': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '64': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '65': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false }, // MA
  '66': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false }, // PA
  '67': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false },
  '68': { prazo: '10-15 dias úteis', frete: 44.90, gratis: false }, // AM/PA interior
  '69': { prazo: '10-15 dias úteis', frete: 44.90, gratis: false }, // AM
  '70': { prazo: '6-10 dias úteis', frete: 35.90, gratis: false }, // DF
  '71': { prazo: '6-10 dias úteis', frete: 35.90, gratis: false },
  '72': { prazo: '6-10 dias úteis', frete: 35.90, gratis: false },
  '73': { prazo: '6-10 dias úteis', frete: 35.90, gratis: false }, // GO
  '74': { prazo: '6-10 dias úteis', frete: 35.90, gratis: false },
  '75': { prazo: '6-10 dias úteis', frete: 35.90, gratis: false },
  '76': { prazo: '6-10 dias úteis', frete: 35.90, gratis: false },
  '77': { prazo: '7-12 dias úteis', frete: 38.90, gratis: false }, // TO
  '78': { prazo: '8-12 dias úteis', frete: 40.90, gratis: false }, // MT
  '79': { prazo: '5-8 dias úteis',  frete: 30.90, gratis: false }, // MS
  '80': { prazo: '4-6 dias úteis',  frete: 29.90, gratis: false }, // PR
  '81': { prazo: '4-6 dias úteis',  frete: 29.90, gratis: false },
  '82': { prazo: '4-6 dias úteis',  frete: 29.90, gratis: false },
  '83': { prazo: '4-6 dias úteis',  frete: 29.90, gratis: false },
  '84': { prazo: '4-6 dias úteis',  frete: 29.90, gratis: false },
  '85': { prazo: '4-6 dias úteis',  frete: 29.90, gratis: false },
  '86': { prazo: '4-6 dias úteis',  frete: 29.90, gratis: false },
  '87': { prazo: '4-6 dias úteis',  frete: 29.90, gratis: false },
  '88': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false }, // SC
  '89': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
  '90': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false }, // RS
  '91': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
  '92': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
  '93': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
  '94': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
  '95': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
  '96': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
  '97': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
  '98': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
  '99': { prazo: '5-8 dias úteis',  frete: 31.90, gratis: false },
}

function getRegiao(cep: string) {
  const dois = cep.substring(0, 2)
  return (
    REGIOES[dois] ?? { prazo: '5-12 dias úteis', frete: 34.90, gratis: false }
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cep, valorPedido } = body

    if (!cep) return NextResponse.json({ error: 'CEP obrigatório' }, { status: 400 })

    const cepLimpo = String(cep).replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
    }

    const regiao = getRegiao(cepLimpo)
    const freteGratis = regiao.gratis || (valorPedido && Number(valorPedido) >= 500)
    const freteValor = freteGratis ? 0 : regiao.frete

    return NextResponse.json({
      cep: cepLimpo,
      prazo: regiao.prazo,
      frete: freteValor,
      freteGratis,
      mensagem: freteGratis
        ? `✅ Frete GRÁTIS para seu CEP! Prazo estimado: ${regiao.prazo}`
        : `📦 Frete: R$ ${freteValor.toFixed(2).replace('.', ',')} | Prazo estimado: ${regiao.prazo}`,
      observacao:
        !freteGratis && valorPedido && Number(valorPedido) < 500
          ? 'Frete grátis para compras acima de R$ 500,00'
          : undefined,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao calcular frete' }, { status: 500 })
  }
}
