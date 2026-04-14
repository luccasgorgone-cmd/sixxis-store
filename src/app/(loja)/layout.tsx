import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import LunaChat from '@/components/agente/LunaChatWrapper'
import { prisma } from '@/lib/prisma'

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  let logoUrl = '/logo-sixxis.png'

  // Configs do layout + agente numa única query
  const cfgList = await prisma.configuracao.findMany({
    where: {
      chave: {
        in: [
          'logo_url',
          'agente_ativo', 'agente_nome', 'agente_saudacao',
          'agente_cor_primaria', 'agente_cor_secundaria',
          'agente_whatsapp_vendas', 'agente_whatsapp_suporte',
        ],
      },
    },
  }).catch(() => [])

  const cfg = Object.fromEntries(cfgList.map((c) => [c.chave, c.valor]))
  if (cfg.logo_url) logoUrl = cfg.logo_url

  return (
    <>
      <Header logoUrl={logoUrl} />
      <div className="flex-1 relative z-[1]">{children}</div>
      <Footer />
      <WhatsAppButton />
      {cfg.agente_ativo === 'true' && (
        <LunaChat
          nome={cfg.agente_nome}
          saudacao={cfg.agente_saudacao}
          corPrimaria={cfg.agente_cor_primaria}
          corSecundaria={cfg.agente_cor_secundaria}
          whatsappVendas={cfg.agente_whatsapp_vendas}
          whatsappSuporte={cfg.agente_whatsapp_suporte}
        />
      )}
    </>
  )
}
