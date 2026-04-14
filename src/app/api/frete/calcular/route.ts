import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { cep, peso = 15 } = await req.json()
    void peso // used in future Correios integration

    const configs = await prisma.configuracao.findMany({
      where: { chave: { in: ['frete_gratis_acima'] } },
    })
    const cfg = Object.fromEntries(configs.map(c => [c.chave, c.valor]))
    const freteGratisAcima = Number(cfg.frete_gratis_acima || 500)
    void freteGratisAcima

    // Estimate by region based on CEP prefix
    const prefixo = Number(String(cep).slice(0, 5))

    let pac = { prazo: '7 a 10 dias úteis', preco: 29.90 }
    let sedex = { prazo: '3 a 5 dias úteis', preco: 49.90 }

    // SP interior (01000–19999)
    if (prefixo >= 1000 && prefixo <= 19999) {
      pac = { prazo: '3 a 5 dias úteis', preco: 18.90 }
      sedex = { prazo: '1 a 2 dias úteis', preco: 32.90 }
    }
    // SP capital (01000–09999) frete grátis PAC
    if (prefixo >= 1000 && prefixo <= 9999) {
      pac = { prazo: '2 a 4 dias úteis', preco: 0 }
      sedex = { prazo: '1 dia útil', preco: 24.90 }
    }
    // Sul (80000–99999)
    if (prefixo >= 80000 && prefixo <= 99999) {
      pac = { prazo: '4 a 7 dias úteis', preco: 22.90 }
      sedex = { prazo: '2 a 3 dias úteis', preco: 38.90 }
    }
    // Norte/Nordeste (40000–79999)
    if (prefixo >= 40000 && prefixo <= 79999) {
      pac = { prazo: '8 a 12 dias úteis', preco: 34.90 }
      sedex = { prazo: '4 a 6 dias úteis', preco: 59.90 }
    }

    return Response.json({
      ok: true,
      opcoes: [
        { tipo: 'PAC — Correios',   prazo: pac.prazo,   preco: pac.preco   },
        { tipo: 'SEDEX — Correios', prazo: sedex.prazo, preco: sedex.preco },
      ],
    })
  } catch {
    return Response.json({ ok: false, erro: 'Erro interno' }, { status: 500 })
  }
}
