// ════════════════════════════════════════════════════════════
// SIXXIS — Verificação e envio de upgrade de nível de fidelidade
// ════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { calcularNivel, ORDEM_NIVEIS_GEM } from '@/lib/avatares'
import { templateUpgradeNivel } from '@/lib/email-templates-premium'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sixxis.store'

/**
 * Verifica se o cliente subiu de nível após uma compra e envia e-mail de parabéns.
 * Deve ser chamado após creditar cashback / atualizar totalGasto.
 *
 * @param clienteId - ID do cliente
 * @param totalGastoAnterior - totalGasto antes da compra atual
 * @param totalGastoNovo - totalGasto após a compra atual
 */
export async function verificarUpgradeNivel(
  clienteId: string,
  totalGastoAnterior: number,
  totalGastoNovo: number,
): Promise<{ subiu: boolean; nivelAnterior: string; nivelNovo: string }> {
  const nivelAnterior = calcularNivel(totalGastoAnterior)
  const nivelNovo = calcularNivel(totalGastoNovo)

  const idxAnterior = ORDEM_NIVEIS_GEM.indexOf(nivelAnterior as typeof ORDEM_NIVEIS_GEM[number])
  const idxNovo = ORDEM_NIVEIS_GEM.indexOf(nivelNovo as typeof ORDEM_NIVEIS_GEM[number])

  if (idxNovo <= idxAnterior) {
    return { subiu: false, nivelAnterior, nivelNovo }
  }

  // Subiu! Envia e-mail de parabéns
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { nome: true, email: true },
    })

    if (cliente?.email) {
      const html = templateUpgradeNivel({
        nome: cliente.nome,
        nivelAnterior,
        nivelNovo,
        totalGasto: totalGastoNovo,
        siteUrl: SITE_URL,
      })

      // Persiste o e-mail na fila de envio via configuracao (chave dinamica por cliente+nivel)
      await prisma.configuracao.upsert({
        where: { chave: `email_upgrade_nivel_${clienteId}_${nivelNovo}` },
        update: { valor: JSON.stringify({ enviado: true, em: new Date().toISOString() }) },
        create: {
          chave: `email_upgrade_nivel_${clienteId}_${nivelNovo}`,
          valor: JSON.stringify({ enviado: true, em: new Date().toISOString() }),
        },
      }).catch(() => {})

      // Tenta enviar via API de email
      await fetch(`${SITE_URL}/api/admin/emails/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          para: cliente.email,
          assunto: `🎉 Parabéns! Você é ${nivelNovo} na Sixxis, ${cliente.nome}!`,
          html,
        }),
      }).catch(() => {}) // falha silenciosa — não bloqueia o fluxo de compra
    }
  } catch {
    // nunca bloquear o fluxo principal
  }

  return { subiu: true, nivelAnterior, nivelNovo }
}
