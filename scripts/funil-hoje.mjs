// Funil + tráfego de HOJE direto do banco (independe do GA4).
// Uso: DATABASE_URL="<prod>" node scripts/funil-hoje.mjs [YYYY-MM-DD]
// Prep do Jarvis Site p/ pergunta do Marketing (31/10). Read-only: só SELECT.
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) { console.error("ERRO: defina DATABASE_URL (prod/proxy) antes de rodar."); process.exit(1); }
// Mesmo padrão de src/lib/prisma.ts: passar PoolConfig (objeto), NÃO a string.
// Os params ?connection_limit/?pool_timeout da URL são snake_case (engine Prisma)
// e o driver mariadb só entende camelCase -> seriam ignorados, derrubando o
// connectTimeout pro default de 1000ms (curto pro handshake via proxy Railway).
const _u = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: _u.hostname,
  port: _u.port ? Number(_u.port) : 3306,
  user: decodeURIComponent(_u.username),
  password: decodeURIComponent(_u.password),
  database: _u.pathname.replace(/^\//, ""),
  connectionLimit: Number(_u.searchParams.get("connection_limit")) || 5,
  connectTimeout: 15000,
  acquireTimeout: 20000,
  idleTimeout: 120,
});
const prisma = new PrismaClient({ adapter });
const BRT_OFFSET_H = 3; // BRT = UTC-3

function janelaBRT(arg) {
  // início 00:00 BRT = 03:00 UTC do dia pedido (ou hoje em BRT)
  let y, m, d;
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) {
    [y, m, d] = arg.split("-").map(Number);
    m -= 1;
  } else {
    const brtNow = new Date(Date.now() - BRT_OFFSET_H * 3600e3);
    y = brtNow.getUTCFullYear(); m = brtNow.getUTCMonth(); d = brtNow.getUTCDate();
  }
  const inicio = new Date(Date.UTC(y, m, d, BRT_OFFSET_H, 0, 0));
  const fim = new Date(inicio.getTime() + 24 * 3600e3);
  return { inicio, fim };
}

const pct = (n, base) => (base > 0 ? ((n / base) * 100).toFixed(1) + "%" : "—");

async function main() {
  const { inicio, fim } = janelaBRT(process.argv[2]);
  const win = { gte: inicio, lt: fim };
  console.log(`\n== FUNIL + TRÁFEGO — janela BRT ${inicio.toISOString()} → ${fim.toISOString()} ==\n`);

  // ---- #1 TRÁFEGO POR CANAL (SessaoVisitante) ----
  const sess = await prisma.sessaoVisitante.findMany({
    where: { createdAt: win },
    select: { utmSource: true, utmMedium: true, gclid: true, referer: true, cidade: true, pais: true, converteu: true },
  });
  const canal = (s) => {
    const src = (s.utmSource || "").toLowerCase();
    const med = (s.utmMedium || "").toLowerCase();
    if (s.gclid || src.includes("google") || med === "cpc" || med === "ppc") return "Google Ads";
    if (src.includes("facebook") || src.includes("meta") || src.includes("fb") || src.includes("ig") || src.includes("instagram")) return "Meta/IG";
    if (!s.utmSource && !s.referer) return "Direto";
    if (s.referer && !s.utmSource) return "Referral: " + new URL(s.referer.startsWith("http") ? s.referer : "https://" + s.referer).hostname;
    return `${s.utmSource || "?"}/${s.utmMedium || "?"}`;
  };
  const porCanal = {};
  for (const s of sess) porCanal[canal(s)] = (porCanal[canal(s)] || 0) + 1;
  console.log(`#1 SESSÕES HOJE: ${sess.length} (com gclid: ${sess.filter((s) => s.gclid).length})`);
  Object.entries(porCanal).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`   ${v.toString().padStart(4)}  ${k}`));

  // ---- #2 FUNIL DE EVENTOS (EventoTracking.tipo) ----
  const steps = ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase", "abandono_carrinho"];
  const grp = await prisma.eventoTracking.groupBy({
    by: ["tipo"], where: { createdAt: win, tipo: { in: steps } }, _count: { _all: true },
  });
  const cnt = Object.fromEntries(grp.map((g) => [g.tipo, g._count._all]));
  const pv = cnt.page_view || 0;
  console.log(`\n#2 FUNIL DE EVENTOS HOJE:`);
  for (const s of steps) {
    const n = cnt[s] || 0;
    console.log(`   ${s.padEnd(18)} ${n.toString().padStart(6)}   ${pct(n, pv)} do page_view`);
  }
  // quedas entre etapas
  const quedas = [["page_view→add_to_cart", pv, cnt.add_to_cart || 0], ["add_to_cart→begin_checkout", cnt.add_to_cart || 0, cnt.begin_checkout || 0], ["begin_checkout→purchase", cnt.begin_checkout || 0, cnt.purchase || 0]];
  console.log(`   --- conversão entre etapas ---`);
  quedas.forEach(([lbl, a, b]) => console.log(`   ${lbl.padEnd(28)} ${pct(b, a)}  (${a}→${b})`));

  // ---- #3 PEDIDOS HOJE (Pedido) ----
  const ped = await prisma.pedido.groupBy({ by: ["status"], where: { createdAt: win }, _count: { _all: true }, _sum: { total: true } });
  const totPed = ped.reduce((a, g) => a + g._count._all, 0);
  console.log(`\n#3 PEDIDOS HOJE: ${totPed}`);
  ped.sort((a, b) => b._count._all - a._count._all).forEach((g) => console.log(`   ${(g.status || "?").padEnd(12)} ${g._count._all.toString().padStart(4)}   R$ ${(Number(g._sum.total) || 0).toFixed(2)}`));

  // ---- #4 CARRINHOS CRIADOS HOJE (proxy de intenção) ----
  const carr = await prisma.carrinho.count({ where: { createdAt: win } });
  console.log(`\n#4 CARRINHOS criados hoje: ${carr}`);

  // ---- #5 GEO — PEDIDOS POR UF (Endereco.estado) — sinal de conversão por região ----
  // Prep p/ validar fit geográfico (pergunta do Marketing: Sul converte?). UF vem do
  // endereço de ENTREGA do pedido (fonte limpa). Denominador é FINO (poucas compras
  // on-site/dia) — cruzar com CRM (conversa WhatsApp × região) p/ o sinal primário.
  const SUL = new Set(["PR", "SC", "RS"]);
  const pedGeo = await prisma.pedido.findMany({
    where: { createdAt: win },
    select: { total: true, status: true, endereco: { select: { estado: true } } },
  });
  const porUf = {};
  for (const p of pedGeo) {
    const uf = (p.endereco?.estado || "??").toUpperCase();
    (porUf[uf] ||= { n: 0, total: 0 });
    porUf[uf].n += 1;
    porUf[uf].total += Number(p.total) || 0;
  }
  console.log(`\n#5 PEDIDOS POR UF (endereço de entrega) — total ${pedGeo.length}:`);
  Object.entries(porUf).sort((a, b) => b[1].n - a[1].n).forEach(([uf, v]) =>
    console.log(`   ${uf.padEnd(4)} ${v.n.toString().padStart(4)}   R$ ${v.total.toFixed(2)}`));
  const sul = pedGeo.filter((p) => SUL.has((p.endereco?.estado || "").toUpperCase()));
  const sulTot = sul.reduce((a, p) => a + (Number(p.total) || 0), 0);
  console.log(`   --- SUL (PR+SC+RS): ${sul.length}/${pedGeo.length} pedidos (${pct(sul.length, pedGeo.length)})  R$ ${sulTot.toFixed(2)} ---`);

  // ---- #6 GEO — SESSÕES POR CIDADE (aprox) + taxa de conversão de sessão ----
  // SessaoVisitante NÃO guarda UF (LGPD: não persiste IP cru) — só cidade aproximada.
  // Serve p/ distribuição de tráfego e `converteu`, não p/ recorte fino por UF.
  const porCidade = {};
  let convSess = 0;
  for (const s of sess) {
    const c = s.cidade || "(sem cidade)";
    porCidade[c] = (porCidade[c] || 0) + 1;
    if (s.converteu) convSess += 1;
  }
  console.log(`\n#6 SESSÕES POR CIDADE (aprox) — top 12 | converteu=true: ${convSess}/${sess.length} (${pct(convSess, sess.length)}):`);
  Object.entries(porCidade).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([c, v]) =>
    console.log(`   ${v.toString().padStart(4)}  ${c}`));

  console.log(`\n(observação: EventoTracking depende de Consent Mode; sessões sem consentimento podem não gerar evento — números são best-effort server-side, mas independem do GA4.)\n`);
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
