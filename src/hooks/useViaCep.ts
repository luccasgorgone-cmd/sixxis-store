'use client'

import { useCallback, useRef, useState } from 'react'

export interface ViaCepResult {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  estado: string
  /** True quando ViaCEP retorna {erro: true} ou rede falhou. */
  notFound: boolean
}

const cache = new Map<string, ViaCepResult>()

/**
 * Hook gratuito ViaCEP — busca endereço por CEP, com debounce, cache de
 * sessão (memória do processo) e estado de loading. Não bloqueia digitação
 * manual. Retorna `notFound: true` em CEPs inexistentes ou falha de rede.
 */
export function useViaCep() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ViaCepResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimoRef = useRef<string>('')

  const buscar = useCallback((cepRaw: string, debounceMs = 300) => {
    const cep = cepRaw.replace(/\D/g, '')
    if (timerRef.current) clearTimeout(timerRef.current)
    if (cep.length !== 8) {
      setResult(null)
      setError(null)
      return
    }
    if (cache.has(cep)) {
      const r = cache.get(cep)!
      setResult(r)
      setError(r.notFound ? 'CEP não encontrado' : null)
      return
    }
    setLoading(true)
    setError(null)
    ultimoRef.current = cep

    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await r.json()
        // Outra requisição mais nova já partiu — ignorar.
        if (ultimoRef.current !== cep) return
        if (!r.ok || data?.erro) {
          const fail: ViaCepResult = {
            cep, logradouro: '', bairro: '', cidade: '', estado: '', notFound: true,
          }
          cache.set(cep, fail)
          setResult(fail)
          setError('CEP não encontrado, preencha manualmente')
        } else {
          const ok: ViaCepResult = {
            cep,
            logradouro: data.logradouro ?? '',
            bairro: data.bairro ?? '',
            cidade: data.localidade ?? '',
            estado: data.uf ?? '',
            notFound: false,
          }
          cache.set(cep, ok)
          setResult(ok)
        }
      } catch {
        if (ultimoRef.current !== cep) return
        setError('Falha ao consultar CEP, preencha manualmente')
      } finally {
        if (ultimoRef.current === cep) setLoading(false)
      }
    }, debounceMs)
  }, [])

  return { buscar, loading, result, error }
}
