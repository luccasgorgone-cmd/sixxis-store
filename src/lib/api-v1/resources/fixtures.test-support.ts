import { Prisma } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { expect, vi } from 'vitest'
import type { ApiContext, ApiScope } from '../types'
import { executeItem, executeList, type ResourceDefinition, type ResourceQueryArgs } from '../resource'
import { parseListQuery } from '../query'

export const options = { cursorSecret: 'task-five-test-only-cursor-secret-at-least-32-chars' }
// JSON columns use their application shapes, not one generic object for every model.
const jsonValues: Record<string, unknown> = {
  'Produto.imagens': ['https://media.example.test/Produto.imagens.SENTINEL.webp?token=DO-NOT-LEAK'],
  'Produto.especificacoes': [{ label: 'Produto.especificacoes.label.SENTINEL', valor: 'Produto.especificacoes.valor.SENTINEL', token: 'DO-NOT-LEAK' }],
  'Produto.faqs': [{ pergunta: 'Produto.faqs.pergunta.SENTINEL', resposta: 'Produto.faqs.resposta.SENTINEL token=DO-NOT-LEAK' }],
  'Produto.imagensPorVariacao': { Branco: ['https://media.example.test/Produto.imagensPorVariacao.SENTINEL.webp'], token: 'DO-NOT-LEAK' },
  'PopupInicial.paginas': ['home', 'produtos', '*'],
  'GarantiaEstendida.acionamentos': [{ data: '2026-01-01T10:00:00-03:00', descricao: 'Atendimento em garantia', autor: 'Alice Teste' }],
  'CarrinhoCliente.itens': [{ produtoId: 'p', slug: 'produto', nome: 'Produto Público', variacao: '110V', qtd: 2, preco: 100 }],
}
const expectedJson: Record<string, unknown> = {
  'Produto.imagens': ['https://media.example.test/Produto.imagens.SENTINEL.webp?[REDACTED]'],
  'Produto.especificacoes': [{ label: 'Produto.especificacoes.label.SENTINEL', valor: 'Produto.especificacoes.valor.SENTINEL' }],
  'Produto.faqs': [{ pergunta: 'Produto.faqs.pergunta.SENTINEL', resposta: 'Produto.faqs.resposta.SENTINEL [REDACTED]' }],
  'Produto.imagensPorVariacao': { Branco: ['https://media.example.test/Produto.imagensPorVariacao.SENTINEL.webp'] },
  'PopupInicial.paginas': ['home', 'produtos', '*'],
}
export function context(scopes: ApiScope[] = ['read:all', 'read:pii', 'read:financeiro', 'read:mensagens']): ApiContext {
  return { requestId: 'task-five', identity: { id: 'key', nome: 'test', prefixo: 'test', scopes: new Set(scopes), expiraEm: null }, ip: '', startedAt: 0, rateLimit: { success: true, limit: 600, remaining: 599, reset: 1 } }
}
export function fixture(model: string): Record<string, unknown> {
  const schema = Prisma.dmmf.datamodel.models.find(item => item.name === model)!
  return Object.fromEntries(schema.fields.filter(field => field.kind !== 'object').map((field, i) => [field.name,
    field.type === 'DateTime' ? new Date(Date.UTC(2026, 0, 1, 0, 0, i)) :
      field.type === 'Decimal' ? new Prisma.Decimal(`${100 + i}.456`) :
        field.type === 'Int' ? i + 1 : field.type === 'Float' ? 100 + i + 0.456 : field.type === 'Boolean' ? true :
          field.type === 'Json' ? structuredClone(jsonValues[`${model}.${field.name}`] ?? { sentinel: `${model}.${field.name}`, token: 'DO-NOT-LEAK', nested: { email: 'alice@example.test' } }) :
            field.name === 'chave' ? 'loja_nome' : model === 'Endereco' && field.name === 'clienteId' ? 'cmr1abc123def456ghi789jkl' : `${model}.${field.name}.SENTINEL`,
  ]).concat([['senha', 'PASSWORD-DO-NOT-LEAK'], ['rawResponse', 'RAW-DO-NOT-LEAK'], ['unknown', 'UNKNOWN-DO-NOT-LEAK']]))
}
export const fakeDelegate = () => ({ findMany: vi.fn(async (args: ResourceQueryArgs) => { void args; return [] as Record<string, unknown>[] }), findFirst: vi.fn(async (args: Pick<ResourceQueryArgs, 'where' | 'select'>) => { void args; return null as Record<string, unknown> | null }) })
export function assertCoverage(def: ResourceDefinition, expected: string[], moneyFields: string[] = [], decimals: string[] = []) {
  const raw = fixture(def.model)
  const schemaFields = Prisma.dmmf.datamodel.models.find(model => model.name === def.model)!.fields.filter(field => field.kind !== 'object' && field.name !== 'senha').map(field => field.name)
  expect([...expected].sort()).toEqual(schemaFields.sort())
  const output = def.serialize(raw, context())
  expect(Object.keys(def.select).sort()).toEqual([...expected].sort())
  expect(def.scalarFields?.slice().sort()).toEqual([...expected].sort())
  expect(def.fields.map(field => field.name).sort()).toEqual([...expected].sort())
  expect(Object.keys(output).sort()).toEqual([...expected].sort())
  for (const key of expected) {
    const value = raw[key]
    const wanted = value instanceof Date ? value.toISOString() : moneyFields.includes(key) ? new Prisma.Decimal(String(value)).toFixed(2) : decimals.includes(key) ? String(value) : value
    // JSON is recursively redacted even with PII and message scopes.
    expect(output[key], `${def.model}.${key}`).toEqual(wanted && typeof wanted === 'object' ? expectedJson[`${def.model}.${key}`] ?? { sentinel: `${def.model}.${key}`, nested: { email: 'alice@example.test' } } : wanted)
  }
  expect(JSON.stringify(output)).not.toMatch(/PASSWORD-DO-NOT-LEAK|RAW-DO-NOT-LEAK|UNKNOWN-DO-NOT-LEAK|DO-NOT-LEAK/)
}

export async function assertAdapter(def: ResourceDefinition, delegate: ReturnType<typeof fakeDelegate>) {
  const row = fixture(def.model)
  delegate.findMany.mockResolvedValue([row])
  delegate.findFirst.mockResolvedValue(row)
  const response = await executeList(def, context(), parseListQuery('https://test.local/?limit=2', def), options)
  expect(response.data).toEqual([def.serialize(row, context())])
  const where = def.model === 'Configuracao' ? { AND: [{ AND: [] }, { chave: { in: expect.any(Array) } }] } : { AND: [] }
  expect(delegate.findMany).toHaveBeenCalledWith({ where, select: def.select, orderBy: [{ [def.defaultSort!]: 'asc' }, { id: 'asc' }], take: 3 })
  const detail = await executeItem(def, context(), String(row.id))
  expect(detail.data).toEqual(def.serialize(row, context()))
  expect(delegate.findFirst).toHaveBeenCalledWith({ where: def.model === 'Configuracao' ? { AND: [{ id: row.id }, { chave: { in: expect.any(Array) } }] } : { id: row.id }, select: def.select })
  delegate.findFirst.mockResolvedValue(null)
  await expect(executeItem(def, context(), 'missing')).rejects.toMatchObject({ status: 404 })
}

export function assertNullableFields(def: ResourceDefinition) {
  const row = fixture(def.model)
  // Prisma 7's runtime DMMF omits isRequired; inspect the actual schema contract.
  const schema = readFileSync(new URL('../../../../prisma/schema.prisma', import.meta.url), 'utf8')
  const block = new RegExp(`^model ${def.model} \\{([\\s\\S]*?)^}`, 'm').exec(schema)![1]
  const nullable = [...block.matchAll(/^\s+(\w+)\s+(?:String|Int|Float|Decimal|DateTime|Boolean|Json)\?/gm)].map(match => match[1]).filter(name => Object.hasOwn(def.select, name))
  expect(def.fields.filter(field => field.nullable).map(field => field.name).sort()).toEqual([...nullable].sort())
  for (const field of nullable) row[field] = null
  const output = def.serialize(row, context())
  for (const field of nullable) expect(output[field], `${def.model}.${field}`).toBeNull()
}

/** Every expansion uses its child's own scalar selector and serializer, never grandchildren. */
export async function assertExpansions(def: ResourceDefinition) {
  const fullScopes = ['read:all', 'read:pii', 'read:mensagens'] as const
  for (const expansion of def.expands) {
    const child = expansion.resource(), raw = fixture(child.model)
    for (const grandchild of child.expands) raw[grandchild.name] = { secret: 'GRANDCHILD-MUST-NOT-LEAK' }
    const row = { ...fixture(def.model), [expansion.relation ?? expansion.name]: expansion.many ? [raw] : raw }
    const findMany = vi.fn(async (args: ResourceQueryArgs) => { void args; return [row] }), findFirst = vi.fn(async () => row)
    const serialize = vi.spyOn(child, 'serialize')
    const fake = { ...def, adapter: { findMany, findFirst } }
    const query = parseListQuery(`https://test.local/?expand=${expansion.name}`, def)
    for (const response of [await executeList(fake, context([...fullScopes]), query, options), await executeItem(fake, context([...fullScopes]), 'id', { expand: [expansion.name] })]) {
      const output = Array.isArray(response.data) ? response.data[0] : response.data
      const value = expansion.many ? (output[expansion.name] as { data: unknown[] }).data[0] : output[expansion.name]
      expect(value).toEqual(child.serialize(raw, context([...fullScopes])))
      expect(JSON.stringify(value)).not.toMatch(/GRANDCHILD-MUST-NOT-LEAK|DO-NOT-LEAK/)
    }
    expect(serialize).toHaveBeenCalled()
    expect(findMany.mock.calls[0][0]).toMatchObject({ select: { [expansion.relation ?? expansion.name]: { select: child.select, ...(expansion.many ? { take: 51, orderBy: { id: 'asc' } } : {}) } } })
    serialize.mockRestore()
  }
}
