// ─── Enums / Unions ──────────────────────────────────────────────────────────

export type StatusPedido = 'pendente' | 'pago' | 'enviado' | 'entregue' | 'cancelado'

export type CategoriaProduto = 'climatizadores' | 'aspiradores' | 'spinning' | 'pecas'

export type FormaPagamento = 'pix' | 'cartao' | 'boleto'

// ─── Produto ─────────────────────────────────────────────────────────────────

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
  produtoId: string
  nome: string
  preco: number
  quantidade: number
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
