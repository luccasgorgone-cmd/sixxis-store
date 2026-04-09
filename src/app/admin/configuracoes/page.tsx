'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  Store,
  Palette,
  Truck,
  Plug,
  Search,
  Shield,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Upload,
  Globe,
  LayoutTemplate,
} from 'lucide-react'
import { Toast } from '@/components/admin/Toast'

// ─── Defaults ────────────────────────────────────────────────────────────────

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const DEFAULTS: Record<string, string> = {
  loja_nome: 'Sixxis Store',
  loja_descricao: 'Loja oficial Sixxis. Climatizadores, aspiradores, spinning e peças de reposição originais.',
  loja_email: 'brasil.sixxis@gmail.com',
  loja_telefone: '(18) 99747-4701',
  loja_endereco: 'R. Anhanguera, 1711 - Icaray, Araçatuba - SP',
  loja_cnpj: '54.978.947/0001-09',
  loja_horario: 'Seg-Sex 8h às 18h | Sáb 8h às 12h',
  aparencia_cor_primaria: '#3cbfb3',
  aparencia_cor_secundaria: '#0f1f1e',
  aparencia_banner_titulo: 'Climatizadores, Aspiradores e Spinning',
  aparencia_banner_subtitulo: 'Produtos originais Sixxis com entrega rápida para todo o Brasil.',
  aparencia_banner_cta: 'Ver Produtos',
  // Personalização avançada
  fonte_principal: 'Inter',
  cor_principal: '#3cbfb3',
  cor_header: '#0f1f1e',
  cor_botoes: '#3cbfb3',
  cor_textos: '#0a0a0a',
  cor_fundo: '#ffffff',
  logo_url: '/logo-sixxis.png',
  frete_minimo_gratis: '500',
  frete_cep_origem: '16020355',
  pagamento_pix: 'true',
  pagamento_boleto: 'true',
  pagamento_cartao: 'true',
  pagamento_parcelas: '12',
  pagamento_desconto_pix: '3',
  mp_access_token: '',
  mp_public_key: '',
  melhorenvio_token: '',
  focusnfe_token: '',
  focusnfe_env: 'homologacao',
  social_whatsapp: '5518997474701',
  social_instagram: 'https://instagram.com/sixxisoficial',
  social_facebook: 'https://www.facebook.com/profile.php?id=100090936724453',
  seo_title: 'Sixxis Store — Climatizadores, Aspiradores e Spinning',
  seo_description: 'Loja oficial Sixxis. Climatizadores, aspiradores, spinning e peças de reposição originais com entrega rápida para todo o Brasil.',
  seo_ga_id: '',
  seo_pixel_id: '',
  // Transportadoras
  melhorenvio_sandbox_token: '',
  melhorenvio_prod_token: '',
  melhorenvio_ambiente: 'sandbox',
  melhorenvio_cep_origem: '16020355',
  pacote_altura: '30',
  pacote_largura: '30',
  pacote_comprimento: '40',
  pacote_peso: '5',
  correios_ativo: 'false',
  correios_contrato: '',
  correios_pac: 'true',
  correios_sedex: 'true',
  correios_sedex10: 'false',
  jadlog_ativo: 'false',
  jadlog_token: '',
  jadlog_contrato: '',
  totalexpress_ativo: 'false',
  totalexpress_token: '',
  prazo_adicional: '1',
  peso_divisor: '6000',
  frete_gratis_estados: '[]',
  // Editor do site
  hero_imagem_url: '',
  hero_titulo: 'Climatizadores, Aspiradores e Spinning',
  hero_subtitulo: 'Produtos originais Sixxis com entrega rápida para todo o Brasil.',
  hero_cta_texto: 'Ver Produtos',
  hero_cta_link: '/produtos',
  pq_sixxis_1_titulo: 'Qualidade Original',
  pq_sixxis_1_texto: 'Todos os produtos são 100% originais Sixxis com garantia de fábrica.',
  pq_sixxis_2_titulo: 'Entrega Rápida',
  pq_sixxis_2_texto: 'Enviamos para todo o Brasil com Correios e transportadoras parceiras.',
  pq_sixxis_3_titulo: 'Suporte Especializado',
  pq_sixxis_3_texto: 'Equipe técnica pronta para ajudar com instalação e manutenção.',
  newsletter_ativo: 'true',
  newsletter_titulo: 'Fique por dentro das novidades',
  newsletter_subtitulo: 'Receba ofertas exclusivas e lançamentos diretamente no seu email.',
  whatsapp_banner_titulo: 'Precisa de ajuda?',
  whatsapp_banner_subtitulo: 'Nossa equipe está pronta para te atender via WhatsApp.',
  rodape_tagline: 'Tecnologia e qualidade para seu conforto e bem-estar.',
}

const TABS = [
  { id: 'loja', label: 'Informações da Loja', icon: Store },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
  { id: 'frete', label: 'Frete e Pagamento', icon: Truck },
  { id: 'transportadoras', label: 'Transportadoras', icon: Globe },
  { id: 'integracoes', label: 'Integrações', icon: Plug },
  { id: 'editor', label: 'Editor do Site', icon: LayoutTemplate },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
    />
  )
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="relative shrink-0 ml-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#3cbfb3] rounded-full transition" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-5" />
      </div>
    </label>
  )
}

function MaskedInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] pr-10 font-mono"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">{title}</h3>
      {children}
    </div>
  )
}

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar configurações
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('loja')
  const [configs, setConfigs] = useState<Record<string, string>>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const [uploadingHero, setUploadingHero] = useState(false)

  // Password change state
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    fetch('/api/admin/configuracoes')
      .then((r) => r.json())
      .then((data) => {
        setConfigs((prev) => ({ ...prev, ...data }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function set(key: string, value: string) {
    setConfigs((c) => ({ ...c, [key]: value }))
  }

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  async function save(keys: string[]) {
    setSaving(true)
    const batch = Object.fromEntries(keys.map((k) => [k, configs[k] ?? '']))
    const res = await fetch('/api/admin/configuracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs: batch }),
    })
    setSaving(false)
    if (res.ok) showToast('Configurações salvas com sucesso!')
    else showToast('Erro ao salvar. Tente novamente.', 'error')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      set('logo_url', url)
      await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave: 'logo_url', valor: url }),
      })
      showToast('Logo atualizada com sucesso!')
    } else {
      showToast('Erro ao fazer upload da logo.', 'error')
    }
    setUploadingLogo(false)
    e.target.value = ''
  }

  async function handlePasswordChange() {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      showToast('Preencha todos os campos de senha.', 'error')
      return
    }
    if (novaSenha !== confirmarSenha) {
      showToast('Nova senha e confirmação não coincidem.', 'error')
      return
    }
    if (novaSenha.length < 6) {
      showToast('Nova senha deve ter pelo menos 6 caracteres.', 'error')
      return
    }
    setSavingPassword(true)
    const res = await fetch('/api/admin/configuracoes/senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    })
    setSavingPassword(false)
    if (res.ok) {
      showToast('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Erro ao alterar senha.', 'error')
    }
  }

  // ─── Tab content renderers ────────────────────────────────────────────────

  function renderLoja() {
    const keys = [
      'loja_nome', 'loja_descricao', 'loja_email', 'loja_telefone',
      'loja_endereco', 'loja_cnpj', 'loja_horario',
    ]
    return (
      <div className="space-y-5">
        <Card title="Dados da loja">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome da loja">
                <Input value={configs.loja_nome} onChange={(v) => set('loja_nome', v)} placeholder="Sixxis Store" />
              </Field>
              <Field label="CNPJ">
                <Input value={configs.loja_cnpj} onChange={(v) => set('loja_cnpj', v)} placeholder="00.000.000/0001-00" />
              </Field>
            </div>
            <Field label="Descrição da loja">
              <textarea
                value={configs.loja_descricao}
                onChange={(e) => set('loja_descricao', e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] resize-none"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email de contato">
                <Input value={configs.loja_email} onChange={(v) => set('loja_email', v)} placeholder="email@loja.com" />
              </Field>
              <Field label="Telefone / WhatsApp">
                <Input value={configs.loja_telefone} onChange={(v) => set('loja_telefone', v)} placeholder="(00) 00000-0000" />
              </Field>
            </div>
            <Field label="Endereço">
              <Input value={configs.loja_endereco} onChange={(v) => set('loja_endereco', v)} placeholder="Rua, número - Bairro, Cidade - UF" />
            </Field>
            <Field label="Horário de atendimento">
              <Input value={configs.loja_horario} onChange={(v) => set('loja_horario', v)} placeholder="Seg-Sex 8h às 18h | Sáb 8h às 12h" />
            </Field>
          </div>
        </Card>
        <SaveButton loading={saving} onClick={() => save(keys)} />
      </div>
    )
  }

  function renderAparencia() {
    const keys = [
      'aparencia_cor_primaria', 'aparencia_cor_secundaria',
      'aparencia_banner_titulo', 'aparencia_banner_subtitulo', 'aparencia_banner_cta',
      'fonte_principal', 'cor_principal', 'cor_header', 'cor_botoes', 'cor_textos', 'cor_fundo',
    ]

    const FONTES = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Nunito', 'Raleway', 'Open Sans']

    const CORES_LABELS: [string, string, string][] = [
      ['cor_principal',  'Cor principal',   'Verde Tiffany — botões, destaques, links'],
      ['cor_header',     'Cor do header',   'Fundo do cabeçalho e sidebar admin'],
      ['cor_botoes',     'Cor dos botões',  'Botões CTA em todo o site'],
      ['cor_textos',     'Cor dos textos',  'Cor principal dos textos'],
      ['cor_fundo',      'Cor do fundo',    'Fundo geral das páginas'],
    ]

    return (
      <div className="space-y-5">
        <Card title="Fonte principal">
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Selecione a fonte usada em todo o site (Google Fonts)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FONTES.map((fonte) => (
                <button
                  key={fonte}
                  type="button"
                  onClick={() => set('fonte_principal', fonte)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition text-sm font-semibold ${
                    configs.fonte_principal === fonte
                      ? 'border-[#3cbfb3] bg-[#e8f8f7] text-[#2a9d8f]'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span style={{ fontFamily: fonte }}>{fonte}</span>
                  <span
                    className="text-xs font-normal text-gray-400"
                    style={{ fontFamily: fonte }}
                  >
                    Abc 123
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Cores personalizáveis">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {CORES_LABELS.map(([key, label, hint]) => (
              <Field key={key} label={label} hint={hint}>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={configs[key] || '#3cbfb3'}
                    onChange={(e) => set(key, e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                  />
                  <span className="text-sm font-mono text-gray-600">{configs[key]}</span>
                  <div
                    className="w-8 h-8 rounded-lg border border-gray-200"
                    style={{ background: configs[key] || '#3cbfb3' }}
                  />
                </div>
              </Field>
            ))}
          </div>
        </Card>

        <Card title="Logo">
          <div className="flex items-center gap-6">
            <div className="w-44 h-16 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
              <Image
                src={configs.logo_url || '/logo-sixxis.png'}
                alt="Logo Sixxis"
                width={160}
                height={54}
                className="object-contain"
                unoptimized
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Trocar Logo
              </button>
              <p className="text-xs text-gray-400 mt-2">PNG ou SVG, fundo transparente recomendado</p>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>
        </Card>

        <Card title="Banner principal (Hero)">
          <div className="space-y-4">
            <Field label="Título">
              <Input value={configs.aparencia_banner_titulo} onChange={(v) => set('aparencia_banner_titulo', v)} placeholder="Climatizadores, Aspiradores e Spinning" />
            </Field>
            <Field label="Subtítulo">
              <Input value={configs.aparencia_banner_subtitulo} onChange={(v) => set('aparencia_banner_subtitulo', v)} placeholder="Produtos originais com entrega rápida..." />
            </Field>
            <Field label="Texto do botão CTA">
              <Input value={configs.aparencia_banner_cta} onChange={(v) => set('aparencia_banner_cta', v)} placeholder="Ver Produtos" />
            </Field>
          </div>
        </Card>

        <SaveButton loading={saving} onClick={() => save(keys)} />
      </div>
    )
  }

  function renderFrete() {
    const keys = [
      'frete_minimo_gratis', 'frete_cep_origem',
      'pagamento_pix', 'pagamento_boleto', 'pagamento_cartao',
      'pagamento_parcelas', 'pagamento_desconto_pix',
    ]
    return (
      <div className="space-y-5">
        <Card title="Frete">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor mínimo para frete grátis (R$)">
                <Input
                  type="number"
                  value={configs.frete_minimo_gratis}
                  onChange={(v) => set('frete_minimo_gratis', v)}
                  placeholder="500"
                />
              </Field>
              <Field label="CEP de origem" hint="CEP do estoque/expedição">
                <Input
                  value={configs.frete_cep_origem}
                  onChange={(v) => set('frete_cep_origem', v)}
                  placeholder="00000000"
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Formas de pagamento">
          <Toggle
            checked={configs.pagamento_pix === 'true'}
            onChange={(v) => set('pagamento_pix', v ? 'true' : 'false')}
            label="PIX"
            description="Pagamento instantâneo"
          />
          <Toggle
            checked={configs.pagamento_boleto === 'true'}
            onChange={(v) => set('pagamento_boleto', v ? 'true' : 'false')}
            label="Boleto bancário"
            description="Compensação em até 3 dias úteis"
          />
          <Toggle
            checked={configs.pagamento_cartao === 'true'}
            onChange={(v) => set('pagamento_cartao', v ? 'true' : 'false')}
            label="Cartão de crédito"
            description="Débito e crédito parcelado"
          />
        </Card>

        <Card title="Parcelamento">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Número máximo de parcelas">
              <Input
                type="number"
                value={configs.pagamento_parcelas}
                onChange={(v) => set('pagamento_parcelas', v)}
                placeholder="12"
              />
            </Field>
            <Field label="Desconto PIX (%)" hint="Ex: 3 = 3% de desconto no PIX">
              <Input
                type="number"
                value={configs.pagamento_desconto_pix}
                onChange={(v) => set('pagamento_desconto_pix', v)}
                placeholder="3"
              />
            </Field>
          </div>
        </Card>

        <SaveButton loading={saving} onClick={() => save(keys)} />
      </div>
    )
  }

  function renderIntegracoes() {
    const keys = [
      'mp_access_token', 'mp_public_key', 'melhorenvio_token',
      'focusnfe_token', 'focusnfe_env',
      'social_whatsapp', 'social_instagram', 'social_facebook',
    ]
    return (
      <div className="space-y-5">
        <Card title="Mercado Pago">
          <div className="space-y-4">
            <Field label="Access Token" hint="Chave privada — nunca compartilhe">
              <MaskedInput
                value={configs.mp_access_token}
                onChange={(v) => set('mp_access_token', v)}
                placeholder="APP_USR-..."
              />
            </Field>
            <Field label="Public Key" hint="Chave pública — usada no checkout">
              <MaskedInput
                value={configs.mp_public_key}
                onChange={(v) => set('mp_public_key', v)}
                placeholder="APP_USR-..."
              />
            </Field>
          </div>
        </Card>

        <Card title="Melhor Envio">
          <Field label="Token de acesso" hint="Gerado no painel Melhor Envio">
            <MaskedInput
              value={configs.melhorenvio_token}
              onChange={(v) => set('melhorenvio_token', v)}
              placeholder="eyJ..."
            />
          </Field>
        </Card>

        <Card title="Focus NF-e">
          <div className="space-y-4">
            <Field label="Token" hint="Token de autenticação Focus NF-e">
              <MaskedInput
                value={configs.focusnfe_token}
                onChange={(v) => set('focusnfe_token', v)}
                placeholder="seu_token_focus"
              />
            </Field>
            <Field label="Ambiente">
              <select
                value={configs.focusnfe_env}
                onChange={(e) => set('focusnfe_env', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] bg-white"
              >
                <option value="homologacao">Homologação (testes)</option>
                <option value="producao">Produção</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Redes sociais">
          <div className="space-y-4">
            <Field label="WhatsApp" hint="Número completo com DDI: 5518...">
              <Input value={configs.social_whatsapp} onChange={(v) => set('social_whatsapp', v)} placeholder="5518997474701" />
            </Field>
            <Field label="Instagram (URL)">
              <Input value={configs.social_instagram} onChange={(v) => set('social_instagram', v)} placeholder="https://instagram.com/..." />
            </Field>
            <Field label="Facebook (URL)">
              <Input value={configs.social_facebook} onChange={(v) => set('social_facebook', v)} placeholder="https://facebook.com/..." />
            </Field>
          </div>
        </Card>

        <SaveButton loading={saving} onClick={() => save(keys)} />
      </div>
    )
  }

  function renderSeo() {
    const keys = ['seo_title', 'seo_description', 'seo_ga_id', 'seo_pixel_id']
    return (
      <div className="space-y-5">
        <Card title="Meta tags padrão">
          <div className="space-y-4">
            <Field label="Meta title" hint="Aparece na aba do navegador e no Google (recomendado: até 60 chars)">
              <Input
                value={configs.seo_title}
                onChange={(v) => set('seo_title', v)}
                placeholder="Sixxis Store — Climatizadores, Aspiradores e Spinning"
              />
              <p className="text-xs text-gray-400 mt-1">{configs.seo_title.length} / 60 caracteres</p>
            </Field>
            <Field label="Meta description" hint="Descrição exibida no Google (recomendado: até 155 chars)">
              <textarea
                value={configs.seo_description}
                onChange={(e) => set('seo_description', e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{configs.seo_description.length} / 155 caracteres</p>
            </Field>
          </div>
        </Card>

        <Card title="Analytics e rastreamento">
          <div className="space-y-4">
            <Field label="Google Analytics 4 (Measurement ID)" hint="Ex: G-XXXXXXXXXX">
              <Input
                value={configs.seo_ga_id}
                onChange={(v) => set('seo_ga_id', v)}
                placeholder="G-XXXXXXXXXX"
              />
            </Field>
            <Field label="Facebook Pixel ID" hint="Somente o número do Pixel">
              <Input
                value={configs.seo_pixel_id}
                onChange={(v) => set('seo_pixel_id', v)}
                placeholder="000000000000000"
              />
            </Field>
          </div>
        </Card>

        <SaveButton loading={saving} onClick={() => save(keys)} />
      </div>
    )
  }

  function renderSeguranca() {
    return (
      <div className="space-y-5">
        <Card title="Alterar senha do admin">
          <div className="space-y-4 max-w-md">
            <Field label="Senha atual">
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
              />
            </Field>
            <Field label="Nova senha" hint="Mínimo 6 caracteres">
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
              />
            </Field>
            <Field label="Confirmar nova senha">
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]"
              />
            </Field>
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={savingPassword}
                className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition"
              >
                {savingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Alterar senha
              </button>
            </div>
          </div>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">Importante</p>
          <p className="text-sm text-amber-700">
            Após alterar a senha, ela fica salva no banco de dados e substitui a variável de ambiente
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs mx-1">ADMIN_SECRET</code>.
            Guarde a nova senha em local seguro.
          </p>
        </div>
      </div>
    )
  }

  function renderTransportadoras() {
    const keys = [
      'melhorenvio_sandbox_token','melhorenvio_prod_token','melhorenvio_ambiente',
      'melhorenvio_cep_origem','pacote_altura','pacote_largura','pacote_comprimento','pacote_peso',
      'correios_ativo','correios_contrato','correios_pac','correios_sedex','correios_sedex10',
      'jadlog_ativo','jadlog_token','jadlog_contrato',
      'totalexpress_ativo','totalexpress_token',
      'prazo_adicional','peso_divisor','frete_gratis_estados',
    ]
    const estadosSelecionados: string[] = (() => { try { return JSON.parse(configs.frete_gratis_estados || '[]') } catch { return [] } })()
    function toggleEstado(uf: string) {
      const next = estadosSelecionados.includes(uf)
        ? estadosSelecionados.filter((e) => e !== uf)
        : [...estadosSelecionados, uf]
      set('frete_gratis_estados', JSON.stringify(next))
    }
    return (
      <div className="space-y-5">
        <Card title="Melhor Envio">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ambiente">
                <select value={configs.melhorenvio_ambiente} onChange={(e) => set('melhorenvio_ambiente', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white">
                  <option value="sandbox">Sandbox (testes)</option>
                  <option value="producao">Produção</option>
                </select>
              </Field>
              <Field label="CEP de origem">
                <Input value={configs.melhorenvio_cep_origem} onChange={(v) => set('melhorenvio_cep_origem', v)} placeholder="00000000" />
              </Field>
            </div>
            <Field label="Token Sandbox">
              <MaskedInput value={configs.melhorenvio_sandbox_token} onChange={(v) => set('melhorenvio_sandbox_token', v)} placeholder="eyJ..." />
            </Field>
            <Field label="Token Produção">
              <MaskedInput value={configs.melhorenvio_prod_token} onChange={(v) => set('melhorenvio_prod_token', v)} placeholder="eyJ..." />
            </Field>
          </div>
        </Card>

        <Card title="Dimensões padrão dos pacotes">
          <div className="grid grid-cols-4 gap-4">
            {[['pacote_altura','Altura (cm)'],['pacote_largura','Largura (cm)'],['pacote_comprimento','Comprimento (cm)'],['pacote_peso','Peso (kg)']].map(([key, label]) => (
              <Field key={key} label={label}>
                <Input type="number" value={configs[key]} onChange={(v) => set(key, v)} placeholder="0" />
              </Field>
            ))}
          </div>
        </Card>

        <Card title="Correios">
          <Toggle checked={configs.correios_ativo === 'true'} onChange={(v) => set('correios_ativo', v ? 'true' : 'false')} label="Ativar Correios" />
          <div className="mt-4 space-y-3">
            <Field label="Código de contrato (opcional)">
              <Input value={configs.correios_contrato} onChange={(v) => set('correios_contrato', v)} placeholder="Contrato Correios" />
            </Field>
            <p className="text-xs font-medium text-gray-500">Serviços habilitados:</p>
            <div className="flex gap-4">
              {[['correios_pac','PAC'],['correios_sedex','SEDEX'],['correios_sedex10','SEDEX 10']].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={configs[key] === 'true'}
                    onChange={(e) => set(key, e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 accent-[#3cbfb3]" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card title="Jadlog">
            <Toggle checked={configs.jadlog_ativo === 'true'} onChange={(v) => set('jadlog_ativo', v ? 'true' : 'false')} label="Ativar Jadlog" />
            <div className="mt-4 space-y-3">
              <Field label="Token API"><MaskedInput value={configs.jadlog_token} onChange={(v) => set('jadlog_token', v)} placeholder="Token..." /></Field>
              <Field label="Conta / Contrato"><Input value={configs.jadlog_contrato} onChange={(v) => set('jadlog_contrato', v)} /></Field>
            </div>
          </Card>
          <Card title="Total Express">
            <Toggle checked={configs.totalexpress_ativo === 'true'} onChange={(v) => set('totalexpress_ativo', v ? 'true' : 'false')} label="Ativar Total Express" />
            <div className="mt-4">
              <Field label="Token API"><MaskedInput value={configs.totalexpress_token} onChange={(v) => set('totalexpress_token', v)} placeholder="Token..." /></Field>
            </div>
          </Card>
        </div>

        <Card title="Configurações gerais de frete">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prazo adicional (dias)" hint="Tempo de handling antes do despacho">
                <Input type="number" value={configs.prazo_adicional} onChange={(v) => set('prazo_adicional', v)} placeholder="1" />
              </Field>
              <Field label="Divisor peso volumétrico" hint="Padrão: 6000">
                <Input type="number" value={configs.peso_divisor} onChange={(v) => set('peso_divisor', v)} placeholder="6000" />
              </Field>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Frete grátis por estado</p>
              <div className="flex flex-wrap gap-2">
                {ESTADOS_BR.map((uf) => {
                  const selected = estadosSelecionados.includes(uf)
                  return (
                    <button key={uf} type="button" onClick={() => toggleEstado(uf)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        selected ? 'bg-[#3cbfb3] text-white border-[#3cbfb3]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>{uf}</button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">{estadosSelecionados.length} estado{estadosSelecionados.length !== 1 ? 's' : ''} selecionado{estadosSelecionados.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </Card>

        <SaveButton loading={saving} onClick={() => save(keys)} />
      </div>
    )
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHero(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      set('hero_imagem_url', url)
      await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave: 'hero_imagem_url', valor: url }),
      })
      showToast('Banner atualizado!')
    } else {
      showToast('Erro no upload.', 'error')
    }
    setUploadingHero(false)
    e.target.value = ''
  }

  function renderEditor() {
    const keys = [
      'hero_imagem_url','hero_titulo','hero_subtitulo','hero_cta_texto','hero_cta_link',
      'pq_sixxis_1_titulo','pq_sixxis_1_texto','pq_sixxis_2_titulo','pq_sixxis_2_texto','pq_sixxis_3_titulo','pq_sixxis_3_texto',
      'newsletter_ativo','newsletter_titulo','newsletter_subtitulo',
      'whatsapp_banner_titulo','whatsapp_banner_subtitulo','rodape_tagline',
    ]
    return (
      <div className="space-y-5">
        <Card title="Banner principal (Hero)">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Imagem do banner</p>
              <div className="flex items-center gap-4">
                {configs.hero_imagem_url && (
                  <div className="w-32 h-16 rounded-xl overflow-hidden border border-gray-200">
                    <Image src={configs.hero_imagem_url} alt="Hero" width={128} height={64} className="object-cover w-full h-full" unoptimized />
                  </div>
                )}
                <button type="button" onClick={() => heroInputRef.current?.click()} disabled={uploadingHero}
                  className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
                  {uploadingHero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {configs.hero_imagem_url ? 'Trocar imagem' : 'Fazer upload'}
                </button>
                <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Título">
                <Input value={configs.hero_titulo} onChange={(v) => set('hero_titulo', v)} placeholder="Título principal" />
              </Field>
              <Field label="Subtítulo">
                <Input value={configs.hero_subtitulo} onChange={(v) => set('hero_subtitulo', v)} placeholder="Descrição" />
              </Field>
              <Field label="Texto do botão CTA">
                <Input value={configs.hero_cta_texto} onChange={(v) => set('hero_cta_texto', v)} placeholder="Ver Produtos" />
              </Field>
              <Field label="Link do botão">
                <Input value={configs.hero_cta_link} onChange={(v) => set('hero_cta_link', v)} placeholder="/produtos" />
              </Field>
            </div>
          </div>
        </Card>

        <Card title='Seção "Por que Sixxis?"'>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase">Card {n}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Título">
                    <Input value={configs[`pq_sixxis_${n}_titulo`]} onChange={(v) => set(`pq_sixxis_${n}_titulo`, v)} placeholder={`Título ${n}`} />
                  </Field>
                  <Field label="Texto">
                    <Input value={configs[`pq_sixxis_${n}_texto`]} onChange={(v) => set(`pq_sixxis_${n}_texto`, v)} placeholder="Descrição..." />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Newsletter">
          <Toggle checked={configs.newsletter_ativo === 'true'} onChange={(v) => set('newsletter_ativo', v ? 'true' : 'false')} label="Exibir seção newsletter" />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Título">
              <Input value={configs.newsletter_titulo} onChange={(v) => set('newsletter_titulo', v)} />
            </Field>
            <Field label="Subtítulo">
              <Input value={configs.newsletter_subtitulo} onChange={(v) => set('newsletter_subtitulo', v)} />
            </Field>
          </div>
        </Card>

        <Card title="Banner WhatsApp">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Título">
              <Input value={configs.whatsapp_banner_titulo} onChange={(v) => set('whatsapp_banner_titulo', v)} />
            </Field>
            <Field label="Subtítulo">
              <Input value={configs.whatsapp_banner_subtitulo} onChange={(v) => set('whatsapp_banner_subtitulo', v)} />
            </Field>
          </div>
        </Card>

        <Card title="Rodapé">
          <Field label="Tagline da empresa">
            <Input value={configs.rodape_tagline} onChange={(v) => set('rodape_tagline', v)} placeholder="Tecnologia e qualidade..." />
          </Field>
        </Card>

        <SaveButton loading={saving} onClick={() => save(keys)} />
      </div>
    )
  }

  const TAB_RENDERERS: Record<string, () => React.ReactNode> = {
    loja: renderLoja,
    aparencia: renderAparencia,
    frete: renderFrete,
    transportadoras: renderTransportadoras,
    integracoes: renderIntegracoes,
    editor: renderEditor,
    seo: renderSeo,
    seguranca: renderSeguranca,
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
      </div>
    )
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie as configurações da Sixxis Store</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Tab nav — vertical */}
        <nav className="w-52 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeTab === id
                  ? 'bg-[#3cbfb3]/10 text-[#3cbfb3]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {TAB_RENDERERS[activeTab]?.()}
        </div>
      </div>
    </>
  )
}
