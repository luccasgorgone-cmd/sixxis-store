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

export const braspressCarrier: Carrier = {
  id: BRASPRESS_ID,

  async cotar(input: CotacaoInput): Promise<Cotacao[]> {
    if (!braspressEnabled()) return []

    const auth = authHeader()
    const cnpjRemetente = digits(process.env.BRASPRESS_CNPJ_REMETENTE)
    const cepOrigem = digits(process.env.BRASPRESS_CEP_ORIGEM) || digits(input.cepOrigem)
    const cepDestino = digits(input.cepDestino)

    if (!auth || !cnpjRemetente || !cepOrigem || cepDestino.length !== 8) {
      console.warn('[braspress] cotação ignorada: credenciais/CEP ausentes ou inválidos')
      return []
    }
    if (!input.itens.length) return []

    // Totais do embarque.
    const pesoTotal = input.itens.reduce((s, i) => s + i.pesoKg * i.quantidade, 0)
    const volumesTotal = input.itens.reduce((s, i) => s + Math.max(1, i.quantidade), 0)
    const cubagem = input.itens.map((i) => ({
      altura: Number(cmParaM(i.alturaCm).toFixed(3)),
      largura: Number(cmParaM(i.larguraCm).toFixed(3)),
      comprimento: Number(cmParaM(i.comprimentoCm).toFixed(3)),
      volumes: Math.max(1, i.quantidade),
    }))

    const body = {
      cnpjRemetente: Number(cnpjRemetente),
      cnpjDestinatario: Number(digits(input.cnpjDestinatario) || '0'),
      modal: 'R',
      tipoFrete: '1',
      cepOrigem: Number(cepOrigem),
      cepDestino: Number(cepDestino),
      vlrMercadoria: Number(input.valorMercadoria.toFixed(2)),
      peso: Number(pesoTotal.toFixed(3)),
      volumes: volumesTotal,
      cubagem,
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
        return []
      }

      const data = (await res.json()) as {
        totalFrete?: number | string
        prazo?: number | string
        id?: number | string
      }

      const preco = Number(data?.totalFrete)
      const prazoDias = Number(data?.prazo)
      if (!Number.isFinite(preco) || preco <= 0) {
        console.warn('[braspress] resposta sem totalFrete válido:', JSON.stringify(data).slice(0, 200))
        return []
      }

      console.info(
        `[braspress] cotado ${cepOrigem}→${cepDestino} peso=${body.peso}kg vol=${body.volumes} ` +
        `preco=R$${preco.toFixed(2)} prazo=${prazoDias}d`,
      )

      return [
        {
          carrierId: BRASPRESS_ID,
          servico: 'Braspress Rodoviário',
          preco,
          prazoDias: Number.isFinite(prazoDias) && prazoDias > 0 ? prazoDias : 0,
        },
      ]
    } catch (err) {
      const motivo = err instanceof Error && err.name === 'AbortError' ? 'timeout' : String(err)
      console.warn(`[braspress] falha na cotação (${motivo})`)
      return []
    } finally {
      clearTimeout(timer)
    }
  },
}
