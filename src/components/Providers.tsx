'use client'

import { SessionProvider } from 'next-auth/react'
import { TrackingProvider } from '@/components/TrackingProvider'
import CarrinhoClienteSync from '@/components/CarrinhoClienteSync'
import SessaoBloqueadaGuard from '@/components/SessaoBloqueadaGuard'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TrackingProvider>
        <SessaoBloqueadaGuard />
        <CarrinhoClienteSync />
        {children}
      </TrackingProvider>
    </SessionProvider>
  )
}
