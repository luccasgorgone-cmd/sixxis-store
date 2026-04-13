import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { enviarEmailTeste } from '@/lib/email'

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && session.user.email !== adminEmail) return null
  return session
}

export async function POST(request: NextRequest) {
  const session = await checkAdmin()
  if (!session) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { tipo, emailDestino } = body

  if (!tipo) {
    return Response.json({ error: 'Campo obrigatório: tipo' }, { status: 400 })
  }

  const destino = emailDestino || session.user?.email
  if (!destino) {
    return Response.json({ error: 'Email de destino não informado' }, { status: 400 })
  }

  await enviarEmailTeste(tipo, destino)

  return Response.json({ ok: true, enviado_para: destino })
}
