import axios from 'axios'

const MELHOR_ENVIO_ENV = process.env.MELHOR_ENVIO_ENV ?? 'sandbox'
const MELHOR_ENVIO_BASE =
  MELHOR_ENVIO_ENV === 'production'
    ? 'https://www.melhorenvio.com.br/api/v2'
    : 'https://sandbox.melhorenvio.com.br/api/v2'

// CEP do galpão Sixxis em Araçatuba — configurável via env pra mudar sem deploy.
const CEP_ORIGEM = (
  process.env.MELHOR_ENVIO_CEP_ORIGEM ?? '16050570'
).replace(/\D/g, '')

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
  const url = `${MELHOR_ENVIO_BASE}/me/shipment/calculate`

  try {
    const { data } = await axios.post(
      url,
      {
        from: { postal_code: CEP_ORIGEM },
        to: { postal_code: cepDestino },
        package: {
          height: 20,
          width: 30,
          length: 40,
          weight: produtos.reduce(
            (acc, p) => acc + (p.peso ?? 1) * p.quantidade,
            0,
          ),
        },
        options: { receipt: false, own_hand: false },
        services: '1,2', // PAC e SEDEX
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Sixxis Store (brasil.sixxis@gmail.com)',
        },
        timeout: 8_000,
      },
    )

    const opcoes = (data as OpcaoFrete[]).filter((op) => !('error' in op))
    console.log(
      `[melhorenvio] env=${MELHOR_ENVIO_ENV} ok=true opcoes=${opcoes.length} cepDestino=${cepDestino}`,
    )
    return opcoes
  } catch (err) {
    const e = err as { message?: string; response?: { status?: number } }
    console.log(
      `[melhorenvio] env=${MELHOR_ENVIO_ENV} ok=false status=${e.response?.status ?? 'n/a'} msg=${e.message ?? 'unknown'} → fallback`,
    )
    throw err
  }
}
