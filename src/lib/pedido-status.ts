// ─── SIXXIS · Status canônicos do pedido ────────────────────────────────────
// Fonte única de verdade. Use SEMPRE estas constantes em queries/UI/auditoria
// pra evitar inconsistência entre módulos (ex.: dashboard contar pendente como
// receita).
//
// Histórico: o app aceita maiúsculas/minúsculas no banco por motivos de
// migração legada. Sempre normalize via `STATUS_PEDIDO_*` que já incluem as
// duas formas.

export type PedidoStatus =
  | 'pendente'
  | 'pendente_pagamento'
  | 'aguardando_pagamento'
  | 'pago'
  | 'enviado'
  | 'entregue'
  | 'cancelado'
  | 'cancelado_cliente'
  | 'cancelado_admin'
  | 'rejeitado'
  | 'estornado'
  | 'expirado_sem_pagamento'

// Pedidos cujo pagamento foi confirmado — entram em receita.
export const STATUS_PEDIDO_PAGO = ['pago', 'enviado', 'entregue'] as const

// Pedidos pendentes de pagamento — NÃO somam receita confirmada.
export const STATUS_PEDIDO_PENDENTE = [
  'pendente',
  'pendente_pagamento',
  'aguardando_pagamento',
] as const

// Pedidos cancelados/estornados — saem das duas métricas.
export const STATUS_PEDIDO_CANCELADO = [
  'cancelado',
  'cancelado_cliente',
  'cancelado_admin',
  'rejeitado',
  'estornado',
  'expirado_sem_pagamento',
] as const

// Inclui variantes em maiúsculas pra cobrir registros legados.
function comUpper(arr: readonly string[]): string[] {
  return [...arr, ...arr.map((s) => s.toUpperCase())]
}

export const STATUS_PAGO_TODOS       = comUpper(STATUS_PEDIDO_PAGO)
export const STATUS_PENDENTE_TODOS   = comUpper(STATUS_PEDIDO_PENDENTE)
export const STATUS_CANCELADO_TODOS  = comUpper(STATUS_PEDIDO_CANCELADO)

export function isStatusPago(s: string)       { return STATUS_PAGO_TODOS.includes(s) }
export function isStatusPendente(s: string)   { return STATUS_PENDENTE_TODOS.includes(s) }
export function isStatusCancelado(s: string)  { return STATUS_CANCELADO_TODOS.includes(s) }

// ─── Apresentação na UI ──────────────────────────────────────────────────────

export interface StatusInfo {
  label:  string
  color:  string
  bg:     string
  border: string
  step:   number
}

const STATUS_MAP: Record<string, StatusInfo> = {
  pendente:               { label: 'Pendente',  color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  step: 0 },
  pendente_pagamento:     { label: 'Aguardando pagamento', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', step: 0 },
  aguardando_pagamento:   { label: 'Aguardando pagamento', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', step: 0 },
  pago:                   { label: 'Pago',      color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   step: 1 },
  enviado:                { label: 'Enviado',   color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-200', step: 2 },
  entregue:               { label: 'Entregue',  color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  step: 3 },
  cancelado:              { label: 'Cancelado', color: 'text-gray-500',   bg: 'bg-gray-100',   border: 'border-gray-200',   step: -1 },
  cancelado_cliente:      { label: 'Cancelado pelo cliente', color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200', step: -1 },
  cancelado_admin:        { label: 'Cancelado',  color: 'text-gray-500',  bg: 'bg-gray-100',  border: 'border-gray-200',  step: -1 },
  rejeitado:              { label: 'Rejeitado',  color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200',   step: -1 },
  estornado:              { label: 'Estornado',  color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200',   step: -1 },
  expirado_sem_pagamento: { label: 'Expirado',   color: 'text-gray-500',  bg: 'bg-gray-100',  border: 'border-gray-200',  step: -1 },
}

export function getStatusInfo(status: string): StatusInfo {
  return STATUS_MAP[status?.toLowerCase()] ?? {
    label:  status,
    color:  'text-gray-600',
    bg:     'bg-gray-100',
    border: 'border-gray-200',
    step:   -1,
  }
}

export const PEDIDO_STEPS: { key: PedidoStatus; label: string }[] = [
  { key: 'pendente', label: 'Pedido recebido' },
  { key: 'pago',     label: 'Pagamento confirmado' },
  { key: 'enviado',  label: 'Em transporte' },
  { key: 'entregue', label: 'Entregue' },
]

export function formatarPagamento(forma: string): string {
  const map: Record<string, string> = {
    pix:           'PIX',
    cartao:        'Cartão de Crédito',
    boleto:        'Boleto',
    credito:       'Cartão de Crédito',
    debito:        'Cartão de Débito',
    mercado_pago:  'Mercado Pago',
  }
  return map[forma.toLowerCase()] ?? forma
}
