// Validação/saneamento da solicitação pública "Seja revendedor".
//
// A rota é anônima e manda DOIS e-mails pelo remetente verificado da loja: um
// para o SAC e um de confirmação PARA O E-MAIL DIGITADO. Sem validar/escapar,
// qualquer um usava a loja para mandar e-mail com HTML arbitrário (links,
// imagens) a terceiros, assinado pelo domínio da Sixxis. Aqui: só campos
// conhecidos, tamanho limitado, e-mail válido e todo valor escapado antes de
// entrar em HTML. Módulo puro (testável sem prisma/Resend).
import { z } from 'zod'

export const CAMPOS_SOLICITACAO = [
  'tipo', 'nome', 'email', 'telefone', 'cpf', 'cnpj', 'razaoSocial', 'nomeFantasia',
  'cidade', 'estado', 'cep', 'endereco', 'segmento', 'mensagem',
] as const
export type CampoSolicitacao = (typeof CAMPOS_SOLICITACAO)[number]
export type SolicitacaoLimpa = Partial<Record<CampoSolicitacao, string>> & {
  nome: string
  email: string
  telefone: string
}

const MAX_CAMPO = 200
const MAX_MENSAGEM = 2000
/** Janela em que o mesmo e-mail não recebe outra confirmação automática. */
export const JANELA_CONFIRMACAO_MS = 24 * 60 * 60 * 1000

export function escaparHtml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const emailSchema = z.string().trim().email().max(191)

// Sem union discriminada: o projeto roda com `strict: false`, onde o TS não
// estreita por `ok`. `dados` só vem preenchido quando ok === true.
export type ResultadoSolicitacao = {
  ok: boolean
  dados?: SolicitacaoLimpa
  erro?: string
  faltando?: string[]
}

export function normalizarSolicitacao(bruto: unknown): ResultadoSolicitacao {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) {
    return { ok: false, erro: 'Corpo inválido' }
  }
  const entrada = bruto as Record<string, unknown>
  const dados: Partial<Record<CampoSolicitacao, string>> = {}
  for (const campo of CAMPOS_SOLICITACAO) {
    const v = entrada[campo]
    if (v == null) continue
    if (typeof v !== 'string' && typeof v !== 'number') {
      return { ok: false, erro: `Campo inválido: ${campo}` }
    }
    const str = String(v).trim()
    if (!str) continue
    const max = campo === 'mensagem' ? MAX_MENSAGEM : MAX_CAMPO
    if (str.length > max) return { ok: false, erro: `Campo muito longo: ${campo}` }
    dados[campo] = str
  }

  const faltando = (['nome', 'email', 'telefone'] as const).filter((k) => !dados[k])
  if (faltando.length) {
    return { ok: false, erro: `Campos obrigatórios faltando: ${faltando.join(', ')}`, faltando }
  }
  const email = emailSchema.safeParse(dados.email)
  if (!email.success) return { ok: false, erro: 'E-mail inválido' }
  dados.email = email.data.toLowerCase()

  return { ok: true, dados: dados as SolicitacaoLimpa }
}
