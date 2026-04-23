import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { gerarHtmlTemplate } from '@/lib/email'

export const dynamic = 'force-dynamic'

const DADOS_DEMO = {
  nome:             'João Silva',
  pedido_id:        'TEST12345678',
  total:            599.90,
  subtotal:         599.90,
  frete:            0,
  forma_pagamento:  'Cartão de Crédito (6x)',
  status:           'Confirmado',
  codigo_rastreio:  'BR123456789BR',
  link_rastreio:    'https://www.correios.com.br',
  previsao_entrega: '5 a 8 dias úteis',
  transportadora:   'Correios',
  produto:          'Climatizador Sixxis Pro',
  produto_nome:     'Climatizador Sixxis Pro',
  produto_slug:     'climatizador-sixxis-pro',
  produto_preco:    'R$ 599,90',
  produto_url:      'https://sixxis-store-production.up.railway.app/produtos/climatizador-sixxis-pro',
  cupom_codigo:     'SIXXIS15',
  desconto:         '15% OFF',
  validade:         '07/05/2026',
  total_carrinho:   599.90,
  nivel_anterior:   'Topázio',
  nivel_novo:       'Diamante',
  total_gasto:      5240.50,
  itens: [{ nome: 'Climatizador Sixxis Pro', qtd: 1, preco: 599.90 }],
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth) return auth

  const tipo = req.nextUrl.searchParams.get('tipo') ?? 'boas_vindas'
  const html = gerarHtmlTemplate(tipo, DADOS_DEMO)

  if (!html) {
    return new Response('<p>Template não encontrado para o tipo: ' + tipo + '</p>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
