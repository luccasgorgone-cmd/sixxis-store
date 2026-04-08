// ─── Enums / Unions ──────────────────────────────────────────────────────────

export type StatusPedido = 'pendente' | 'pago' | 'enviado' | 'entregue' | 'cancelado'

export type CategoriaProduto = 'climatizadores' | 'aspiradores' | 'spinning' | 'pecas'

export type FormaPagamento = 'pix' | 'cartao' | 'boleto'

// ─── Produto ─────────────────────────────────────────────────────────────────

/**
 * Tipo completo do modelo Produto — espelha o schema Prisma.
 * Decimal fields tipados como number | string para compatibilidade com
 * Prisma.Decimal (serializa como string) e com valores numéricos nativos.
 * imagens é Json no Prisma; usar `produto.imagens as string[]` no consumo.
 */
export interface VariacaoProduto {
  id:        string
  produtoId: string
  nome:      string
  sku:       string
  preco:     any
  estoque:   number
  ativo:     boolean
  createdAt: Date
}

export interface Produto {
  id:               string
  erpProdutoId:     string
  nome:             string
  slug:             string
  descricao:        string | null
  // Prisma Decimal não é string | number — usar any para compatibilidade
  // em runtime: sempre acessar via Number(produto.preco)
  preco:            any
  precoPromocional: any
  // Json do Prisma — usar `produto.imagens as string[]` no consumo
  imagens:          any
  estoque:          number
  categoria:        string
  modelo:           string | null
  sku:              string | null
  ativo:            boolean
  temVariacoes:     boolean
  createdAt:        Date
  variacoes?:       VariacaoProduto[]
}

/** Shape mínima usada em cards e listas (sem campos pesados como descricao) */
export interface ProdutoCard {
  id: string
  nome: string
  slug: string
  preco: number
  precoPromocional: number | null
  imagens: string[]
  estoque: number
  categoria: string
  modelo: string | null
  ativo: boolean
}

// ─── Carrinho ────────────────────────────────────────────────────────────────

export interface ItemCarrinho {
  produtoId:    string
  nome:         string
  preco:        number
  quantidade:   number
  variacaoId?:  string
  variacaoNome?: string
}

// ─── Endereço ────────────────────────────────────────────────────────────────

export interface EnderecoForm {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  principal?: boolean
}

// ─── Frete ───────────────────────────────────────────────────────────────────

export interface OpcaoFrete {
  id: number
  name: string
  price: number
  delivery_time: number
  company: {
    name: string
    picture: string
  }
}

// ─── Pedido ──────────────────────────────────────────────────────────────────

export interface PedidoResumo {
  id: string
  status: StatusPedido
  total: number
  frete: number
  formaPagamento: string
  createdAt: string
  itens: {
    id: string
    nome: string
    quantidade: number
    precoUnitario: number
  }[]
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

/** Wrapper genérico para respostas de API bem-sucedidas */
export interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
}

/** Wrapper genérico para erros de API */
export interface ApiError {
  error: string
  details?: unknown
}

// ─── next-auth session extension ─────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
