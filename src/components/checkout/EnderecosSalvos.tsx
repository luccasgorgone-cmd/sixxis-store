'use client'

import { useEffect, useState } from 'react'
import { Plus, MapPin, Loader2 } from 'lucide-react'

export interface EnderecoSalvo {
  id: string
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  principal: boolean
}

interface Props {
  selecionadoId: string | null
  /** Disparado quando o cliente escolhe um endereço salvo. */
  onSelecionar: (e: EnderecoSalvo) => void
  /** Disparado para o pai abrir o formulário de novo endereço. */
  onNovoEndereco: () => void
  /** Quando o pai já está mostrando o formulário, mantém o card "novo" destacado. */
  mostrandoFormulario: boolean
}

export default function EnderecosSalvos({
  selecionadoId, onSelecionar, onNovoEndereco, mostrandoFormulario,
}: Props) {
  const [enderecos, setEnderecos] = useState<EnderecoSalvo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/enderecos', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return { enderecos: [] }
        return r.json()
      })
      .then((d) => {
        const lista: EnderecoSalvo[] = d.enderecos ?? []
        setEnderecos(lista)
        // Auto-seleciona o principal (ou o primeiro) se ainda não tem nada escolhido.
        if (!selecionadoId && !mostrandoFormulario && lista.length > 0) {
          const principal = lista.find((e) => e.principal) ?? lista[0]
          onSelecionar(principal)
        }
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
        <Loader2 size={14} className="animate-spin" /> Carregando endereços salvos…
      </div>
    )
  }

  if (enderecos.length === 0) return null

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        <MapPin size={11} /> Seus endereços
      </p>

      {enderecos.map((e) => {
        const ativo = selecionadoId === e.id && !mostrandoFormulario
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onSelecionar(e)}
            className={`w-full text-left rounded-xl border-2 px-4 py-3 transition ${
              ativo
                ? 'border-sx-accent bg-sx-tint'
                : 'border-gray-200 hover:border-sx-accent/40 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">
                    {e.logradouro}, {e.numero}
                    {e.complemento ? ` — ${e.complemento}` : ''}
                  </p>
                  {e.principal && (
                    <span className="text-[10px] uppercase font-bold bg-sx-accent text-sx-ink px-1.5 py-0.5 rounded">
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {e.bairro} • {e.cidade}/{e.estado} • CEP {e.cep}
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                ativo ? 'border-sx-accent' : 'border-gray-300'
              }`}>
                {ativo && <div className="w-2 h-2 rounded-full bg-sx-accent" />}
              </div>
            </div>
          </button>
        )
      })}

      <button
        type="button"
        onClick={onNovoEndereco}
        className={`w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-xl border-2 border-dashed py-3 transition ${
          mostrandoFormulario
            ? 'border-sx-accent text-sx-accent-text bg-sx-tint'
            : 'border-gray-200 text-gray-500 hover:border-sx-accent/50 hover:text-sx-accent-text'
        }`}
      >
        <Plus size={14} /> Adicionar novo endereço
      </button>
    </div>
  )
}
