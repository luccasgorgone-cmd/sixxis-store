'use client'

import { useEffect, useState, useRef } from 'react'

export type HeaderState = 'top' | 'compact' | 'hidden' | 'reveal'

/**
 * Smart header scroll state machine.
 * - top: scrollY === 0 (full announcement + expanded header)
 * - compact: scrolled but not hiding (smaller header, no announcement)
 * - hidden: scrolling down past threshold (translate-y-full)
 * - reveal: scrolling up from hidden (returning to compact)
 */
export function useScrollHeader(hideThreshold = 120) {
  const [state, setState] = useState<HeaderState>('top')
  const lastY = useRef(0)
  const rafId = useRef(0)
  const ticking = useRef(false)
  const DELTA = 5

  useEffect(() => {
    const update = () => {
      const y = window.scrollY
      const delta = y - lastY.current

      if (y <= 0) {
        setState('top')
      } else if (delta < -DELTA) {
        setState('reveal')
      } else if (delta > DELTA && y > hideThreshold) {
        setState('hidden')
      } else if (y > 0 && Math.abs(delta) <= DELTA) {
        setState(prev => (prev === 'top' ? 'compact' : prev))
      }

      lastY.current = y
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        rafId.current = requestAnimationFrame(update)
        ticking.current = true
      }
    }

    if (window.scrollY === 0) setState('top')
    else setState('compact')
    lastY.current = window.scrollY

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId.current)
    }
  }, [hideThreshold])

  return state
}
