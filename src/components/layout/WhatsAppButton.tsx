'use client'

import { MessageCircle } from 'lucide-react'
import { useState } from 'react'

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      {/* Tooltip */}
      {hovered && (
        <div className="bg-[#0a0a0a] text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
          Fale conosco
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-[#0a0a0a]" />
        </div>
      )}

      <a
        href="https://wa.me/5518999999999"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="wa-pulse w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <MessageCircle size={28} className="text-white fill-white" />
      </a>
    </div>
  )
}
