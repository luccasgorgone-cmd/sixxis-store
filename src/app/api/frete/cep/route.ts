export const dynamic = 'force-dynamic'

const PRAZOS: Record<string, number> = {
  SP: 3, MG: 4, RJ: 4, PR: 4, SC: 5, RS: 5,
  GO: 5, DF: 5, MT: 6, MS: 5, BA: 6, ES: 5,
  PE: 6, CE: 7, MA: 7, PA: 7, AM: 8, RO: 7,
  AC: 9, RR: 9, AP: 9, TO: 7, PI: 7, RN: 6,
  PB: 6, AL: 6, SE: 6,
}

export async function POST(req: Request) {
  let cep: string
  try {
    const body = await req.json()
    cep = String(body.cep ?? '').replace(/\D/g, '')
  } catch {
    return Response.json({ erro: 'Corpo inválido' }, { status: 400 })
  }

  if (cep.length !== 8) {
    return Response.json({ erro: 'CEP inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // cache 1h
    })

    if (!res.ok) {
      return Response.json({ erro: 'Erro ao consultar ViaCEP' }, { status: 502 })
    }

    const data = await res.json()

    if (data.erro) {
      return Response.json({ erro: 'CEP não encontrado' }, { status: 404 })
    }

    const prazo = PRAZOS[data.uf] ?? 7

    return Response.json({
      ok: true,
      cidade: data.localidade,
      estado: data.uf,
      bairro: data.bairro,
      prazo,
      mensagem: `Entrega em até ${prazo} dias úteis para ${data.localidade}-${data.uf}`,
    })
  } catch {
    return Response.json({ erro: 'Erro ao consultar CEP' }, { status: 500 })
  }
}
