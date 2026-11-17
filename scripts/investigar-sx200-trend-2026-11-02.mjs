// Diagnóstico read-only: tentativas de compra do SX200 Trend em 2026-11-02 (BRT).
// Não imprime PII completa nem segredos. Uso local: carregar .env e executar com node.
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

// No Gateway, o project token protegido resolve as variáveis do serviço sem
// imprimir seus valores. O fallback local continua aceitando .env.
if (process.env.SIXXIS_STORE_RAILWAY_TOKEN) {
  const query = `query {
    variables(
      projectId: "7b056a0c-b4c1-4288-b94c-1604c81aade3"
      environmentId: "bff8f3f8-1e08-433c-9992-cef9e53b87bb"
      serviceId: "49a264de-9fb0-4577-bff8-5b73be47176b"
    )
  }`
  const response = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Project-Access-Token': process.env.SIXXIS_STORE_RAILWAY_TOKEN,
    },
    body: JSON.stringify({ query }),
  })
  const payload = await response.json()
  if (!response.ok || payload.errors) throw new Error('Falha ao resolver variáveis do Railway')
  const vars = payload.data?.variables || {}
  process.env.DATABASE_URL = vars.DATABASE_URL || process.env.DATABASE_URL
  process.env.MP_ACCESS_TOKEN = vars.MP_ACCESS_TOKEN || vars.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente')

const u = new URL(process.env.DATABASE_URL)
// O .env local aponta para um túnel 127.0.0.1:3307. Para diagnósticos read-only
// sem o túnel, use o proxy público Railway já validado em 2026-11-01.
const dbHost = u.hostname === '127.0.0.1' ? 'crossover.proxy.rlwy.net' : u.hostname
const dbPort = u.hostname === '127.0.0.1' ? 29794 : (u.port ? Number(u.port) : 3306)
const adapter = new PrismaMariaDb({
  host: dbHost,
  port: dbPort,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ''),
  allowPublicKeyRetrieval: true,
  connectionLimit: 3,
  connectTimeout: 15_000,
  acquireTimeout: 20_000,
  idleTimeout: 120,
})
const prisma = new PrismaClient({ adapter })

const inicio = new Date('2026-11-02T03:00:00.000Z')
const fim = new Date('2026-11-03T03:00:00.000Z')
const win = { gte: inicio, lt: fim }

const maskEmail = (v) => {
  if (!v || !v.includes('@')) return v ? '***' : null
  const [local, domain] = v.split('@')
  return `${local.slice(0, 2)}***@${domain}`
}
const maskDoc = (v) => {
  const d = String(v || '').replace(/\D/g, '')
  return d ? `${d.slice(0, 3)}***${d.slice(-2)}` : null
}
const maskIp = (v) => {
  if (!v) return null
  if (v.includes(':')) return `${v.split(':').slice(0, 3).join(':')}:…`
  const p = v.split('.')
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.x` : '***'
}
const asObj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const pickMp = (raw) => {
  const r = asObj(raw)
  const payer = asObj(r.payer)
  const card = asObj(r.card)
  const issuer = asObj(r.issuer)
  const ai = asObj(r.additional_info)
  return {
    id: r.id != null ? String(r.id) : null,
    liveMode: r.live_mode ?? null,
    status: r.status ?? null,
    statusDetail: r.status_detail ?? null,
    created: r.date_created ?? null,
    updated: r.date_last_updated ?? null,
    amount: r.transaction_amount ?? null,
    installments: r.installments ?? null,
    method: r.payment_method_id ?? null,
    type: r.payment_type_id ?? null,
    issuerId: issuer.id != null ? String(issuer.id) : null,
    payerId: payer.id != null ? String(payer.id) : null,
    payerEmail: maskEmail(payer.email),
    bin: card.first_six_digits ?? null,
    last4: card.last_four_digits ?? null,
    ip: maskIp(ai.ip_address),
    externalReference: r.external_reference ?? null,
  }
}

async function mpGet(id) {
  if (!process.env.MP_ACCESS_TOKEN || !id) return { unavailable: 'token/id ausente' }
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!res.ok) return { http: res.status, body: (await res.text()).slice(0, 200) }
  return pickMp(await res.json())
}

async function mpSearch(inicioIso, fimIso, pedidosIds) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) return { unavailable: 'token ausente' }
    const url = new URL('https://api.mercadopago.com/v1/payments/search')
    url.searchParams.set('begin_date', inicioIso)
    url.searchParams.set('end_date', fimIso)
    url.searchParams.set('sort', 'date_created')
    url.searchParams.set('criteria', 'desc')
    url.searchParams.set('limit', '100')
    const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } })
    if (!res.ok) return { http: res.status, body: (await res.text()).slice(0, 200) }
    const body = await res.json()
    const ids = new Set(pedidosIds)
    return {
      totalDia: body.paging?.total ?? body.results?.length ?? 0,
      ligadosAosPedidos: (body.results || []).filter((p) => ids.has(p.external_reference)).map(pickMp),
    }
  } catch (e) {
    return { unavailable: e instanceof Error ? e.message : String(e) }
  }
}

async function main() {
  const produtos = await prisma.produto.findMany({
    where: {
      OR: [
        { slug: 'sx200-trend' },
        { sku: { contains: 'SX200' } },
        { nome: { contains: 'SX200 Trend' } },
        { modelo: { contains: 'SX200 Trend' } },
      ],
    },
    select: { id: true, nome: true, slug: true, sku: true, modelo: true, preco: true, precoPromocional: true },
  })
  const produtoIds = produtos.filter((p) => p.slug === 'sx200-trend' || /sx200\s*trend/i.test(`${p.nome} ${p.modelo || ''}`)).map((p) => p.id)

  const pedidos = await prisma.pedido.findMany({
    where: {
      itens: { some: { produtoId: { in: produtoIds } } },
      OR: [{ createdAt: win }, { pagamentos: { some: { createdAt: win } } }],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      cliente: { select: { id: true, nome: true, email: true, cpf: true, cnpj: true, telefone: true, senha: true, createdAt: true, bloqueado: true, motivoBloqueio: true } },
      endereco: { select: { cidade: true, estado: true, cep: true, logradouro: true, numero: true, bairro: true } },
      itens: { include: { produto: { select: { nome: true, sku: true, slug: true } } } },
      pagamentos: { orderBy: { createdAt: 'asc' } },
      tentativasMultiMetodo: { include: { pagamentos: true }, orderBy: { createdAt: 'asc' } },
    },
  })

  const clienteIds = [...new Set(pedidos.map((p) => p.clienteId))]
  const ips = [...new Set(pedidos.map((p) => p.clientIp).filter(Boolean))]
  const historico = clienteIds.length
    ? await prisma.pedido.findMany({
        where: { clienteId: { in: clienteIds } },
        orderBy: { createdAt: 'asc' },
        include: {
          itens: { include: { produto: { select: { nome: true, sku: true, slug: true } } } },
          pagamentos: { orderBy: { createdAt: 'asc' } },
        },
      })
    : []

  const todosPagamentosHoje = await prisma.pagamento.findMany({
    where: { createdAt: win },
    orderBy: { createdAt: 'asc' },
    include: { pedido: { select: { id: true, clienteId: true, clientIp: true } } },
  })
  const colisaoIp = ips.length
    ? await prisma.pedido.findMany({
        where: { clientIp: { in: ips }, clienteId: { notIn: clienteIds } },
        select: { id: true, clienteId: true, createdAt: true, status: true, clientIp: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  const eventos = await prisma.eventoTracking.groupBy({
    by: ['tipo'],
    where: { createdAt: win, OR: [{ produtoSlug: 'sx200-trend' }, { produtoId: { in: produtoIds } }] },
    _count: { _all: true },
  })

  const mpLive = {}
  for (const p of pedidos.flatMap((o) => o.pagamentos)) {
    if (p.mpPaymentId) mpLive[p.mpPaymentId] = await mpGet(p.mpPaymentId)
  }
  const mpBuscaDia = await mpSearch(inicio.toISOString(), fim.toISOString(), pedidos.map((p) => p.id))

  const porPedido = pedidos.map((p) => ({
    id: p.id,
    createdAt: p.createdAt,
    status: p.status,
    total: Number(p.total),
    frete: Number(p.frete),
    formaPagamento: p.formaPagamento,
    cidadeUf: `${p.endereco.cidade}/${p.endereco.estado}`,
    cliente: {
      id: p.cliente.id,
      nome: `${p.cliente.nome.split(/\s+/)[0]} ***`,
      email: maskEmail(p.cliente.email),
      documento: maskDoc(p.cliente.cpf || p.cliente.cnpj),
      criadoEm: p.cliente.createdAt,
      temSenhaLocal: Boolean(p.cliente.senha),
      bloqueado: p.cliente.bloqueado,
      motivoBloqueio: p.cliente.motivoBloqueio,
    },
    ip: maskIp(p.clientIp),
    userAgent: p.clientUserAgent?.slice(0, 120) ?? null,
    itens: p.itens.map((i) => ({ sku: i.produto.sku, slug: i.produto.slug, variacao: i.variacaoNome, qtd: i.quantidade, preco: Number(i.precoUnitario) })),
    pagamentos: p.pagamentos.map((pg) => ({
      id: pg.id,
      createdAt: pg.createdAt,
      mpPaymentId: pg.mpPaymentId,
      status: pg.mpStatus,
      detail: pg.mpStatusDetail,
      metodo: pg.metodo,
      valor: pg.valor / 100,
      parcelas: pg.parcelas,
      bandeira: pg.bandeira,
      last4: pg.ultimosDigitos,
      payerEmail: maskEmail(pg.payerEmail),
      payerCpf: maskDoc(pg.payerCpf),
      raw: pickMp(pg.rawResponse),
      live: pg.mpPaymentId ? mpLive[pg.mpPaymentId] : null,
    })),
    multiMetodo: p.tentativasMultiMetodo.map((t) => ({ id: t.id, tipo: t.tipo, status: t.status, erro: t.erro, detalhe: t.detalhe, createdAt: t.createdAt })),
  }))

  const historicoResumo = historico.map((p) => ({
    id: p.id,
    clienteId: p.clienteId,
    createdAt: p.createdAt,
    status: p.status,
    total: Number(p.total),
    itens: p.itens.map((i) => i.produto.sku || i.produto.slug),
    pagamentos: p.pagamentos.map((pg) => ({ createdAt: pg.createdAt, status: pg.mpStatus, detail: pg.mpStatusDetail, metodo: pg.metodo, mpPaymentId: pg.mpPaymentId, raw: pickMp(pg.rawResponse) })),
  }))

  const pagamentosHojeResumo = todosPagamentosHoje.reduce((acc, pg) => {
    const key = `${pg.metodo}|${pg.mpStatus}|${pg.mpStatusDetail || '-'}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  console.log(JSON.stringify({
    janela: { inicio, fim },
    produtos,
    eventos: Object.fromEntries(eventos.map((e) => [e.tipo, e._count._all])),
    pedidos: porPedido,
    enderecosDistintos: new Set(pedidos.map((p) => [p.endereco.cep, p.endereco.logradouro, p.endereco.numero, p.endereco.bairro, p.endereco.cidade, p.endereco.estado].map((v) => String(v || '').trim().toLowerCase()).join('|'))).size,
    historicoMesmoCliente: historicoResumo,
    pagamentosHojeTodos: pagamentosHojeResumo,
    mercadoPagoBuscaDia: mpBuscaDia,
    outrosClientesMesmoIp: colisaoIp.map((p) => ({ ...p, clientIp: maskIp(p.clientIp) })),
  }, null, 2))
}

main().catch((e) => {
  console.error('ERRO:', e instanceof Error ? e.message : String(e))
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
