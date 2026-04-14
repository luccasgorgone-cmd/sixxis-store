'use client'

import dynamic from 'next/dynamic'

const LunaChat = dynamic(() => import('@/components/agente/LunaChat'), {
  ssr: false,
  loading: () => null,
})

export default LunaChat
