// ─── Resolver de frete — FONTE ÚNICA DE VERDADE ──────────────────────────────
// Substitui as 4 tabelas divergentes que existiam (lib/frete TABELA, api/frete/cep
// PRAZOS, api/luna/frete REGIOES e o fallback inline do carrinho).
//
// Cadeia de resolução (produto × UF) — o registry de carriers é o MOTOR DE PREÇO:
//   1. Flags de negócio da FreteRegra (avaliadas PRIMEIRO):
//        a. bloqueado = true  → 'bloqueado' (não vende). NÃO cota carrier. FIM.
//        b. freteGratis = true → cliente vê "Frete Grátis" (preço 0). Em paralelo,
//           cota os carriers só para gravar o custoFreteReal do pedido — a MAIS
//           BARATA vence, igual ao caminho normal. Se falhar, custoFreteReal fica
//           null (frete grátis NUNCA quebra a venda).
//   2. Caso normal (sem bloqueio, sem grátis):
//        a. Cota TODAS as transportadoras ATIVAS (registry: Braspress, Melhor
//           Envio) e escolhe a MAIS BARATA (empate → menor prazo).
//        b. Veio cotação → usa ela. Preço = CUSTO PURO (sem markup). custoFreteReal =
//           mesmo valor. Cliente vê "Entrega" + prazo + preço, nunca a transportadora.
//        c. Nenhum carrier retornou → FALLBACK para a tabela manual FreteRegra.
//        d. Sem carrier E sem regra manual → 'a_combinar'.
//
// TRAVAS: qualquer exceção de carrier é capturada e cai no fallback — o checkout
// nunca fica sem resposta. Com TODAS as flags de carrier OFF → cadeia 100% tabela
// manual, byte-idêntica ao histórico ("sem regra" = bloqueado).
//
// Carrinho com múltiplos produtos (frete é por produto):
//   - QUALQUER item bloqueado    → pedido bloqueado
//   - Precisa cotar/orçar        → o carrinho inteiro vira uma cotação única
//     (Braspress cota o embarque todo) ou "a combinar".
//   - Senão → soma os fretes por modalidade (Normal soma com Normal, Expresso com
//     Expresso); o prazo do pedido é o MAIOR prazo entre os itens.

import { prisma } from '@/lib/prisma'
import { normalizarUF, type UF } from '@/lib/ufs'
import { cotarComCarriers, algumCarrierHabilitado, type ItemCotacao } from '@/lib/carriers'
import { calcularFreteCarrinho, type ItemFretePolitica } from '@/lib/frete-politica'

export type StatusFrete = 'ok' | 'a_combinar' | 'bloqueado'

export interface OpcaoFreteResolvida {
  id: 'normal' | 'expresso'
  nome: string
  preco: number
  prazoDiasMin: number
  prazoDiasMax: number
  prazo: string // string formatada p/ exibição
  freteGratis: boolean // true → preço 0 por "frete grátis" (não por falta de preço)
}

export interface ResultadoFrete {
  status: StatusFrete
  uf: UF | null
  opcoes: OpcaoFreteResolvida[]
  mensagem: string
  freteGratis: boolean // a opção resolvida é frete grátis (valor 0)
  // Custo REAL da transportadora (carrier), para registro interno no pedido —
  // gravado inclusive em frete grátis (o cliente pagou 0, mas a empresa gastou).
  // null quando não houve cotação de carrier (fallback manual / a combinar).
  custoFreteReal?: number | null
  // Nome interno da transportadora que cotou (SÓ admin, nunca vai ao cliente).
  transportadora?: string | null
}

export interface ItemFrete {
  produtoId: string
  quantidade: number
}

export interface ResolverFreteOpts {
  // CEP de destino (só dígitos) — necessário para a cotação em tempo real
  // (Braspress). Sem ele, a cadeia usa só a tabela manual + "a combinar".
  cepDestino?: string
  // CPF/CNPJ do destinatário (só dígitos), quando conhecido.
  documentoDestinatario?: string
}

export function formatarPrazo(min?: number | null, max?: number | null): string {
  const lo = min && min > 0 ? min : 0
  const hi = max && max > 0 ? max : 0
  if (!hi) return 'a combinar'
  if (!lo || lo === hi) return hi === 1 ? '1 dia útil' : `${hi} dias úteis`
  return `${lo} a ${hi} dias úteis`   // ex.: "1 a 3 dias úteis"
}

// Consulta ViaCEP no servidor p/ descobrir a UF a partir do CEP.
export async function cepParaUF(cep: string): Promise<UF | null> {
  const limpo = String(cep ?? '').replace(/\D/g, '')
  if (limpo.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86_400 }, // CEP→UF muda raríssimo: cache 24h
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.erro) return null
    return normalizarUF(data.uf)
  } catch {
    return null
  }
}

export async function resolverFrete(
  itens: ItemFrete[],
  ufInput: string,
  opts: ResolverFreteOpts = {},
): Promise<ResultadoFrete> {
  // ── Política REGIONAL (regra de negócio vigente) ───────────────────────────
  // Preço ao cliente = regra regional (lib/frete-politica): grátis nas UFs de
  // UFS_FRETE_GRATIS; 9% do valor do produto nas demais; aspirador isento. É a
  // FONTE ÚNICA do preço cobrado — substitui a tabela manual FreteRegra, que
  // deixou de dirigir preço. Os carriers (quando ligados) registram só o CUSTO
  // interno (custoFreteReal), nunca o preço ao cliente.
  const uf = normalizarUF(ufInput)
  if (!uf) {
    return { status: 'bloqueado', uf: null, opcoes: [], mensagem: 'UF inválida.', freteGratis: false }
  }

  const itensValidos = itens.filter((i) => i.produtoId && i.quantidade > 0)
  if (itensValidos.length === 0) {
    return { status: 'bloqueado', uf, opcoes: [], mensagem: 'Carrinho vazio.', freteGratis: false }
  }

  const produtoIds = [...new Set(itensValidos.map((i) => i.produtoId))]

  // Quantidade por produto — frete é por UNIDADE. Piso 1 por item.
  const qtdPorProduto = new Map<string, number>()
  for (const item of itensValidos) {
    const q = Math.max(1, Math.floor(Number(item.quantidade)) || 0)
    qtdPorProduto.set(item.produtoId, (qtdPorProduto.get(item.produtoId) ?? 0) + q)
  }

  // Preço efetivo (promocional quando houver) + categoria por produto. O 9%
  // incide sobre o que o cliente realmente paga; a categoria define a isenção
  // de aspirador.
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
    select: { id: true, preco: true, precoPromocional: true },
  })
  const porId = new Map(produtos.map((p) => [p.id, p]))

  const itensPolitica: ItemFretePolitica[] = produtoIds.map((id) => {
    const p = porId.get(id)
    return {
      precoEfetivo: p ? Number(p.precoPromocional ?? p.preco) : 0,
      quantidade: qtdPorProduto.get(id) ?? 1,
    }
  })

  const r = calcularFreteCarrinho(uf, itensPolitica)

  // Custo REAL da transportadora (interno, só admin) — gravado inclusive em
  // frete grátis/9%. Só cota quando um carrier está ligado E há CEP de destino.
  // NUNCA afeta o preço ao cliente e NUNCA quebra a venda (cotarCarrinho captura
  // qualquer falha e devolve null).
  const cepDestino = String(opts.cepDestino ?? '').replace(/\D/g, '')
  let custoFreteReal: number | null = null
  let transportadora: string | null = null
  if (algumCarrierHabilitado() && cepDestino.length === 8) {
    const cr = await cotarCarrinho(produtoIds, qtdPorProduto, cepDestino, opts.documentoDestinatario)
    if (cr) {
      custoFreteReal = cr.custoFreteReal
      transportadora = cr.transportadora
    }
  }

  const prazo = r.prazoDiasMax > 0 ? formatarPrazo(r.prazoDiasMin, r.prazoDiasMax) : ''

  return {
    status: 'ok',
    uf,
    opcoes: [
      {
        id: 'normal',
        nome: r.freteGratis ? 'Frete Grátis' : 'Entrega',
        preco: r.preco,
        prazoDiasMin: r.prazoDiasMin,
        prazoDiasMax: r.prazoDiasMax,
        prazo,
        freteGratis: r.freteGratis,
      },
    ],
    mensagem: '',
    freteGratis: r.freteGratis,
    custoFreteReal,
    transportadora,
  }
}

// Resultado da cotação de carrier para o carrinho inteiro.
interface CarrierResolucao {
  opcao: OpcaoFreteResolvida // opção genérica "Entrega" mostrada ao cliente
  custoFreteReal: number // custo real da transportadora (= preço, sem markup)
  transportadora: string // nome interno do serviço (só admin)
}

// Resultado de resolver as dimensões dos produtos do carrinho para cotação.
export interface ItensCotacaoProdutos {
  itens: ItemCotacao[] // itens prontos para o carrier (só os com dimensões completas)
  valorMercadoria: number // soma preço × quantidade (promocional quando houver)
  semDimensoes: string[] // produtoIds encontrados mas SEM peso/dimensões completas
  naoEncontrados: string[] // produtoIds pedidos que não existem no banco
}

// FONTE ÚNICA de resolução produto → ItemCotacao (peso/dimensões + valor da
// mercadoria). Reusada pelo checkout (cotarCarrinho, que aborta se faltar
// dimensão) e pela API interna do CRM (que reporta o que faltou). NÃO chama
// carrier — só monta os itens a partir do banco.
export async function montarItensCotacaoProdutos(
  produtoIds: string[],
  qtdPorProduto: Map<string, number>,
): Promise<ItensCotacaoProdutos> {
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
    select: {
      id: true,
      preco: true,
      precoPromocional: true,
      pesoKg: true,
      alturaCm: true,
      larguraCm: true,
      comprimentoCm: true,
    },
  })

  const encontrados = new Set(produtos.map((p) => p.id))
  const naoEncontrados = produtoIds.filter((id) => !encontrados.has(id))

  const itens: ItemCotacao[] = []
  const semDimensoes: string[] = []
  let valorMercadoria = 0

  for (const p of produtos) {
    const qtd = qtdPorProduto.get(p.id) ?? 1
    const peso = p.pesoKg != null ? Number(p.pesoKg) : 0
    const altura = p.alturaCm != null ? Number(p.alturaCm) : 0
    const largura = p.larguraCm != null ? Number(p.larguraCm) : 0
    const comprimento = p.comprimentoCm != null ? Number(p.comprimentoCm) : 0

    // Sem peso/dimensões completas não dá para cotar com segurança.
    if (peso <= 0 || altura <= 0 || largura <= 0 || comprimento <= 0) {
      semDimensoes.push(p.id)
      continue
    }

    const preco = Number(p.precoPromocional ?? p.preco)
    valorMercadoria += preco * qtd

    itens.push({
      pesoKg: peso,
      alturaCm: altura,
      larguraCm: largura,
      comprimentoCm: comprimento,
      quantidade: qtd,
    })
  }

  return { itens, valorMercadoria, semDimensoes, naoEncontrados }
}

// Cota o carrinho inteiro via carriers (Braspress). Retorna a MENOR cotação como
// opção genérica ("Entrega") — o NOME da transportadora NUNCA vai ao cliente
// (fica só em transportadora, p/ admin). null quando faltam dimensões, o carrier
// falha/timeout ou está desligado. Nunca lança (cotarComCarriers já captura).
async function cotarCarrinho(
  produtoIds: string[],
  qtdPorProduto: Map<string, number>,
  cepDestino: string,
  documentoDestinatario?: string,
): Promise<CarrierResolucao | null> {
  const { itens, valorMercadoria, semDimensoes } = await montarItensCotacaoProdutos(
    produtoIds,
    qtdPorProduto,
  )

  // Qualquer produto sem peso/dimensões completas → aborta (comportamento
  // histórico: não cota o carrinho com dado incompleto).
  if (semDimensoes.length > 0) return null
  if (itens.length === 0) return null

  const cotacoes = await cotarComCarriers({
    cepOrigem: '', // adapters usam a env de origem própria
    cepDestino,
    valorMercadoria,
    cnpjDestinatario: documentoDestinatario,
    itens,
  })

  if (cotacoes.length === 0) return null

  // Menor preço vence; empate → menor prazo. Nome genérico, sem transportadora.
  const melhor = cotacoes.reduce((a, b) =>
    b.preco < a.preco || (b.preco === a.preco && b.prazoDias < a.prazoDias) ? b : a,
  )
  // PART C: prazoDias vem do campo `prazo` da resposta Braspress, em DIAS ÚTEIS.
  // Não somamos/dobramos — usamos o valor real; formatarPrazo escreve "dias úteis".
  const prazo = melhor.prazoDias

  return {
    opcao: {
      id: 'normal',
      nome: 'Entrega',
      preco: melhor.preco,
      prazoDiasMin: prazo,
      prazoDiasMax: prazo,
      prazo: formatarPrazo(prazo, prazo),
      freteGratis: melhor.preco === 0,
    },
    custoFreteReal: melhor.preco,
    transportadora: melhor.servico,
  }
}
