import axios from 'axios'

const erpClient = axios.create({
  baseURL: process.env.ERP_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.ERP_API_SECRET}`,
    'Content-Type': 'application/json',
  },
})

export async function buscarClienteERP(cpf: string) {
  const { data } = await erpClient.get(`/clientes?cpf=${cpf}`)
  return data
}

export async function criarClienteERP(cliente: {
  nome: string
  email: string
  cpf: string
  telefone?: string
}) {
  const { data } = await erpClient.post('/clientes', cliente)
  return data
}

export async function enviarPedidoERP(pedido: {
  id: string
  clienteErpId: string
  itens: { erpProdutoId: string; quantidade: number; precoUnitario: number }[]
  total: number
  frete: number
  enderecoEntrega: object
}) {
  const { data } = await erpClient.post('/pedidos', pedido)
  return data
}

export async function sincronizarEstoque() {
  const { data } = await erpClient.get('/produtos/estoque')
  return data
}
