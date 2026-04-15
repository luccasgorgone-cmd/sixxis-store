import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { codigo, total } = await request.json()

  if (!codigo) return NextResponse.json({ valido: false, erro: 'Código obrigatório' })

  const cupom = await prisma.cupom.findUnique({ where: { codigo: codigo.toUpperCase().trim() } })

  if (!cupom || !cupom.ativo) {
    return NextResponse.json({ valido: false, erro: 'Cupom inválido ou inativo' })
  }

  if (cupom.validade && new Date() > cupom.validade) {
    return NextResponse.json({ valido: false, erro: 'Cupom expirado' })
  }

  if (cupom.usoMaximo != null && cupom.totalUsos >= cupom.usoMaximo) {
    return NextResponse.json({ valido: false, erro: 'Cupom atingiu o limite de uso' })
  }

  if (cupom.pedidoMinimo > 0 && total < cupom.pedidoMinimo) {
    return NextResponse.json({
      valido: false,
      erro: `Pedido mínimo de R$${Number(cupom.pedidoMinimo).toFixed(2)} para usar este cupom`,
    })
  }

  const valor = Number(cupom.valor)
  const desconto =
    cupom.tipo === 'PERCENTUAL'
      ? Math.min(total * (valor / 100), total)
      : cupom.tipo === 'VALOR_FIXO'
        ? Math.min(valor, total)
        : 0 // FRETE_GRATIS — desconto aplicado no frete, não aqui

  return NextResponse.json({ valido: true, tipo: cupom.tipo, valor, desconto, codigo: cupom.codigo })
}
