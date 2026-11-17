import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const schema = readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8')
const migrationPath = path.join(root, 'prisma/migrations/20261116190000_api_leitura_v1/migration.sql')
const sql = existsSync(migrationPath) ? readFileSync(migrationPath, 'utf8') : ''
const statements = sql.replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean)
const models = new Map([...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map(m => [m[1], m[2]]))

// Authoritative coverage matrix in docs/superpowers/plans/2026-11-16-api-leitura-v1.md.
const newMutableClocks = [
  'Cliente', 'Endereco', 'Produto', 'Pedido', 'ItemPedido', 'ItemCarrinho', 'Banner',
  'ListaEspera', 'VariacaoProduto', 'CashbackTransacao', 'NivelFidelidade',
  'CampanhaDestinatario', 'BloqueioIp', 'SolicitacaoParceiro', 'MensagemContato',
]
const newCreationClocks = ['Endereco', 'ItemPedido', 'ItemCarrinho', 'NivelFidelidade']
const syncClocks: Record<string, string> = {
  Cliente: 'updatedAt', Endereco: 'updatedAt', Produto: 'updatedAt', Pedido: 'updatedAt',
  GarantiaEstendida: 'updatedAt', Pagamento: 'updatedAt', TentativaMultiMetodo: 'updatedAt',
  ItemPedido: 'updatedAt', Carrinho: 'createdAt', ItemCarrinho: 'updatedAt',
  Avaliacao: 'updatedAt', AvaliacaoFoto: 'createdAt', Banner: 'updatedAt',
  Configuracao: 'updatedAt', FormaPagamento: 'updatedAt', Cupom: 'updatedAt',
  CupomUso: 'usadoEm', HistoricoPontos: 'createdAt', ListaEspera: 'updatedAt',
  PontosCliente: 'updatedAt', ProdutoDestaque: 'createdAt', VariacaoProduto: 'updatedAt',
  FreteRegra: 'atualizadoEm', EmailTemplate: 'updatedAt', CookieConsent: 'createdAt',
  EventoAnalitico: 'createdAt', ClienteInsight: 'ultimaVisita', AvaliacaoParceiro: 'updatedAt',
  CashbackTransacao: 'updatedAt', BloqueioFraude: 'createdAt', Campanha: 'updatedAt',
  NivelFidelidade: 'updatedAt', CampanhaDestinatario: 'updatedAt', WhatsappNumero: 'updatedAt',
  EnvioLog: 'createdAt', LunaConversa: 'updatedAt', LunaMensagem: 'createdAt',
  SessaoVisitante: 'updatedAt', EventoTracking: 'createdAt', RelatorioVendaHora: 'updatedAt',
  TentativaLogin: 'createdAt', BloqueioIp: 'updatedAt', PopupInicial: 'updatedAt',
  AuditLog: 'createdAt', Presenca: 'ultimoPing', CarrinhoCliente: 'atualizadoEm',
  TrafegoBruto: 'dia', SolicitacaoParceiro: 'updatedAt', MensagemContato: 'updatedAt',
}

function model(name: string) {
  expect(models.has(name), `model ${name} must exist`).toBe(true)
  return models.get(name)!
}

function expectIndex(name: string, field: string) {
  expect(model(name), `${name}.${field} must lead an index`).toMatch(
    new RegExp(`@@(?:index|unique)\\(\\[${field}(?:\\s*[,\\]])`),
  )
}

function expectFields(name: string, fields: Record<string, string>) {
  for (const [field, type] of Object.entries(fields)) {
    expect(model(name), `${name}.${field}`).toMatch(new RegExp(`^\\s+${field}\\s+${type}(?:\\s|$)`, 'm'))
  }
}

describe('API v1 additive persistence contract', () => {
  it('preserves all 49 business models and adds only the two infrastructure models', () => {
    expect(Object.keys(syncClocks)).toHaveLength(49)
    expect([...models.keys()].sort()).toEqual([
      ...Object.keys(syncClocks), 'ApiChaveLeitura', 'ApiAuditoriaLeitura',
    ].sort())
  })

  it('stores only a unique SHA-256 digest and safe lifecycle metadata for keys', () => {
    expectFields('ApiChaveLeitura', {
      id: 'String', nome: 'String', prefixo: 'String', hash: 'String', escopos: 'Json',
      criadoEm: 'DateTime', expiraEm: 'DateTime\\?', revogadoEm: 'DateTime\\?',
      ultimoUsoEm: 'DateTime\\?', ultimoIp: 'String\\?',
    })
    const key = model('ApiChaveLeitura')
    const hash = key.match(/^\s+hash\s+String[^\n]*/m)?.[0] ?? ''
    expect(hash).toContain('@unique')
    expect(hash).toContain('@db.Char(64)')
    expect(key).toMatch(/auditorias\s+ApiAuditoriaLeitura\[\]/)
    for (const field of ['prefixo', 'expiraEm', 'revogadoEm', 'criadoEm']) expectIndex('ApiChaveLeitura', field)
    expect(sql).toMatch(/`hash` CHAR\(64\) NOT NULL/)
    expect(sql).toMatch(/UNIQUE INDEX `[^`]+`\(`hash`\)/)
  })

  it('keeps nullable audit identity and a foreign key without cascading away audit history', () => {
    expectFields('ApiAuditoriaLeitura', {
      id: 'String', chaveId: 'String\\?', prefixo: 'String\\?', requestId: 'String',
      rota: 'String', queryKeys: 'Json\\?', status: 'Int', duracaoMs: 'Int',
      ip: 'String\\?', criadoEm: 'DateTime',
    })
    expect(model('ApiAuditoriaLeitura')).toMatch(/chave\s+ApiChaveLeitura\?\s+@relation\(fields: \[chaveId\], references: \[id\], onDelete: Restrict\)/)
    for (const field of ['chaveId', 'prefixo', 'requestId', 'criadoEm']) expectIndex('ApiAuditoriaLeitura', field)
    expect(sql).toMatch(/FOREIGN KEY \(`chaveId`\) REFERENCES `ApiChaveLeitura`\(`id`\)/)
    expect(sql).toMatch(/`chaveId` VARCHAR\(191\) NULL/)
    expect(sql).toMatch(/`queryKeys` JSON NULL/)
  })

  it('uses strictly additive DDL, without business data rewrites or destructive SQL', () => {
    expect(sql.length).toBeGreaterThan(0)
    expect(sql).not.toMatch(/\b(?:DROP|RENAME|DELETE|TRUNCATE)\b/i)
    expect(statements.length).toBeGreaterThan(0)
    for (const statement of statements) {
      expect(statement).toMatch(/^(?:CREATE TABLE|CREATE (?:UNIQUE )?INDEX|ALTER TABLE `\w+` ADD (?:COLUMN|CONSTRAINT))\b/)
    }
    expect([...sql.matchAll(/CREATE TABLE `(\w+)`/g)].map(m => m[1]).sort()).toEqual([
      'ApiAuditoriaLeitura', 'ApiChaveLeitura',
    ])
  })

  it.each(newMutableClocks)('%s gains a backfilled database-managed mutable clock mirrored by Prisma', name => {
    expect(model(name)).toMatch(/^\s+updatedAt\s+DateTime\s+@default\(now\(\)\)\s+@updatedAt/m)
    expect(sql).toContain(`ALTER TABLE \`${name}\` ADD COLUMN \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    expectIndex(name, 'updatedAt')
  })

  it.each(newCreationClocks)('%s gains an immutable creation clock with safe automatic backfill', name => {
    expect(model(name)).toMatch(/^\s+createdAt\s+DateTime\s+@default\(now\(\)\)/m)
    expect(sql).toContain(`ALTER TABLE \`${name}\` ADD COLUMN \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);`)
    expectIndex(name, 'createdAt')
  })

  it.each(Object.entries(syncClocks))('%s has an index led by its sync/window clock %s', (name, clock) => {
    expectIndex(name, clock)
  })

  it('mirrors every newly declared index in migration DDL', () => {
    const declared = [...sql.matchAll(/(?:CREATE (?:UNIQUE )?INDEX `([^`]+)` ON `(\w+)`|(?:UNIQUE )?INDEX `([^`]+)`)\(([^)]+)\)/g)]
    expect(declared.length).toBeGreaterThan(0)
    for (const match of declared) {
      const name = match[1] ?? match[3]
      const table = match[2] ?? name.split('_')[0]
      const fields = [...match[4].matchAll(/`(\w+)`/g)].map(m => m[1])
      const modelName = [...models].find(([candidate, body]) =>
        (body.match(/@@map\("([^"]+)"\)/)?.[1] ?? candidate) === table,
      )?.[0]
      expect(modelName, `DDL table ${table} must map to a Prisma model`).toBeDefined()
      const body = model(modelName!)
      if (fields.length === 1 && new RegExp(`^\\s+${fields[0]}\\s+[^\\n]+@unique`, 'm').test(body)) continue
      expect(body, `DDL index ${name}`).toMatch(new RegExp(`@@(?:index|unique)\\(\\[${fields.join(',\\s*')}\\]`))
    }
  })
})
