import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Package, ArrowRight, Truck, FileText, Mail } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PurchaseTracker from '@/components/analytics/PurchaseTracker'
import { feedId } from '@/lib/feed-id'
import { FATOR_PIX, DESCONTO_PIX_PCT } from '@/lib/preco-pix'

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
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#080B0B]">
        <div className="w-full max-w-md bg-[#111717] rounded-2xl shadow-sm border border-[#2A3937] p-8 text-center">
          <h1 className="text-xl font-extrabold text-[#F4F7F6] mb-2">Faça login para ver seu pedido</h1>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 mt-4 bg-[#00cfb5] hover:bg-[#65E5D4] text-[#032E28] font-bold px-6 py-3 rounded-xl text-sm"
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
        include: {
          produto: {
            select: {
              nome: true, imagens: true, slug: true, categoria: true, sku: true,
              // p/ resolver o g:id (content_ids) de itens vendidos por variação.
              variacoes: { select: { id: true, sku: true, preco: true } },
            },
          },
        },
      },
      endereco: true,
      cliente: { select: { nome: true, email: true, telefone: true } },
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
  // No PIX o total já vem com o desconto à vista aplicado. Sem esta linha o
  // resumo teria um buraco de 5% sem rótulo entre Subtotal/Frete e Total.
  // Derivado do próprio total cobrado (inverso do fator), não recalculado.
  const descontoPix =
    ultimoPagamento?.metodo === 'pix'
      ? Math.round((Number(pedido.total) / FATOR_PIX - Number(pedido.total)) * 100) / 100
      : 0

  return (
    <main className="min-h-[70vh] px-4 py-12 bg-[#080B0B]">
      <PurchaseTracker
        transactionId={pedido.id}
        items={pedido.itens.map(i => ({
          // content_ids = g:id do feed (mesma função do merchant-feed).
          item_id: feedId(
            { sku: i.produto.sku, slug: i.produto.slug },
            i.variacaoId ? i.produto.variacoes.find(v => v.id === i.variacaoId) : null,
            i.produto.variacoes,
          ),
          produto_id: i.produtoId,
          item_name: i.produto.nome,
          item_category: i.produto.categoria ?? undefined,
          item_brand: 'Sixxis',
          price: Number(i.precoUnitario),
          quantity: i.quantidade,
          variant: i.variacaoNome ?? undefined,
        }))}
        total={Number(pedido.total)}
        frete={Number(pedido.frete)}
        coupon={pedido.cupomCodigo ?? undefined}
        advancedMatching={{
          email:      pedido.cliente.email,
          telefone:   pedido.cliente.telefone,
          nome:       pedido.cliente.nome,
          cidade:     pedido.endereco.cidade,
          estado:     pedido.endereco.estado,
          cep:        pedido.endereco.cep,
          country:    'br',
          externalId: pedido.clienteId,
        }}
      />
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#111717] rounded-2xl shadow-sm border border-[#2A3937] p-6 sm:p-8 text-center mb-4">
          <div className="w-20 h-20 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-[#00cfb5]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] mb-2 tracking-tight">
            {aprovado ? 'Pagamento aprovado!' : 'Pedido confirmado!'}
          </h1>
          <p className="text-[#B0BFBC] text-sm mb-1">
            Pedido <span className="font-mono font-bold text-[#00cfb5]">#{pedido.id.slice(-8).toUpperCase()}</span>
          </p>
          <p className="text-[#8a9794] text-xs mb-6">
            {aprovado
              ? 'Recebemos seu pagamento. Em breve seu pedido será preparado para envio.'
              : 'Aguardando confirmação do pagamento.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Link
              href={`/minha-conta/pedidos/${pedido.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#00cfb5] hover:bg-[#65E5D4] text-[#032E28] font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm"
            >
              Acompanhar pedido <ArrowRight size={16} />
            </Link>
            <Link
              href="/produtos"
              className="flex-1 flex items-center justify-center gap-2 border border-[#2A3937] hover:border-[#00cfb5] text-[#B0BFBC] hover:text-[#00cfb5] font-medium px-6 py-3 rounded-xl transition-all text-sm"
            >
              Continuar comprando
            </Link>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-[#111717] rounded-2xl shadow-sm border border-[#2A3937] p-6 mb-4">
          <h2 className="text-sm font-extrabold text-[#F4F7F6] mb-4 flex items-center gap-2">
            <Package size={14} className="text-[#00cfb5]" /> Itens do pedido
          </h2>
          <div className="space-y-3">
            {pedido.itens.map((item) => {
              const img = imagemCapa(item.produto.imagens)
              return (
                <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-[#2A3937] last:border-0 last:pb-0">
                  {img ? (
                    <div className="w-14 h-14 rounded-lg border border-[#2A3937] bg-[#192221] overflow-hidden shrink-0">
                      <Image src={img} alt={item.produto.nome} width={56} height={56} className="object-contain w-full h-full" unoptimized />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg border border-[#2A3937] bg-[#192221] flex items-center justify-center shrink-0">
                      <Package size={16} className="text-[#6b7a77]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#F4F7F6] leading-snug">{item.produto.nome}</p>
                    {item.variacaoNome && <p className="text-xs text-[#8a9794] mt-0.5">{item.variacaoNome}</p>}
                    <p className="text-xs text-[#8a9794]">Qtd: {item.quantidade}</p>
                  </div>
                  <p className="text-sm font-bold text-[#F4F7F6] shrink-0">
                    {moeda(Number(item.precoUnitario) * item.quantidade)}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-[#2A3937] space-y-1.5">
            <div className="flex justify-between text-xs text-[#B0BFBC]">
              <span>Subtotal</span><span>{moeda(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#B0BFBC]">
              <span>Frete</span>
              {pedido.freteTipo === 'a_combinar' ? (
                <span className="text-amber-600 font-semibold">A combinar</span>
              ) : Number(pedido.frete) === 0 ? (
                <span className="text-green-600 font-bold">Frete Grátis</span>
              ) : (
                <span>{moeda(Number(pedido.frete))}</span>
              )}
            </div>
            {Number(pedido.desconto) > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Desconto</span><span>-{moeda(Number(pedido.desconto))}</span>
              </div>
            )}
            {descontoPix > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Desconto PIX ({DESCONTO_PIX_PCT}%)</span><span>-{moeda(descontoPix)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-[#F4F7F6] text-sm pt-2 border-t border-[#2A3937]">
              <span>Total</span><span className="text-[#00cfb5]">{moeda(Number(pedido.total))}</span>
            </div>
          </div>
        </div>

        {/* Entrega */}
        <div className="bg-[#111717] rounded-2xl shadow-sm border border-[#2A3937] p-6 mb-4">
          <h2 className="text-sm font-extrabold text-[#F4F7F6] mb-3 flex items-center gap-2">
            <Truck size={14} className="text-[#00cfb5]" /> Entrega
          </h2>
          <p className="text-xs text-[#B0BFBC] leading-relaxed">
            {pedido.endereco.logradouro}, {pedido.endereco.numero}
            {pedido.endereco.complemento ? ` — ${pedido.endereco.complemento}` : ''}<br />
            {pedido.endereco.bairro}, {pedido.endereco.cidade}/{pedido.endereco.estado} · CEP {pedido.endereco.cep}
          </p>
          <p className="text-xs text-[#8a9794] mt-3">
            Estimativa de entrega: 5–10 dias úteis após postagem.
          </p>
        </div>

        {/* Próximos passos */}
        <div className="bg-[#e8f8f7] border border-[#00cfb5]/20 rounded-2xl p-5 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-[#111717] flex items-center justify-center shrink-0 border border-[#00cfb5]/30">
            {aprovado ? <Mail size={14} className="text-[#00cfb5]" /> : <FileText size={14} className="text-[#00cfb5]" />}
          </div>
          <div className="text-xs text-[#D7E0DD] leading-relaxed">
            <p className="font-semibold text-[#F4F7F6] mb-0.5">
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
