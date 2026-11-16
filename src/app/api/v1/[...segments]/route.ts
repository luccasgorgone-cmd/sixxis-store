import { routeApiV1 } from '../../../../lib/api-v1/router'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ segments: string[] }> }

async function dispatch(request: Request, context: Context) {
  const { segments } = await context.params
  return routeApiV1(request, segments)
}

export async function GET(request: Request, context: Context) { return dispatch(request, context) }
export async function HEAD(request: Request, context: Context) { return dispatch(request, context) }
export async function OPTIONS(request: Request, context: Context) { return dispatch(request, context) }
export async function POST(request: Request, context: Context) { return dispatch(request, context) }
export async function PUT(request: Request, context: Context) { return dispatch(request, context) }
export async function PATCH(request: Request, context: Context) { return dispatch(request, context) }
export async function DELETE(request: Request, context: Context) { return dispatch(request, context) }
