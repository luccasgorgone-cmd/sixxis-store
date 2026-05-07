'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function DeprecatedBanner() {
  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center shrink-0">
        <Sparkles size={20} className="text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-extrabold text-amber-900">Editor descontinuado</h3>
        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
          Esta tela continua funcionando mas será removida em breve. Use o novo
          <strong> Editor Visual</strong>: preview ao vivo, abas Desktop/Tablet/Mobile,
          tudo organizado por seção da página.
        </p>
      </div>
      <Link
        href="/adm-a7f9c2b4/editor-visual"
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition"
      >
        Abrir <ArrowRight size={13} />
      </Link>
    </div>
  )
}
