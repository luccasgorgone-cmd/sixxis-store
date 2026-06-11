'use client'

import { SessionProvider } from 'next-auth/react'
import { TrackingProvider } from '@/components/TrackingProvider'
import CarrinhoClienteSync from '@/components/CarrinhoClienteSync'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TrackingProvider>
        <CarrinhoClienteSync />
        {children}
      </TrackingProvider>
    </SessionProvider>
  )
}
