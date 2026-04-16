'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import LayoutConta from '@/components/conta/LayoutConta'
import { AvatarComArco } from '@/components/ui/AvatarComArco'
import {
  AVATARES_PREDEFINIDOS, TODOS_AVATARES, NIVEIS_CONFIG,
  calcularNivel,
} from '@/lib/avatares'
import { User, Palette, Bell, Save, Loader2 } from 'lucide-react'

type Tab = 'dados' | 'avatar' | 'notificacoes'

export default function PerfilPage() {
  const { data: session } = useSession()
  const [abaAtiva, setAbaAtiva] = useState<Tab>('dados')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [msgErr, setMsgErr]     = useState(false)

  // campos
  const [nome, setNome]             = useState('')
  const [email, setEmail]           = useState('')
  const [telefone, setTelefone]     = useState('')
  const [dataNasc, setDataNasc]     = useState('')
  const [genero, setGenero]         = useState('')
  const [avatarId, setAvatarId]     = useState('inicial')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifWpp, setNotifWpp]     = useState(false)
  const [nivelAtual, setNivelAtual] = useState('Cristal')
  const [totalGasto, setTotalGasto] = useState(0)

  // Auto-abrir aba avatar se ?aba=avatar na URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('aba') === 'avatar') setAbaAtiva('avatar')
    }
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/conta/perfil').then(r => r.json()),
      fetch('/api/cashback').then(r => r.json()).catch(() => null),
    ]).then(([perfil, cashback]) => {
      const c = perfil.cliente ?? perfil
      setNome(c.nome || '')
      setEmail(c.email || '')
      setTelefone(c.telefone || '')
      setDataNasc(c.dataNascimento ? c.dataNascimento.slice(0, 10) : '')
      setGenero(c.genero || '')
      setAvatarId(c.avatar || 'inicial')
      setNotifEmail(c.notifEmail ?? true)
      setNotifWpp(c.notifWhatsapp ?? false)
      if (cashback?.totalGasto) {
        setTotalGasto(cashback.totalGasto)
        setNivelAtual(calcularNivel(cashback.totalGasto))
      } else if (cashback?.nivel?.atual) {
        setNivelAtual(cashback.nivel.atual)
      }
    }).finally(() => setLoading(false))
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
      payload.avatar = avatarId
      // Remove gradiente legacy — não precisa mais
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

        {/* Header */}
        <div
          className="px-6 pt-6 pb-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0b2220 0%, #0f2e2b 50%, #1a4f4a 100%)' }}
        >
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="relative flex items-center gap-4">
            <AvatarComArco
              nome={nome || session?.user?.name || '?'}
              avatarId={avatarId}
              nivel={nivelAtual}
              totalGasto={totalGasto}
              size={56}
              mostrarBadge={true}
              mostrarTooltip={false}
            />
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

        {/* Conteúdo */}
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
              {/* Preview grande com arco real */}
              <div className="flex items-center gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <AvatarComArco
                  nome={nome || session?.user?.name || '?'}
                  avatarId={avatarId}
                  nivel={nivelAtual}
                  totalGasto={totalGasto}
                  size={72}
                  mostrarBadge={true}
                  mostrarTooltip={false}
                />
                <div>
                  <p className="font-black text-gray-900">{nome || session?.user?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{email}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NIVEIS_CONFIG[nivelAtual]?.cor }} />
                    <p className="text-xs font-bold" style={{ color: NIVEIS_CONFIG[nivelAtual]?.cor }}>
                      Nível {nivelAtual}
                    </p>
                    <span className="text-gray-300">·</span>
                    <p className="text-xs text-gray-400">
                      {TODOS_AVATARES.find(a => a.id === avatarId)?.label || 'Inicial do Nome'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid de seleção */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Escolha seu avatar</p>

                {/* Opção especial: Inicial do nome */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setAvatarId('inicial')}
                    className={[
                      'flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all',
                      'hover:border-[#3cbfb3]/40 hover:bg-[#3cbfb3]/5',
                      avatarId === 'inicial'
                        ? 'border-[#3cbfb3] bg-[#3cbfb3]/10 shadow-sm'
                        : 'border-gray-100',
                    ].join(' ')}
                  >
                    <AvatarComArco
                      nome={nome || session?.user?.name || '?'}
                      avatarId="inicial"
                      nivel={nivelAtual}
                      size={44}
                      mostrarBadge={false}
                    />
                    <p className={`text-[10px] font-semibold ${avatarId === 'inicial' ? 'text-[#3cbfb3]' : 'text-gray-400'}`}>
                      Inicial
                    </p>
                  </button>
                </div>

                {/* Separador */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-widest">
                    ou escolha um personagem
                  </p>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Grid 5×mobile 8×desktop — avatares DiceBear sem label */}
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5">
                  {AVATARES_PREDEFINIDOS.map(av => {
                    const ativo = avatarId === av.id
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatarId(av.id)}
                        title={av.label}
                        className={[
                          'p-1.5 rounded-2xl border-2 transition-all',
                          'hover:scale-105 active:scale-95',
                          ativo
                            ? 'border-[#3cbfb3] bg-[#3cbfb3]/10 scale-105'
                            : 'border-gray-100 hover:border-gray-200',
                        ].join(' ')}
                      >
                        <div
                          className="w-12 h-12 rounded-full overflow-hidden"
                          style={{ backgroundColor: av.bgColor }}
                        >
                          {av.url && (
                            <img
                              src={av.url}
                              alt={av.label}
                              width={48}
                              height={48}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              loading="lazy"
                            />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <p className="text-[9px] text-gray-300 text-center">
                Avatares gerados por DiceBear
              </p>
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
                    <span className={[
                      'inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5',
                      item.valor ? 'translate-x-5' : 'translate-x-0.5',
                    ].join(' ')} />
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
