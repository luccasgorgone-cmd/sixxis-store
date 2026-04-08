'use client'

import { MessageCircle } from 'lucide-react'
import { useState } from 'react'

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      {/* Tooltip */}
      {hovered && (
        <div
          className="bg-[#0a0a0a] text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
          style={{ position: 'relative' }}
        >
          Fale conosco
        </div>
      )}

      <a
        href="https://wa.me/5518997474701"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="wa-pulse w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        style={{ background: '#25D366' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <MessageCircle size={28} className="text-white" style={{ fill: 'white' }} />
      </a>
    </div>
  )
}
