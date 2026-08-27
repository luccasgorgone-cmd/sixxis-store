import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import { STATUS_PAGO_TODOS } from '@/lib/pedido-status'

const rawUrl = process.env.DATABASE_URL!
const adapterUrl = (rawUrl.startsWith('mysql://') ? rawUrl.replace(/^mysql:\/\//, 'mariadb://') : rawUrl)
  .replace(/([?&])connectTimeout=\d+/, '') + (rawUrl.includes('?') ? '&' : '?') + 'connectTimeout=15000'
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(adapterUrl) })

async function main() {
  // Todos os pedidos pagos entregues em Araçatuba/Birigui, independente do custoFreteReal atual
  const pedidos = await prisma.pedido.findMany({
    where: {
      status: { in: STATUS_PAGO_TODOS },
      endereco: { cidade: { in: ['Araçatuba', 'Aracatuba', 'Birigui'] } },
    },
    select: {
      id: true, createdAt: true, total: true, frete: true, custoFreteReal: true,
      transportadora: true, freteTipo: true,
      endereco: { select: { cidade: true, estado: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`\n=== Pedidos PAGOS em Araçatuba/Birigui: ${pedidos.length} ===`)
  for (const p of pedidos) {
    console.log(`  ${p.id} | ${p.createdAt.toISOString()} | ${p.endereco.cidade}/${p.endereco.estado} | total=R$${p.total} | frete cobrado=R$${p.frete} | custoFreteReal=${p.custoFreteReal} | transportadora=${p.transportadora} | freteTipo=${p.freteTipo}`)
  }

  // Todas as variações distintas de transportadora usadas (pra achar o rótulo de "entrega própria")
  const distintos = await prisma.pedido.groupBy({
    by: ['transportadora'],
    where: { status: { in: STATUS_PAGO_TODOS } },
    _count: true,
  })
  console.log(`\n=== Transportadoras distintas usadas em pedidos pagos ===`)
  for (const d of distintos) {
    console.log(`  ${d.transportadora ?? '(null)'}: ${d._count} pedido(s)`)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
