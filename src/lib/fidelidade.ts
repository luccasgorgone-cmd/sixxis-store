import { prisma } from '@/lib/prisma'

// Configurações default (podem ser overrideadas via Configuracao no DB)
export const PONTOS_POR_REAL = 1 // 1 ponto por R$1 gasto
export const REAIS_POR_PONTO = 100 // 100 pontos = R$1 de desconto

export async function obterConfig(chave: string, fallback: string) {
  try {
    const cfg = await prisma.configuracao.findUnique({ where: { chave } })
    return cfg?.valor ?? fallback
  } catch {
    return fallback
  }
}

export async function calcularPontos(total: number): Promise<number> {
  const ratio = Number(await obterConfig('fidelidade_pontos_por_real', String(PONTOS_POR_REAL)))
  return Math.floor(total * ratio)
}

export async function obterSaldo(clienteId: string): Promise<number> {
  const pontos = await prisma.pontosCliente.findUnique({ where: { clienteId } })
  return pontos?.pontos ?? 0
}

export async function creditarPontos(clienteId: string, pontos: number, descricao: string, pedidoId?: string) {
  await prisma.$transaction([
    prisma.pontosCliente.upsert({
      where: { clienteId },
      update: { pontos: { increment: pontos } },
      create: { clienteId, pontos },
    }),
    prisma.historicoPontos.create({
      data: { clienteId, pontos, tipo: 'credito', descricao, pedidoId: pedidoId ?? null },
    }),
  ])
}

export async function debitarPontos(clienteId: string, pontos: number, descricao: string) {
  const saldo = await obterSaldo(clienteId)
  if (saldo < pontos) throw new Error('Saldo insuficiente')

  await prisma.$transaction([
    prisma.pontosCliente.update({
      where: { clienteId },
      data: { pontos: { decrement: pontos } },
    }),
    prisma.historicoPontos.create({
      data: { clienteId, pontos: -pontos, tipo: 'debito', descricao },
    }),
  ])
}

export async function pontosParaDesconto(pontos: number): Promise<number> {
  const ratio = Number(await obterConfig('fidelidade_reais_por_ponto', String(REAIS_POR_PONTO)))
  return pontos / ratio
}

// Gera um cupom de desconto a partir de resgate de pontos
export async function resgatarPontos(clienteId: string, pontos: number): Promise<string> {
  const saldo = await obterSaldo(clienteId)
  if (saldo < pontos) throw new Error('Saldo insuficiente')

  const desconto = await pontosParaDesconto(pontos)
  if (desconto < 1) throw new Error('Mínimo de resgate é R$1,00')

  const codigo = `FIDELIDADE-${Date.now().toString(36).toUpperCase()}`

  await prisma.$transaction([
    prisma.cupom.create({
      data: {
        codigo,
        tipo:  'fixo',
        valor: desconto,
        usoMaximo: 1,
        ativo: true,
      },
    }),
    prisma.pontosCliente.update({
      where: { clienteId },
      data: { pontos: { decrement: pontos } },
    }),
    prisma.historicoPontos.create({
      data: {
        clienteId,
        pontos: -pontos,
        tipo: 'resgate',
        descricao: `Resgate por cupom ${codigo} — R$${desconto.toFixed(2)}`,
      },
    }),
  ])

  return codigo
}
