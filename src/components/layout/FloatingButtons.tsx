'use client'

import dynamic from 'next/dynamic'
import WhatsAppBotao from './WhatsAppBotao'

const LunaWidget = dynamic(() => import('./LunaWidget'), { ssr: false, loading: () => null })

interface Props {
  agenteAtivo: boolean
}

export default function FloatingButtons({ agenteAtivo }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col-reverse items-end gap-3">
      <WhatsAppBotao />
      {agenteAtivo && <LunaWidget />}
    </div>
  )
}
