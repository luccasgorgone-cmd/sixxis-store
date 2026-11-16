import { routeApiV1 } from '../../../lib/api-v1/router'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) { return routeApiV1(request, []) }
export async function HEAD(request: Request) { return routeApiV1(request, []) }
export async function OPTIONS(request: Request) { return routeApiV1(request, []) }
export async function POST(request: Request) { return routeApiV1(request, []) }
export async function PUT(request: Request) { return routeApiV1(request, []) }
export async function PATCH(request: Request) { return routeApiV1(request, []) }
export async function DELETE(request: Request) { return routeApiV1(request, []) }
