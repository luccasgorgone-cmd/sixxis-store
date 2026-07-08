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

export interface Carrier {
  id: string
  cotar(input: CotacaoInput): Promise<Cotacao[]>
  // Declarados para o futuro — NÃO implementar agora.
  gerarEtiqueta?: (...args: unknown[]) => Promise<unknown>
  rastrear?: (...args: unknown[]) => Promise<unknown>
}
