import { prisma } from '@/lib/prisma'

const LIMITE_TENTATIVAS = 5
const JANELA_MIN = 10
const BLOQUEIO_MIN = 30

function extractIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri
  return 'unknown'
}

export async function registrarTentativaFalha(req: Request) {
  const ip = extractIp(req)
  const userAgent = req.headers.get('user-agent') || ''
  const rota = new URL(req.url).pathname

  try {
    await prisma.tentativaLogin.create({
      data: { ip, userAgent, sucesso: false, rota },
    })
  } catch (e) {
    console.error('[bruteforce] registro tentativa falhou:', e)
    return
  }

  const desde = new Date(Date.now() - JANELA_MIN * 60 * 1000)
  const count = await prisma.tentativaLogin.count({
    where: { ip, sucesso: false, createdAt: { gte: desde } },
  }).catch(() => 0)

  if (count >= LIMITE_TENTATIVAS) {
    const bloqueadoAte = new Date(Date.now() + BLOQUEIO_MIN * 60 * 1000)
    await prisma.bloqueioIp.upsert({
      where: { ip },
      create: { ip, motivo: 'brute-force', bloqueadoAte },
      update: { motivo: 'brute-force', bloqueadoAte },
    }).catch((e) => console.error('[bruteforce] upsert bloqueio falhou:', e))
  }
}

export async function registrarTentativaSucesso(req: Request) {
  const ip = extractIp(req)
  const userAgent = req.headers.get('user-agent') || ''
  const rota = new URL(req.url).pathname
  try {
    await prisma.tentativaLogin.create({
      data: { ip, userAgent, sucesso: true, rota },
    })
  } catch {}
}

export async function verificarBloqueio(req: Request): Promise<boolean> {
  const ip = extractIp(req)
  const bloq = await prisma.bloqueioIp.findUnique({ where: { ip } }).catch(() => null)
  if (!bloq) return false
  if (bloq.bloqueadoAte > new Date()) return true
  await prisma.bloqueioIp.delete({ where: { ip } }).catch(() => {})
  return false
}

export function ipFromRequest(req: Request): string {
  return extractIp(req)
}
