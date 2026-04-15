import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

function personalizarMensagem(template: string, vars: Record<string, string>) {
  let msg = template
  for (const [k, v] of Object.entries(vars)) {
    msg = msg.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v)
  }
  return msg
}

async function enviarWhatsappEvolutionApi({ instanceId, apiUrl, apiKey, para, mensagem }: {
  instanceId: string; apiUrl: string; apiKey: string; para: string; mensagem: string
}) {
  const tel = para.replace(/\D/g, '')
  const res = await fetch(`${apiUrl}/message/sendText/${instanceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
    body: JSON.stringify({ number: tel.startsWith('55') ? tel : `55${tel}`, text: mensagem }),
  })
  if (!res.ok) throw new Error(`Evolution API error: ${res.status}`)
  return res.json()
}

async function enviarEmailCampanha({ para, assunto, corpo }: { para: string; assunto: string; corpo: string }) {
  // Placeholder — adaptar para o serviço de email do projeto
  console.log(`[Email] Para: ${para} | Assunto: ${assunto} | Body: ${corpo.slice(0, 50)}...`)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth) return auth
  const { id } = await params

  const campanha = await prisma.campanha.findUnique({
    where: { id },
    include: { destinatarios: true, whatsappNumero: true },
  })
  if (!campanha) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  if (campanha.status === 'ENVIADA') return NextResponse.json({ error: 'Já enviada' }, { status: 400 })

  await prisma.campanha.update({ where: { id }, data: { status: 'ENVIANDO' } })

  let enviados = 0, erros = 0

  for (const dest of campanha.destinatarios) {
    try {
      if (campanha.tipo === 'EMAIL' && dest.email) {
        await enviarEmailCampanha({
          para: dest.email,
          assunto: campanha.assunto || 'Mensagem da Sixxis',
          corpo: personalizarMensagem(campanha.mensagem, { nome: dest.nome, email: dest.email || '' }),
        })
      } else if (campanha.tipo === 'WHATSAPP' && dest.telefone) {
        const num = campanha.whatsappNumero
        if (num?.instanceId && num?.apiUrl && num?.apiKey) {
          await enviarWhatsappEvolutionApi({
            instanceId: num.instanceId, apiUrl: num.apiUrl, apiKey: num.apiKey,
            para: dest.telefone,
            mensagem: personalizarMensagem(campanha.mensagem, { nome: dest.nome }),
          })
        } else {
          throw new Error('WhatsApp não configurado')
        }
      } else {
        throw new Error('Sem destinatário válido')
      }
      await prisma.campanhaDestinatario.update({ where: { id: dest.id }, data: { status: 'ENVIADO', enviadoEm: new Date() } })
      enviados++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      await prisma.campanhaDestinatario.update({ where: { id: dest.id }, data: { status: 'ERRO', erroMsg: msg } })
      erros++
    }
    await new Promise(r => setTimeout(r, 150))
  }

  await prisma.campanha.update({
    where: { id },
    data: { status: 'ENVIADA', enviadaEm: new Date(), totalEnviados: enviados, totalErros: erros },
  })

  return NextResponse.json({ ok: true, enviados, erros })
}
