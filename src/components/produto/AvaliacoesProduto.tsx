'use client'

import { useState, useEffect, useRef } from 'react'
import { Star, Camera, MessageSquare, User, X } from 'lucide-react'
import EstrelasNota from '@/components/ui/EstrelasNota'
import Image from 'next/image'

interface AvaliacaoFoto {
  id: string
  url: string
}

interface Avaliacao {
  id: string
  nota: number
  titulo: string | null
  comentario: string | null
  nomeAutor: string
  createdAt: string
  aprovada: boolean
  destaque: boolean
  resposta: string | null
  respostaEm: string | null
  fotos: AvaliacaoFoto[]
  cliente: { nome: string } | null
}

interface Props {
  produtoId: string
}

const LABELS: Record<number, string> = { 1: 'Péssimo', 2: 'Ruim', 3: 'Regular', 4: 'Bom', 5: 'Excelente!' }

const VISIVEIS_INICIAL = 3

export default function AvaliacoesProduto({ produtoId }: Props) {
  const [data, setData] = useState<{
    avaliacoes: Avaliacao[]
    media: number
    total: number
    distribuicao: { nota: number; count: number }[]
  } | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erroForm, setErroForm] = useState('')
  const [form, setForm] = useState({ nota: 0, nomeAutor: '', emailAutor: '', titulo: '', comentario: '' })
  const [fotosFiles, setFotosFiles] = useState<File[]>([])
  const [fotosPreview, setFotosPreview] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/avaliacoes?produtoId=${produtoId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [produtoId])

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - fotosFiles.length)
    const previews = files.map((f) => URL.createObjectURL(f))
    setFotosFiles((prev) => [...prev, ...files])
    setFotosPreview((prev) => [...prev, ...previews])
  }

  function removerFoto(i: number) {
    URL.revokeObjectURL(fotosPreview[i])
    setFotosFiles((prev) => prev.filter((_, idx) => idx !== i))
    setFotosPreview((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleEnviar() {
    if (!form.nota || !form.comentario.trim() || !form.nomeAutor.trim()) {
      setErroForm('Preencha nota, nome e comentário.')
      return
    }
    setErroForm('')
    setEnviando(true)

    try {
      const res = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId,
          nota:       form.nota,
          titulo:     form.titulo || undefined,
          comentario: form.comentario,
          nomeAutor:  form.nomeAutor,
          emailAutor: form.emailAutor || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setErroForm(json.erro || 'Erro ao enviar.'); setEnviando(false); return }

      // Upload fotos se houver
      if (fotosFiles.length > 0 && json.avaliacao?.id) {
        for (const file of fotosFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('avaliacaoId', json.avaliacao.id)
          await fetch('/api/avaliacoes/fotos', { method: 'POST', body: fd })
        }
      }

      setEnviado(true)
    } catch {
      setErroForm('Erro de rede. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (!data) return null

  const { avaliacoes, media, total, distribuicao } = data

  const avaliacoesExibidas = expandida ? data.avaliacoes : data.avaliacoes.slice(0, VISIVEIS_INICIAL)
  const temMais = data.avaliacoes.length > VISIVEIS_INICIAL

  // Mapa de distribuição por estrela (1-5)
  const distMap = Object.fromEntries(data.distribuicao.map(d => [d.nota, d.count]))

  return (
    <div className="mt-2">
      <h3 className="text-xl font-extrabold text-gray-900 mb-6">Avaliações dos Clientes</h3>

      {/* ── Resumo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2e2b] to-[#1a4f4a] rounded-2xl p-8 text-white">
          <span className="text-6xl font-black leading-none mb-2">{total > 0 ? media.toFixed(1) : '—'}</span>
          <div className="flex gap-1 mb-2">
            <EstrelasNota nota={media} size={20} />
          </div>
          <span className="text-white/70 text-sm">{total} avaliação{total !== 1 ? 'ões' : ''}</span>
        </div>
        <div className="lg:col-span-2 flex flex-col justify-center gap-2">
          {distribuicao.map(({ nota, count }) => {
            const pct = total > 0 ? (count / total) * 100 : 0
            return (
              <div key={nota} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12 shrink-0">
                  <span className="text-sm font-bold text-gray-700">{nota}</span>
                  <Star size={13} className="text-[#f59e0b] fill-[#f59e0b]" />
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-[#f59e0b] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right shrink-0">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Botão abrir form ── */}
      {!formAberto && !enviado && (
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setFormAberto(true)}
            className="flex items-center gap-2 text-white font-bold px-8 py-3.5 rounded-2xl transition shadow-lg hover:opacity-90 hover:-translate-y-0.5"
            style={{ backgroundColor: '#2a9d8f' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            Deixar minha avaliação
          </button>
        </div>
      )}

      {/* ── Formulário ── */}
      {formAberto && !enviado && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-extrabold text-gray-900">Sua Avaliação</h4>
            <button onClick={() => setFormAberto(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition">
              <X size={18} />
            </button>
          </div>

          {/* Estrelas */}
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-700 mb-2">Sua nota *</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, nota: n }))} className="transition-transform hover:scale-110">
                  <Star size={32} className={n <= form.nota ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200 fill-gray-200 hover:text-[#f59e0b]'} />
                </button>
              ))}
            </div>
            {form.nota > 0 && <p className="text-sm text-[#3cbfb3] font-semibold mt-1">{LABELS[form.nota]}</p>}
          </div>

          {/* Nome + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1.5">Nome *</label>
              <input type="text" value={form.nomeAutor} onChange={(e) => setForm((f) => ({ ...f, nomeAutor: e.target.value }))}
                placeholder="Seu nome" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none bg-white" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1.5">E-mail</label>
              <input type="email" value={form.emailAutor} onChange={(e) => setForm((f) => ({ ...f, emailAutor: e.target.value }))}
                placeholder="seu@email.com (não exibido)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none bg-white" />
            </div>
          </div>

          {/* Título */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Título</label>
            <input type="text" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: Produto excelente!" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none bg-white" />
          </div>

          {/* Comentário */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Comentário *</label>
            <textarea value={form.comentario} onChange={(e) => setForm((f) => ({ ...f, comentario: e.target.value }))}
              rows={4} placeholder="Conte sua experiência..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#3cbfb3] outline-none bg-white resize-none" />
          </div>

          {/* Fotos */}
          <div className="mb-5">
            <label className="text-sm font-bold text-gray-700 block mb-2">Fotos (opcional)</label>
            <div className="flex flex-wrap gap-2">
              {fotosPreview.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button onClick={() => removerFoto(i)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    ×
                  </button>
                </div>
              ))}
              {fotosPreview.length < 5 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#3cbfb3] flex flex-col items-center justify-center cursor-pointer transition bg-gray-50 hover:bg-[#e8f8f7]">
                  <Camera size={16} className="text-gray-400" />
                  <span className="text-[9px] text-gray-400 mt-0.5">Foto</span>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFotos} />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Máximo 5 fotos • JPG, PNG, WebP</p>
          </div>

          {erroForm && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">{erroForm}</p>}

          <div className="flex gap-3">
            <button onClick={handleEnviar} disabled={enviando}
              className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl transition flex items-center gap-2">
              {enviando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Enviando...</>
                : <><Star size={16} fill="white" />Enviar Avaliação</>
              }
            </button>
            <button onClick={() => setFormAberto(false)} className="border border-gray-200 text-gray-600 font-semibold px-5 py-3 rounded-2xl hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Sua avaliação será publicada após revisão da equipe Sixxis.</p>
        </div>
      )}

      {/* ── Sucesso ── */}
      {enviado && (
        <div className="bg-[#e8f8f7] border border-[#3cbfb3]/30 rounded-2xl p-5 text-center mb-8">
          <p className="text-[#3cbfb3] font-bold text-lg">⭐ Avaliação enviada!</p>
          <p className="text-sm text-gray-600 mt-1">Será publicada após análise da nossa equipe. Obrigado!</p>
        </div>
      )}

      {/* ── Lista ── */}
      {avaliacoes.length > 0 && (
        <div className="space-y-4">
          {avaliacoes.map((av) => {
            const nomeExibido = av.nomeAutor || av.cliente?.nome || 'Anônimo'
            return (
              <div key={av.id}
                className={`bg-white rounded-2xl border p-5${av.destaque ? ' border-[#3cbfb3]/40 shadow-sm shadow-[#3cbfb3]/10' : ' border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e8f8f7] flex items-center justify-center shrink-0">
                      <User size={18} className="text-[#3cbfb3]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{nomeExibido}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(av.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {av.destaque && (
                      <span className="bg-[#e8f8f7] text-[#1a4f4a] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#3cbfb3]/20">
                        DESTAQUE
                      </span>
                    )}
                    <EstrelasNota nota={av.nota} size={13} />
                  </div>
                </div>
                {av.titulo && <p className="font-bold text-gray-900 text-sm mb-1">{av.titulo}</p>}
                {av.comentario && <p className="text-gray-600 text-sm leading-relaxed mb-3">{av.comentario}</p>}
                {av.fotos?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {av.fotos.map((foto) => (
                      <div key={foto.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100">
                        <Image src={foto.url} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                )}
                {av.resposta && (
                  <div className="bg-[#e8f8f7] border border-[#3cbfb3]/20 rounded-xl p-4 mt-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#3cbfb3] flex items-center justify-center">
                        <MessageSquare size={12} className="text-white" />
                      </div>
                      <p className="text-xs font-bold text-[#1a4f4a]">Resposta da Sixxis</p>
                    </div>
                    <p className="text-[#2a9d8f] text-sm leading-relaxed">{av.resposta}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
