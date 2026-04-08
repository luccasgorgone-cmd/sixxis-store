'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FaqItem {
  q: string
  a: string
}

interface Props {
  items: FaqItem[]
}

function Item({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-[#f8f9fa] transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-[#0a0a0a] text-sm sm:text-base leading-snug">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#3cbfb3] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 pt-2 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-[#fafafa]">
          {a}
        </div>
      )}
    </div>
  )
}

export default function FaqAccordion({ items }: Props) {
  return (
    <div className="space-y-3">
      {items.map(({ q, a }) => (
        <Item key={q} q={q} a={a} />
      ))}
    </div>
  )
}
