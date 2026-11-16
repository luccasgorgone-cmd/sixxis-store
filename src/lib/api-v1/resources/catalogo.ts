import type { Prisma, PrismaClient } from '@prisma/client'
import type { ResourceDefinition } from '../resource'
import { amount, decimal, safeRecord, timestamp, type ResourceResolver, type ResourceRow } from './shared'

export type CatalogResourceOptions = { prisma?: Pick<PrismaClient, 'produto' | 'avaliacao' | 'avaliacaoFoto' | 'banner' | 'configuracao' | 'formaPagamento' | 'produtoDestaque' | 'variacaoProduto' | 'freteRegra' | 'emailTemplate' | 'avaliacaoParceiro' | 'popupInicial'>; resolve?: ResourceResolver }

/** Exact known public keys; prefix matching and unknown keys are intentionally forbidden. */
export const SAFE_CONFIGURATION_KEYS = [
  'loja_nome', 'loja_descricao', 'loja_email', 'loja_telefone',
  'loja_endereco', 'loja_cnpj', 'loja_horario', 'loja_aberta',
  'logo_url', 'logo_rodape_url', 'favicon_url', 'nf_logo_url',
  'cor_principal', 'cor_principal_dark', 'cor_destaque', 'cor_header',
  'cor_header_texto', 'cor_textos', 'cor_textos_sec', 'cor_fundo',
  'cor_fundo_alt', 'cor_botoes', 'cor_botoes_texto', 'cor_botoes_hover',
  'cor_titulos', 'cor_titulos_secao', 'cor_descricao', 'cor_precos',
  'cor_precos_promo', 'cor_links', 'cor_links_hover', 'cor_card_fundo',
  'cor_card_borda', 'cor_card_hover', 'cor_trustbar_fundo', 'cor_trustbar_icones',
  'cor_badge_oferta', 'cor_badge_novo', 'cor_badge_esgotado', 'cor_anuncio_fundo',
  'cor_anuncio_texto', 'cor_stats_fundo', 'cor_wa_fundo', 'cor_footer_fundo',
  'bg_header_cor', 'bg_header_nav_cor', 'bg_anuncio_cor', 'bg_anuncio_texto',
  'bg_footer_cor', 'bg_footer_texto', 'bg_footer_titulo', 'bg_footer_hover',
  'bg_body_url', 'bg_body_ativo', 'bg_body_size', 'bg_body_attachment',
  'bg_body_repeat', 'bg_body_position', 'bg_body_overlay', 'social_whatsapp',
  'social_whatsapp_suporte', 'social_instagram', 'social_facebook', 'seo_title',
  'seo_description', 'seo_ga_id', 'seo_pixel_id', 'juros_cartao_taxa_mensal',
  'cashback_min_pct', 'cashback_max_pct', 'fidelidade_pontos_por_real', 'fidelidade_reais_por_ponto',
  'agente_ativo', 'agente_nome', 'agente_avatar_url', 'agente_avatar_tipo',
  'agente_saudacao', 'agente_status', 'agente_cor_primaria', 'agente_cor_secundaria',
  'agente_cor_fundo', 'agente_placeholder', 'agente_whatsapp_fallback', 'agente_whatsapp_vendas',
  'agente_whatsapp_suporte',
] as const
const safeConfigurationKeys = new Set<string>(SAFE_CONFIGURATION_KEYS)

export function createCatalogResources(deps: CatalogResourceOptions = {}): ResourceDefinition[] {
  const resolve: ResourceResolver = slug => {
    const definition = definitions.find(item => item.slug === slug) ?? deps.resolve?.(slug)
    if (!definition) throw new TypeError(`Unregistered expansion resource: ${slug}`)
    return definition
  }
  const definitions: ResourceDefinition[] = [
    {
      slug: 'produtos', model: 'Produto', scope: 'read:catalogo',
      scalarFields: ['id', 'erpProdutoId', 'nome', 'slug', 'descricao', 'preco', 'precoPromocional', 'custoProduto', 'imagens', 'estoque', 'categoria', 'modelo', 'ativo', 'createdAt', 'sku', 'temVariacoes', 'videoUrl', 'especificacoes', 'faqs', 'imagensPorVariacao', 'vendidos', 'mediaAvaliacoes', 'totalAvaliacoes', 'garantiaFabricaMeses', 'garantiaEstendida12Preco', 'garantiaEstendida24Preco', 'pesoKg', 'alturaCm', 'larguraCm', 'comprimentoCm', 'volumes', 'updatedAt'],
      publicFields: ['nome', 'descricao'],
      select: { id: true, erpProdutoId: true, nome: true, slug: true, descricao: true, preco: true, precoPromocional: true, custoProduto: true, imagens: true, estoque: true, categoria: true, modelo: true, ativo: true, createdAt: true, sku: true, temVariacoes: true, videoUrl: true, especificacoes: true, faqs: true, imagensPorVariacao: true, vendidos: true, mediaAvaliacoes: true, totalAvaliacoes: true, garantiaFabricaMeses: true, garantiaEstendida12Preco: true, garantiaEstendida24Preco: true, pesoKg: true, alturaCm: true, larguraCm: true, comprimentoCm: true, volumes: true, updatedAt: true } as const satisfies Prisma.ProdutoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'erpProdutoId', type: 'string' },
        { name: 'nome', type: 'string' },
        { name: 'slug', type: 'string' },
        { name: 'descricao', type: 'string', nullable: true },
        { name: 'preco', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.' },
        { name: 'precoPromocional', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.', nullable: true },
        { name: 'custoProduto', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.', nullable: true, scope: 'read:financeiro' },
        { name: 'imagens', type: 'array', items: { type: 'string' } },
        { name: 'estoque', type: 'integer' },
        { name: 'categoria', type: 'string' },
        { name: 'modelo', type: 'string', nullable: true },
        { name: 'ativo', type: 'boolean' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'sku', type: 'string', nullable: true },
        { name: 'temVariacoes', type: 'boolean' },
        { name: 'videoUrl', type: 'string', nullable: true },
        { name: 'especificacoes', type: 'array', nullable: true, items: { type: 'object', properties: { label: { type: 'string' }, valor: { type: 'string' } }, required: ['label', 'valor'] } },
        { name: 'faqs', type: 'array', nullable: true, items: { type: 'object', properties: { pergunta: { type: 'string' }, resposta: { type: 'string' } }, required: ['pergunta', 'resposta'] } },
        { name: 'imagensPorVariacao', type: 'object', nullable: true },
        { name: 'vendidos', type: 'integer' },
        { name: 'mediaAvaliacoes', type: 'number' },
        { name: 'totalAvaliacoes', type: 'integer' },
        { name: 'garantiaFabricaMeses', type: 'integer' },
        { name: 'garantiaEstendida12Preco', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.', nullable: true },
        { name: 'garantiaEstendida24Preco', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.', nullable: true },
        { name: 'pesoKg', type: 'string', format: 'decimal', nullable: true, description: 'Peso em kg; decimal com precisão preservada.' },
        { name: 'alturaCm', type: 'string', format: 'decimal', nullable: true, description: 'Altura em cm; decimal com precisão preservada.' },
        { name: 'larguraCm', type: 'string', format: 'decimal', nullable: true, description: 'Largura em cm; decimal com precisão preservada.' },
        { name: 'comprimentoCm', type: 'string', format: 'decimal', nullable: true, description: 'Comprimento em cm; decimal com precisão preservada.' },
        { name: 'volumes', type: 'integer', nullable: true },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'variacoes', many: true, resource: () => resolve('variacoes-produto') },
        { name: 'avaliacoes', many: true, resource: () => resolve('avaliacoes') },
        { name: 'destaques', many: true, resource: () => resolve('produtos-destaques') },
        { name: 'freteRegras', many: true, resource: () => resolve('frete-regras') },
      ],
      sorts: ['id', 'updatedAt', 'nome'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      searchFields: ['nome', 'sku', 'slug', 'modelo'],
      filters: {
        produtoId: { type: 'string', field: 'id' },
        categoria: { type: 'string' },
        sku: { type: 'string' },
        slug: { type: 'string' },
        modelo: { type: 'string' },
        ativo: { type: 'boolean' },
        erpProdutoId: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.produto.findMany(args as Prisma.ProdutoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.produto.findFirst(args as Prisma.ProdutoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        erpProdutoId: row.erpProdutoId,
        nome: row.nome,
        slug: row.slug,
        descricao: row.descricao,
        preco: amount(row.preco),
        precoPromocional: amount(row.precoPromocional),
        custoProduto: amount(row.custoProduto),
        imagens: row.imagens,
        estoque: row.estoque,
        categoria: row.categoria,
        modelo: row.modelo,
        ativo: row.ativo,
        createdAt: timestamp(row.createdAt),
        sku: row.sku,
        temVariacoes: row.temVariacoes,
        videoUrl: row.videoUrl,
        especificacoes: row.especificacoes,
        faqs: row.faqs,
        imagensPorVariacao: row.imagensPorVariacao,
        vendidos: row.vendidos,
        mediaAvaliacoes: row.mediaAvaliacoes,
        totalAvaliacoes: row.totalAvaliacoes,
        garantiaFabricaMeses: row.garantiaFabricaMeses,
        garantiaEstendida12Preco: amount(row.garantiaEstendida12Preco),
        garantiaEstendida24Preco: amount(row.garantiaEstendida24Preco),
        pesoKg: decimal(row.pesoKg),
        alturaCm: decimal(row.alturaCm),
        larguraCm: decimal(row.larguraCm),
        comprimentoCm: decimal(row.comprimentoCm),
        volumes: row.volumes,
        updatedAt: timestamp(row.updatedAt),
      }, ctx, ['nome', 'descricao'], ['custoProduto']),
    },
    {
      slug: 'avaliacoes', model: 'Avaliacao', scope: 'read:catalogo',
      scalarFields: ['id', 'produtoId', 'clienteId', 'nomeAutor', 'emailAutor', 'nota', 'titulo', 'comentario', 'aprovada', 'destaque', 'ordem', 'resposta', 'respostaEm', 'createdAt', 'updatedAt'],
      select: { id: true, produtoId: true, clienteId: true, nomeAutor: true, emailAutor: true, nota: true, titulo: true, comentario: true, aprovada: true, destaque: true, ordem: true, resposta: true, respostaEm: true, createdAt: true, updatedAt: true } as const satisfies Prisma.AvaliacaoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'produtoId', type: 'string' },
        { name: 'clienteId', type: 'string', nullable: true },
        { name: 'nomeAutor', type: 'string' },
        { name: 'emailAutor', type: 'string', nullable: true },
        { name: 'nota', type: 'integer' },
        { name: 'titulo', type: 'string', nullable: true },
        { name: 'comentario', type: 'string', nullable: true },
        { name: 'aprovada', type: 'boolean' },
        { name: 'destaque', type: 'boolean' },
        { name: 'ordem', type: 'integer' },
        { name: 'resposta', type: 'string', nullable: true },
        { name: 'respostaEm', type: 'string', format: 'date-time', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'cliente', many: false, resource: () => resolve('clientes') },
        { name: 'produto', many: false, resource: () => resolve('produtos') },
        { name: 'fotos', many: true, resource: () => resolve('avaliacoes-fotos') },
      ],
      sorts: ['id', 'updatedAt', 'ordem'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        produtoId: { type: 'string' },
        clienteId: { type: 'string' },
        nota: { type: 'number', values: ['1', '2', '3', '4', '5'] },
        aprovada: { type: 'boolean' },
        destaque: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.avaliacao.findMany(args as Prisma.AvaliacaoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.avaliacao.findFirst(args as Prisma.AvaliacaoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        produtoId: row.produtoId,
        clienteId: row.clienteId,
        nomeAutor: row.nomeAutor,
        emailAutor: row.emailAutor,
        nota: row.nota,
        titulo: row.titulo,
        comentario: row.comentario,
        aprovada: row.aprovada,
        destaque: row.destaque,
        ordem: row.ordem,
        resposta: row.resposta,
        respostaEm: timestamp(row.respostaEm),
        createdAt: timestamp(row.createdAt),
        updatedAt: timestamp(row.updatedAt),
      }, ctx),
    },
    {
      slug: 'avaliacoes-fotos', model: 'AvaliacaoFoto', scope: 'read:catalogo',
      scalarFields: ['id', 'avaliacaoId', 'url', 'createdAt'],
      select: { id: true, avaliacaoId: true, url: true, createdAt: true } as const satisfies Prisma.AvaliacaoFotoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'avaliacaoId', type: 'string' },
        { name: 'url', type: 'string' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'avaliacao', many: false, resource: () => resolve('avaliacoes') },
      ],
      sorts: ['id', 'createdAt'], defaultSort: 'createdAt',
      dateFields: { created: 'createdAt' },
      filters: {
        avaliacaoId: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.avaliacaoFoto.findMany(args as Prisma.AvaliacaoFotoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.avaliacaoFoto.findFirst(args as Prisma.AvaliacaoFotoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        avaliacaoId: row.avaliacaoId,
        url: row.url,
        createdAt: timestamp(row.createdAt),
      }, ctx),
    },
    {
      slug: 'banners', model: 'Banner', scope: 'read:catalogo',
      scalarFields: ['id', 'imagem', 'imagemTablet', 'imagemMobile', 'titulo', 'subtitulo', 'link', 'ordem', 'ativo', 'tempoCads', 'aspectMobile', 'aspectTablet', 'aspectDesktop', 'maxHeightDesktop', 'createdAt', 'updatedAt'],
      select: { id: true, imagem: true, imagemTablet: true, imagemMobile: true, titulo: true, subtitulo: true, link: true, ordem: true, ativo: true, tempoCads: true, aspectMobile: true, aspectTablet: true, aspectDesktop: true, maxHeightDesktop: true, createdAt: true, updatedAt: true } as const satisfies Prisma.BannerSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'imagem', type: 'string' },
        { name: 'imagemTablet', type: 'string', nullable: true },
        { name: 'imagemMobile', type: 'string', nullable: true },
        { name: 'titulo', type: 'string', nullable: true },
        { name: 'subtitulo', type: 'string', nullable: true },
        { name: 'link', type: 'string', nullable: true },
        { name: 'ordem', type: 'integer' },
        { name: 'ativo', type: 'boolean' },
        { name: 'tempoCads', type: 'integer' },
        { name: 'aspectMobile', type: 'string', nullable: true },
        { name: 'aspectTablet', type: 'string', nullable: true },
        { name: 'aspectDesktop', type: 'string', nullable: true },
        { name: 'maxHeightDesktop', type: 'string', nullable: true },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'updatedAt', 'ordem'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        ativo: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.banner.findMany(args as Prisma.BannerFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.banner.findFirst(args as Prisma.BannerFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        imagem: row.imagem,
        imagemTablet: row.imagemTablet,
        imagemMobile: row.imagemMobile,
        titulo: row.titulo,
        subtitulo: row.subtitulo,
        link: row.link,
        ordem: row.ordem,
        ativo: row.ativo,
        tempoCads: row.tempoCads,
        aspectMobile: row.aspectMobile,
        aspectTablet: row.aspectTablet,
        aspectDesktop: row.aspectDesktop,
        maxHeightDesktop: row.maxHeightDesktop,
        createdAt: timestamp(row.createdAt),
        updatedAt: timestamp(row.updatedAt),
      }, ctx),
    },
    {
      slug: 'configuracoes', model: 'Configuracao', scope: 'read:configuracoes',
      scalarFields: ['id', 'chave', 'valor', 'updatedAt'],
      select: { id: true, chave: true, valor: true, updatedAt: true } as const satisfies Prisma.ConfiguracaoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'chave', type: 'string' },
        { name: 'valor', type: 'string' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { updated: 'updatedAt' },
      filters: {
        chave: { type: 'string', values: SAFE_CONFIGURATION_KEYS },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const where = { AND: [args.where, { chave: { in: [...SAFE_CONFIGURATION_KEYS] } }] }
          return await db.configuracao.findMany({ ...args, where } as Prisma.ConfiguracaoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          const where = { AND: [args.where, { chave: { in: [...SAFE_CONFIGURATION_KEYS] } }] }
          return await db.configuracao.findFirst({ ...args, where } as Prisma.ConfiguracaoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => typeof row.chave === 'string' && safeConfigurationKeys.has(row.chave) ? safeRecord({
        id: row.id,
        chave: row.chave,
        valor: row.valor,
        updatedAt: timestamp(row.updatedAt),
      }, ctx) : {},
    },
    {
      slug: 'formas-pagamento', model: 'FormaPagamento', scope: 'read:catalogo',
      scalarFields: ['id', 'nome', 'iconeUrl', 'ordem', 'ativo', 'createdAt', 'updatedAt'],
      publicFields: ['nome'],
      select: { id: true, nome: true, iconeUrl: true, ordem: true, ativo: true, createdAt: true, updatedAt: true } as const satisfies Prisma.FormaPagamentoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'nome', type: 'string' },
        { name: 'iconeUrl', type: 'string' },
        { name: 'ordem', type: 'integer' },
        { name: 'ativo', type: 'boolean' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'updatedAt', 'nome', 'ordem'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      searchFields: ['nome'],
      filters: {
        ativo: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.formaPagamento.findMany(args as Prisma.FormaPagamentoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.formaPagamento.findFirst(args as Prisma.FormaPagamentoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        nome: row.nome,
        iconeUrl: row.iconeUrl,
        ordem: row.ordem,
        ativo: row.ativo,
        createdAt: timestamp(row.createdAt),
        updatedAt: timestamp(row.updatedAt),
      }, ctx, ['nome']),
    },
    {
      slug: 'produtos-destaques', model: 'ProdutoDestaque', scope: 'read:catalogo',
      scalarFields: ['id', 'produtoId', 'ordem', 'secao', 'createdAt'],
      select: { id: true, produtoId: true, ordem: true, secao: true, createdAt: true } as const satisfies Prisma.ProdutoDestaqueSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'produtoId', type: 'string' },
        { name: 'ordem', type: 'integer' },
        { name: 'secao', type: 'string' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'produto', many: false, resource: () => resolve('produtos') },
      ],
      sorts: ['id', 'createdAt', 'ordem'], defaultSort: 'createdAt',
      dateFields: { created: 'createdAt' },
      filters: {
        produtoId: { type: 'string' },
        secao: { type: 'string' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.produtoDestaque.findMany(args as Prisma.ProdutoDestaqueFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.produtoDestaque.findFirst(args as Prisma.ProdutoDestaqueFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        produtoId: row.produtoId,
        ordem: row.ordem,
        secao: row.secao,
        createdAt: timestamp(row.createdAt),
      }, ctx),
    },
    {
      slug: 'variacoes-produto', model: 'VariacaoProduto', scope: 'read:catalogo',
      scalarFields: ['id', 'produtoId', 'nome', 'sku', 'preco', 'estoque', 'ativo', 'createdAt', 'updatedAt'],
      publicFields: ['nome'],
      select: { id: true, produtoId: true, nome: true, sku: true, preco: true, estoque: true, ativo: true, createdAt: true, updatedAt: true } as const satisfies Prisma.VariacaoProdutoSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'produtoId', type: 'string' },
        { name: 'nome', type: 'string' },
        { name: 'sku', type: 'string' },
        { name: 'preco', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.', nullable: true },
        { name: 'estoque', type: 'integer' },
        { name: 'ativo', type: 'boolean' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'produto', many: false, resource: () => resolve('produtos') },
      ],
      sorts: ['id', 'updatedAt', 'nome'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      searchFields: ['nome', 'sku'],
      filters: {
        produtoId: { type: 'string' },
        sku: { type: 'string' },
        ativo: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.variacaoProduto.findMany(args as Prisma.VariacaoProdutoFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.variacaoProduto.findFirst(args as Prisma.VariacaoProdutoFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        produtoId: row.produtoId,
        nome: row.nome,
        sku: row.sku,
        preco: amount(row.preco),
        estoque: row.estoque,
        ativo: row.ativo,
        createdAt: timestamp(row.createdAt),
        updatedAt: timestamp(row.updatedAt),
      }, ctx, ['nome']),
    },
    {
      slug: 'frete-regras', model: 'FreteRegra', scope: 'read:catalogo',
      scalarFields: ['id', 'produtoId', 'uf', 'precoNormal', 'prazoNormal', 'precoExpresso', 'prazoExpresso', 'prazoNormalMin', 'prazoNormalMax', 'prazoExpressoMin', 'prazoExpressoMax', 'aCombinar', 'bloqueado', 'freteGratis', 'criadoEm', 'atualizadoEm'],
      select: { id: true, produtoId: true, uf: true, precoNormal: true, prazoNormal: true, precoExpresso: true, prazoExpresso: true, prazoNormalMin: true, prazoNormalMax: true, prazoExpressoMin: true, prazoExpressoMax: true, aCombinar: true, bloqueado: true, freteGratis: true, criadoEm: true, atualizadoEm: true } as const satisfies Prisma.FreteRegraSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'produtoId', type: 'string' },
        { name: 'uf', type: 'string' },
        { name: 'precoNormal', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.', nullable: true },
        { name: 'prazoNormal', type: 'integer', nullable: true, description: 'Legado; preferir prazoNormalMin e prazoNormalMax (dias úteis).' },
        { name: 'precoExpresso', type: 'string', format: 'decimal', description: 'Valor monetário em BRL.', nullable: true },
        { name: 'prazoExpresso', type: 'integer', nullable: true, description: 'Legado; preferir prazoExpressoMin e prazoExpressoMax (dias úteis).' },
        { name: 'prazoNormalMin', type: 'integer', nullable: true },
        { name: 'prazoNormalMax', type: 'integer', nullable: true },
        { name: 'prazoExpressoMin', type: 'integer', nullable: true },
        { name: 'prazoExpressoMax', type: 'integer', nullable: true },
        { name: 'aCombinar', type: 'boolean', description: 'Solicita orçamento; não permite finalizar compra automaticamente.' },
        { name: 'bloqueado', type: 'boolean', description: 'Não entrega nesta UF.' },
        { name: 'freteGratis', type: 'boolean', description: 'Entrega grátis; somente o prazo normal é utilizado.' },
        { name: 'criadoEm', type: 'string', format: 'date-time' },
        { name: 'atualizadoEm', type: 'string', format: 'date-time' },
      ],
      expands: [
        { name: 'produto', many: false, resource: () => resolve('produtos') },
      ],
      sorts: ['id', 'atualizadoEm'], defaultSort: 'atualizadoEm',
      dateFields: { created: 'criadoEm', updated: 'atualizadoEm' },
      filters: {
        uf: { type: 'string' },
        produtoId: { type: 'string' },
        bloqueado: { type: 'boolean' },
        aCombinar: { type: 'boolean' },
        freteGratis: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.freteRegra.findMany(args as Prisma.FreteRegraFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.freteRegra.findFirst(args as Prisma.FreteRegraFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        produtoId: row.produtoId,
        uf: row.uf,
        precoNormal: amount(row.precoNormal),
        prazoNormal: row.prazoNormal,
        precoExpresso: amount(row.precoExpresso),
        prazoExpresso: row.prazoExpresso,
        prazoNormalMin: row.prazoNormalMin,
        prazoNormalMax: row.prazoNormalMax,
        prazoExpressoMin: row.prazoExpressoMin,
        prazoExpressoMax: row.prazoExpressoMax,
        aCombinar: row.aCombinar,
        bloqueado: row.bloqueado,
        freteGratis: row.freteGratis,
        criadoEm: timestamp(row.criadoEm),
        atualizadoEm: timestamp(row.atualizadoEm),
      }, ctx),
    },
    {
      slug: 'email-templates', model: 'EmailTemplate', scope: 'read:configuracoes',
      scalarFields: ['id', 'tipo', 'ativo', 'assunto', 'corpo', 'prazo', 'unidadePrazo', 'updatedAt'],
      select: { id: true, tipo: true, ativo: true, assunto: true, corpo: true, prazo: true, unidadePrazo: true, updatedAt: true } as const satisfies Prisma.EmailTemplateSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'tipo', type: 'string' },
        { name: 'ativo', type: 'boolean' },
        { name: 'assunto', type: 'string' },
        { name: 'corpo', type: 'string' },
        { name: 'prazo', type: 'integer' },
        { name: 'unidadePrazo', type: 'string' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { updated: 'updatedAt' },
      filters: {
        tipo: { type: 'string' },
        ativo: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.emailTemplate.findMany(args as Prisma.EmailTemplateFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.emailTemplate.findFirst(args as Prisma.EmailTemplateFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        tipo: row.tipo,
        ativo: row.ativo,
        assunto: row.assunto,
        corpo: row.corpo,
        prazo: row.prazo,
        unidadePrazo: row.unidadePrazo,
        updatedAt: timestamp(row.updatedAt),
      }, ctx),
    },
    {
      slug: 'avaliacoes-parceiros', model: 'AvaliacaoParceiro', scope: 'read:catalogo',
      scalarFields: ['id', 'nomeCompleto', 'empresa', 'cargo', 'cidade', 'nota', 'titulo', 'comentario', 'avatarInicial', 'corAvatar', 'aprovada', 'destaque', 'ordem', 'createdAt', 'updatedAt'],
      select: { id: true, nomeCompleto: true, empresa: true, cargo: true, cidade: true, nota: true, titulo: true, comentario: true, avatarInicial: true, corAvatar: true, aprovada: true, destaque: true, ordem: true, createdAt: true, updatedAt: true } as const satisfies Prisma.AvaliacaoParceiroSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'nomeCompleto', type: 'string' },
        { name: 'empresa', type: 'string', nullable: true },
        { name: 'cargo', type: 'string', nullable: true },
        { name: 'cidade', type: 'string', nullable: true },
        { name: 'nota', type: 'integer' },
        { name: 'titulo', type: 'string' },
        { name: 'comentario', type: 'string' },
        { name: 'avatarInicial', type: 'string', nullable: true },
        { name: 'corAvatar', type: 'string' },
        { name: 'aprovada', type: 'boolean' },
        { name: 'destaque', type: 'boolean' },
        { name: 'ordem', type: 'integer' },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'updatedAt', 'ordem'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        nota: { type: 'number', values: ['1', '2', '3', '4', '5'] },
        aprovada: { type: 'boolean' },
        destaque: { type: 'boolean' },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.avaliacaoParceiro.findMany(args as Prisma.AvaliacaoParceiroFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.avaliacaoParceiro.findFirst(args as Prisma.AvaliacaoParceiroFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        nomeCompleto: row.nomeCompleto,
        empresa: row.empresa,
        cargo: row.cargo,
        cidade: row.cidade,
        nota: row.nota,
        titulo: row.titulo,
        comentario: row.comentario,
        avatarInicial: row.avatarInicial,
        corAvatar: row.corAvatar,
        aprovada: row.aprovada,
        destaque: row.destaque,
        ordem: row.ordem,
        createdAt: timestamp(row.createdAt),
        updatedAt: timestamp(row.updatedAt),
      }, ctx, [], [], ['empresa', 'cargo', 'cidade', 'avatarInicial']),
    },
    {
      slug: 'popup-inicial', model: 'PopupInicial', scope: 'read:catalogo',
      scalarFields: ['id', 'ativado', 'bannerDesktop', 'bannerTablet', 'bannerMobile', 'altText', 'linkDestino', 'abrirNovaAba', 'titulo', 'texto', 'corBotao', 'textoBotao', 'delaySegundos', 'frequencia', 'paginas', 'createdAt', 'updatedAt'],
      select: { id: true, ativado: true, bannerDesktop: true, bannerTablet: true, bannerMobile: true, altText: true, linkDestino: true, abrirNovaAba: true, titulo: true, texto: true, corBotao: true, textoBotao: true, delaySegundos: true, frequencia: true, paginas: true, createdAt: true, updatedAt: true } as const satisfies Prisma.PopupInicialSelect,
      fields: [
        { name: 'id', type: 'string' },
        { name: 'ativado', type: 'boolean' },
        { name: 'bannerDesktop', type: 'string', nullable: true },
        { name: 'bannerTablet', type: 'string', nullable: true },
        { name: 'bannerMobile', type: 'string', nullable: true },
        { name: 'altText', type: 'string', nullable: true },
        { name: 'linkDestino', type: 'string', nullable: true },
        { name: 'abrirNovaAba', type: 'boolean' },
        { name: 'titulo', type: 'string', nullable: true },
        { name: 'texto', type: 'string', nullable: true },
        { name: 'corBotao', type: 'string', nullable: true },
        { name: 'textoBotao', type: 'string', nullable: true },
        { name: 'delaySegundos', type: 'integer' },
        { name: 'frequencia', type: 'string', enum: ['sessao', 'dia', 'semana'] },
        { name: 'paginas', type: 'array', nullable: true, items: { type: 'string' } },
        { name: 'createdAt', type: 'string', format: 'date-time' },
        { name: 'updatedAt', type: 'string', format: 'date-time' },
      ],
      expands: [
      ],
      sorts: ['id', 'updatedAt'], defaultSort: 'updatedAt',
      dateFields: { created: 'createdAt', updated: 'updatedAt' },
      filters: {
        ativado: { type: 'boolean' },
        frequencia: { type: 'string', values: ['sessao', 'dia', 'semana'] },
      },
      adapter: {
        findMany: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.popupInicial.findMany(args as Prisma.PopupInicialFindManyArgs) as unknown as ResourceRow[]
        },
        findFirst: async args => {
          const db = deps.prisma ?? (await import('../../prisma')).prisma
          return await db.popupInicial.findFirst(args as Prisma.PopupInicialFindFirstArgs) as unknown as ResourceRow | null
        },
      },
      serialize: (row, ctx) => safeRecord({
        id: row.id,
        ativado: row.ativado,
        bannerDesktop: row.bannerDesktop,
        bannerTablet: row.bannerTablet,
        bannerMobile: row.bannerMobile,
        altText: row.altText,
        linkDestino: row.linkDestino,
        abrirNovaAba: row.abrirNovaAba,
        titulo: row.titulo,
        texto: row.texto,
        corBotao: row.corBotao,
        textoBotao: row.textoBotao,
        delaySegundos: row.delaySegundos,
        frequencia: row.frequencia,
        paginas: row.paginas,
        createdAt: timestamp(row.createdAt),
        updatedAt: timestamp(row.updatedAt),
      }, ctx),
    },
  ]
  return definitions
}
