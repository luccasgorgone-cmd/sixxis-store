'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  alvo: number
  prefixo?: string
  sufixo?: string
  duracao?: number
}

export default function ContadorAnimado({ alvo, prefixo = '', sufixo = '', duracao = 1800 }: Props) {
  const [valor, setValor] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const animou = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animou.current) return
        animou.current = true
        const inicio = Date.now()
        const animar = () => {
          const prog = Math.min((Date.now() - inicio) / duracao, 1)
          const ease = 1 - Math.pow(1 - prog, 3)
          setValor(Math.round(ease * alvo))
          if (prog < 1) requestAnimationFrame(animar)
        }
        requestAnimationFrame(animar)
        observer.disconnect()
      },
      { threshold: 0.5 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [alvo, duracao])

  return (
    <span ref={ref}>
      {prefixo}{valor.toLocaleString('pt-BR')}{sufixo}
    </span>
  )
}
