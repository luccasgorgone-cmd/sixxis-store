// ─── Resolver de frete — FONTE ÚNICA DE VERDADE ──────────────────────────────
// Substitui as 4 tabelas divergentes que existiam (lib/frete TABELA, api/frete/cep
// PRAZOS, api/luna/frete REGIOES e o fallback inline do carrinho).
//
// Regra de negócio central (produto × UF):
//   1. Sem regra OU regra.bloqueado          → status 'bloqueado' (não vende)
//   2. regra.aCombinar OU sem preço definido  → status 'a_combinar' (vira orçamento)
//   3. Caso contrário                         → status 'ok' com opções Normal/Expresso
//
// Carrinho com múltiplos produtos (frete é por produto):
//   - QUALQUER item bloqueado    → pedido bloqueado
//   - QUALQUER item "a combinar" → pedido inteiro vira orçamento
//   - Senão → soma os fretes por modalidade (Normal soma com Normal, Expresso com
//     Expresso); o prazo do pedido é o MAIOR prazo entre os itens (item mais lento
//     manda). Uma modalidade só é oferecida se TODOS os itens a tiverem precificada.
//     Se nenhuma modalidade for comum a todos os itens → vira orçamento.

import { prisma } from '@/lib/prisma'
import { normalizarUF, type UF } from '@/lib/ufs'

export type StatusFrete = 'ok' | 'a_combinar' | 'bloqueado'

export interface OpcaoFreteResolvida {
  id: 'normal' | 'expresso'
  nome: string
  preco: number
  prazoDias: number
  prazo: string // string formatada p/ exibição
}

export interface ResultadoFrete {
  status: StatusFrete
  uf: UF | null
  opcoes: OpcaoFreteResolvida[]
  mensagem: string
}

export interface ItemFrete {
  produtoId: string
  quantidade: number
}

export function formatarPrazo(dias: number | null | undefined): string {
  if (!dias || dias <= 0) return 'a combinar'
  if (dias === 1) return '1 dia útil'
  return `até ${dias} dias úteis`
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
): Promise<ResultadoFrete> {
  const uf = normalizarUF(ufInput)
  if (!uf) {
    return { status: 'bloqueado', uf: null, opcoes: [], mensagem: 'UF inválida.' }
  }

  const itensValidos = itens.filter((i) => i.produtoId && i.quantidade > 0)
  if (itensValidos.length === 0) {
    return { status: 'bloqueado', uf, opcoes: [], mensagem: 'Carrinho vazio.' }
  }

  const produtoIds = [...new Set(itensValidos.map((i) => i.produtoId))]
  const regras = await prisma.freteRegra.findMany({
    where: { uf, produtoId: { in: produtoIds } },
  })
  const regraPorProduto = new Map(regras.map((r) => [r.produtoId, r]))

  let temNormal = true // todos os itens têm preço normal?
  let temExpresso = true // todos os itens têm preço expresso?
  let precoNormal = 0
  let precoExpresso = 0
  let prazoNormal = 0
  let prazoExpresso = 0

  for (const produtoId of produtoIds) {
    const regra = regraPorProduto.get(produtoId)

    // 1. Sem regra ou bloqueado → bloqueia o pedido inteiro.
    if (!regra || regra.bloqueado) {
      return { status: 'bloqueado', uf, opcoes: [], mensagem: MSG_BLOQUEADO }
    }

    // 2. "A combinar" → pedido inteiro vira orçamento.
    if (regra.aCombinar) {
      return { status: 'a_combinar', uf, opcoes: [], mensagem: MSG_A_COMBINAR }
    }

    const pn = regra.precoNormal != null ? Number(regra.precoNormal) : null
    const pe = regra.precoExpresso != null ? Number(regra.precoExpresso) : null

    // Regra existe mas sem nenhum preço → trata como orçamento (precisa cotação).
    if (pn == null && pe == null) {
      return { status: 'a_combinar', uf, opcoes: [], mensagem: MSG_A_COMBINAR }
    }

    if (pn != null) {
      precoNormal += pn
      prazoNormal = Math.max(prazoNormal, regra.prazoNormal ?? 0)
    } else {
      temNormal = false
    }

    if (pe != null) {
      precoExpresso += pe
      prazoExpresso = Math.max(prazoExpresso, regra.prazoExpresso ?? 0)
    } else {
      temExpresso = false
    }
  }

  const opcoes: OpcaoFreteResolvida[] = []
  if (temNormal) {
    opcoes.push({
      id: 'normal',
      nome: 'Frete Normal',
      preco: precoNormal,
      prazoDias: prazoNormal,
      prazo: formatarPrazo(prazoNormal),
    })
  }
  if (temExpresso) {
    opcoes.push({
      id: 'expresso',
      nome: 'Frete Expresso',
      preco: precoExpresso,
      prazoDias: prazoExpresso,
      prazo: formatarPrazo(prazoExpresso),
    })
  }

  // Nenhuma modalidade é comum a todos os itens → orçamento.
  if (opcoes.length === 0) {
    return { status: 'a_combinar', uf, opcoes: [], mensagem: MSG_A_COMBINAR }
  }

  return { status: 'ok', uf, opcoes, mensagem: '' }
}
