import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Package, ArrowRight, Truck, FileText, Mail } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function moeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function imagemCapa(imgs: unknown): string | null {
  if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string') {
    return imgs[0]
  }
  return null
}

export default async function PedidoSucessoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#f9fafb]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Faça login para ver seu pedido</h1>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 mt-4 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl text-sm"
          >
            Entrar
          </Link>
        </div>
      </main>
    )
  }

  const pedido = await prisma.pedido.findFirst({
    where: { id, clienteId: session.user.id },
    include: {
      itens: {
        include: { produto: { select: { nome: true, imagens: true, slug: true } } },
      },
      endereco: true,
      pagamentos: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  if (!pedido) notFound()

  const ultimoPagamento = pedido.pagamentos[0]
  const aprovado = pedido.status === 'pago' || ultimoPagamento?.mpStatus === 'approved'
  const subtotal = pedido.itens.reduce(
    (s, i) => s + Number(i.precoUnitario) * i.quantidade,
    0,
  )

  return (
    <main className="min-h-[70vh] px-4 py-12 bg-[#f9fafb]">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center mb-4">
          <div className="w-20 h-20 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-[#3cbfb3]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] mb-2 tracking-tight">
            {aprovado ? 'Pagamento aprovado!' : 'Pedido confirmado!'}
          </h1>
          <p className="text-gray-500 text-sm mb-1">
            Pedido <span className="font-mono font-bold text-[#3cbfb3]">#{pedido.id.slice(-8).toUpperCase()}</span>
          </p>
          <p className="text-gray-400 text-xs mb-6">
            {aprovado
              ? 'Recebemos seu pagamento. Em breve seu pedido será preparado para envio.'
              : 'Aguardando confirmação do pagamento.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Link
              href={`/minha-conta/pedidos/${pedido.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm"
            >
              Acompanhar pedido <ArrowRight size={16} />
            </Link>
            <Link
              href="/produtos"
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:border-[#3cbfb3] text-gray-600 hover:text-[#3cbfb3] font-medium px-6 py-3 rounded-xl transition-all text-sm"
            >
              Continuar comprando
            </Link>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={14} className="text-[#3cbfb3]" /> Itens do pedido
          </h2>
          <div className="space-y-3">
            {pedido.itens.map((item) => {
              const img = imagemCapa(item.produto.imagens)
              return (
                <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  {img ? (
                    <div className="w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                      <Image src={img} alt={item.produto.nome} width={56} height={56} className="object-contain w-full h-full" unoptimized />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{item.produto.nome}</p>
                    {item.variacaoNome && <p className="text-xs text-gray-400 mt-0.5">{item.variacaoNome}</p>}
                    <p className="text-xs text-gray-400">Qtd: {item.quantidade}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">
                    {moeda(Number(item.precoUnitario) * item.quantidade)}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>{moeda(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Frete</span>
              <span>{Number(pedido.frete) === 0 ? 'Grátis' : moeda(Number(pedido.frete))}</span>
            </div>
            {Number(pedido.desconto) > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Desconto</span><span>-{moeda(Number(pedido.desconto))}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-gray-900 text-sm pt-2 border-t border-gray-100">
              <span>Total</span><span className="text-[#3cbfb3]">{moeda(Number(pedido.total))}</span>
            </div>
          </div>
        </div>

        {/* Entrega */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
            <Truck size={14} className="text-[#3cbfb3]" /> Entrega
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            {pedido.endereco.logradouro}, {pedido.endereco.numero}
            {pedido.endereco.complemento ? ` — ${pedido.endereco.complemento}` : ''}<br />
            {pedido.endereco.bairro}, {pedido.endereco.cidade}/{pedido.endereco.estado} · CEP {pedido.endereco.cep}
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Estimativa de entrega: 5–10 dias úteis após postagem.
          </p>
        </div>

        {/* Próximos passos */}
        <div className="bg-[#e8f8f7] border border-[#3cbfb3]/20 rounded-2xl p-5 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#3cbfb3]/30">
            {aprovado ? <Mail size={14} className="text-[#3cbfb3]" /> : <FileText size={14} className="text-[#3cbfb3]" />}
          </div>
          <div className="text-xs text-gray-700 leading-relaxed">
            <p className="font-semibold text-[#0f2e2b] mb-0.5">
              {aprovado ? 'E-mail de confirmação a caminho' : 'Aguardando pagamento'}
            </p>
            <p>
              {aprovado
                ? 'Você receberá um e-mail com a nota fiscal e o código de rastreio assim que seu pedido for despachado.'
                : 'Assim que recebermos a confirmação do pagamento, você será notificado por e-mail.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
