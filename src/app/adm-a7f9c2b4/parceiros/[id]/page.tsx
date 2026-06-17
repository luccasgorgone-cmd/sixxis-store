'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, FileText,
  Calendar, Tag, MessageSquare, User, Handshake,
} from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'

const STATUS_OPCOES = [
  { valor: 'novo',       label: 'Novo',       cor: '#3b82f6' },
  { valor: 'em_analise', label: 'Em análise', cor: '#f59e0b' },
  { valor: 'aprovado',   label: 'Aprovado',   cor: '#10b981' },
  { valor: 'recusado',   label: 'Recusado',   cor: '#ef4444' },
]

interface Solicitacao {
  id: string
  tipo: string
  nome: string
  email: string
  telefone: string
  cpf: string | null
  cnpj: string | null
  razaoSocial: string | null
  nomeFantasia: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  endereco: string | null
  segmento: string | null
  mensagem: string | null
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

export default function ParceiroDetalhe() {
  const { id } = useParams<{ id: string }>()
  const [s, setS] = useState<Solicitacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/parceiros/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.error) setErro(d.error)
        else setS(d.solicitacao)
      })
      .catch(() => setErro('Erro ao carregar solicitação'))
      .finally(() => setLoading(false))
  }, [id])

  async function trocarStatus(novo: string) {
    if (!s || novo === s.status) return
    setSalvando(true)
    try {
      const res = await fetch(`/api/admin/parceiros/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novo }),
      })
      const d = await res.json()
      if (d.solicitacao) setS(d.solicitacao)
    } catch {
      alert('Erro ao atualizar status')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return <div className="p-8 max-w-3xl mx-auto"><div className="h-40 bg-gray-100 animate-pulse rounded-2xl" /></div>
  }
  if (erro || !s) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link href={`${ADMIN_BASE}/parceiros`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <p className="text-red-500">{erro || 'Solicitação não encontrada'}</p>
      </div>
    )
  }

  const empresa = s.nomeFantasia || s.razaoSocial
  const cidadeUf = s.cidade ? `${s.cidade}${s.estado ? ' / ' + s.estado : ''}` : null
  const dataFmt = new Date(s.createdAt).toLocaleString('pt-BR')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href={`${ADMIN_BASE}/parceiros`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft size={16} /> Voltar para Parceiros
      </Link>

      {/* CABEÇALHO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#0f2e2b] flex items-center justify-center shrink-0">
            <Handshake size={22} className="text-[#3cbfb3]" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-gray-900 truncate">{s.nome}</h1>
            {empresa && <p className="text-sm text-gray-500">{empresa}</p>}
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Calendar size={12} /> Recebido em {dataFmt}
            </p>
          </div>
        </div>

        {/* STATUS */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Status da solicitação</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPCOES.map(opt => {
              const ativo = s.status === opt.valor
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
        <h2 className="text-sm font-bold text-gray-900 mb-4">Dados do solicitante</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Campo icon={User}      label="Nome / Responsável" valor={s.nome} />
          <Campo icon={Tag}       label="Tipo" valor={s.tipo === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'} />
          <Campo icon={Mail}      label="E-mail" valor={s.email} />
          <Campo icon={Phone}     label="Telefone / WhatsApp" valor={s.telefone} />
          <Campo icon={Building2} label="Razão Social" valor={s.razaoSocial} />
          <Campo icon={Building2} label="Nome Fantasia" valor={s.nomeFantasia} />
          <Campo icon={FileText}  label="CNPJ" valor={s.cnpj} />
          <Campo icon={FileText}  label="CPF" valor={s.cpf} />
          <Campo icon={Tag}       label="Segmento de atuação" valor={s.segmento} />
          <Campo icon={MapPin}    label="Cidade / UF" valor={cidadeUf} />
          <Campo icon={MapPin}    label="CEP" valor={s.cep} />
          <Campo icon={MapPin}    label="Endereço" valor={s.endereco} />
        </div>
      </div>

      {/* MENSAGEM */}
      {s.mensagem && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare size={15} className="text-gray-400" /> Mensagem
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{s.mensagem}</p>
        </div>
      )}

      {/* AÇÕES RÁPIDAS */}
      <div className="flex flex-wrap gap-2 mt-5">
        <a
          href={`mailto:${s.email}`}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#3cbfb3]/10 text-[#0f766e] hover:bg-[#3cbfb3] hover:text-white transition-all"
        >
          <Mail size={15} /> Responder por e-mail
        </a>
        <a
          href={`https://wa.me/55${s.telefone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all"
        >
          <Phone size={15} /> WhatsApp
        </a>
      </div>
    </div>
  )
}
