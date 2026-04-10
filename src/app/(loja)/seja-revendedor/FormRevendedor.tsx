'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Send, ChevronDown } from 'lucide-react'

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
]

// ── Máscaras ──────────────────────────────────────────────────────────────────
function maskCPF(v: string) {
  v = v.replace(/\D/g, '').slice(0, 11)
  if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
  if (v.length > 3) return v.replace(/(\d{3})(\d+)/, '$1.$2')
  return v
}

function maskCNPJ(v: string) {
  v = v.replace(/\D/g, '').slice(0, 14)
  if (v.length > 12) return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  if (v.length > 8)  return v.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4')
  if (v.length > 5)  return v.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3')
  if (v.length > 2)  return v.replace(/(\d{2})(\d+)/, '$1.$2')
  return v
}

function maskPhone(v: string) {
  v = v.replace(/\D/g, '').slice(0, 11)
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (v.length > 6)  return v.replace(/(\d{2})(\d{4,5})(\d+)/, '($1) $2-$3')
  if (v.length > 2)  return v.replace(/(\d{2})(\d+)/, '($1) $2')
  return v
}

function maskCEP(v: string) {
  v = v.replace(/\D/g, '').slice(0, 8)
  if (v.length > 5) return v.slice(0, 5) + '-' + v.slice(5)
  return v
}

// ── Field Component ────────────────────────────────────────────────────────────
function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full border rounded-xl px-4 py-3 text-base sm:text-sm text-gray-800 outline-none transition focus:ring-2 ${
    err ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-[#3cbfb3]/30 focus:border-[#3cbfb3]'
  }`

// ── Main Form ──────────────────────────────────────────────────────────────────
export default function FormRevendedor() {
  const [tipo, setTipo] = useState<'pf' | 'pj'>('pj')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroGlobal, setErroGlobal] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    nome: '', email: '', telefone: '',
    cpf: '', cnpj: '', razaoSocial: '', nomeFantasia: '',
    cidade: '', estado: '', cep: '', endereco: '',
    segmento: '', mensagem: '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleMasked(field: keyof typeof form, value: string, maskFn: (v: string) => string) {
    set(field, maskFn(value))
  }

  // Validação
  const errors: Partial<Record<keyof typeof form | 'tipo', string>> = {}
  if (submitted) {
    if (!form.nome.trim())      errors.nome = 'Campo obrigatório'
    if (!form.email.trim())     errors.email = 'Campo obrigatório'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'E-mail inválido'
    if (!form.telefone.trim())  errors.telefone = 'Campo obrigatório'
    if (!form.cidade.trim())    errors.cidade = 'Campo obrigatório'
    if (!form.estado)           errors.estado = 'Selecione um estado'
    if (!form.cep.trim())       errors.cep = 'Campo obrigatório'
    if (!form.endereco.trim())  errors.endereco = 'Campo obrigatório'
    if (tipo === 'pf' && !form.cpf.trim())             errors.cpf = 'Campo obrigatório'
    if (tipo === 'pj' && !form.cnpj.trim())            errors.cnpj = 'Campo obrigatório'
    if (tipo === 'pj' && !form.razaoSocial.trim())     errors.razaoSocial = 'Campo obrigatório'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setErroGlobal('')

    // Revalidar
    const hasErrors =
      !form.nome.trim() || !form.email.trim() || !form.telefone.trim() ||
      !form.cidade.trim() || !form.estado || !form.cep.trim() || !form.endereco.trim() ||
      (tipo === 'pf' && !form.cpf.trim()) ||
      (tipo === 'pj' && (!form.cnpj.trim() || !form.razaoSocial.trim())) ||
      !/\S+@\S+\.\S+/.test(form.email)

    if (hasErrors) return

    setEnviando(true)
    try {
      const payload = { tipo, ...form }
      const r = await fetch('/api/revendedor/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.erro || 'Erro ao enviar')
      }
      setEnviado(true)
    } catch (err) {
      setErroGlobal(err instanceof Error ? err.message : 'Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Sucesso ──────────────────────────────────────────────────────────────────
  if (enviado) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-[#e8f8f7] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-[#3cbfb3]" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
          Obrigado pelo seu interesse!
        </h2>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          Recebemos sua solicitação de parceria. Nossa equipe irá analisar
          as informações e, mediante aprovação, entraremos em contato em
          até <strong>3 dias úteis</strong>.
        </p>
        <p className="text-gray-500 text-sm mt-4">
          Um e-mail de confirmação foi enviado para <strong>{form.email}</strong>
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-8 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-8 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          Voltar ao início
        </Link>
      </div>
    )
  }

  // ── Formulário ───────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* Tipo de pessoa */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Tipo de Pessoa <span className="text-red-500">*</span>
        </p>
        <div className="flex gap-4">
          {(['pj', 'pf'] as const).map((t) => (
            <label
              key={t}
              className={`flex items-center gap-2.5 cursor-pointer px-5 py-3 rounded-xl border-2 font-semibold text-sm transition-all flex-1 justify-center ${
                tipo === t
                  ? 'border-[#3cbfb3] bg-[#e8f8f7] text-[#1a4f4a]'
                  : 'border-gray-200 text-gray-600 hover:border-[#3cbfb3]/50'
              }`}
            >
              <input
                type="radio" name="tipo" value={t}
                checked={tipo === t}
                onChange={() => setTipo(t)}
                className="sr-only"
              />
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                tipo === t ? 'border-[#3cbfb3]' : 'border-gray-300'
              }`}>
                {tipo === t && <span className="w-2 h-2 rounded-full bg-[#3cbfb3]" />}
              </span>
              {t === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}
            </label>
          ))}
        </div>
      </div>

      {/* Campos PJ */}
      {tipo === 'pj' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-100">
          <Field label="CNPJ" required error={errors.cnpj}>
            <input
              value={form.cnpj}
              onChange={(e) => handleMasked('cnpj', e.target.value, maskCNPJ)}
              placeholder="XX.XXX.XXX/XXXX-XX"
              className={inputCls(errors.cnpj)}
            />
          </Field>
          <Field label="Razão Social" required error={errors.razaoSocial}>
            <input
              value={form.razaoSocial}
              onChange={(e) => set('razaoSocial', e.target.value)}
              placeholder="Nome legal da empresa"
              className={inputCls(errors.razaoSocial)}
            />
          </Field>
          <Field label="Nome Fantasia">
            <input
              value={form.nomeFantasia}
              onChange={(e) => set('nomeFantasia', e.target.value)}
              placeholder="Como a empresa é conhecida"
              className={inputCls()}
            />
          </Field>
        </div>
      )}

      {/* Campos PF */}
      {tipo === 'pf' && (
        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
          <Field label="CPF" required error={errors.cpf}>
            <input
              value={form.cpf}
              onChange={(e) => handleMasked('cpf', e.target.value, maskCPF)}
              placeholder="XXX.XXX.XXX-XX"
              className={inputCls(errors.cpf)}
            />
          </Field>
        </div>
      )}

      {/* Dados comuns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label={tipo === 'pj' ? 'Nome do Responsável' : 'Nome Completo'} required error={errors.nome}>
          <input
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            placeholder="Nome completo"
            className={inputCls(errors.nome)}
          />
        </Field>
        <Field label="E-mail" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="contato@empresa.com.br"
            className={inputCls(errors.email)}
          />
        </Field>
        <Field label="Telefone / WhatsApp" required error={errors.telefone}>
          <input
            value={form.telefone}
            onChange={(e) => handleMasked('telefone', e.target.value, maskPhone)}
            placeholder="(XX) XXXXX-XXXX"
            className={inputCls(errors.telefone)}
          />
        </Field>
        <Field label="Segmento de Atuação">
          <div className="relative">
            <select
              value={form.segmento}
              onChange={(e) => set('segmento', e.target.value)}
              className={inputCls() + ' appearance-none'}
            >
              <option value="">Selecione...</option>
              <option value="Varejo">Varejo</option>
              <option value="Atacado">Atacado</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Distribuidor">Distribuidor</option>
              <option value="Outro">Outro</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </Field>
      </div>

      {/* Endereço */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Field label="CEP" required error={errors.cep}>
          <input
            value={form.cep}
            onChange={(e) => handleMasked('cep', e.target.value, maskCEP)}
            placeholder="XXXXX-XXX"
            className={inputCls(errors.cep)}
          />
        </Field>
        <Field label="Cidade" required error={errors.cidade}>
          <input
            value={form.cidade}
            onChange={(e) => set('cidade', e.target.value)}
            placeholder="Sua cidade"
            className={inputCls(errors.cidade)}
          />
        </Field>
        <Field label="Estado" required error={errors.estado}>
          <div className="relative">
            <select
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              className={inputCls(errors.estado) + ' appearance-none'}
            >
              <option value="">UF</option>
              {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </Field>
      </div>

      <Field label="Endereço Completo" required error={errors.endereco}>
        <input
          value={form.endereco}
          onChange={(e) => set('endereco', e.target.value)}
          placeholder="Rua, número, complemento, bairro"
          className={inputCls(errors.endereco)}
        />
      </Field>

      <Field label="Mensagem / Como conheceu a Sixxis">
        <textarea
          value={form.mensagem}
          onChange={(e) => set('mensagem', e.target.value)}
          rows={4}
          placeholder="Conte-nos um pouco sobre o seu negócio e como nos conheceu..."
          className={inputCls() + ' resize-none'}
        />
      </Field>

      {erroGlobal && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {erroGlobal}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full flex items-center justify-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        {enviando ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send size={18} />
        )}
        {enviando ? 'Enviando...' : 'Enviar Solicitação'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Seus dados são tratados com segurança e nunca compartilhados com terceiros.
      </p>
    </form>
  )
}
