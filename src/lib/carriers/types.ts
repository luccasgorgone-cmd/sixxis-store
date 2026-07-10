// ─── Módulo carriers — interface única de transportadoras ────────────────────
// Um Carrier sabe COTAR frete. gerarEtiqueta/rastrear ficam DECLARADOS para o
// futuro (etiqueta + rastreamento), mas NÃO são implementados agora.
//
// O shape de saída (Cotacao) é normalizado e o mesmo que o resolver de frete
// mapeia para as opções que o checkout já exibe — nenhum shape novo é inventado
// na ponta do cliente.

export interface ItemCotacao {
  pesoKg: number
  alturaCm: number
  larguraCm: number
  comprimentoCm: number
  quantidade: number
}

export interface CotacaoInput {
  cepOrigem: string
  cepDestino: string
  valorMercadoria: number
  // CPF/CNPJ do destinatário (só dígitos). Opcional: transportadoras aceitam
  // "0" quando não há documento (ex.: cotação anônima no carrinho).
  cnpjDestinatario?: string
  itens: ItemCotacao[]
}

export interface Cotacao {
  carrierId: string // id interno da transportadora (NUNCA exposto ao cliente)
  servico: string // nome do serviço da transportadora (uso interno/admin)
  preco: number // R$
  prazoDias: number // prazo de entrega em dias úteis
}

// Cotação POR transportadora, com NOME e (quando falha) o erro — para consumo
// INTERNO/admin (ex.: pós-venda do CRM precisa ver Braspress E Melhor Envio para
// escolher, não só a mais barata). O checkout público NÃO usa isto.
export interface CotacaoDetalhada {
  carrierId: string // id interno (braspress, melhorenvio)
  transportadora: string // nome de exibição (Braspress, Melhor Envio)
  ok: boolean
  preco: number | null // R$ quando ok; null quando falhou
  prazoDias: number | null // dias úteis quando ok; null quando falhou
  erro?: string // motivo da falha (ex.: rota não atendida)
}

export interface Carrier {
  id: string
  nome: string // nome de exibição da transportadora (uso interno/admin)
  cotar(input: CotacaoInput): Promise<Cotacao[]>
  // Mesma cotação de cotar(), mas devolvendo SEMPRE um resultado por
  // transportadora — inclusive falhas com o motivo — para a API interna.
  cotarDetalhado(input: CotacaoInput): Promise<CotacaoDetalhada>
  // Declarados para o futuro — NÃO implementar agora.
  gerarEtiqueta?: (...args: unknown[]) => Promise<unknown>
  rastrear?: (...args: unknown[]) => Promise<unknown>
}
