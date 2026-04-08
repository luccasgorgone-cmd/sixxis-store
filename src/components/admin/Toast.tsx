'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Pequeno delay para disparar a transição CSS
    const r = requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(onClose, 3000)
    return () => {
      cancelAnimationFrame(r)
      clearTimeout(t)
    }
  }, [onClose])

  return (
    <div
      className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white max-w-sm transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-16 opacity-0'
      } ${type === 'success' ? 'border-green-200' : 'border-red-200'}`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
      )}
      <span className="text-sm font-medium text-gray-800 flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-gray-300 hover:text-gray-500 transition shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
