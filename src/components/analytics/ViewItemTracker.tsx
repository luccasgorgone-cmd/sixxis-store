'use client'

import { useEffect } from 'react'
import { trackViewItem, type ProdutoTracking } from '@/lib/analytics/events'

interface Props {
  produto: ProdutoTracking
}

export default function ViewItemTracker({ produto }: Props) {
  useEffect(() => {
    trackViewItem(produto)
  }, [produto.item_id])

  return null
}
