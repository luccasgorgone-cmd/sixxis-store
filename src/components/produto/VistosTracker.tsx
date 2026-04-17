'use client'

import { useEffect } from 'react'
import { useVistos } from '@/hooks/useListas'

export default function VistosTracker({ produtoId }: { produtoId: string }) {
  const registrar = useVistos((s) => s.registrar)
  useEffect(() => {
    if (produtoId) registrar(produtoId)
  }, [produtoId, registrar])
  return null
}
