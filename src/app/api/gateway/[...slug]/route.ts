import { NextRequest, NextResponse } from 'next/server'
import { auditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

function validKeys(): Set<string> {
  return new Set(
    [process.env.ERP_API_KEY, process.env.NFE_API_KEY, process.env.WEBHOOK_API_KEY]
      .filter((k): k is string => typeof k === 'string' && k.length > 0 && k !== 'replace-me'),
  )
}

function autorizar(req: Request): boolean {
  const key = req.headers.get('x-api-key')
  if (!key) return false
  return validKeys().has(key)
}

async function processar(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
  method: string,
) {
  if (!autorizar(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const rota = slug.join('/')

  let body: unknown = null
  if (method !== 'GET' && method !== 'HEAD') {
    body = await req.json().catch(() => null)
  }

  await auditLog({
    req,
    actor: 'gateway',
    action: `gateway.${rota}`,
    metadata: {
      method,
      rota,
      hasBody: body !== null,
      bodyKeys: body && typeof body === 'object' ? Object.keys(body as object) : [],
    },
  })

  // Sprint 2 vai plugar aqui os routers específicos:
  //   rota === 'erp/pedido'        → ERP.criarPedido(body)
  //   rota === 'nfe/emitir'        → NFe.emitir(body)
  //   rota === 'whatsapp/enviar'   → Evolution.sendMessage(body)
  //   etc.

  return NextResponse.json({
    ok: true,
    rota,
    method,
    message: 'Gateway disponível. Roteamento específico será implementado no Sprint 2.',
  })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return processar(req, ctx, 'GET')
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return processar(req, ctx, 'POST')
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return processar(req, ctx, 'PUT')
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return processar(req, ctx, 'PATCH')
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return processar(req, ctx, 'DELETE')
}
