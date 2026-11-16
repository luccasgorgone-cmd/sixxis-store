import { randomBytes } from 'node:crypto'
import { open } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { z } from 'zod'
import { apiScopesSchema, hashApiKey } from '../src/lib/api-v1/auth'

const METADATA_SELECT = { id: true, nome: true, prefixo: true, escopos: true, criadoEm: true, expiraEm: true, revogadoEm: true, ultimoUsoEm: true, ultimoIp: true } as const
type Metadata = { id: string; nome?: string; prefixo?: string; escopos?: unknown; criadoEm?: Date; expiraEm?: Date | null; revogadoEm?: Date | null; ultimoUsoEm?: Date | null; ultimoIp?: string | null }
type CliStore = { apiChaveLeitura: {
  create(args: { data: { nome: string; prefixo: string; hash: string; escopos: string[]; expiraEm: Date | null }; select: { id: true } }): Promise<{ id: string }>
  findMany(args: { where?: { prefixo: string }; select: typeof METADATA_SELECT | { id: true }; orderBy?: { criadoEm: 'desc' } }): Promise<Metadata[]>
  updateMany(args: { where: { id: string; revogadoEm: null }; data: { revogadoEm: Date } }): Promise<{ count: number }>
} }
export type CliDeps = { prisma?: CliStore; write?: (text: string) => unknown }

function parseArgs(args: string[]): { command: string; flags: Record<string, string> } {
  const [command, ...rest] = args
  if (!['criar', 'listar', 'revogar'].includes(command)) throw new Error('Use criar, listar ou revogar.')
  const allowed: Record<string, string[]> = { criar: ['nome', 'escopos', 'expira-em', 'output'], listar: [], revogar: ['id', 'prefixo'] }
  const flags: Record<string, string> = Object.create(null)
  for (let i = 0; i < rest.length; i += 2) {
    const name = rest[i].replace(/^--/, '')
    if (!rest[i].startsWith('--') || !allowed[command].includes(name) || flags[name] !== undefined || !rest[i + 1] || rest[i + 1].startsWith('--')) throw new Error('Argumentos inválidos.')
    flags[name] = rest[i + 1]
  }
  return { command, flags }
}

/** Raw credentials only enter a one-time output sink; never return or persist raw. */
export async function runApiKeyCli(args: string[], deps: CliDeps = {}): Promise<void> {
  const { command, flags } = parseArgs(args)
  const write = deps.write ?? ((text: string) => process.stdout.write(text))
  if (command === 'criar') {
    const nome = z.string().trim().min(1).max(120).refine(value => !/[\r\n\x00-\x1f]/.test(value) && !value.includes('sxs_live_')).parse(flags.nome)
    const escopos = [...new Set(apiScopesSchema.parse(flags.escopos?.split(',').map(scope => scope.trim())))]
    const expiraEm = flags['expira-em'] ? new Date(z.iso.datetime({ offset: true }).parse(flags['expira-em'])) : null
    if (expiraEm && expiraEm <= new Date()) throw new Error('Expiração deve estar no futuro.')
    // Reserve a NEW exclusive file before touching the DB; never overwrite/symlink.
    const file = flags.output ? await open(flags.output, 'wx', 0o600) : null
    try {
      if (file) await file.chmod(0o600)
      const prisma = deps.prisma ?? (await import('../src/lib/prisma')).prisma
      const raw = `sxs_live_${randomBytes(32).toString('base64url')}`
      await prisma.apiChaveLeitura.create({ data: { nome, prefixo: raw.slice(0, 20), hash: hashApiKey(raw).toString('hex'), escopos, expiraEm }, select: { id: true } })
      if (file) { await file.writeFile(`${raw}\n`, 'utf8'); await file.sync() }
      else write(`${raw}\n`)
    } finally { await file?.close() }
    return
  }
  const prisma = deps.prisma ?? (await import('../src/lib/prisma')).prisma
  if (command === 'listar') {
    const rows = await prisma.apiChaveLeitura.findMany({ select: METADATA_SELECT, orderBy: { criadoEm: 'desc' } })
    // Defense in depth: explicitly copy metadata even if a client ignores select.
    const metadata = rows.map(row => ({ id: row.id, nome: row.nome, prefixo: row.prefixo, escopos: row.escopos, criadoEm: row.criadoEm, expiraEm: row.expiraEm, revogadoEm: row.revogadoEm, ultimoUsoEm: row.ultimoUsoEm, ultimoIp: row.ultimoIp }))
    write(`${JSON.stringify(metadata, null, 2)}\n`)
    return
  }
  if (Boolean(flags.id) === Boolean(flags.prefixo)) throw new Error('Informe somente --id ou --prefixo.')
  let id = flags.id
  if (flags.prefixo) {
    if (flags.prefixo.length > 20 || /[\x00-\x1f]/.test(flags.prefixo)) throw new Error('Prefixo inválido.')
    const matches = await prisma.apiChaveLeitura.findMany({ where: { prefixo: flags.prefixo }, select: { id: true } })
    if (matches.length !== 1) throw new Error('Prefixo ausente ou ambíguo. Use --id.')
    id = matches[0].id
  }
  const result = await prisma.apiChaveLeitura.updateMany({ where: { id, revogadoEm: null }, data: { revogadoEm: new Date() } })
  write(`${JSON.stringify({ revogadas: result.count })}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runApiKeyCli(process.argv.slice(2)).catch(() => {
    // Zod/Prisma/provider errors may carry user input. Do not print them.
    process.stderr.write('Não foi possível executar api:chave. Confira argumentos, banco e permissões do arquivo.\n')
    process.exitCode = 1
  }).finally(async () => {
    // The singleton may never have been instantiated (argument validation failure).
    const prisma = (globalThis as unknown as { prisma?: { $disconnect(): Promise<void> } }).prisma
    await prisma?.$disconnect()
  })
}
