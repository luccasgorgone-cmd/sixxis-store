// prisma/seed-fretes.ts
// Gerado a partir da tabela conferida (Sixxis fretes por UF, 08/06/2026).
// Idempotente: upsert na chave @@unique([produtoId, uf]). Re-rodar é seguro.
// Valores = preço NORMAL ao cliente (sem markup, por decisão). Expresso = null.
//
// Bootstrap do client adaptado ao projeto (Prisma 7): carrega .env.local e usa o
// adapter mariadb (o engine Rust foi removido — PrismaClient exige adapter).
// Mesma normalização mysql://→mariadb:// de src/lib/prisma.ts e scripts/_db.ts.
import path from 'path'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: path.resolve(process.cwd(), '.env.local') })
dotenvConfig({ path: path.resolve(process.cwd(), '.env') })

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const rawUrl = process.env.DATABASE_URL
if (!rawUrl) throw new Error('DATABASE_URL ausente. Configure em .env.local.')
const adapterUrl = rawUrl.startsWith('mysql://')
  ? rawUrl.replace(/^mysql:\/\//, 'mariadb://')
  : rawUrl
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(adapterUrl) })

// Prazo (dias úteis) é por UF, igual para todos os produtos: [min, max]
const PRAZO: Record<string, [number, number]> = { SP: [1, 3], MG: [2, 5], RJ: [3, 5], ES: [3, 6], PR: [2, 4], SC: [3, 5], RS: [4, 7], MS: [3, 6], GO: [3, 6], DF: [3, 6], MT: [4, 8], BA: [5, 9], SE: [6, 10], AL: [7, 12], PE: [7, 12], PB: [7, 13], RN: [7, 13], CE: [8, 13], PI: [8, 13], MA: [8, 14], TO: [5, 10], RO: [8, 15], PA: [8, 16], AC: [9, 17], AM: [10, 20], AP: [12, 22], RR: [12, 22] }

// Preço normal por produto (slug) x UF
const PRECO: Record<string, Record<string, number>> = {
  'asp-bravo': { SP: 17, MG: 17, RJ: 17, ES: 17, PR: 24, SC: 24, RS: 24, MS: 27, GO: 27, DF: 27, MT: 27, BA: 33, SE: 33, AL: 33, PE: 33, PB: 33, RN: 33, CE: 33, PI: 33, MA: 33, TO: 42, RO: 42, PA: 42, AC: 42, AM: 42, AP: 42, RR: 42 },
  'spinning-sixxis-life': { SP: 54, MG: 69, RJ: 103, ES: 106, PR: 70, SC: 88, RS: 124, MS: 83, GO: 93, DF: 116, MT: 170, BA: 150, SE: 170, AL: 233, PE: 258, PB: 268, RN: 278, CE: 288, PI: 273, MA: 293, TO: 175, RO: 214, PA: 317, AC: 269, AM: 427, AP: 372, RR: 493 },
  'm45-trend': { SP: 58, MG: 83, RJ: 123, ES: 127, PR: 71, SC: 105, RS: 148, MS: 95, GO: 111, DF: 138, MT: 203, BA: 180, SE: 203, AL: 278, PE: 308, PB: 320, RN: 332, CE: 343, PI: 326, MA: 350, TO: 175, RO: 255, PA: 379, AC: 321, AM: 510, AP: 445, RR: 588 },
  'sx040': { SP: 58, MG: 83, RJ: 123, ES: 127, PR: 71, SC: 105, RS: 148, MS: 95, GO: 111, DF: 138, MT: 203, BA: 180, SE: 203, AL: 278, PE: 308, PB: 320, RN: 332, CE: 343, PI: 326, MA: 350, TO: 175, RO: 255, PA: 379, AC: 321, AM: 510, AP: 445, RR: 588 },
  'sx060-prime': { SP: 58, MG: 83, RJ: 123, ES: 127, PR: 71, SC: 105, RS: 148, MS: 96, GO: 111, DF: 138, MT: 204, BA: 180, SE: 203, AL: 279, PE: 309, PB: 321, RN: 333, CE: 344, PI: 327, MA: 351, TO: 175, RO: 256, PA: 380, AC: 322, AM: 511, AP: 446, RR: 590 },
  'sx070-trend': { SP: 86, MG: 123, RJ: 183, ES: 189, PR: 105, SC: 156, RS: 220, MS: 142, GO: 165, DF: 205, MT: 302, BA: 267, SE: 302, AL: 414, PE: 458, PB: 475, RN: 494, CE: 511, PI: 484, MA: 520, TO: 228, RO: 380, PA: 563, AC: 478, AM: 758, AP: 661, RR: 875 },
  'sx100-trend': { SP: 131, MG: 188, RJ: 278, ES: 288, PR: 160, SC: 237, RS: 336, MS: 216, GO: 251, DF: 313, MT: 460, BA: 407, SE: 460, AL: 631, PE: 699, PB: 725, RN: 753, CE: 779, PI: 739, MA: 793, TO: 348, RO: 579, PA: 859, AC: 729, AM: 1156, AP: 1008, RR: 1334 },
  'sx120-prime': { SP: 145, MG: 209, RJ: 309, ES: 319, PR: 178, SC: 263, RS: 372, MS: 240, GO: 279, DF: 347, MT: 511, BA: 452, SE: 510, AL: 700, PE: 775, PB: 804, RN: 835, CE: 864, PI: 820, MA: 880, TO: 386, RO: 642, PA: 953, AC: 809, AM: 1283, AP: 1119, RR: 1480 },
  'sx200-prime': { SP: 287, MG: 414, RJ: 612, ES: 633, PR: 352, SC: 522, RS: 738, MS: 475, GO: 553, DF: 688, MT: 1012, BA: 896, SE: 1011, AL: 1387, PE: 1537, PB: 1594, RN: 1655, CE: 1712, PI: 1624, MA: 1743, TO: 765, RO: 1273, PA: 1888, AC: 1603, AM: 2542, AP: 2217, RR: 2933 },
  'sx200-trend': { SP: 168, MG: 242, RJ: 358, ES: 370, PR: 206, SC: 305, RS: 431, MS: 278, GO: 323, DF: 402, MT: 591, BA: 523, SE: 591, AL: 811, PE: 898, PB: 931, RN: 967, CE: 1000, PI: 949, MA: 1018, TO: 447, RO: 743, PA: 1103, AC: 936, AM: 1485, AP: 1295, RR: 1714 },
}

// SX180 Trend ainda NÃO existe como produto no banco (sem produtoId).
// Quando o produto for criado, descomente o slug correto abaixo e re-rode o seed.
// const PRECO_SX180 = { SP: 196, MG: 282, RJ: 418, ES: 432, PR: 240, SC: 356, RS: 503, MS: 324, GO: 377, DF: 470, MT: 690, BA: 611, SE: 690, AL: 946, PE: 1048, PB: 1087, RN: 1129, CE: 1168, PI: 1108, MA: 1189, TO: 522, RO: 868, PA: 1288, AC: 1093, AM: 1734, AP: 1513, RR: 2001 }

async function main() {
  let ok = 0
  for (const slug of Object.keys(PRECO)) {
    const produto = await prisma.produto.findUnique({ where: { slug } })
    if (!produto) {
      console.warn(`[SKIP] produto não encontrado para slug="${slug}" — pulando.`)
      continue
    }
    for (const uf of Object.keys(PRAZO)) {
      const preco = PRECO[slug][uf]
      const [min, max] = PRAZO[uf]
      await prisma.freteRegra.upsert({
        where: { produtoId_uf: { produtoId: produto.id, uf } },
        update: {
          precoNormal: preco,
          prazoNormalMin: min,
          prazoNormalMax: max,
          precoExpresso: null,
          prazoExpressoMin: null,
          prazoExpressoMax: null,
          aCombinar: false,
          bloqueado: false,
        },
        create: {
          produtoId: produto.id,
          uf,
          precoNormal: preco,
          prazoNormalMin: min,
          prazoNormalMax: max,
          aCombinar: false,
          bloqueado: false,
        },
      })
      ok++
    }
    console.log(`[OK] ${slug}: 27 UFs`)
  }
  const total = await prisma.freteRegra.count()
  console.log(`\nUpserts nesta execução: ${ok}`)
  console.log(`Total de FreteRegra no banco: ${total}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
