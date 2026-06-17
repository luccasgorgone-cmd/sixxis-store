'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, Calendar, Tag, MessageSquare, User, Inbox,
} from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'

const STATUS_OPCOES = [
  { valor: 'novo',       label: 'Novo',       cor: '#3b82f6' },
  { valor: 'lido',       label: 'Lido',       cor: '#8b5cf6' },
  { valor: 'respondido', label: 'Respondido', cor: '#10b981' },
  { valor: 'arquivado',  label: 'Arquivado',  cor: '#94a3b8' },
]

const ASSUNTO_LABEL: Record<string, string> = {
  duvida:  'Dúvida sobre produto',
  suporte: 'Suporte técnico',
  pedido:  'Informação sobre pedido',
  troca:   'Troca ou devolução',
  outro:   'Outro assunto',
}

interface Mensagem {
  id: string
  nome: string
  email: string
  telefone: string | null
  assunto: string
  mensagem: string
  status: string
  createdAt: string
}

function Campo({ icon: Icon, label, valor }: { icon: React.ElementType; label: string; valor: string | null }) {
  if (!valor) return null
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 break-words">{valor}</p>
      </div>
    </div>
  )
}

export default function ContatoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const [m, setM] = useState<Mensagem | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/contatos/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.error) setErro(d.error)
        else setM(d.mensagem)
      })
      .catch(() => setErro('Erro ao carregar mensagem'))
      .finally(() => setLoading(false))
  }, [id])

  async function trocarStatus(novo: string) {
    if (!m || novo === m.status) return
    setSalvando(true)
    try {
      const res = await fetch(`/api/admin/contatos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novo }),
      })
      const d = await res.json()
      if (d.mensagem) setM(d.mensagem)
    } catch {
      alert('Erro ao atualizar status')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return <div className="p-8 max-w-3xl mx-auto"><div className="h-40 bg-gray-100 animate-pulse rounded-2xl" /></div>
  }
  if (erro || !m) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link href={`${ADMIN_BASE}/contatos`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <p className="text-red-500">{erro || 'Mensagem não encontrada'}</p>
      </div>
    )
  }

  const dataFmt = new Date(m.createdAt).toLocaleString('pt-BR')
  const assuntoLabel = ASSUNTO_LABEL[m.assunto] || m.assunto

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href={`${ADMIN_BASE}/contatos`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft size={16} /> Voltar para Contatos
      </Link>

      {/* CABEÇALHO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#0f2e2b] flex items-center justify-center shrink-0">
            <Inbox size={22} className="text-[#3cbfb3]" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-gray-900 truncate">{m.nome}</h1>
            <p className="text-sm text-gray-500">{assuntoLabel}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Calendar size={12} /> Recebido em {dataFmt}
            </p>
          </div>
        </div>

        {/* STATUS */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Status da mensagem</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPCOES.map(opt => {
              const ativo = m.status === opt.valor
              return (
                <button
                  key={opt.valor}
                  onClick={() => trocarStatus(opt.valor)}
                  disabled={salvando}
                  className="text-sm font-semibold px-3.5 py-2 rounded-xl transition-all disabled:opacity-60"
                  style={
                    ativo
                      ? { backgroundColor: opt.cor, color: '#fff' }
                      : { backgroundColor: `${opt.cor}14`, color: opt.cor }
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* DADOS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Dados do remetente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Campo icon={User}  label="Nome" valor={m.nome} />
          <Campo icon={Tag}   label="Assunto" valor={assuntoLabel} />
          <Campo icon={Mail}  label="E-mail" valor={m.email} />
          <Campo icon={Phone} label="Telefone / WhatsApp" valor={m.telefone} />
        </div>
      </div>

      {/* MENSAGEM */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquare size={15} className="text-gray-400" /> Mensagem
        </h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{m.mensagem}</p>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="flex flex-wrap gap-2 mt-5">
        <a
          href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + assuntoLabel)}`}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#3cbfb3]/10 text-[#0f766e] hover:bg-[#3cbfb3] hover:text-white transition-all"
        >
          <Mail size={15} /> Responder por e-mail
        </a>
        {m.telefone && (
          <a
            href={`https://wa.me/55${m.telefone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all"
          >
            <Phone size={15} /> WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
