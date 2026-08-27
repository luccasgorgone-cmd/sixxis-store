import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import { STATUS_PAGO_TODOS } from '@/lib/pedido-status'
import { mpPayment, somarTaxaMp } from '@/lib/mercadopago'

// Mesma lógica de POST /api/admin/pagamentos/sincronizar-taxas, rodada aqui
// porque a rota exige cookie admin_token (sessão de navegador) que não temos
// neste script. Timeout de socket maior que o default do driver (1000ms),
// que estoura nessa rede sandbox — só para este script.
const rawUrl = process.env.DATABASE_URL!
const adapterUrl = (rawUrl.startsWith('mysql://') ? rawUrl.replace(/^mysql:\/\//, 'mariadb://') : rawUrl)
  .replace(/([?&])connectTimeout=\d+/, '') + (rawUrl.includes('?') ? '&' : '?') + 'connectTimeout=15000'
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(adapterUrl) })

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function sincronizarTaxasMp() {
  const pendentes = await prisma.pedido.findMany({
    where: { status: { in: STATUS_PAGO_TODOS }, mpPaymentId: { not: null }, mpTaxaReal: null },
    select: { id: true, mpPaymentId: true },
    orderBy: { pagoEm: 'desc' },
  })

  console.log(`\n=== Sincronizando taxa MP em ${pendentes.length} pedido(s) ===`)
  let atualizados = 0, semTaxa = 0, falhas = 0, viaCache = 0

  for (const p of pendentes) {
    const mpPaymentId = p.mpPaymentId as string
    try {
      const pagamento = await prisma.pagamento.findUnique({
        where: { mpPaymentId },
        select: { rawResponse: true },
      })
      const raw = pagamento?.rawResponse as { fee_details?: unknown } | null
      let taxa = somarTaxaMp(raw?.fee_details)
      if (taxa != null) viaCache++

      if (taxa == null) {
        if (!mpPayment) throw new Error('Mercado Pago client não configurado')
        const mpResp = await mpPayment.get({ id: mpPaymentId })
        taxa = somarTaxaMp((mpResp as { fee_details?: unknown }).fee_details)
        await pausa(250)
      }

      if (taxa == null) {
        semTaxa++
        console.warn(`  [sem fee_details] pedido ${p.id} (mpPaymentId ${mpPaymentId})`)
        continue
      }

      const r = await prisma.pedido.updateMany({
        where: { id: p.id, mpTaxaReal: null },
        data: { mpTaxaReal: taxa },
      })
      if (r.count) {
        atualizados++
        console.log(`  OK  ${p.id} | mpPaymentId=${mpPaymentId} | mpTaxaReal=R$${taxa}`)
      }
    } catch (e) {
      falhas++
      console.error(`  FALHA pedido ${p.id} (mpPaymentId ${mpPaymentId}):`, (e as Error).message)
    }
  }

  console.log(`\nResumo taxa MP: processados=${pendentes.length} atualizados=${atualizados} viaCache=${viaCache} semTaxa=${semTaxa} falhas=${falhas}`)
}

async function corrigirFreteEntregaPropria() {
  // Único pedido identificado no survey (2026-08-27): Birigui/SP, transportadora
  // "Entrega Sixxis", frete cobrado R$0, custoFreteReal ainda null. Os outros 3
  // pedidos em Araçatuba/Birigui já têm custoFreteReal=0 corretamente lançado.
  const ID_PEDIDO_ENTREGA_PROPRIA = 'cmsz6uwyt00os0xnujl166cbw'

  const antes = await prisma.pedido.findUnique({
    where: { id: ID_PEDIDO_ENTREGA_PROPRIA },
    select: { id: true, custoFreteReal: true, transportadora: true, endereco: { select: { cidade: true } } },
  })
  console.log(`\n=== Corrigindo custoFreteReal (entrega própria) ===`)
  console.log(`  Antes: ${JSON.stringify(antes)}`)

  const r = await prisma.pedido.updateMany({
    where: { id: ID_PEDIDO_ENTREGA_PROPRIA, custoFreteReal: null },
    data: { custoFreteReal: 0 },
  })
  console.log(`  Atualizado: ${r.count} pedido(s)`)
}

async function main() {
  await sincronizarTaxasMp()
  await corrigirFreteEntregaPropria()
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
