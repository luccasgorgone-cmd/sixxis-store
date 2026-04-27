export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card'

export interface PaymentDTO {
  id: string
  mpPaymentId: string
  pedidoId: string
  valor: number
  metodo: PaymentMethod
  status: PaymentStatus
  qrCodePix?: string
  qrCodePixCopiaECola?: string
  pixExpiraEm?: Date
  parcelas?: number
  bandeira?: string
  ultimosDigitos?: string
  createdAt: Date
  updatedAt: Date
}
