import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const cliente = await prisma.cliente.findUnique({
    where: { id: session.user.id },
    select: {
      nome: true, email: true, cpf: true, telefone: true,
      cnpj: true, razaoSocial: true, inscricaoEstadual: true, indicadorIE: true,
      dataNascimento: true, genero: true,
      avatar: true, avatarGradiente: true,
      notifEmail: true, notifWhatsapp: true,
    },
  })

  return NextResponse.json({ cliente })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json() as {
    nome?: string
    cpf?: string
    // Pessoa jurídica (consumidor final) — vindo do checkout.
    cnpj?: string
    razaoSocial?: string | null
    inscricaoEstadual?: string | null
    indicadorIE?: number | null
    telefone?: string
    dataNascimento?: string | null
    genero?: string | null
    avatar?: string | null
    avatarGradiente?: string | null
    notifEmail?: boolean
    notifWhatsapp?: boolean
  }

  const data: Record<string, unknown> = {}
  if (body.nome !== undefined)            data.nome = body.nome
  if (body.cpf !== undefined)             data.cpf = body.cpf ? body.cpf.replace(/\D/g, '') : null
  // CNPJ só dígitos, nunca gravado no campo cpf.
  if (body.cnpj !== undefined)            data.cnpj = body.cnpj ? body.cnpj.replace(/\D/g, '') : null
  if (body.razaoSocial !== undefined)     data.razaoSocial = body.razaoSocial || null
  if (body.inscricaoEstadual !== undefined) data.inscricaoEstadual = body.inscricaoEstadual ? String(body.inscricaoEstadual).replace(/\D/g, '') : null
  if (body.indicadorIE !== undefined)     data.indicadorIE = body.indicadorIE ?? null
  if (body.telefone !== undefined)        data.telefone = body.telefone ? body.telefone.replace(/\D/g, '') : null
  if (body.dataNascimento !== undefined)  data.dataNascimento = body.dataNascimento ? new Date(body.dataNascimento) : null
  if (body.genero !== undefined)          data.genero = body.genero ?? null
  if (body.avatar !== undefined)          data.avatar = body.avatar ?? null
  if (body.avatarGradiente !== undefined) data.avatarGradiente = body.avatarGradiente ?? 'tiffany'
  if (body.notifEmail !== undefined)      data.notifEmail = body.notifEmail
  if (body.notifWhatsapp !== undefined)   data.notifWhatsapp = body.notifWhatsapp

  try {
    const cliente = await prisma.cliente.update({
      where: { id: session.user.id },
      data,
      select: { id: true, nome: true, email: true },
    })
    return NextResponse.json({ cliente })
  } catch (e) {
    // cpf/cnpj são @unique: se outro cadastro já usa esse documento, retorna 409
    // sem 500. A mensagem reflete qual documento colidiu.
    if ((e as { code?: string }).code === 'P2002') {
      const target = String((e as { meta?: { target?: unknown } }).meta?.target ?? '')
      const doc = target.includes('cnpj') ? 'CNPJ' : 'CPF'
      return NextResponse.json(
        { error: `${doc} já cadastrado em outra conta.` },
        { status: 409 },
      )
    }
    throw e
  }
}
