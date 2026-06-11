'use client'

import { useEffect } from 'react'

// Marca a árvore do admin como "não rastrear". Enquanto qualquer página do painel
// estiver montada, o TrackingProvider (na raiz) não emite NENHUM evento. É robusto
// e independe do NEXT_PUBLIC_ADMIN_PATH estar inlined no bundle do client — por
// isso complementa a exclusão por path (que cobre /api, /_next e assets).
//
// Ordem de efeitos garante a corretude na navegação SPA: este componente é filho
// do TrackingProvider, então seu efeito (set flag) roda ANTES do page_view do
// provider ao entrar no admin; e seu cleanup (reset flag) roda ANTES do page_view
// ao sair do admin para a loja.
export default function NoTrack() {
  useEffect(() => {
    const w = window as unknown as { __sixxisNoTrack?: boolean }
    w.__sixxisNoTrack = true
    return () => { w.__sixxisNoTrack = false }
  }, [])
  return null
}
