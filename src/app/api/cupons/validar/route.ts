import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { avaliarCupom } from '@/lib/cupom'
import { rateLimit, getClientIp } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const rl = await rateLimit('validar-cupom', getClientIp(request))
  if (!rl.success) {
    return NextResponse.json(
      { valido: false, erro: 'Muitas tentativas. Aguarde um momento.' },
      { status: 429 },
    )
  }

  const { codigo, total } = await request.json()

  if (!codigo) return NextResponse.json({ valido: false, erro: 'Código obrigatório' })

  const cupom = await prisma.cupom.findUnique({ where: { codigo: codigo.toUpperCase().trim() } })

  // Sessão do cliente (se houver) — necessária p/ a regra de primeira compra.
  const session = await auth()
  const clienteId = session?.user?.id ?? null

  const r = await avaliarCupom(cupom, Number(total) || 0, clienteId)
  if (!r.valido) return NextResponse.json({ valido: false, erro: r.erro })

  return NextResponse.json({
    valido:   true,
    tipo:     r.tipo,
    valor:    r.valor,
    desconto: r.desconto,
    codigo:   r.codigo,
  })
}
