import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Frete da Luna (assistente): a Luna detecta um CEP na conversa mas NÃO tem um
// produto em contexto, e o frete agora é por produto × UF (fonte única em
// /api/frete + src/lib/frete-resolver). Por isso aqui só confirmamos a
// localização (ViaCEP) e orientamos o cliente — sem a antiga tabela REGIOES de
// preços fixos, que divergia das demais.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const cepLimpo = String(body?.cep ?? '').replace(/\D/g, '')

    if (cepLimpo.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
    }

    let local = ''
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86_400 },
      })
      if (res.ok) {
        const data = await res.json()
        if (!data?.erro && data.localidade) {
          local = ` (${data.localidade}-${data.uf})`
        }
      }
    } catch {
      // segue sem o nome da cidade
    }

    return NextResponse.json({
      cep: cepLimpo,
      mensagem:
        `📦 O frete para o seu CEP${local} é calculado por produto na página do ` +
        `produto e no carrinho. Alguns itens maiores podem ter frete "a combinar".`,
      observacao:
        'Peça ao cliente para adicionar o item ao carrinho e informar o CEP para ver o valor exato.',
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao consultar frete' }, { status: 500 })
  }
}
