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

const MSG_BLOQUEADO = 'Ainda não entregamos na sua região.'
const MSG_A_COMBINAR =
  'Frete a combinar para a sua região — registramos o pedido como orçamento e entramos em contato para finalizar.'

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
  const uf = normalizarUF(ufInput)
  if (!uf) {
    return { status: 'bloqueado', uf: null, opcoes: [], mensagem: 'UF inválida.', freteGratis: false }
  }

  const itensValidos = itens.filter((i) => i.produtoId && i.quantidade > 0)
  if (itensValidos.length === 0) {
    return { status: 'bloqueado', uf, opcoes: [], mensagem: 'Carrinho vazio.', freteGratis: false }
  }

  const produtoIds = [...new Set(itensValidos.map((i) => i.produtoId))]
  const regras = await prisma.freteRegra.findMany({
    where: { uf, produtoId: { in: produtoIds } },
  })
  const regraPorProduto = new Map(regras.map((r) => [r.produtoId, r]))

  // Quantidade por produto — frete é por UNIDADE (soma as quantidades de itens
  // duplicados do mesmo produto). Piso 1: quantidade inválida ou < 1 vira 1.
  const qtdPorProduto = new Map<string, number>()
  for (const item of itensValidos) {
    const q = Math.max(1, Math.floor(Number(item.quantidade)) || 0)
    qtdPorProduto.set(item.produtoId, (qtdPorProduto.get(item.produtoId) ?? 0) + q)
  }

  // Carrier em tempo real só entra na cadeia se houver flag ligada E CEP de
  // destino. Sem isso, a cadeia é idêntica ao comportamento histórico.
  const cepDestino = String(opts.cepDestino ?? '').replace(/\D/g, '')
  const carrierNaCadeia = algumCarrierHabilitado() && cepDestino.length === 8

  let temNormal = true // todos os itens têm preço normal?
  let temExpresso = true // todos os itens têm preço expresso?
  let precoNormal = 0
  let precoExpresso = 0
  let prazoNormalMin = 0
  let prazoNormalMax = 0
  let prazoExpressoMin = 0
  let prazoExpressoMax = 0

  // Precedência de status (independe da ordem de iteração):
  // bloqueado > precisaCotar > a_combinar > ok.
  let algumBloqueado = false
  let algumACombinar = false
  let precisaCotar = false // só é marcado quando carrierNaCadeia

  for (const produtoId of produtoIds) {
    const regra = regraPorProduto.get(produtoId)
    const qtd = qtdPorProduto.get(produtoId) ?? 1

    // 1. Sem regra: histórico = bloqueio. Com carrier na cadeia, vira cotação.
    if (!regra) {
      if (carrierNaCadeia) precisaCotar = true
      else algumBloqueado = true
      continue
    }

    // Regra com bloqueio explícito → sempre bloqueia (hard block do admin).
    if (regra.bloqueado) {
      algumBloqueado = true
      continue
    }

    // 2. "A combinar" → cotação (se houver carrier) ou orçamento.
    if (regra.aCombinar) {
      if (carrierNaCadeia) precisaCotar = true
      else algumACombinar = true
      continue
    }

    const pn = regra.precoNormal != null ? Number(regra.precoNormal) : null
    const pe = regra.precoExpresso != null ? Number(regra.precoExpresso) : null

    // 3. Frete grátis (flag explícita OU preço normal = 0). É a opção ÚNICA:
    //    preço 0, prazo da faixa normal, expresso suprimido. Vem ANTES do teste
    //    "sem preço" porque uma regra grátis costuma ter os preços em branco.
    if (regra.freteGratis || pn === 0) {
      precoNormal += 0
      prazoNormalMin = Math.max(prazoNormalMin, regra.prazoNormalMin ?? 0)
      prazoNormalMax = Math.max(prazoNormalMax, regra.prazoNormalMax ?? 0)
      temExpresso = false // frete grátis é a única modalidade
      continue
    }

    // Regra existe mas sem nenhum preço → cotação (se houver carrier) ou orçamento.
    if (pn == null && pe == null) {
      if (carrierNaCadeia) precisaCotar = true
      else algumACombinar = true
      continue
    }

    // Frete por unidade: preço × quantidade. Prazo NÃO escala com quantidade.
    if (pn != null) {
      precoNormal += pn * qtd
      prazoNormalMin = Math.max(prazoNormalMin, regra.prazoNormalMin ?? 0)
      prazoNormalMax = Math.max(prazoNormalMax, regra.prazoNormalMax ?? 0)
    } else {
      temNormal = false
    }

    if (pe != null) {
      precoExpresso += pe * qtd
      prazoExpressoMin = Math.max(prazoExpressoMin, regra.prazoExpressoMin ?? 0)
      prazoExpressoMax = Math.max(prazoExpressoMax, regra.prazoExpressoMax ?? 0)
    } else {
      temExpresso = false
    }
  }

  // 1a. Bloqueado tem prioridade máxima: NÃO cota carrier. FIM.
  if (algumBloqueado) {
    return { status: 'bloqueado', uf, opcoes: [], mensagem: MSG_BLOQUEADO, freteGratis: false }
  }

  // Produto SEM preço manual (sem regra*/a combinar/sem preço), com carrier na
  // cadeia → Braspress é a fonte de preço. Precedência mantida do histórico:
  // esta checagem vem ANTES de grátis/normal. (*sem regra com a flag OFF já virou
  // bloqueado no laço, então aqui precisaCotar só existe com carrier ligado.)
  if (precisaCotar) {
    const cr = await cotarCarrinho(produtoIds, qtdPorProduto, cepDestino, opts.documentoDestinatario)
    if (cr) {
      return {
        status: 'ok', uf, opcoes: [cr.opcao], mensagem: '', freteGratis: false,
        custoFreteReal: cr.custoFreteReal, transportadora: cr.transportadora,
      }
    }
    // 2d. Sem cotação e sem preço manual → orçamento.
    return { status: 'a_combinar', uf, opcoes: [], mensagem: MSG_A_COMBINAR, freteGratis: false }
  }

  // Caminho da flag OFF: "a combinar" declarado no laço tem precedência sobre
  // grátis/normal (mesma ordem do histórico).
  if (algumACombinar) {
    return { status: 'a_combinar', uf, opcoes: [], mensagem: MSG_A_COMBINAR, freteGratis: false }
  }

  // Frete grátis ao cliente = todos os itens somam 0 no normal (grátis ou R$ 0).
  const normalGratis = temNormal && precoNormal === 0

  // 1b. FRETE GRÁTIS: cliente vê "Frete Grátis" (preço 0). Em paralelo cota os
  // carriers só para registrar o custoFreteReal — mesma regra do caminho normal,
  // a MAIS BARATA entre as ativas vence. Se falhar, segue null (frete grátis
  // NUNCA quebra a venda).
  if (normalGratis) {
    const bg = carrierNaCadeia
      ? await cotarCarrinho(produtoIds, qtdPorProduto, cepDestino, opts.documentoDestinatario)
      : null

    // Prazo exibido no frete grátis:
    //  • manual preenchido (ex.: SX200 "2 a 5 dias úteis") → mantém como está.
    //  • manual vazio (prazoNormalMax = 0, ex.: aspirador em RS/MG) → usa o prazo
    //    da MESMA cotação Braspress já feita acima (sem chamada extra).
    //  • Braspress sem prazo (falhou/off/0) → segue vazio (não quebra o grátis).
    const manualTemPrazo = prazoNormalMax > 0
    const carrierPrazo = bg?.opcao.prazoDiasMax ?? 0
    const prazoMin = manualTemPrazo ? prazoNormalMin : carrierPrazo
    const prazoMax = manualTemPrazo ? prazoNormalMax : carrierPrazo
    const prazoNormalStr = prazoMax > 0 ? formatarPrazo(prazoMin, prazoMax) : ''

    return {
      status: 'ok',
      uf,
      opcoes: [
        {
          id: 'normal',
          nome: 'Frete Grátis',
          preco: 0,
          prazoDiasMin: prazoMin,
          prazoDiasMax: prazoMax,
          prazo: prazoNormalStr,
          freteGratis: true,
        },
      ],
      mensagem: '',
      freteGratis: true,
      custoFreteReal: bg?.custoFreteReal ?? null,
      transportadora: bg?.transportadora ?? null,
    }
  }

  // 2a/2b. CASO NORMAL (precificado) — o registry é o MOTOR DE PREÇO.
  // Cota o carrinho inteiro; se veio cotação, ela VENCE a tabela manual (preço =
  // custo puro, sem markup). Se não veio, cai no fallback manual abaixo.
  if (carrierNaCadeia) {
    const cr = await cotarCarrinho(produtoIds, qtdPorProduto, cepDestino, opts.documentoDestinatario)
    if (cr) {
      return {
        status: 'ok', uf, opcoes: [cr.opcao], mensagem: '', freteGratis: false,
        custoFreteReal: cr.custoFreteReal, transportadora: cr.transportadora,
      }
    }
  }

  // 2c. FALLBACK: tabela manual FreteRegra (comportamento histórico).
  const opcoes: OpcaoFreteResolvida[] = []
  if (temNormal) {
    // Frete grátis sem prazo NÃO exibe "a combinar": só "Frete Grátis".
    const prazoNormalStr =
      normalGratis && !prazoNormalMax ? '' : formatarPrazo(prazoNormalMin, prazoNormalMax)
    opcoes.push({
      id: 'normal',
      nome: normalGratis ? 'Frete Grátis' : 'Frete Normal',
      preco: precoNormal,
      prazoDiasMin: prazoNormalMin,
      prazoDiasMax: prazoNormalMax,
      prazo: prazoNormalStr,
      freteGratis: normalGratis,
    })
  }
  if (temExpresso) {
    opcoes.push({
      id: 'expresso',
      nome: 'Frete Expresso',
      preco: precoExpresso,
      prazoDiasMin: prazoExpressoMin,
      prazoDiasMax: prazoExpressoMax,
      prazo: formatarPrazo(prazoExpressoMin, prazoExpressoMax),
      freteGratis: precoExpresso === 0,
    })
  }

  // Nenhuma modalidade é comum a todos os itens → orçamento.
  if (opcoes.length === 0) {
    return { status: 'a_combinar', uf, opcoes: [], mensagem: MSG_A_COMBINAR, freteGratis: false }
  }

  // Opção grátis primeiro (é a única quando há frete grátis).
  opcoes.sort((a, b) => Number(b.freteGratis) - Number(a.freteGratis))

  return { status: 'ok', uf, opcoes, mensagem: '', freteGratis: normalGratis, custoFreteReal: null, transportadora: null }
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
