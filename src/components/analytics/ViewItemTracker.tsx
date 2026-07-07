'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackViewItem, type ProdutoTracking } from '@/lib/analytics/events'

interface Props {
  produto: ProdutoTracking
}

export default function ViewItemTracker({ produto }: Props) {
  const pathname = usePathname()

  // Dispara ViewContent/view_item a cada produto exibido — INCLUINDO troca de
  // rota SPA (App Router não recarrega a página, então o snippet base só conta o
  // 1º load). Depende de pathname além do item_id: garante o disparo em toda
  // navegação para uma página de produto. item_id e pathname mudam juntos numa
  // navegação produto→produto, então o efeito roda uma única vez (sem duplicar).
  useEffect(() => {
    trackViewItem(produto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto.item_id, pathname])

  return null
}
