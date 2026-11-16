import { describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { createCatalogResources, SAFE_CONFIGURATION_KEYS } from './catalogo'
import { createCustomerResources } from './clientes'
import { executeItem, executeList } from '../resource'
import { parseListQuery } from '../query'
import { assertAdapter, assertCoverage, assertExpansions, assertNullableFields, context, fakeDelegate, fixture, options } from './fixtures.test-support'

const importedDatabase = vi.hoisted(() => vi.fn())
vi.mock('../../prisma', () => { importedDatabase(); throw new Error('Database must not be eagerly imported') })

const expected: Record<string, string> = {
  Produto: 'id erpProdutoId nome slug descricao preco precoPromocional custoProduto imagens estoque categoria modelo ativo createdAt sku temVariacoes videoUrl especificacoes faqs imagensPorVariacao vendidos mediaAvaliacoes totalAvaliacoes garantiaFabricaMeses garantiaEstendida12Preco garantiaEstendida24Preco pesoKg alturaCm larguraCm comprimentoCm volumes updatedAt',
  Avaliacao: 'id produtoId clienteId nomeAutor emailAutor nota titulo comentario aprovada destaque ordem resposta respostaEm createdAt updatedAt',
  AvaliacaoFoto: 'id avaliacaoId url createdAt',
  Banner: 'id imagem imagemTablet imagemMobile titulo subtitulo link ordem ativo tempoCads aspectMobile aspectTablet aspectDesktop maxHeightDesktop createdAt updatedAt',
  Configuracao: 'id chave valor updatedAt',
  FormaPagamento: 'id nome iconeUrl ordem ativo createdAt updatedAt',
  ProdutoDestaque: 'id produtoId ordem secao createdAt',
  VariacaoProduto: 'id produtoId nome sku preco estoque ativo createdAt updatedAt',
  FreteRegra: 'id produtoId uf precoNormal prazoNormal precoExpresso prazoExpresso prazoNormalMin prazoNormalMax prazoExpressoMin prazoExpressoMax aCombinar bloqueado freteGratis criadoEm atualizadoEm',
  EmailTemplate: 'id tipo ativo assunto corpo prazo unidadePrazo updatedAt',
  AvaliacaoParceiro: 'id nomeCompleto empresa cargo cidade nota titulo comentario avatarInicial corAvatar aprovada destaque ordem createdAt updatedAt',
  PopupInicial: 'id ativado bannerDesktop bannerTablet bannerMobile altText linkDestino abrirNovaAba titulo texto corBotao textoBotao delaySegundos frequencia paginas createdAt updatedAt',
}
const resources = createCatalogResources()
const get = (model: string) => resources.find(def => def.model === model)!
describe('catalog resource allowlists', () => {
  it('constructs exactly twelve definitions without opening a database', () => {
    expect(resources.map(def => def.model).sort()).toEqual(Object.keys(expected).sort())
    expect(importedDatabase).not.toHaveBeenCalled()
  })
  it.each(Object.keys(expected))('covers every allowed scalar and excludes forbidden sentinels: %s', model => {
    const money = model === 'Produto' ? ['preco', 'precoPromocional', 'custoProduto', 'garantiaEstendida12Preco', 'garantiaEstendida24Preco'] : model === 'VariacaoProduto' ? ['preco'] : model === 'FreteRegra' ? ['precoNormal', 'precoExpresso'] : []
    assertCoverage(get(model), expected[model].split(' '), money, model === 'Produto' ? ['pesoKg', 'alturaCm', 'larguraCm', 'comprimentoCm'] : [])
    assertNullableFields(get(model))
  })
  it('uses the plan’s singleton popup resource slug', () => expect(get('PopupInicial').slug).toBe('popup-inicial'))
  it.each(Object.keys(expected))('exercises real list/detail adapters: %s', async model => {
    const key = model[0].toLowerCase() + model.slice(1), delegate = fakeDelegate()
    const defs = createCatalogResources({ prisma: { [key]: delegate } as never })
    await assertAdapter(defs.find(item => item.model === model)!, delegate)
  })
  it('serializes every catalog expansion using a child definition at depth one', async () => {
    const customers = createCustomerResources()
    for (const def of createCatalogResources({ resolve: slug => customers.find(item => item.slug === slug)! })) await assertExpansions(def)
  })
  it('preserves product names/descriptions through the engine, while retaining secret and PAN redaction', async () => {
    const def = get('Produto')
    const raw = { ...fixture('Produto'), nome: 'Climatizador Sixxis SX180', descricao: 'Nome público do produto token=DO-NOT-LEAK cartão 4111111111111111' }
    const result = await executeList({ ...def, adapter: { findMany: async () => [raw] } }, context(['read:catalogo']), parseListQuery('https://test.local/', def), options)
    expect(result.data[0].nome).toBe('Climatizador Sixxis SX180')
    expect(result.data[0].descricao).toContain('Nome público do produto')
    expect(result.data[0].descricao).not.toMatch(/DO-NOT-LEAK|4111111111111111/)
    expect(result.data[0]).not.toHaveProperty('custoProduto')
    const structured = { ...raw, descricao: JSON.stringify({ nome: 'Climatizador Sixxis', token: 'DO-NOT-LEAK', detalhe: '4111111111111111' }) }
    const detail = await executeItem({ ...def, adapter: { ...def.adapter, findFirst: async () => structured } }, context(['read:catalogo']), 'id')
    expect(JSON.parse(detail.data.descricao as string)).toEqual({ nome: 'Climatizador Sixxis', detalhe: '[REDACTED]' })
  })
  it('requires explicit read:financeiro for product costs and uses strings for money/dimensions', () => {
    const def = get('Produto'), raw = { ...fixture('Produto'), custoProduto: new Prisma.Decimal('123.456'), preco: new Prisma.Decimal('123.456'), pesoKg: new Prisma.Decimal('123.456'), alturaCm: new Prisma.Decimal('123.456') }
    for (const scopes of [['read:catalogo'], ['read:all']] as const) expect(def.serialize(raw, context([...scopes]))).not.toHaveProperty('custoProduto')
    expect(def.serialize(raw, context())).toMatchObject({ custoProduto: '123.46', preco: '123.46', pesoKg: '123.456', alturaCm: '123.456' })
  })
  it('masks author/partner PII but leaves public category/payment/variant/tier names intact', () => {
    const review = get('Avaliacao'), partner = get('AvaliacaoParceiro')
    expect(review.serialize({ ...fixture('Avaliacao'), nomeAutor: 'Alice', emailAutor: 'alice@example.test' }, context(['read:catalogo']))).toMatchObject({ nomeAutor: 'A***', emailAutor: 'a***@example.test' })
    const output = partner.serialize(fixture('AvaliacaoParceiro'), context(['read:catalogo']))
    for (const key of ['nomeCompleto', 'empresa', 'cargo', 'cidade', 'avatarInicial']) expect(output[key]).not.toBe(fixture('AvaliacaoParceiro')[key])
    for (const model of ['FormaPagamento', 'VariacaoProduto']) expect(get(model).serialize(fixture(model), context(['read:catalogo'])).nome).toBe(fixture(model).nome)
  })
  it('uses safe config keys both in query predicates and pure serialization; unknown is omitted', async () => {
    const configuracao = fakeDelegate()
    const def = createCatalogResources({ prisma: { configuracao } as never }).find(item => item.model === 'Configuracao')!
    for (const chave of ['loja_nome', 'seo_title', 'social_instagram', 'cor_principal', 'bg_body_url', 'logo_url', 'juros_cartao_taxa_mensal', 'cashback_min_pct', 'fidelidade_pontos_por_real', 'agente_avatar_url']) expect(SAFE_CONFIGURATION_KEYS).toContain(chave)
    for (const chave of ['admin_password', 'newsletter_ativo', 'loja_future_secret', 'unknown', 'agente_system_prompt', 'agente_modelo', 'evolution_api_key']) {
      expect(SAFE_CONFIGURATION_KEYS).not.toContain(chave)
      expect(def.serialize({ ...fixture('Configuracao'), chave }, context())).toEqual({})
      expect(() => parseListQuery(`https://test.local/?chave=${chave}`, def)).toThrow()
    }
    configuracao.findMany.mockResolvedValue([fixture('Configuracao')])
    await executeList(def, context(['read:configuracoes']), parseListQuery('https://test.local/?chave=loja_nome', def), options)
    expect(configuracao.findMany.mock.calls[0][0]).toMatchObject({ where: { AND: [{ AND: [{ chave: 'loja_nome' }] }, { chave: { in: [...SAFE_CONFIGURATION_KEYS] } }] } })
    configuracao.findFirst.mockResolvedValue(fixture('Configuracao'))
    await executeItem(def, context(['read:configuracoes']), 'id')
    expect(configuracao.findFirst.mock.calls[0][0]).toMatchObject({ where: { AND: [{ id: 'id' }, { chave: { in: [...SAFE_CONFIGURATION_KEYS] } }] } })
  })
  it('templates keep body/subject without messages scope and recursively remove secrets/PII', () => {
    const output = get('EmailTemplate').serialize({ ...fixture('EmailTemplate'), assunto: 'Contato alice@example.test', corpo: 'token=DO-NOT-LEAK email=alice@example.test' }, context(['read:configuracoes']))
    expect(output.assunto).toBe('Contato a***@example.test')
    expect(output.corpo).not.toMatch(/DO-NOT-LEAK|alice@example.test/)
  })
  it('bounds expands at depth one, serializes children and uses nominal filters', async () => {
    const produto = fakeDelegate(), avaliacao = fakeDelegate()
    const customers = createCustomerResources()
    const defs = createCatalogResources({ prisma: { produto, avaliacao } as never, resolve: slug => customers.find(item => item.slug === slug)! })
    const def = defs.find(item => item.model === 'Produto')!
    produto.findMany.mockResolvedValue([{ ...fixture('Produto'), variacoes: [fixture('VariacaoProduto')] }])
    const q = parseListQuery('https://test.local/?produtoId=p&categoria=climatizador&sku=SX&slug=sx&modelo=180&ativo=true&expand=variacoes&limit=2', def)
    const result = await executeList(def, context(['read:catalogo']), q, options)
    expect(produto.findMany.mock.calls[0][0]).toMatchObject({ where: { AND: [{ id: 'p' }, { categoria: 'climatizador' }, { sku: 'SX' }, { slug: 'sx' }, { modelo: '180' }, { ativo: true }] }, take: 3, select: { variacoes: { select: defs.find(item => item.model === 'VariacaoProduto')!.select, take: 51, orderBy: { id: 'asc' } } } })
    expect(result.data[0].variacoes).toMatchObject({ data: [{ preco: (fixture('VariacaoProduto').preco as Prisma.Decimal).toFixed(2), nome: fixture('VariacaoProduto').nome }], _meta: { hasMore: false } })
    expect(() => parseListQuery('https://test.local/?expand=variacoes.produto', def)).toThrow()
    expect(() => parseListQuery('https://test.local/?ativo={"not":true}', def)).toThrow()
    expect(() => parseListQuery('https://test.local/?OR=1', def)).toThrow()
    const reviews = defs.find(item => item.model === 'Avaliacao')!
    avaliacao.findMany.mockResolvedValue([{ ...fixture('Avaliacao'), cliente: fixture('Cliente') }])
    await expect(executeList(reviews, context(['read:catalogo']), parseListQuery('https://test.local/?expand=cliente', reviews), options)).rejects.toMatchObject({ status: 403 })
    expect(avaliacao.findMany).not.toHaveBeenCalled()
    const authorized = await executeList(reviews, context(['read:catalogo', 'read:clientes']), parseListQuery('https://test.local/?expand=cliente', reviews), options)
    expect(authorized.data[0].cliente).toMatchObject({ nome: 'C***' })
    expect(authorized.data[0].cliente).not.toHaveProperty('senha')
  })
  it('documents popup frequency and freight flags and validates their natural filters', () => {
    expect(get('PopupInicial').fields.find(field => field.name === 'frequencia')?.enum).toEqual(['sessao', 'dia', 'semana'])
    for (const key of ['aCombinar', 'bloqueado', 'freteGratis']) expect(get('FreteRegra').fields.find(field => field.name === key)?.description).toBeTruthy()
    expect(parseListQuery('https://test.local/?uf=SP&produtoId=p', get('FreteRegra')).filters).toEqual({ uf: ['SP'], produtoId: ['p'] })
    expect(parseListQuery('https://test.local/?nota=5&aprovada=true', get('Avaliacao')).filters).toEqual({ nota: ['5'], aprovada: ['true'] })
    expect(parseListQuery('https://test.local/?secao=mais-vendidos', get('ProdutoDestaque')).filters).toEqual({ secao: ['mais-vendidos'] })
  })
})
