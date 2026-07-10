// ─── Cotação POR transportadora — estágio final compartilhado ────────────────
// Dado um conjunto de itens já resolvidos (peso/dimensões) + valor + CEP destino,
// chama o motor de carriers (cotarComCarriersDetalhado) e monta a resposta
// padronizada: cotações por transportadora (com nome e erro) + a mais barata.
//
// FONTE ÚNICA reusada por:
//   • /api/interno/frete/cotar        (CRM, auth por chave interna)
//   • /api/admin/pedidos/[id]/cotar-transportadoras (admin, auth por sessão)
// Nenhuma dessas rotas reimplementa a fan-out/ordenação/mais-barata — tudo aqui.

import {
  cotarComCarriersDetalhado,
  algumCarrierHabilitado,
  type CotacaoDetalhada,
  type ItemCotacao,
} from '@/lib/carriers'

export type StatusCotacao = 'ok' | 'a_combinar' | 'bloqueado'

export interface MaisBarata {
  transportadora: string
  preco: number
  prazoDias: number | null
}

export interface RespostaCotacaoTransportadoras {
  ok: boolean
  uf: string | null
  cotacoes: CotacaoDetalhada[]
  maisBarata: MaisBarata | null
  status: StatusCotacao
  mensagem: string
}

// Ordena: as que cotaram primeiro (mais barata → mais cara), falhas por último.
function ordenar(cotacoes: CotacaoDetalhada[]): CotacaoDetalhada[] {
  return [...cotacoes].sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? -1 : 1
    if (a.ok && b.ok) return (a.preco ?? Infinity) - (b.preco ?? Infinity)
    return 0
  })
}

// Cota os itens JÁ resolvidos por transportadora. Nunca lança: um carrier que
// falha vem ok:false com o motivo, sem derrubar os outros.
export async function cotarTransportadoras(params: {
  uf: string | null
  cepDestino: string
  itens: ItemCotacao[]
  valorMercadoria: number
}): Promise<RespostaCotacaoTransportadoras> {
  const { uf, cepDestino, itens, valorMercadoria } = params

  if (itens.length === 0) {
    return {
      ok: false,
      uf,
      cotacoes: [],
      maisBarata: null,
      status: 'a_combinar',
      mensagem: 'Nenhum item cotável no pedido.',
    }
  }

  // Nenhum carrier ativo → cotação automática indisponível (não é bloqueio).
  if (!algumCarrierHabilitado()) {
    return {
      ok: false,
      uf,
      cotacoes: [],
      maisBarata: null,
      status: 'a_combinar',
      mensagem: 'Cotação automática indisponível — nenhuma transportadora ativa.',
    }
  }

  const detalhadas = await cotarComCarriersDetalhado({
    cepOrigem: '', // adapters usam a env de origem própria
    cepDestino,
    valorMercadoria,
    itens,
  })

  const cotacoes = ordenar(detalhadas)
  const oks = cotacoes.filter(
    (c): c is CotacaoDetalhada & { preco: number } => c.ok && c.preco != null,
  )
  const melhor = oks.length ? oks.reduce((a, b) => (b.preco < a.preco ? b : a)) : null
  const maisBarata: MaisBarata | null = melhor
    ? { transportadora: melhor.transportadora, preco: melhor.preco, prazoDias: melhor.prazoDias }
    : null

  return {
    ok: Boolean(maisBarata),
    uf,
    cotacoes,
    maisBarata,
    status: maisBarata ? 'ok' : 'a_combinar',
    mensagem: maisBarata ? '' : 'Nenhuma transportadora cotou este envio — cotação manual.',
  }
}
