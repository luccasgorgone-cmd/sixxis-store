'use client'

import { useEffect, useState } from 'react'
import LayoutConta from '@/components/conta/LayoutConta'
import { User, Palette, Bell, Save, Loader2, Check } from 'lucide-react'

type Tab = 'dados' | 'avatar' | 'notificacoes'

const AVATARS_PREDEFINIDOS = [
  { id: 'inicial', label: 'Inicial' },
  { id: '😊', label: 'Feliz' },
  { id: '🚀', label: 'Foguete' },
  { id: '⚡', label: 'Raio' },
  { id: '🌟', label: 'Estrela' },
  { id: '🔥', label: 'Fogo' },
  { id: '💎', label: 'Diamante' },
  { id: '🌊', label: 'Onda' },
  { id: '🎯', label: 'Alvo' },
  { id: '🦁', label: 'Leão' },
  { id: '🐉', label: 'Dragão' },
  { id: '🎮', label: 'Jogo' },
]

const GRADIENTES_AVATAR = [
  { id: 'tiffany', label: 'Tiffany', gradiente: 'linear-gradient(145deg, #0f2e2b, #3cbfb3)', cor: '#3cbfb3' },
  { id: 'blue',    label: 'Azul',    gradiente: 'linear-gradient(145deg, #1e3a5f, #3b82f6)', cor: '#3b82f6' },
  { id: 'purple',  label: 'Roxo',    gradiente: 'linear-gradient(145deg, #3b1f6b, #8b5cf6)', cor: '#8b5cf6' },
  { id: 'rose',    label: 'Rosa',    gradiente: 'linear-gradient(145deg, #6b1f3a, #f43f5e)', cor: '#f43f5e' },
  { id: 'orange',  label: 'Laranja', gradiente: 'linear-gradient(145deg, #6b3010, #f97316)', cor: '#f97316' },
  { id: 'dark',    label: 'Dark',    gradiente: 'linear-gradient(145deg, #111827, #374151)', cor: '#374151' },
]

export default function PerfilPage() {
  const [abaAtiva, setAbaAtiva] = useState<Tab>('dados')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [msgErr, setMsgErr]     = useState(false)

  // campos
  const [nome, setNome]               = useState('')
  const [email, setEmail]             = useState('')
  const [telefone, setTelefone]       = useState('')
  const [dataNasc, setDataNasc]       = useState('')
  const [genero, setGenero]           = useState('')
  const [avatarEmoji, setAvatarEmoji] = useState('inicial')
  const [gradiente, setGradiente]     = useState('tiffany')
  const [notifEmail, setNotifEmail]   = useState(true)
  const [notifWpp, setNotifWpp]       = useState(false)

  useEffect(() => {
    fetch('/api/conta/perfil')
      .then(r => r.json())
      .then(d => {
        const c = d.cliente ?? d
        setNome(c.nome || '')
        setEmail(c.email || '')
        setTelefone(c.telefone || '')
        setDataNasc(c.dataNascimento ? c.dataNascimento.slice(0, 10) : '')
        setGenero(c.genero || '')
        setAvatarEmoji(c.avatar || 'inicial')
        setGradiente(c.avatarGradiente || 'tiffany')
        setNotifEmail(c.notifEmail ?? true)
        setNotifWpp(c.notifWhatsapp ?? false)
      })
      .finally(() => setLoading(false))
  }, [])

  async function salvar() {
    setSaving(true); setMsg('')
    const payload: Record<string, unknown> = {}
    if (abaAtiva === 'dados') {
      payload.nome = nome
      payload.telefone = telefone
      payload.dataNascimento = dataNasc || null
      payload.genero = genero || null
    } else if (abaAtiva === 'avatar') {
      payload.avatar = avatarEmoji
      payload.avatarGradiente = gradiente
    } else {
      payload.notifEmail = notifEmail
      payload.notifWhatsapp = notifWpp
    }
    const res = await fetch('/api/conta/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setMsgErr(!res.ok)
    setMsg(res.ok ? 'Salvo com sucesso!' : 'Erro ao salvar.')
    if (res.ok) setTimeout(() => setMsg(''), 3000)
  }

  const gradConf = GRADIENTES_AVATAR.find(g => g.id === gradiente) ?? GRADIENTES_AVATAR[0]
  const avatarDisplay = avatarEmoji === 'inicial'
    ? (nome?.[0]?.toUpperCase() ?? '?')
    : avatarEmoji

  const ABAS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dados',        label: 'Dados pessoais', icon: <User size={15} /> },
    { id: 'avatar',       label: 'Avatar',         icon: <Palette size={15} /> },
    { id: 'notificacoes', label: 'Notificações',   icon: <Bell size={15} /> },
  ]

  if (loading) return (
    <LayoutConta>
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#3cbfb3]" />
      </div>
    </LayoutConta>
  )

  return (
    <LayoutConta>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header com preview ao vivo */}
        <div
          className="px-6 pt-6 pb-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0b2220 0%, #0f2e2b 50%, #1a4f4a 100%)' }}
        >
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="relative flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl ring-4 ring-white/20"
              style={{ background: gradConf.gradiente, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
            >
              {avatarDisplay}
            </div>
            <div>
              <p className="text-white font-black text-lg leading-tight">{nome || 'Seu nome'}</p>
              <p className="text-white/50 text-xs mt-0.5">{email}</p>
              <button
                type="button"
                onClick={() => setAbaAtiva('avatar')}
                className="mt-1.5 text-[10px] text-[#3cbfb3] font-semibold hover:text-[#5dd6cb] transition"
              >
                ✏️ Alterar avatar
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 pt-2">
          {ABAS.map(aba => (
            <button
              key={aba.id}
              type="button"
              onClick={() => { setAbaAtiva(aba.id); setMsg('') }}
              className={[
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all',
                abaAtiva === aba.id
                  ? 'border-[#3cbfb3] text-[#3cbfb3]'
                  : 'border-transparent text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              {aba.icon}{aba.label}
            </button>
          ))}
        </div>

        {/* Conteúdo da aba */}
        <div className="px-5 py-5 space-y-4">

          {/* ── Dados pessoais ── */}
          {abaAtiva === 'dados' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome completo</label>
                <input
                  value={nome} onChange={e => setNome(e.target.value)}
                  className="mt-1.5 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</label>
                <input
                  value={email} disabled
                  className="mt-1.5 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefone / WhatsApp</label>
                <input
                  value={telefone} onChange={e => setTelefone(e.target.value)} type="tel"
                  placeholder="(11) 99999-9999"
                  className="mt-1.5 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data de nascimento</label>
                  <input
                    type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)}
                    className="mt-1.5 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gênero</label>
                  <select
                    value={genero} onChange={e => setGenero(e.target.value)}
                    className="mt-1.5 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3] bg-white"
                  >
                    <option value="">Prefiro não informar</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ── Avatar ── */}
          {abaAtiva === 'avatar' && (
            <>
              {/* Preview central */}
              <div className="flex justify-center py-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl text-white shadow-xl ring-4 ring-white"
                  style={{ background: gradConf.gradiente, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                >
                  {avatarDisplay}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Escolha um ícone</p>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS_PREDEFINIDOS.map(av => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarEmoji(av.id)}
                      className={[
                        'aspect-square rounded-xl flex items-center justify-center text-lg transition-all border-2',
                        avatarEmoji === av.id
                          ? 'border-[#3cbfb3] bg-[#3cbfb3]/10 scale-105 shadow-sm'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-300',
                      ].join(' ')}
                    >
                      {av.id === 'inicial'
                        ? <span className="text-sm font-black text-gray-600">{nome?.[0]?.toUpperCase() ?? 'A'}</span>
                        : av.id}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cor do avatar</p>
                <div className="flex gap-3 flex-wrap">
                  {GRADIENTES_AVATAR.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGradiente(g.id)}
                      title={g.label}
                      className="relative w-10 h-10 rounded-xl shadow-sm transition-all hover:scale-110"
                      style={{ background: g.gradiente }}
                    >
                      {gradiente === g.id && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check size={16} className="text-white drop-shadow" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Notificações ── */}
          {abaAtiva === 'notificacoes' && (
            <div className="space-y-3">
              {[
                {
                  key: 'email' as const,
                  label: 'E-mail',
                  desc: 'Receba confirmações de pedido, promoções e novidades por e-mail.',
                  valor: notifEmail,
                  set: setNotifEmail,
                },
                {
                  key: 'wpp' as const,
                  label: 'WhatsApp',
                  desc: 'Receba atualizações de rastreio e ofertas exclusivas pelo WhatsApp.',
                  valor: notifWpp,
                  set: setNotifWpp,
                },
              ].map(item => (
                <div key={item.key} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.set(!item.valor)}
                    className={[
                      'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none',
                      item.valor ? 'bg-[#3cbfb3]' : 'bg-gray-300',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5',
                        item.valor ? 'translate-x-5' : 'translate-x-0.5',
                      ].join(' ')}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Feedback + Botão */}
          {msg && (
            <p className={`text-sm font-semibold ${msgErr ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>
          )}
          <button
            type="button"
            onClick={salvar}
            disabled={saving}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar alterações
          </button>
        </div>
      </div>
    </LayoutConta>
  )
}
