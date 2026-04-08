'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCarrinho } from '@/hooks/useCarrinho'
import axios from 'axios'

const enderecoSchema = z.object({
  cep:          z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  logradouro:   z.string().min(3),
  numero:       z.string().min(1),
  complemento:  z.string().optional(),
  bairro:       z.string().min(2),
  cidade:       z.string().min(2),
  estado:       z.string().length(2, 'Use a sigla do estado (ex: SP)'),
})

type EnderecoForm = z.infer<typeof enderecoSchema>

interface Props {
  onProximo: (enderecoId: string, frete: number) => void
}

interface OpcaoFrete {
  name: string
  price: number
  delivery_time: number
}

export default function FormEndereco({ onProximo }: Props) {
  const { itens } = useCarrinho()
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([])
  const [freteSelecionado, setFreteSelecionado] = useState<number | null>(null)
  const [carregandoFrete, setCarregandoFrete] = useState(false)
  const [erro, setErro] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EnderecoForm>({ resolver: zodResolver(enderecoSchema) })

  const cep = watch('cep')

  useEffect(() => {
    if (cep?.length === 8) {
      axios
        .get(`https://viacep.com.br/ws/${cep}/json/`)
        .then(({ data }) => {
          if (!data.erro) {
            setValue('logradouro', data.logradouro)
            setValue('bairro', data.bairro)
            setValue('cidade', data.localidade)
            setValue('estado', data.uf)
          }
        })
        .catch(() => {})
    }
  }, [cep, setValue])

  async function buscarFrete(cepDestino: string) {
    if (cepDestino.length !== 8 || itens.length === 0) return
    setCarregandoFrete(true)
    try {
      const { data } = await axios.post('/api/frete', {
        cepDestino,
        produtos: itens.map((i) => ({ id: i.produtoId, quantidade: i.quantidade })),
      })
      setOpcoesFrete(data.opcoes ?? [])
    } catch {
      setOpcoesFrete([])
    } finally {
      setCarregandoFrete(false)
    }
  }

  async function onSubmit(data: EnderecoForm) {
    if (freteSelecionado === null) {
      setErro('Selecione uma opção de frete.')
      return
    }
    setErro('')

    const res = await fetch('/api/enderecos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, principal: false }),
    })

    if (!res.ok) {
      setErro('Erro ao salvar endereço.')
      return
    }

    const { enderecoId } = await res.json()
    onProximo(enderecoId, freteSelecionado)
  }

  const campos: { name: keyof EnderecoForm; label: string; placeholder?: string; grid?: boolean }[] = [
    { name: 'cep',          label: 'CEP',                   placeholder: 'Somente números' },
    { name: 'logradouro',   label: 'Logradouro' },
    { name: 'numero',       label: 'Número' },
    { name: 'complemento',  label: 'Complemento (opcional)' },
    { name: 'bairro',       label: 'Bairro' },
    { name: 'cidade',       label: 'Cidade' },
    { name: 'estado',       label: 'Estado (UF)',            placeholder: 'Ex: SP' },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="section-title mb-6 text-xl">Endereço de Entrega</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {campos.map(({ name, label, placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <input
              {...register(name)}
              placeholder={placeholder}
              onBlur={() => name === 'cep' && buscarFrete(cep)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
            />
            {errors[name] && (
              <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>
            )}
          </div>
        ))}

        {/* Opções de frete */}
        {carregandoFrete && (
          <p className="text-sm text-[#3cbfb3] font-medium">Calculando frete...</p>
        )}
        {opcoesFrete.length > 0 && (
          <div>
            <p className="font-semibold text-sm text-[#0a0a0a] mb-3">Opções de frete</p>
            <div className="space-y-2">
              {opcoesFrete.map((op, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition ${
                    freteSelecionado === op.price
                      ? 'border-[#3cbfb3] bg-[#e8f8f7]'
                      : 'border-gray-200 hover:border-[#3cbfb3] hover:bg-[#f8f9fa]'
                  }`}
                >
                  <input
                    type="radio"
                    name="frete"
                    value={op.price}
                    onChange={() => setFreteSelecionado(op.price)}
                    checked={freteSelecionado === op.price}
                    className="accent-[#3cbfb3]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{op.name}</p>
                    <p className="text-xs text-gray-500">{op.delivery_time} dias úteis</p>
                  </div>
                  <p className="font-bold text-sm text-[#3cbfb3]">
                    {op.price === 0 ? 'Grátis' : `R$ ${op.price.toFixed(2)}`}
                  </p>
                </label>
              ))}
            </div>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Salvando...' : 'Continuar para Pagamento'}
        </button>
      </form>
    </div>
  )
}
