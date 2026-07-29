// ─── SIXXIS · Cliente da Focus NFe (emissão de NF-e) ─────────────────────────
//
// Emissão MANUAL, acionada pelo admin depois do pagamento aprovado. Regime
// Simples Nacional, série 2, envio síncrono ligado na Focus (a resposta do POST
// já costuma vir "autorizado" ou "erro_autorizacao"; "processando_autorizacao"
// existe e é resolvido pelo GET).
//
// AMBIENTE — três envs, uma chave só:
//   FOCUS_NFE_AMBIENTE        homologacao (default) | producao
//   FOCUS_NFE_TOKEN_HOMOLOGACAO
//   FOCUS_NFE_TOKEN_PRODUCAO
// `FOCUS_NFE_AMBIENTE` decide AO MESMO TEMPO a baseURL e QUAL token é usado —
// não há caminho que misture os dois, nem env que ignore o ambiente. O token é
// SERVER-ONLY: nada aqui é importável do client (nenhum NEXT_PUBLIC_).
//
// Nada nesta camada lança para a UI: toda falha vira { status: 'erro', erro }.

import axios, { AxiosError } from 'axios'
import type { Prisma } from '@prisma/client'
import { regrasFiscais } from '@/lib/nfe-regras'

// ─── Ambiente ────────────────────────────────────────────────────────────────

export type AmbienteNfe = 'homologacao' | 'producao'

/** Ambiente ativo. Qualquer valor que não seja exatamente 'producao' → homologação. */
export function ambienteNfe(): AmbienteNfe {
  return process.env.FOCUS_NFE_AMBIENTE?.trim().toLowerCase() === 'producao'
    ? 'producao'
    : 'homologacao'
}

export function isHomologacao(): boolean {
  return ambienteNfe() === 'homologacao'
}

function baseUrl(): string {
  return ambienteNfe() === 'producao'
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br'
}

function token(): string {
  const t =
    ambienteNfe() === 'producao'
      ? process.env.FOCUS_NFE_TOKEN_PRODUCAO
      : process.env.FOCUS_NFE_TOKEN_HOMOLOGACAO
  return t?.trim() ?? ''
}

/** CNPJ do emitente (Sixxis) — só dígitos. */
const CNPJ_EMITENTE = '54978947000109'

/**
 * Nome do destinatário EXIGIDO pela SEFAZ em ambiente de teste. Em homologação
 * ele SUBSTITUI o nome real do cliente, sempre — é o que impede uma nota de
 * teste de parecer real.
 */
const NOME_DESTINATARIO_HOMOLOGACAO =
  'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'

/** Emissão síncrona pode demorar (SEFAZ). 30s antes de desistir. */
const TIMEOUT_MS = 30_000

function http() {
  return axios.create({
    baseURL: baseUrl(),
    timeout: TIMEOUT_MS,
    // HTTP Basic: usuário = token, senha vazia.
    auth: { username: token(), password: '' },
    // 4xx da Focus carrega o motivo da rejeição no corpo — queremos ler, não
    // deixar o axios transformar em exceção sem contexto.
    validateStatus: () => true,
  })
}

// ─── Dados do pedido necessários para a nota ─────────────────────────────────

export const SELECT_PEDIDO_NFE = {
  id: true,
  status: true,
  total: true,
  frete: true,
  desconto: true,
  cashbackUsado: true,
  formaPagamento: true,
  nfeRef: true,
  nfeChave: true,
  nfeStatus: true,
  nfeNumero: true,
  nfeSerie: true,
  nfeDanfeUrl: true,
  nfeXmlUrl: true,
  cliente: {
    select: {
      nome: true, cpf: true, cnpj: true, razaoSocial: true,
      inscricaoEstadual: true, indicadorIE: true,
    },
  },
  endereco: {
    select: {
      cep: true, logradouro: true, numero: true, complemento: true,
      bairro: true, cidade: true, estado: true,
    },
  },
  itens: {
    select: {
      quantidade: true,
      precoUnitario: true,
      variacaoId: true,
      variacaoNome: true,
      produto: {
        select: {
          nome: true, slug: true, sku: true, categoria: true,
          variacoes: { select: { id: true, sku: true } },
        },
      },
    },
  },
  pagamentos: {
    select: { metodo: true, valor: true, mpStatus: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.PedidoSelect

export type PedidoParaNfe = Prisma.PedidoGetPayload<{ select: typeof SELECT_PEDIDO_NFE }>

// ─── Resultado normalizado (o que a rota grava no Pedido) ────────────────────

export type StatusNfe = 'autorizado' | 'processando' | 'erro' | 'cancelado'

export interface ResultadoNfe {
  status: StatusNfe
  chave: string | null
  numero: number | null
  serie: number | null
  danfeUrl: string | null
  xmlUrl: string | null
  /** Mensagem legível de rejeição/falha. null quando autorizado. */
  erro: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const soDigitos = (v: string | null | undefined) => (v ?? '').replace(/\D/g, '')
const cent = (n: number) => Math.round(n * 100) / 100

/**
 * "YYYY-MM-DDTHH:mm:ss-03:00" — instante atual escrito no fuso de São Paulo.
 * O offset é CALCULADO (não hardcoded): o Brasil não tem mais horário de verão,
 * mas se voltar a ter, a data de emissão continua correta sozinha.
 */
function isoSaoPaulo(d: Date): string {
  // 'sv-SE' formata como "2026-07-29 14:03:22" — o formato mais próximo do ISO.
  const local = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(d).replace(' ', 'T')

  // Lendo a hora-parede como se fosse UTC, a diferença para o instante real é
  // exatamente o offset do fuso.
  const offsetMin = Math.round((Date.parse(`${local}Z`) - d.getTime()) / 60_000)
  const sinal = offsetMin < 0 ? '-' : '+'
  const abs = Math.abs(offsetMin)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${local}${sinal}${hh}:${mm}`
}

/** Pagamento aprovado (o que de fato foi cobrado); senão o mais recente. */
function pagamentoRelevante(pedido: PedidoParaNfe) {
  return pedido.pagamentos.find((p) => p.mpStatus === 'approved') ?? pedido.pagamentos[0] ?? null
}

/** Método do pedido → código da tabela `tPag` da NF-e. */
function formaPagamentoNfe(metodo: string | null | undefined): string {
  switch ((metodo ?? '').toLowerCase()) {
    case 'pix':                                return '17'
    case 'cartao': case 'credito': case 'credit_card': return '03'
    case 'debito': case 'debit_card':          return '04'
    case 'boleto': case 'bolbank': case 'ticket': return '15'
    default:                                   return '99' // outros
  }
}

// ─── Montagem do payload (Focus NFe v2) ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Payload = Record<string, any>

/**
 * Payload completo da NF-e a partir do pedido. FONTE ÚNICA — a rota não monta
 * nada, só chama.
 *
 * Fechamento dos valores (a SEFAZ rejeita se vNF ≠ vProd − vDesc + vFrete):
 * o desconto é apurado como RESÍDUO entre (produtos + frete) e o que o cliente
 * REALMENTE pagou. Por construção esse resíduo é a soma de cupom + desconto PIX
 * + cashback resgatado — o desconto do PIX não é campo persistido (está embutido
 * no valor cobrado, ver src/lib/preco-pix.ts), e usar o resíduo evita que um
 * arredondamento de centavo derrube a nota.
 */
export function montarPayloadNfe(pedido: PedidoParaNfe): Payload {
  const uf = (pedido.endereco?.estado ?? '').trim().toUpperCase()
  const cliente = pedido.cliente
  const indicadorIE = cliente.indicadorIE ?? 9
  const ehPJ = !!soDigitos(cliente.cnpj)

  // ── Destinatário ───────────────────────────────────────────────────────────
  const nomeReal = (ehPJ ? cliente.razaoSocial?.trim() : null) || cliente.nome?.trim() || 'CONSUMIDOR'
  const nomeDestinatario = isHomologacao() ? NOME_DESTINATARIO_HOMOLOGACAO : nomeReal

  const cnpjDest = soDigitos(cliente.cnpj)
  const cpfDest = soDigitos(cliente.cpf)
  // Mutuamente exclusivos — nunca os dois no mesmo payload.
  const documento = cnpjDest ? { cnpj_destinatario: cnpjDest } : cpfDest ? { cpf_destinatario: cpfDest } : {}

  const ie = soDigitos(cliente.inscricaoEstadual)

  // ── Valores ────────────────────────────────────────────────────────────────
  const itens = pedido.itens
  const brutoDe = (i: PedidoParaNfe['itens'][number]) => cent(Number(i.precoUnitario) * i.quantidade)
  const valorProdutos = cent(itens.reduce((s, i) => s + brutoDe(i), 0))

  const freteCobrado = cent(Number(pedido.frete ?? 0))
  const valorFrete = freteCobrado > 0 ? freteCobrado : 0

  const pg = pagamentoRelevante(pedido)
  // Pagamento.valor é INT em centavos. Sem pagamento registrado, cai no total.
  const valorCobrado = pg ? cent(pg.valor / 100) : cent(Number(pedido.total ?? 0))

  const descontoTotal = Math.max(0, cent(valorProdutos + valorFrete - valorCobrado))
  const valorTotalNota = cent(valorProdutos + valorFrete - descontoTotal)

  // ── Itens ──────────────────────────────────────────────────────────────────
  // Desconto rateado proporcionalmente ao valor bruto; a sobra de centavos vai
  // no último item para que a soma bata EXATAMENTE com o desconto do cabeçalho.
  let descontoDistribuido = 0

  const items = itens.map((item, idx) => {
    const p = item.produto
    const regras = regrasFiscais({ categoria: p.categoria, ufDestino: uf, indicadorIE })

    const bruto = brutoDe(item)
    const ultimo = idx === itens.length - 1
    const descontoItem = ultimo
      ? cent(descontoTotal - descontoDistribuido)
      : cent(valorProdutos > 0 ? (descontoTotal * bruto) / valorProdutos : 0)
    descontoDistribuido = cent(descontoDistribuido + descontoItem)

    // Código do produto: SKU da variação quando o item foi vendido em variação;
    // senão o SKU do produto; o slug é o último recurso (cProd é obrigatório).
    const skuVariacao = item.variacaoId
      ? p.variacoes.find((v) => v.id === item.variacaoId)?.sku?.trim()
      : null
    const codigoProduto = skuVariacao || p.sku?.trim() || p.slug

    const descricao = item.variacaoNome ? `${p.nome} (${item.variacaoNome})` : p.nome

    return {
      numero_item: idx + 1,
      codigo_produto: codigoProduto,
      descricao,
      codigo_ncm: regras.ncm,
      cfop: regras.cfop,
      ...(regras.cest ? { cest: regras.cest } : {}),
      unidade_comercial: 'un',
      quantidade_comercial: item.quantidade,
      valor_unitario_comercial: cent(Number(item.precoUnitario)),
      valor_bruto: bruto,
      ...(descontoItem > 0 ? { valor_desconto: descontoItem } : {}),
      unidade_tributavel: 'un',
      quantidade_tributavel: item.quantidade,
      valor_unitario_tributavel: cent(Number(item.precoUnitario)),
      inclui_no_total: 1,

      icms_origem: regras.origem,
      icms_situacao_tributaria: regras.csosn,
      // TODO-FISCAL: CSOSN 500 (climatizadores) pode exigir da SEFAZ os valores
      // de ST já retida na entrada (vBCSTRet / vICMSSTRet), que só a NF do
      // fornecedor tem. Não são enviados hoje — se a homologação rejeitar por
      // isso, os valores vêm da contadora. Ver src/lib/nfe-regras.ts.

      // Simples Nacional: PIS/COFINS em "outras operações", zerados. É o
      // tratamento padrão do CRT=1 — o imposto já está no DAS.
      pis_situacao_tributaria: '49',
      pis_valor_base_calculo: 0,
      pis_aliquota_porcentual: 0,
      pis_valor: 0,
      cofins_situacao_tributaria: '49',
      cofins_valor_base_calculo: 0,
      cofins_aliquota_porcentual: 0,
      cofins_valor: 0,
    }
  })

  // ── Informações adicionais ────────────────────────────────────────────────
  // A menção ao Simples Nacional é OBRIGATÓRIA (LC 123/2006, art. 26 §1º).
  let infoAdicional = 'DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL'
  if (ehPJ) infoAdicional += ' MERCADORIA DESTINADA A CONSUMO FINAL'

  return {
    natureza_operacao: 'VENDA AO CONSUMIDOR',
    data_emissao: isoSaoPaulo(new Date()),
    tipo_documento: 1,        // 1 = saída
    finalidade_emissao: 1,    // 1 = NF-e normal
    presenca_comprador: 2,    // 2 = operação não presencial, pela internet
    // 0 = frete por conta do emitente (a loja contrata); 9 = sem ocorrência de
    // transporte (frete grátis não é "sem frete" fisicamente, mas é o que a
    // nota declara quando não há valor de frete cobrado do destinatário).
    modalidade_frete: valorFrete > 0 ? 0 : 9,
    local_destino: uf === 'SP' ? 1 : 2, // 1 = interna, 2 = interestadual

    cnpj_emitente: CNPJ_EMITENTE,

    nome_destinatario: nomeDestinatario,
    ...documento,
    indicador_inscricao_estadual_destinatario: String(indicadorIE),
    // IE só faz sentido (e só é aceita) quando o destinatário é contribuinte.
    ...(indicadorIE === 1 && ie ? { inscricao_estadual_destinatario: ie } : {}),
    logradouro_destinatario: pedido.endereco?.logradouro ?? '',
    numero_destinatario: pedido.endereco?.numero ?? 'S/N',
    ...(pedido.endereco?.complemento?.trim()
      ? { complemento_destinatario: pedido.endereco.complemento.trim() }
      : {}),
    bairro_destinatario: pedido.endereco?.bairro ?? '',
    municipio_destinatario: pedido.endereco?.cidade ?? '',
    uf_destinatario: uf,
    cep_destinatario: soDigitos(pedido.endereco?.cep),

    valor_frete: valorFrete,
    valor_desconto: descontoTotal,

    informacoes_adicionais_contribuinte: infoAdicional,

    items,

    formas_pagamento: [
      {
        forma_pagamento: formaPagamentoNfe(pg?.metodo ?? pedido.formaPagamento),
        // Casa com vNF por construção (ver comentário do fechamento acima).
        valor_pagamento: valorTotalNota,
      },
    ],
  }
}

// ─── Normalização da resposta da Focus ───────────────────────────────────────

function mapStatus(bruto: string | null | undefined): StatusNfe {
  switch ((bruto ?? '').toLowerCase()) {
    case 'autorizado':              return 'autorizado'
    case 'cancelado':               return 'cancelado'
    case 'processando_autorizacao': return 'processando'
    default:                        return 'erro'
  }
}

/** Caminho relativo devolvido pela Focus → URL absoluta do ambiente ativo. */
function urlAbsoluta(caminho: string | null | undefined): string | null {
  const c = caminho?.trim()
  if (!c) return null
  return /^https?:\/\//i.test(c) ? c : `${baseUrl()}${c.startsWith('/') ? '' : '/'}${c}`
}

/** Junta o que a Focus/SEFAZ devolveu numa frase única e legível para o admin. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mensagemErro(d: any): string {
  if (!d) return 'A Focus NFe não respondeu.'
  const partes: string[] = []
  if (d.status_sefaz) partes.push(`SEFAZ ${d.status_sefaz}`)
  const texto =
    d.mensagem_sefaz ||
    d.mensagem ||
    (Array.isArray(d.erros)
      ? d.erros.map((e: { campo?: string; mensagem?: string }) =>
          [e.campo, e.mensagem].filter(Boolean).join(': ')).join(' · ')
      : null) ||
    d.codigo ||
    'Falha desconhecida na emissão.'
  partes.push(String(texto))
  return partes.join(' — ')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizar(d: any): ResultadoNfe {
  const status = mapStatus(d?.status)
  const numero = Number(d?.numero)
  const serie = Number(d?.serie)
  return {
    status,
    // A chave às vezes vem prefixada ("NFe3517…") — guardamos só os 44 dígitos.
    chave: soDigitos(d?.chave_nfe) || null,
    numero: Number.isFinite(numero) && numero > 0 ? numero : null,
    serie: Number.isFinite(serie) && serie > 0 ? serie : null,
    danfeUrl: urlAbsoluta(d?.caminho_danfe),
    xmlUrl: urlAbsoluta(d?.caminho_xml_nota_fiscal),
    erro: status === 'autorizado' || status === 'processando' ? null : mensagemErro(d),
  }
}

function falha(msg: string): ResultadoNfe {
  return { status: 'erro', chave: null, numero: null, serie: null, danfeUrl: null, xmlUrl: null, erro: msg }
}

// ─── API pública ─────────────────────────────────────────────────────────────

/** Consulta o estado de uma nota já enviada (usado quando fica "processando"). */
export async function consultarNfe(ref: string): Promise<ResultadoNfe> {
  if (!token()) return falha(`Token da Focus NFe ausente para o ambiente "${ambienteNfe()}".`)
  try {
    const res = await http().get(`/v2/nfe/${encodeURIComponent(ref)}`)
    if (res.status >= 500) return falha(`Focus NFe indisponível (HTTP ${res.status}).`)
    return normalizar(res.data)
  } catch (e) {
    const err = e as AxiosError
    return falha(
      err.code === 'ECONNABORTED'
        ? 'Tempo esgotado ao consultar a Focus NFe. A nota pode ter sido emitida — consulte de novo.'
        : `Falha de comunicação com a Focus NFe: ${err.message}`,
    )
  }
}

/**
 * Emite a NF-e do pedido. `ref` = Pedido.id (a Focus deduplica por ela).
 * NUNCA lança: qualquer problema volta como { status: 'erro', erro }.
 */
export async function emitirNfe(pedido: PedidoParaNfe): Promise<ResultadoNfe> {
  if (!token()) return falha(`Token da Focus NFe ausente para o ambiente "${ambienteNfe()}".`)

  let payload: Payload
  try {
    payload = montarPayloadNfe(pedido)
  } catch (e) {
    // Categoria sem regra fiscal, endereço faltando… erro nosso, não da SEFAZ.
    return falha((e as Error).message)
  }

  const ref = pedido.id
  try {
    const res = await http().post(`/v2/nfe?ref=${encodeURIComponent(ref)}`, payload)

    if (res.status >= 500) return falha(`Focus NFe indisponível (HTTP ${res.status}).`)

    // Referência já usada: a nota existe do lado deles. Em vez de devolver um
    // erro inútil, buscamos o estado real dela.
    const codigo = String(res.data?.codigo ?? '').toLowerCase()
    if (res.status === 422 && (codigo.includes('duplicad') || codigo.includes('já existe'))) {
      return consultarNfe(ref)
    }

    return normalizar(res.data)
  } catch (e) {
    const err = e as AxiosError
    if (err.code === 'ECONNABORTED') {
      // Timeout no POST não significa que a SEFAZ não autorizou — pergunta.
      return consultarNfe(ref)
    }
    return falha(`Falha de comunicação com a Focus NFe: ${err.message}`)
  }
}
