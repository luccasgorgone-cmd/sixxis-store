import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import { prisma } from '@/lib/prisma'

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  let logoUrl = '/logo-sixxis.png'
  try {
    const cfg = await prisma.configuracao.findUnique({ where: { chave: 'logo_url' } })
    if (cfg?.valor) logoUrl = cfg.valor
  } catch {
    // use default
  }

  return (
    <>
      <Header logoUrl={logoUrl} />
      <div className="flex-1 relative z-[1]">{children}</div>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
