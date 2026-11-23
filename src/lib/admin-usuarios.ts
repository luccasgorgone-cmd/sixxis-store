// ─── Logins nomeados do painel admin (RBAC leve) ─────────────────────────────
// O painel nasceu com UM login só-senha. Agora há logins NOMEADOS com papel:
//   • Gerenciamento → role 'admin' (acesso total). Valida contra o MESMO hash do
//     admin (Configuracao `admin_password_hash` / env ADMIN_PASSWORD_HASH).
//   • vitor         → role 'pedidos' (colaborador: só a aba Pedidos, p/ cotar
//     frete). Hash próprio em Configuracao `colaborador_vitor_hash`.
// O login LEGADO (sem usuário, só a senha do admin) continua funcionando como
// 'admin' — para não travar o acesso atual do Luccas.
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { AdminRole } from '@/lib/adminToken'

interface LoginSpec {
  role: AdminRole
  /** Chave da Configuracao com o hash; null = usa o hash do admin. */
  hashConfigKey: string | null
}

// usuário (lowercase, sem espaços) → especificação.
const LOGINS: Record<string, LoginSpec> = {
  gerenciamento: { role: 'admin', hashConfigKey: null },
  vitor:         { role: 'pedidos', hashConfigKey: 'colaborador_vitor_hash' },
}

async function loadHash(chave: string): Promise<string | null> {
  const cfg = await prisma.configuracao.findUnique({ where: { chave } }).catch(() => null)
  return cfg?.valor ?? null
}

async function loadAdminHash(): Promise<string | null> {
  return (await loadHash('admin_password_hash')) ?? process.env.ADMIN_PASSWORD_HASH ?? null
}

export interface AuthResult {
  ok: boolean
  role?: AdminRole
}

/**
 * Valida usuário + senha. Usuário vazio/ausente → login legado (senha do admin →
 * role 'admin'). Usuário conhecido → valida contra o hash do seu papel. bcrypt
 * é timing-safe; usuário inexistente devolve ok:false sem vazar qual falhou.
 */
export async function autenticarAdmin(
  usuario: string | undefined | null,
  senha: string,
): Promise<AuthResult> {
  const u = (usuario ?? '').trim().toLowerCase()

  if (!u) {
    const hash = await loadAdminHash()
    if (hash && (await bcrypt.compare(senha, hash))) return { ok: true, role: 'admin' }
    return { ok: false }
  }

  const spec = LOGINS[u]
  if (!spec) return { ok: false }
  const hash = spec.hashConfigKey ? await loadHash(spec.hashConfigKey) : await loadAdminHash()
  if (hash && (await bcrypt.compare(senha, hash))) return { ok: true, role: spec.role }
  return { ok: false }
}
