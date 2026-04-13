'use client'

import { useEffect, useState } from 'react'

function pad(n: number) { return String(n).padStart(2, '0') }

export default function OfertaCountdown({ targetDate }: { targetDate: string }) {
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    const target = new Date(targetDate).getTime()
    const update = () => setDiff(Math.max(0, target - Date.now()))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  if (diff === 0) return null

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 font-medium">Termina em:</span>
      {[
        { v: h, l: 'h' },
        { v: m, l: 'm' },
        { v: s, l: 's' },
      ].map(({ v, l }, i) => (
        <span key={l} className="flex items-center gap-1">
          <span className="bg-[#1a4f4a] text-white text-xs font-bold px-2 py-1 rounded tabular-nums min-w-[32px] text-center">
            {pad(v)}{l}
          </span>
          {i < 2 && <span className="text-gray-400 font-bold text-xs">:</span>}
        </span>
      ))}
    </div>
  )
}
