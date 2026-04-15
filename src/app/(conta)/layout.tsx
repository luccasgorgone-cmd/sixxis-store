import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'
import CookieBanner from '@/components/cookies/CookieBanner'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: { template: '%s — Minha Conta | Sixxis Store', default: 'Minha Conta — Sixxis Store' },
  robots: { index: false },
}

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  let logoUrl = '/logo-sixxis.png'

  const cfgList = await prisma.configuracao.findMany({
    where: { chave: { in: ['logo_url', 'agente_ativo'] } },
  }).catch(() => [])

  const cfg = Object.fromEntries(cfgList.map((c) => [c.chave, c.valor]))
  if (cfg.logo_url) logoUrl = cfg.logo_url

  return (
    <div className="relative min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
      <Header logoUrl={logoUrl} />
      <div className="flex-1">{children}</div>
      <Footer />
      <FloatingButtons agenteAtivo={cfg.agente_ativo === 'true'} />
      <CookieBanner />
    </div>
  )
}
