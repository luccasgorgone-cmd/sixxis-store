'use client'

import { useState } from 'react'
import { Ruler, Eye, Loader2, Check, AlertTriangle, ChevronDown } from 'lucide-react'

interface Linha {
  label: string
  ids: string[]
  medida: {
    pesoKg: number
    alturaCm: number
    larguraCm: number
    comprimentoCm: number
    volumes: number
  }
  casou: boolean
  produtoNome?: string
  produtoSku?: string | null
  produtoSlug?: string | null
  via?: string
  jaAtualizado?: boolean
}

interface Resposta {
  ok: boolean
  modo: 'preview' | 'aplicar'
  total: number
  casados?: number
  naoCasaram: number
  atualizados?: number
  jaEstavam?: number
  linhas: Linha[]
}

const ENDPOINT = '/api/admin/produtos/importar-dimensoes'

function medidaTxt(m: Linha['medida']) {
  return `${m.pesoKg} kg · A${m.alturaCm} · L${m.larguraCm} · C${m.comprimentoCm} · ${m.volumes} vol`
}

export default function ImportarDimensoes() {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState<'preview' | 'aplicar' | null>(null)
  const [resp, setResp] = useState<Resposta | null>(null)
  const [aplicado, setAplicado] = useState(false)
  const [erro, setErro] = useState('')

  const chamar = async (modo: 'preview' | 'aplicar') => {
    setCarregando(modo)
    setErro('')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo }),
      })
      const data = (await res.json()) as Resposta & { error?: string }
      if (!res.ok || !data.ok) {
        setErro(data.error ?? 'Falha ao processar. Tente novamente.')
        return
      }
      setResp(data)
      setAplicado(modo === 'aplicar')
    } catch {
      setErro('Erro de rede. Tente novamente.')
    } finally {
      setCarregando(null)
    }
  }

  const podeAplicar = !!resp && !aplicado && carregando === null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Cabeçalho clicável */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3cbfb3]/10 flex items-center justify-center shrink-0">
            <Ruler className="w-4 h-4 text-[#3cbfb3]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Importar dimensões (frete)</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Preenche peso e medidas dos produtos a partir da tabela padrão
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-amber-800 leading-relaxed">
              Medidas em <strong>cm</strong> e peso em <strong>kg</strong>. As dimensões valem
              por produto — as variações (110/220, cor) herdam. <strong>Sobrescreve</strong> o que
              estiver preenchido nos produtos que casarem. Rode <strong>Pré-visualizar</strong> antes
              de aplicar. Aplicar de novo é seguro (não duplica nada).
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => chamar('preview')}
              disabled={carregando !== null}
              className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-50"
            >
              {carregando === 'preview' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Pré-visualizar
            </button>
            <button
              type="button"
              onClick={() => chamar('aplicar')}
              disabled={!podeAplicar}
              className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
              title={!resp ? 'Rode a pré-visualização primeiro' : undefined}
            >
              {carregando === 'aplicar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Aplicar
            </button>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
              {erro}
            </div>
          )}

          {resp && (
            <>
              {/* Resumo */}
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                {aplicado ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full px-3 py-1">
                    <Check className="w-3 h-3" /> {resp.atualizados} atualizados
                    {resp.jaEstavam ? ` (${resp.jaEstavam} já estavam)` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-[#3cbfb3]/10 text-[#2a9d8f] font-semibold rounded-full px-3 py-1">
                    <Eye className="w-3 h-3" /> {resp.casados} casaram
                  </span>
                )}
                {resp.naoCasaram > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-semibold rounded-full px-3 py-1">
                    <AlertTriangle className="w-3 h-3" /> {resp.naoCasaram} não encontrados
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 font-semibold rounded-full px-3 py-1">
                  {resp.total} linhas na tabela
                </span>
              </div>

              {/* Tabela de de-para */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Item</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Produto casado</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Medida a aplicar</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {resp.linhas.map((l) => (
                      <tr key={l.label} className={l.casou ? '' : 'bg-amber-50/40'}>
                        <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">{l.label}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {l.casou ? (
                            <div>
                              <p className="text-gray-800">{l.produtoNome}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{l.via}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">— (tentou: {l.ids.join(', ')})</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{medidaTxt(l.medida)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {!l.casou ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
                              <AlertTriangle className="w-3 h-3" /> Não encontrado
                            </span>
                          ) : aplicado ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                              <Check className="w-3 h-3" /> Aplicado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#2a9d8f] text-xs font-semibold">
                              <Check className="w-3 h-3" /> Casou{l.jaAtualizado ? ' (já igual)' : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
