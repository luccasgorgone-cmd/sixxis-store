// READ-ONLY. Exporta pedidos PAGOS com gclid p/ Offline Conversion Import (Google Ads).
// Colunas: gclid, data (ISO -03:00), valor (2 casas), moeda=BRL, transaction_id=Pedido.id.
// Filtro: status='pago' AND gclid != null. SEM PII (nenhum dado de cliente).
// Uso: railway run npx tsx scripts/export-conversoes-google.ts
import path from 'path'
import { writeFileSync, mkdirSync } from 'fs'
import { prisma } from './_db'

// São Paulo = UTC-03:00 fixo (sem horário de verão desde 2019).
function isoSaoPaulo(d: Date): string {
  const t = new Date(d.getTime() - 3 * 3600 * 1000)
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return (
    `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}` +
    `T${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}-03:00`
  )
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

async function main() {
  const pedidos = await prisma.pedido.findMany({
    where: { status: 'pago', gclid: { not: null } },
    select: { id: true, gclid: true, total: true, pagoEm: true, createdAt: true },
    orderBy: { pagoEm: 'asc' },
  })

  const linhas = pedidos.map((p) => {
    const quando = p.pagoEm ?? p.createdAt // pagoEm é a hora da conversão; fallback defensivo
    return [
      csvCell(p.gclid as string),
      csvCell(isoSaoPaulo(quando)),
      csvCell(Number(p.total).toFixed(2)),
      'BRL',
      csvCell(p.id),
    ].join(',')
  })

  const header = 'gclid,data,valor,moeda,transaction_id'
  const csv = [header, ...linhas].join('\n') + '\n'

  const outDir = path.resolve(process.cwd(), '..', 'exports')
  mkdirSync(outDir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const outPath = path.join(outDir, `conversoes-google-${stamp}.csv`)
  writeFileSync(outPath, csv, 'utf8')

  const datas = pedidos.map((p) => (p.pagoEm ?? p.createdAt)).sort((a, b) => a.getTime() - b.getTime())
  const periodo = datas.length
    ? `${isoSaoPaulo(datas[0])} → ${isoSaoPaulo(datas[datas.length - 1])}`
    : '(vazio)'

  console.log(JSON.stringify({ linhas: pedidos.length, periodo, arquivo: outPath }, null, 2))
}

main()
  .catch((e) => { console.error('ERRO export:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
