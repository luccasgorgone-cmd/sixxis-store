import axios from 'axios'

const CEP_ORIGEM = '01310100' // Substitua pelo CEP do seu CD

interface ProdutoFrete {
  id: string
  quantidade: number
  peso?: number
}

interface OpcaoFrete {
  id: number
  name: string
  price: number
  delivery_time: number
}

export async function calcularFrete(
  cepDestino: string,
  produtos: ProdutoFrete[],
): Promise<OpcaoFrete[]> {
  const { data } = await axios.post(
    'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate',
    {
      from: { postal_code: CEP_ORIGEM },
      to: { postal_code: cepDestino },
      package: {
        height: 20,
        width: 30,
        length: 40,
        weight: produtos.reduce((acc, p) => acc + (p.peso ?? 1) * p.quantidade, 0),
      },
      options: { receipt: false, own_hand: false },
      services: '1,2', // PAC e SEDEX
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'sixxis-store/1.0',
      },
    },
  )

  return (data as OpcaoFrete[]).filter((op) => !('error' in op))
}
