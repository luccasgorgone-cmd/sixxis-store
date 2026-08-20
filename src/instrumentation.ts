// Hook oficial do Next.js — roda 1x quando o server sobe, antes de qualquer
// request. Único lugar que cobre literalmente "crash: reconcilia no restart"
// (requisito 8 do checkout multi-método): se o container caiu com alguma
// tentativa travada em 'em_andamento'/'aguardando_confirmacao'/etc, isto
// converge o estado assim que o processo volta, sem depender do cliente
// voltar à página ou do webhook chegar de novo.
//
// Também é reexecutável sob demanda via /api/interno/checkout/multi-metodo/
// reconciliar (autenticado, x-internal-key) — o boot cobre "acabou de cair e
// subiu de novo", mas um container que fica dias no ar sem restart também
// precisa de reconciliação periódica; isso exige um agendador EXTERNO
// (Railway Cron Job batendo nessa rota, por exemplo) — não implementado aqui,
// fora do escopo de código.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  try {
    const { reconciliarMultiMetodo } = await import('./lib/checkout-multi-metodo-orquestrador')
    const { paymentsClientDeps } = await import('./lib/mercadopago-payments-deps')
    const resultado = await reconciliarMultiMetodo(paymentsClientDeps)
    if (resultado.tentativasProcessadas > 0 || resultado.estornosRetentados > 0) {
      console.info('[instrumentation] reconciliação de checkout multi-método no boot:', resultado)
    }
  } catch (e) {
    // Nunca derruba o boot do server por causa disto — só loga.
    console.error('[instrumentation] falha na reconciliação de boot:', e)
  }
}
