import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import CardProduto from '@/components/produto/CardProduto'
import { Wrench } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Peças de Reposição — Sixxis Store',
  description: 'Peças originais de reposição para produtos Sixxis. Climatizadores, aspiradores e equipamentos fitness.',
}

export default async function PecasPage() {
  const pecas = await prisma.produto.findMany({
    where:   { ativo: true, categoria: 'pecas' },
    orderBy: { nome: 'asc' },
  })

  return (
    <main className="bg-white">
      {/* Hero */}
      <section
        className="py-14 md:py-18"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-5">
            <Wrench size={14} />
            Peças Originais Sixxis
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Peças de Reposição
          </h1>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Encontre peças originais para climatizadores, aspiradores e spinning Sixxis com garantia total.
          </p>
        </div>
      </section>

      {/* Produtos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {pecas.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <div className="w-14 h-14 rounded-full bg-[#e8f8f7] flex items-center justify-center mx-auto mb-4">
              <Wrench size={24} className="text-[#3cbfb3]" />
            </div>
            <p className="text-gray-500 font-medium">Nenhuma peça disponível no momento.</p>
            <p className="text-sm text-gray-400 mt-1">
              Entre em contato para verificar disponibilidade de peças específicas.
            </p>
            <a
              href="https://wa.me/5518997474701"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-6 inline-flex"
            >
              Consultar via WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {pecas.map((peca) => (
              <CardProduto key={peca.id} produto={peca} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
