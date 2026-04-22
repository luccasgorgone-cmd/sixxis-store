import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const unauth = await requireAdmin(request)
  if (unauth) return unauth

  // Tenta contar mensagens de hoje e do mês (modelo LunaMensagem pode existir)
  const agora = new Date()
  const hojeInicio = new Date(agora); hojeInicio.setHours(0, 0, 0, 0)
  const mesInicio  = new Date(agora.getFullYear(), agora.getMonth(), 1)

  let msgsHoje = 0
  let msgsMes  = 0
  let tokens   = 0

  try {
    msgsHoje = await prisma.lunaMensagem?.count?.({ where: { createdAt: { gte: hojeInicio } } }) ?? 0
    msgsMes  = await prisma.lunaMensagem?.count?.({ where: { createdAt: { gte: mesInicio } } }) ?? 0
  } catch { /* ignore */ }

  // Custo estimado por mensagem (Haiku 4.5 ~ $0.001 input + output combinado avg)
  const CUSTO_POR_MSG_BRL = 0.008
  const hoje = msgsHoje * CUSTO_POR_MSG_BRL
  const mes  = msgsMes  * CUSTO_POR_MSG_BRL
  const diaDoMes = agora.getDate()
  const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate()
  const projecao = diaDoMes > 0 ? (mes / diaDoMes) * diasNoMes : 0
  tokens = msgsMes * 400

  return Response.json({
    hoje:     Number(hoje.toFixed(2)),
    mes:      Number(mes.toFixed(2)),
    projecao: Number(projecao.toFixed(2)),
    tokens,
    erros: [] as Array<{ id: string; mensagem: string; createdAt: string }>,
  })
}
