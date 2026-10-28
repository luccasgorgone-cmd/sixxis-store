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
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }

  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  // register() pode ser chamado mais de uma vez (ex.: HMR em dev, ou por worker).
  // Sem guarda, empilharíamos watchdogs/handlers de sinal a cada chamada.
  const guarda = globalThis as unknown as { __instrumentationBooted?: boolean }
  if (guarda.__instrumentationBooted) return
  guarda.__instrumentationBooted = true

  // Encerramento gracioso do pool. SEM isto, o SIGTERM que o Railway manda em
  // TODO redeploy (e o process.exit(1) do watchdog abaixo) matam o processo sem
  // fechar o pool mariadb: as conexões abertas no MySQL ficam penduradas até o
  // wait_timeout (~8h). Com restartPolicy ON_FAILURE, um blip de DB vira loop de
  // restart e cada ciclo abandona até `connectionLimit` conexões-zumbi mais rápido
  // do que o servidor as recolhe → estoura max_connections (151) → 1040 "Too many
  // connections" no próximo `migrate deploy`/boot. Drenar o pool na saída faz o
  // MySQL liberar as conexões na hora.
  const drenarPool = async (): Promise<void> => {
    try {
      const { prisma } = await import('./lib/prisma')
      // Timeout defensivo: um pool travado não pode impedir o processo de sair.
      await Promise.race([
        prisma.$disconnect(),
        new Promise<void>((resolve) => setTimeout(resolve, 5000)),
      ])
    } catch {
      // Estamos saindo de qualquer forma — nada a fazer.
    }
  }

  let encerrando = false
  const encerrarGracioso = () => {
    if (encerrando) return
    encerrando = true
    void drenarPool().finally(() => {
      // Código 0: saída limpa a pedido do orquestrador, não aciona ON_FAILURE.
      process.exit(0)
    })
  }
  process.once('SIGTERM', encerrarGracioso)
  process.once('SIGINT', encerrarGracioso)

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

  // Watchdog de banco: auto-recuperação em runtime. O healthcheck do Railway só
  // roda no deploy, não continuamente — então, se o pool do Prisma travar (ex.:
  // banco reinicia e as conexões morrem), nada reinicia o container e o site
  // fica fora até um restart manual (incidente de 2026-10-10, ~7h fora).
  // Aqui pingamos o pool periodicamente; se falhar de forma sustentada, saímos
  // com código !=0 e o Railway (restartPolicy ON_FAILURE) sobe um processo novo,
  // reconstruindo o pool — bounded recovery de minutos em vez de horas.
  if (process.env.NODE_ENV === 'production' && process.env.DB_WATCHDOG_DISABLED !== '1') {
    const { prisma } = await import('./lib/prisma')
    const INTERVALO_MS = 30_000
    const MAX_FALHAS = 6 // ~3 min de banco inacessível antes de reiniciar
    let falhas = 0
    const timer = setInterval(async () => {
      try {
        await prisma.$queryRaw`SELECT 1`
        if (falhas > 0) console.info(`[db-watchdog] banco recuperado após ${falhas} falha(s)`)
        falhas = 0
      } catch (e) {
        falhas++
        console.error(`[db-watchdog] ping falhou (${falhas}/${MAX_FALHAS}): ${String(e).slice(0, 200)}`)
        if (falhas >= MAX_FALHAS) {
          console.error('[db-watchdog] banco inacessível de forma sustentada — reiniciando o processo para reconstruir o pool')
          // Drena o pool ANTES de sair: senão o restart (ON_FAILURE) deixaria até
          // `connectionLimit` conexões penduradas no MySQL a cada ciclo — que era
          // justamente o que saturava o max_connections durante um incidente.
          await drenarPool()
          process.exit(1)
        }
      }
    }, INTERVALO_MS)
    // Não manter o processo vivo só por causa do timer.
    timer.unref()
  }
}

// Erros de Server Components, middleware e proxies — captura automática pelo
// Next.js quando exportado daqui. Sem SENTRY_DSN configurado o SDK está
// inerte (ver src/sentry.server.config.ts), então isto não envia nada hoje.
export { captureRequestError as onRequestError } from '@sentry/nextjs'
