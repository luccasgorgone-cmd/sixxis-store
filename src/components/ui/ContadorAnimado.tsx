'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  alvo: number
  prefixo?: string
  sufixo?: string
  duracao?: number
}

export default function ContadorAnimado({ alvo, prefixo = '', sufixo = '', duracao = 1800 }: Props) {
  // Inicia no valor alvo — SSR e pré-animação sempre mostram o número final,
  // evitando flash de "+0". Reseta para 0 e anima apenas se o elemento
  // entrar no viewport via scroll (não está visível no mount).
  const [valor, setValor] = useState<number>(alvo)
  const ref = useRef<HTMLSpanElement>(null)
  const animou = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Se já está visível no mount, mantém o valor alvo (sem reset)
    const rect = el.getBoundingClientRect()
    const jaVisivel = rect.top < window.innerHeight * 0.85 && rect.bottom > 0
    if (jaVisivel) {
      animou.current = true
      return
    }

    // Não visível: reseta para 0 e anima quando intersectar
    setValor(0)
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
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [alvo, duracao])

  return (
    <span ref={ref}>
      {prefixo}{valor.toLocaleString('pt-BR')}{sufixo}
    </span>
  )
}
