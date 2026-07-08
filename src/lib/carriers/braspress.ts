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

// Payload COMPLETO enviado à Braspress (é exatamente o body do POST, sem
// credenciais de auth). Fonte única: cotar() e o diagnóstico usam este mesmo
// objeto — o que o admin vê é o que foi enviado.
//
// Tipos numéricos: a Braspress trata string como campo nulo ("CAMPOS DE ENTRADA
// NULOS"), então CNPJs e CEPs vão como INTEIRO. modal/tipoFrete são strings
// fixas por contrato da API.
export interface PayloadBraspress {
  cnpjRemetente: number
  cnpjDestinatario: number
  modal: 'R'
  tipoFrete: '1'
  cepOrigem: number
  cepDestino: number
  vlrMercadoria: number
  peso: number
  volumes: number
  cubagem: { altura: number; largura: number; comprimento: number; volumes: number }[]
}

export function montarPayloadBraspress(input: CotacaoInput): PayloadBraspress {
  const cnpjRemetente = Number(digits(process.env.BRASPRESS_CNPJ_REMETENTE) || '0')
  // Sem CPF/CNPJ do cliente (ex.: cotação de teste/anônima) → usa o próprio
  // remetente como fallback. NUNCA 0/null (a Braspress rejeita).
  const docCliente = digits(input.cnpjDestinatario)
  const cnpjDestinatario = docCliente ? Number(docCliente) : cnpjRemetente

  const cepOrigem = Number(digits(process.env.BRASPRESS_CEP_ORIGEM) || digits(input.cepOrigem) || '0')
  const cepDestino = Number(digits(input.cepDestino) || '0')

  const peso = input.itens.reduce((s, i) => s + i.pesoKg * i.quantidade, 0)
  const volumes = input.itens.reduce((s, i) => s + Math.max(1, i.quantidade), 0)
  const cubagem = input.itens.map((i) => ({
    altura: Number(cmParaM(i.alturaCm).toFixed(3)),
    largura: Number(cmParaM(i.larguraCm).toFixed(3)),
    comprimento: Number(cmParaM(i.comprimentoCm).toFixed(3)),
    volumes: Math.max(1, i.quantidade),
  }))

  return {
    cnpjRemetente,
    cnpjDestinatario,
    modal: 'R',
    tipoFrete: '1',
    cepOrigem,
    cepDestino,
    vlrMercadoria: Number(input.valorMercadoria.toFixed(2)),
    peso: Number(peso.toFixed(3)),
    volumes,
    cubagem,
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
  // Validação nos dígitos crus (o Number perde zero à esquerda / vazio vira 0).
  const cnpjRemetenteDigits = digits(process.env.BRASPRESS_CNPJ_REMETENTE)
  const cepOrigemDigits = digits(process.env.BRASPRESS_CEP_ORIGEM) || digits(input.cepOrigem)
  const cepDestinoDigits = digits(input.cepDestino)

  if (!auth || !cnpjRemetenteDigits || cepOrigemDigits.length !== 8 || cepDestinoDigits.length !== 8) {
    const mensagem =
      'credenciais (BRASPRESS_API_USER/PASSWORD/CNPJ_REMETENTE) ou CEP origem/destino ausentes ou inválidos'
    console.warn(`[braspress] cotação ignorada: ${mensagem}`)
    return { payload, cotacoes: [], erro: { status: null, mensagem } }
  }
  if (!input.itens.length) {
    return { payload, cotacoes: [], erro: { status: null, mensagem: 'sem itens para cotar' } }
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
      // Envia o payload COMPLETO verbatim (mesmo objeto do diagnóstico).
      body: JSON.stringify(payload),
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
// payload COMPLETO enviado + resultado + erro. Uso exclusivo de rotas admin.
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
