// ─── Adapter Braspress (cotação real) ────────────────────────────────────────
// Implementa Carrier.cotar chamando a API de cotação da Braspress. Nunca quebra
// o checkout: timeout curto, log estruturado e [] em qualquer falha.
//
// Segredos vêm SÓ das env vars (nada hardcoded):
//   BRASPRESS_CNPJ_REMETENTE  — CNPJ do remetente (só dígitos)
//   BRASPRESS_API_USER        — usuário da API
//   BRASPRESS_API_PASSWORD    — senha da API
//   BRASPRESS_CEP_ORIGEM      — CEP de origem (só dígitos)
//   CARRIERS_BRASPRESS_ENABLED — feature flag ('true' liga)

import type { Carrier, Cotacao, CotacaoInput } from './types'

const BRASPRESS_ID = 'braspress'
const ENDPOINT = 'https://api.braspress.com/v1/cotacao/calcular/json'
const TIMEOUT_MS = 8_000

const digits = (s: string | undefined | null) => (s ?? '').replace(/\D/g, '')
// cm → m (Braspress usa METROS na cubagem).
const cmParaM = (cm: number) => Math.max(0, cm) / 100

export function braspressEnabled(): boolean {
  return process.env.CARRIERS_BRASPRESS_ENABLED === 'true'
}

function authHeader(): string | null {
  const user = process.env.BRASPRESS_API_USER
  const pass = process.env.BRASPRESS_API_PASSWORD
  if (!user || !pass) return null
  // Basic base64(USER:PASSWORD) montado em runtime.
  const token = Buffer.from(`${user}:${pass}`).toString('base64')
  return `Basic ${token}`
}

// Payload "de exibição" (o que a Braspress recebe, sem credenciais). Reusado
// tanto pela cotação real quanto pelo diagnóstico do admin.
export interface PayloadBraspress {
  cepOrigem: string
  cepDestino: string
  peso: number
  volumes: number
  cubagem: { altura: number; largura: number; comprimento: number; volumes: number }[]
  vlrMercadoria: number
}

export function montarPayloadBraspress(input: CotacaoInput): PayloadBraspress {
  const cepOrigem = digits(process.env.BRASPRESS_CEP_ORIGEM) || digits(input.cepOrigem)
  const cepDestino = digits(input.cepDestino)
  const peso = input.itens.reduce((s, i) => s + i.pesoKg * i.quantidade, 0)
  const volumes = input.itens.reduce((s, i) => s + Math.max(1, i.quantidade), 0)
  const cubagem = input.itens.map((i) => ({
    altura: Number(cmParaM(i.alturaCm).toFixed(3)),
    largura: Number(cmParaM(i.larguraCm).toFixed(3)),
    comprimento: Number(cmParaM(i.comprimentoCm).toFixed(3)),
    volumes: Math.max(1, i.quantidade),
  }))
  return {
    cepOrigem,
    cepDestino,
    peso: Number(peso.toFixed(3)),
    volumes,
    cubagem,
    vlrMercadoria: Number(input.valorMercadoria.toFixed(2)),
  }
}

export interface BraspressResultado {
  payload: PayloadBraspress
  cotacoes: Cotacao[]
  erro: { status: number | null; mensagem: string } | null
}

// Executa a cotação de fato (fetch). NÃO checa a feature flag — quem chama
// decide (o checkout via cotar() checa; o diagnóstico do admin não). Nunca
// lança: devolve erro estruturado.
async function requestBraspress(input: CotacaoInput): Promise<BraspressResultado> {
  const payload = montarPayloadBraspress(input)

  const auth = authHeader()
  const cnpjRemetente = digits(process.env.BRASPRESS_CNPJ_REMETENTE)

  if (!auth || !cnpjRemetente || payload.cepOrigem.length !== 8 || payload.cepDestino.length !== 8) {
    const mensagem = 'credenciais (BRASPRESS_API_USER/PASSWORD/CNPJ_REMETENTE) ou CEP origem/destino ausentes ou inválidos'
    console.warn(`[braspress] cotação ignorada: ${mensagem}`)
    return { payload, cotacoes: [], erro: { status: null, mensagem } }
  }
  if (!input.itens.length) {
    return { payload, cotacoes: [], erro: { status: null, mensagem: 'sem itens para cotar' } }
  }

  const body = {
    cnpjRemetente: Number(cnpjRemetente),
    cnpjDestinatario: Number(digits(input.cnpjDestinatario) || '0'),
    modal: 'R',
    tipoFrete: '1',
    cepOrigem: Number(payload.cepOrigem),
    cepDestino: Number(payload.cepDestino),
    vlrMercadoria: payload.vlrMercadoria,
    peso: payload.peso,
    volumes: payload.volumes,
    cubagem: payload.cubagem,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.warn(`[braspress] HTTP ${res.status} — ${txt.slice(0, 200)}`)
      return { payload, cotacoes: [], erro: { status: res.status, mensagem: txt.slice(0, 300) || `HTTP ${res.status}` } }
    }

    const data = (await res.json()) as {
      totalFrete?: number | string
      prazo?: number | string
      id?: number | string
    }

    const preco = Number(data?.totalFrete)
    const prazoDias = Number(data?.prazo)
    if (!Number.isFinite(preco) || preco <= 0) {
      const mensagem = `resposta sem totalFrete válido: ${JSON.stringify(data).slice(0, 200)}`
      console.warn(`[braspress] ${mensagem}`)
      return { payload, cotacoes: [], erro: { status: res.status, mensagem } }
    }

    console.info(
      `[braspress] cotado ${payload.cepOrigem}→${payload.cepDestino} peso=${payload.peso}kg ` +
      `vol=${payload.volumes} preco=R$${preco.toFixed(2)} prazo=${prazoDias}d`,
    )

    return {
      payload,
      cotacoes: [
        {
          carrierId: BRASPRESS_ID,
          servico: 'Braspress Rodoviário',
          preco,
          prazoDias: Number.isFinite(prazoDias) && prazoDias > 0 ? prazoDias : 0,
        },
      ],
      erro: null,
    }
  } catch (err) {
    const mensagem = err instanceof Error && err.name === 'AbortError' ? 'timeout' : String(err)
    console.warn(`[braspress] falha na cotação (${mensagem})`)
    return { payload, cotacoes: [], erro: { status: null, mensagem } }
  } finally {
    clearTimeout(timer)
  }
}

export const braspressCarrier: Carrier = {
  id: BRASPRESS_ID,

  async cotar(input: CotacaoInput): Promise<Cotacao[]> {
    if (!braspressEnabled()) return []
    const { cotacoes } = await requestBraspress(input)
    return cotacoes
  },
}

// Diagnóstico do admin: roda a cotação SEM checar a feature flag e devolve o
// payload enviado + resultado + erro. Uso exclusivo de rotas admin protegidas.
export async function diagnosticarBraspress(input: CotacaoInput): Promise<{
  payload: PayloadBraspress
  resultado: { preco: number; prazoDias: number } | null
  erro: { status: number | null; mensagem: string } | null
}> {
  const r = await requestBraspress(input)
  const c = r.cotacoes[0]
  return {
    payload: r.payload,
    resultado: c ? { preco: c.preco, prazoDias: c.prazoDias } : null,
    erro: r.erro,
  }
}
