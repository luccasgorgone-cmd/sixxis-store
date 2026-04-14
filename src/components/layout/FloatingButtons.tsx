'use client'

import dynamic from 'next/dynamic'
import WhatsAppBotao from './WhatsAppBotao'

const LunaWidget = dynamic(() => import('./LunaWidget'), { ssr: false, loading: () => null })

interface Props {
  agenteAtivo:       boolean
  nome?:             string
  saudacao?:         string
  corPrimaria?:      string
  corSecundaria?:    string
  whatsappVendas?:   string
  whatsappSuporte?:  string
}

export default function FloatingButtons({
  agenteAtivo,
  nome,
  saudacao,
  corPrimaria,
  corSecundaria,
  whatsappVendas,
  whatsappSuporte,
}: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex items-end gap-3">
      {agenteAtivo && (
        <LunaWidget
          nome={nome}
          saudacao={saudacao}
          corPrimaria={corPrimaria}
          corSecundaria={corSecundaria}
          whatsappVendas={whatsappVendas}
          whatsappSuporte={whatsappSuporte}
        />
      )}
      <WhatsAppBotao />
    </div>
  )
}
