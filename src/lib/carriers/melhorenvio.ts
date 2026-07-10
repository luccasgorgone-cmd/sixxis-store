// ─── Adapter Melhor Envio (cotação real) ─────────────────────────────────────
// Mesmo padrão do braspress.ts: implementa Carrier.cotar, nunca quebra o checkout
// (timeout curto, log estruturado, [] em falha), payload montado por uma função
// única reusada pela cotação e pelo diagnóstico do admin.
//
// Segredos vêm SÓ das env vars (nada hardcoded):
//   MELHORENVIO_TOKEN         — Bearer token da API
//   MELHORENVIO_USER_AGENT    — User-Agent obrigatório (ex.: "Sixxis (sac@sixxis.com.br)")
//   MELHORENVIO_CEP_ORIGEM    — CEP de origem (fallback: BRASPRESS_CEP_ORIGEM — mesma origem)
//   CARRIERS_MELHORENVIO_ENABLED — feature flag ('true' liga)
//
// ATENÇÃO às unidades: o Melhor Envio usa CENTÍMETROS e KG (nossos campos já
// estão em cm/kg) — NÃO converter para metros como na Braspress.

import type { Carrier, Cotacao, CotacaoDetalhada, CotacaoInput } from './types'

const MELHORENVIO_ID = 'melhorenvio'
// Ambiente PRODUÇÃO.
const BASE = 'https://melhorenvio.com.br'
const ENDPOINT = `${BASE}/api/v2/me/shipment/calculate`
const TIMEOUT_MS = 8_000

const digits = (s: string | undefined | null) => (s ?? '').replace(/\D/g, '')

export function melhorenvioEnabled(): boolean {
  return process.env.CARRIERS_MELHORENVIO_ENABLED === 'true'
}

function authHeader(): string | null {
  const token = process.env.MELHORENVIO_TOKEN
  if (!token) return null
  return `Bearer ${token}`
}

// Payload de cotação (é o body do POST). Fonte única: cotar() e o diagnóstico.
// Unidades: cm e kg (sem conversão). insurance_value distribuído por unidade a
// partir do valorMercadoria (proporcional pela quantidade).
export interface PayloadMelhorEnvio {
  from: { postal_code: string }
  to: { postal_code: string }
  products: {
    id: string
    width: number
    height: number
    length: number
    weight: number
    insurance_value: number
    quantity: number
  }[]
}

export function montarPayloadMelhorEnvio(input: CotacaoInput): PayloadMelhorEnvio {
  const cepOrigem =
    digits(process.env.MELHORENVIO_CEP_ORIGEM) ||
    digits(process.env.BRASPRESS_CEP_ORIGEM) ||
    digits(input.cepOrigem)
  const cepDestino = digits(input.cepDestino)

  const totalQtd = input.itens.reduce((s, i) => s + Math.max(1, i.quantidade), 0)
  const seguroPorUnidade = totalQtd > 0 ? input.valorMercadoria / totalQtd : input.valorMercadoria

  const products = input.itens.map((i, idx) => ({
    id: String(idx + 1),
    width: i.larguraCm,
    height: i.alturaCm,
    length: i.comprimentoCm,
    weight: i.pesoKg,
    insurance_value: Number(seguroPorUnidade.toFixed(2)),
    quantity: Math.max(1, i.quantidade),
  }))

  return {
    from: { postal_code: cepOrigem },
    to: { postal_code: cepDestino },
    products,
  }
}

export interface MelhorEnvioResultado {
  payload: PayloadMelhorEnvio
  cotacoes: Cotacao[]
  erro: { status: number | null; mensagem: string } | null
}

// Serviço retornado pelo Melhor Envio. price/delivery_time vêm null quando o
// serviço tem erro (não cobre a rota, etc.).
interface MeServico {
  id?: number
  name?: string
  price?: number | string | null
  delivery_time?: number | string | null
  company?: { id?: number; name?: string } | null
  error?: string | null
}

// Executa a cotação (fetch). NÃO checa a feature flag — quem chama decide (o
// checkout via cotar() checa; o diagnóstico do admin não). Nunca lança.
async function requestMelhorEnvio(input: CotacaoInput): Promise<MelhorEnvioResultado> {
  const payload = montarPayloadMelhorEnvio(input)

  const auth = authHeader()
  const userAgent = process.env.MELHORENVIO_USER_AGENT
  const cepOrigem = digits(payload.from.postal_code)
  const cepDestino = digits(payload.to.postal_code)

  if (!auth || !userAgent || cepOrigem.length !== 8 || cepDestino.length !== 8) {
    const mensagem =
      'credenciais (MELHORENVIO_TOKEN/USER_AGENT) ou CEP origem/destino ausentes ou inválidos'
    console.warn(`[melhorenvio] cotação ignorada: ${mensagem}`)
    return { payload, cotacoes: [], erro: { status: null, mensagem } }
  }
  if (!payload.products.length) {
    return { payload, cotacoes: [], erro: { status: null, mensagem: 'sem itens para cotar' } }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: auth,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        // O Melhor Envio BLOQUEIA requisições sem User-Agent.
        'User-Agent': userAgent,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.warn(`[melhorenvio] HTTP ${res.status} — ${txt.slice(0, 200)}`)
      return { payload, cotacoes: [], erro: { status: res.status, mensagem: txt.slice(0, 300) || `HTTP ${res.status}` } }
    }

    const data = (await res.json()) as MeServico[]
    if (!Array.isArray(data)) {
      const mensagem = `resposta inesperada: ${JSON.stringify(data).slice(0, 200)}`
      console.warn(`[melhorenvio] ${mensagem}`)
      return { payload, cotacoes: [], erro: { status: res.status, mensagem } }
    }

    // Filtra serviços com erro (price null / error preenchido) e pega o MAIS BARATO.
    const validos = data
      .map((s) => ({ ...s, precoNum: Number(s.price) }))
      .filter((s) => !s.error && Number.isFinite(s.precoNum) && s.precoNum > 0)

    if (validos.length === 0) {
      const mensagem = 'nenhum serviço válido retornado (todos com erro/sem preço)'
      console.warn(`[melhorenvio] ${mensagem}`)
      return { payload, cotacoes: [], erro: { status: res.status, mensagem } }
    }

    const melhor = validos.reduce((a, b) => (b.precoNum < a.precoNum ? b : a))
    // delivery_time do Melhor Envio já é em DIAS ÚTEIS (valor cru, sem ajuste).
    const prazoDias = Number(melhor.delivery_time)

    console.info(
      `[melhorenvio] cotado ${cepOrigem}→${cepDestino} ` +
      `${melhor.company?.name ?? '?'}/${melhor.name ?? '?'} ` +
      `preco=R$${melhor.precoNum.toFixed(2)} prazo=${prazoDias}d`,
    )

    return {
      payload,
      cotacoes: [
        {
          carrierId: MELHORENVIO_ID,
          servico: 'Entrega',
          preco: melhor.precoNum,
          prazoDias: Number.isFinite(prazoDias) && prazoDias > 0 ? prazoDias : 0,
        },
      ],
      erro: null,
    }
  } catch (err) {
    const mensagem = err instanceof Error && err.name === 'AbortError' ? 'timeout' : String(err)
    console.warn(`[melhorenvio] falha na cotação (${mensagem})`)
    return { payload, cotacoes: [], erro: { status: null, mensagem } }
  } finally {
    clearTimeout(timer)
  }
}

const MELHORENVIO_NOME = 'Melhor Envio'

export const melhorenvioCarrier: Carrier = {
  id: MELHORENVIO_ID,
  nome: MELHORENVIO_NOME,

  async cotar(input: CotacaoInput): Promise<Cotacao[]> {
    if (!melhorenvioEnabled()) return []
    const { cotacoes } = await requestMelhorEnvio(input)
    return cotacoes
  },

  // Mesmo request de cotar(), mas devolve sempre um resultado com nome — e o erro
  // estruturado quando o Melhor Envio não cota (ex.: não atende climatizador).
  async cotarDetalhado(input: CotacaoInput): Promise<CotacaoDetalhada> {
    const { cotacoes, erro } = await requestMelhorEnvio(input)
    const c = cotacoes[0]
    if (c) {
      return {
        carrierId: MELHORENVIO_ID,
        transportadora: MELHORENVIO_NOME,
        ok: true,
        preco: c.preco,
        prazoDias: c.prazoDias > 0 ? c.prazoDias : null,
      }
    }
    return {
      carrierId: MELHORENVIO_ID,
      transportadora: MELHORENVIO_NOME,
      ok: false,
      preco: null,
      prazoDias: null,
      erro: erro?.mensagem ?? 'sem cotação disponível',
    }
  },
}

// Diagnóstico do admin: roda a cotação SEM checar a feature flag e devolve o
// payload enviado + resultado + erro. Uso exclusivo de rotas admin protegidas.
export async function diagnosticarMelhorEnvio(input: CotacaoInput): Promise<{
  payload: PayloadMelhorEnvio
  resultado: { preco: number; prazoDias: number } | null
  erro: { status: number | null; mensagem: string } | null
}> {
  const r = await requestMelhorEnvio(input)
  const c = r.cotacoes[0]
  return {
    payload: r.payload,
    resultado: c ? { preco: c.preco, prazoDias: c.prazoDias } : null,
    erro: r.erro,
  }
}
