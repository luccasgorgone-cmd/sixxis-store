export type PedidoStatus = 'pendente' | 'pago' | 'enviado' | 'entregue' | 'cancelado'

export interface StatusInfo {
  label:  string
  color:  string   // tailwind text color
  bg:     string   // tailwind bg color
  border: string   // tailwind border color
  step:   number   // 0-based step index (for progress bar)
}

const STATUS_MAP: Record<PedidoStatus, StatusInfo> = {
  pendente:  { label: 'Pendente',  color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  step: 0 },
  pago:      { label: 'Pago',      color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   step: 1 },
  enviado:   { label: 'Enviado',   color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-200', step: 2 },
  entregue:  { label: 'Entregue',  color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  step: 3 },
  cancelado: { label: 'Cancelado', color: 'text-gray-500',   bg: 'bg-gray-100',   border: 'border-gray-200',   step: -1 },
}

export function getStatusInfo(status: string): StatusInfo {
  return STATUS_MAP[status as PedidoStatus] ?? {
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
    pix:     'PIX',
    cartao:  'Cartão de Crédito',
    boleto:  'Boleto',
    credito: 'Cartão de Crédito',
    debito:  'Cartão de Débito',
  }
  return map[forma.toLowerCase()] ?? forma
}
