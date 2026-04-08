import axios from 'axios'

const BASE_URL =
  process.env.FOCUS_NFE_ENV === 'producao'
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br'

const client = axios.create({
  baseURL: BASE_URL,
  auth: { username: process.env.FOCUS_NFE_TOKEN!, password: '' },
})

interface DadosNFe {
  referencia: string
  natureza_operacao: string
  cpf: string
  nome_destinatario: string
  logradouro_destinatario: string
  numero_destinatario: string
  bairro_destinatario: string
  municipio_destinatario: string
  uf_destinatario: string
  cep_destinatario: string
  valor_produtos: number
  valor_nota: number
  itens: {
    numero_item: number
    codigo_produto: string
    descricao: string
    ncm: string
    cfop: string
    unidade_comercial: string
    quantidade_comercial: number
    valor_unitario_comercial: number
  }[]
}

export async function emitirNFe(dados: DadosNFe) {
  const { data } = await client.post(`/v2/nfe?ref=${dados.referencia}`, dados)
  return data
}

export async function consultarNFe(referencia: string) {
  const { data } = await client.get(`/v2/nfe/${referencia}`)
  return data
}

export async function cancelarNFe(referencia: string, justificativa: string) {
  const { data } = await client.delete(`/v2/nfe/${referencia}`, {
    data: { justificativa },
  })
  return data
}
