import type { Prisma } from '@prisma/client'
import {
  STATUS_PAGO_TODOS,
  STATUS_PENDENTE_TODOS,
  STATUS_CANCELADO_TODOS,
} from '@/lib/pedido-status'

// Filtros prontos pra usar em prisma.pedido.{find,count,aggregate,groupBy}.
// Encapsulam a regra de negócio "o que conta como receita confirmada" pra
// evitar divergência entre dashboard, listagem e relatórios.

export const filtroReceitaConfirmada: Prisma.PedidoWhereInput = {
  status: { in: STATUS_PAGO_TODOS },
}

export const filtroReceitaPendente: Prisma.PedidoWhereInput = {
  status: { in: STATUS_PENDENTE_TODOS },
}

export const filtroPedidoCancelado: Prisma.PedidoWhereInput = {
  status: { in: STATUS_CANCELADO_TODOS },
}

// "Não cancelado" — útil em queries que aceitam tanto pago quanto pendente
// mas precisam descartar cancelados.
export const filtroNaoCancelado: Prisma.PedidoWhereInput = {
  status: { notIn: STATUS_CANCELADO_TODOS },
}
