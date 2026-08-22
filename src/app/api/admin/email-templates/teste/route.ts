import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { enviarEmailTeste } from '@/lib/email'

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json()
  const { tipo, emailDestino } = body

  if (!tipo) {
    return Response.json({ error: 'Campo obrigatório: tipo' }, { status: 400 })
  }

  const destino = emailDestino || process.env.ADMIN_EMAIL
  if (!destino) {
    return Response.json({ error: 'Email de destino não informado' }, { status: 400 })
  }

  await enviarEmailTeste(tipo, destino)

  return Response.json({ ok: true, enviado_para: destino })
}
