import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { codigo, total } = await request.json()

  if (!codigo) return NextResponse.json({ valido: false, erro: 'Código obrigatório' })

  const cupom = await prisma.cupom.findUnique({ where: { codigo: codigo.toUpperCase().trim() } })

  if (!cupom || !cupom.ativo) {
    return NextResponse.json({ valido: false, erro: 'Cupom inválido ou inativo' })
  }

  if (cupom.expiresAt && new Date() > cupom.expiresAt) {
    return NextResponse.json({ valido: false, erro: 'Cupom expirado' })
  }

  if (cupom.usoMaximo != null && cupom.usoAtual >= cupom.usoMaximo) {
    return NextResponse.json({ valido: false, erro: 'Cupom atingiu o limite de uso' })
  }

  if (cupom.valorMinimo != null && total < Number(cupom.valorMinimo)) {
    return NextResponse.json({
      valido: false,
      erro: `Pedido mínimo de R$${Number(cupom.valorMinimo).toFixed(2)} para usar este cupom`,
    })
  }

  const valor = Number(cupom.valor)
  const desconto = cupom.tipo === 'percentual'
    ? Math.min(total * (valor / 100), total)
    : Math.min(valor, total)

  return NextResponse.json({ valido: true, tipo: cupom.tipo, valor, desconto, codigo: cupom.codigo })
}
