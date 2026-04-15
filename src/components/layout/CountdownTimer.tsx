'use client'

import { useEffect, useState } from 'react'

interface Props { targetDate: string }

function pad(n: number) { return String(n).padStart(2, '0') }

export default function CountdownTimer({ targetDate }: Props) {
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    const target = new Date(targetDate).getTime()
    const update = () => setDiff(Math.max(0, target - Date.now()))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  const blocks = [
    { label: 'Dias',    value: d },
    { label: 'Horas',   value: h },
    { label: 'Min',     value: m },
    { label: 'Seg',     value: s },
  ]

  if (diff === 0) return null

  return (
    <div className="inline-flex items-center gap-3">
      {blocks.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="text-center">
            <div className="timer-block bg-white/10 border border-white/20 rounded-xl flex items-center justify-center" style={{ minWidth: 'clamp(48px, 9vw, 60px)', padding: '0.5rem 1rem' }}>
              <p className="timer-value text-2xl font-extrabold text-white tabular-nums">{pad(value)}</p>
            </div>
            <p className="text-white/50 text-xs mt-1">{label}</p>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-white/40 text-2xl font-bold mb-5">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
