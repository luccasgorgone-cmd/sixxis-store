import { prisma } from '@/lib/prisma'

// Mensagem única de bloqueio — reutilizada nos gates de API e na tela de login.
export const MSG_CONTA_BLOQUEADA = 'Conta bloqueada. Entre em contato com o suporte.'

// Gate autoritativo server-side: o cliente da sessão está bloqueado?
// Lookup por PK (barato). Em caso de erro de DB, devolve false (não trava o site
// por indisponibilidade) — a checagem de login/sessão cobre os demais pontos.
export async function isClienteBloqueado(clienteId: string): Promise<boolean> {
  try {
    const c = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { bloqueado: true },
    })
    return !!c?.bloqueado
  } catch {
    return false
  }
}
