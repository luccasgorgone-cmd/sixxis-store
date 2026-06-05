export const dynamic = 'force-dynamic'

// Lookup de endereço por CEP (ViaCEP) — usado pelo Header só para confirmar a
// localização do visitante. NÃO calcula preço/prazo de frete: a fonte única de
// frete é a tabela produto × UF (resolvida no carrinho/checkout/produto via
// /api/frete). Por isso a antiga tabela PRAZOS por UF foi removida daqui.

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

    return Response.json({
      ok: true,
      cidade: data.localidade,
      estado: data.uf,
      bairro: data.bairro,
      mensagem: `Você está em ${data.localidade}-${data.uf}. O frete é calculado por produto.`,
    })
  } catch {
    return Response.json({ erro: 'Erro ao consultar CEP' }, { status: 500 })
  }
}
