'use client'

import { useState, useEffect } from 'react'
import { Truck, MapPin, Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface FreteOpcao {
  tipo: string
  prazo: string
  preco: number | null
}

interface Props {
  produtoId?: string
  peso?: number
}

export default function CalcFrete({ produtoId, peso = 15 }: Props) {
  const [cep, setCep] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ localidade: string; bairro?: string; opcoes: FreteOpcao[] } | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const cepSalvo = localStorage.getItem('sixxis_cep') || ''
    if (!cepSalvo) return
    if (/^16015-?480$/.test(cepSalvo)) {
      localStorage.removeItem('sixxis_cep')
      return
    }
    const cepLimpo = cepSalvo.replace(/\D/g, '')
    setCep(cepLimpo)
    if (cepLimpo.length === 8) {
      calcularFrete(cepLimpo)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const calcularFrete = async (cepParam?: string) => {
    const cepNumeros = (cepParam || cep).replace(/\D/g, '')
    if (cepNumeros.length !== 8) {
      setErro('Digite um CEP válido com 8 dígitos.')
      return
    }

    setLoading(true)
    setErro('')
    setResultado(null)

    try {
      const viaCep = await fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`)
      const dadosCep = await viaCep.json()

      if (dadosCep.erro) {
        setErro('CEP não encontrado. Verifique e tente novamente.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/frete/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cepNumeros, produtoId, peso }),
      })
      const data = await res.json()

      localStorage.setItem('sixxis_cep', cepNumeros.slice(0, 5) + '-' + cepNumeros.slice(5))

      setResultado({
        localidade: `${dadosCep.localidade} - ${dadosCep.uf}`,
        bairro: dadosCep.bairro,
        opcoes: data.opcoes || [],
      })
    } catch {
      setErro('Erro ao calcular o frete. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleConsultar = () => {
    setResultado(null)
    calcularFrete()
  }

  const cepFormatado = cep.length >= 5
    ? cep.slice(0, 5) + (cep.length > 5 ? '-' + cep.slice(5) : '')
    : cep

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">

      {/* Label */}
      <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
        <Truck size={15} className="text-[#3cbfb3]" />
        Calcular frete e prazo de entrega
      </p>

      {/* Input + Botão */}
      <div className="flex gap-2 mb-1">
        <div className="relative flex-1">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            inputMode="numeric"
            value={cepFormatado}
            onChange={e => {
              const nums = e.target.value.replace(/\D/g, '').slice(0, 8)
              setCep(nums)
              setResultado(null)
              setErro('')
            }}
            onKeyDown={e => e.key === 'Enter' && handleConsultar()}
            placeholder="00000-000"
            maxLength={9}
            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-transparent bg-white transition"
          />
        </div>
        <button
          onClick={handleConsultar}
          disabled={loading || cep.length < 8}
          className="flex items-center gap-1.5 bg-[#0f2e2b] hover:bg-[#1a4f4a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl text-sm transition active:scale-95"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
          {loading ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-[#3cbfb3] hover:text-[#2a9d8f] transition underline"
      >
        Não sei meu CEP
      </a>

      {/* Erro */}
      {erro && (
        <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{erro}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-3 space-y-2 animate-pulse">
          <div className="h-3 bg-gray-200 rounded-full w-2/3" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      )}

      {/* Resultado */}
      {resultado && !loading && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle size={13} className="text-[#3cbfb3]" />
            <p className="text-xs text-gray-600">
              Entrega para: <strong className="text-gray-900">{resultado.localidade}</strong>
              {resultado.bairro && ` — ${resultado.bairro}`}
            </p>
          </div>

          <div className="space-y-2">
            {resultado.opcoes.map((op, i) => (
              <div key={i}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3.5 py-3 hover:border-[#3cbfb3]/30 transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#f8f9fa] rounded-lg flex items-center justify-center">
                    <Truck size={14} className="text-[#3cbfb3]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{op.tipo}</p>
                    <p className="text-[10px] text-gray-500">{op.prazo}</p>
                  </div>
                </div>
                <div className="text-right">
                  {op.preco === 0 || op.preco === null ? (
                    <p className="text-sm font-extrabold text-green-600">GRÁTIS</p>
                  ) : (
                    <p className="text-sm font-extrabold text-gray-900">
                      R$ {op.preco.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Frete grátis para pedidos acima de R$ 500,00
          </p>
        </div>
      )}
    </div>
  )
}
