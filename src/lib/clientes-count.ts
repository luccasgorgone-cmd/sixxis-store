import { prisma } from './prisma'

// Fonte única da contagem total de clientes. Dashboard e página de clientes
// devem consumir essa função para garantir que os dois
// lugares sempre mostram exatamente o mesmo número.
//
// Como só existe o modelo `Cliente` no schema, a contagem é direta.
// Qualquer filtro futuro (ex.: "apenas com pedido") deve ser adicionado aqui,
// não duplicado nas rotas.
export async function contarClientes(): Promise<number> {
  return prisma.cliente.count({ where: {} })
}
