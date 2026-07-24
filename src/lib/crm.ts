// ─── Cliente SERVER-SIDE do CRM (ponte loja -> CRM) ──────────────────────────
//
// A Loja chama três rotas internas do CRM ({CRM_API_URL}/api/interno/crm/*),
// autenticadas pelo header `x-internal-key` = STORE_INTERNAL_KEY (a MESMA chave
// já compartilhada entre os dois Railways; nenhuma chave nova).
//
// SEGURANÇA: este módulo roda SÓ no servidor. A chave interna NUNCA vai ao
// browser — as rotas /api/admin/pedidos/[id]/crm/* (autenticadas por sessão de
// admin) é que chamam estas funções.
//
// ROBUSTEZ: timeout ~10s e falha graciosa — nunca lança para a UI. Sempre
// devolve { ok } com uma mensagem tratável, para o modal exibir sem quebrar a
// tela de pedidos.

const TIMEOUT_MS = 10_000

// ── Tipos do contrato ────────────────────────────────────────────────────────
export interface DadosCrmEndereco {
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string // NUNCA "estado" — o CRM espera `uf` e ignora "estado" em silêncio.
}

export interface DadosCrm {
  nome?: string
  // Documento: cpf (PF) e cnpj (PJ) são campos PRÓPRIOS e mutuamente exclusivos —
  // o CRM tem destino separado p/ cada um. Só dígitos. NUNCA CNPJ no campo cpf.
  cpf?: string
  cnpj?: string
  razaoSocial?: string // o CRM o mapeia p/ a chave `empresa` dele
  email?: string
  endereco?: DadosCrmEndereco
  notaFiscal?: { numero?: string; data?: string } // data = "YYYY-MM-DD"
  rastreio?: { codigo?: string; transportadora?: string }
}

export interface CrmCandidato {
  leadId: string
  nome: string | null
  telefone: string | null
  cidadeUf: string | null
  temNegocioAberto: boolean
  ultimaInteracaoEm: string | null
}

export type CrmClassificacao = 'preencher' | 'conflito' | 'igual'

export interface CrmCampoPrevia {
  chave: string
  rotulo: string
  valorCrm: string | null
  valorLoja: string | null
  classificacao: CrmClassificacao
}

export interface CrmAplicarResultado {
  aplicados: string[]
  pulados: { chave: string; motivo: string }[]
}

// Interface ÚNICA (não união discriminada): o projeto usa `strict: false`, e sem
// strictNullChecks o narrowing por `ok: true|false` não funciona (os literais
// colapsam em boolean). Com um só shape, `r.data` e `r.error` são sempre
// acessíveis — quem chama checa `r.ok` e usa o campo correspondente.
export interface CrmResultado<T> {
  ok: boolean
  data?: T
  error?: string
  status?: number
}

// ── Chamador genérico (timeout + falha graciosa) ─────────────────────────────
async function chamarCrm<T>(path: string, body: unknown): Promise<CrmResultado<T>> {
  const base = process.env.CRM_API_URL
  const key = process.env.STORE_INTERNAL_KEY
  if (!base) return { ok: false, error: 'Integração com o CRM não configurada (CRM_API_URL ausente).' }
  if (!key) return { ok: false, error: 'Chave interna do CRM não configurada no servidor.' }

  const url = `${base.replace(/\/$/, '')}${path}`
  console.log('[crm:url]', url) // sem a chave — jamais logar a chave
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: 'no-store',
    })
    const texto = await res.text()
    console.log('[crm:chamada]', path, res.status, res.headers.get('content-type'),
                `len=${texto.length}`, texto.slice(0, 300))
    let json: unknown = null
    try { json = texto ? JSON.parse(texto) : null } catch { /* resposta não-JSON */ }

    if (!res.ok) {
      const msg = (json as { error?: string } | null)?.error
      return { ok: false, error: msg || `O CRM respondeu ${res.status}.`, status: res.status }
    }
    return { ok: true, data: (json ?? {}) as T }
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') {
      return { ok: false, error: 'O CRM demorou para responder (timeout). Tente de novo.' }
    }
    return { ok: false, error: 'Não foi possível falar com o CRM. Tente de novo.' }
  } finally {
    clearTimeout(timer)
  }
}

// ── As três chamadas do contrato ─────────────────────────────────────────────
export function crmBuscarCliente(
  input: { telefone?: string; cpf?: string; cnpj?: string; nome?: string },
): Promise<CrmResultado<{ candidatos: CrmCandidato[] }>> {
  return chamarCrm('/api/interno/crm/buscar-cliente', input)
}

export function crmPrevia(
  input: { leadId: string; dados: DadosCrm },
): Promise<CrmResultado<{ campos: CrmCampoPrevia[] }>> {
  return chamarCrm('/api/interno/crm/previa', input)
}

export function crmAplicar(
  input: { leadId: string; dados: DadosCrm; campos: string[] },
): Promise<CrmResultado<CrmAplicarResultado>> {
  return chamarCrm('/api/interno/crm/aplicar', input)
}
