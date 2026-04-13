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
  FileText,
  Type,
} from 'lucide-react'
import CampoCor from '@/components/admin/CampoCor'
import { Toast } from '@/components/admin/Toast'

// ─── Defaults ────────────────────────────────────────────────────────────────

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const DEFAULTS: Record<string, string> = {
  loja_nome: 'Sixxis Store',
  loja_descricao: 'Loja oficial Sixxis. Climatizadores, aspiradores e spinning.',
  loja_email: 'brasil.sixxis@gmail.com',
  loja_telefone: '(18) 99747-4701',
  loja_endereco: 'R. Anhanguera, 1711 - Icaray, Araçatuba - SP',
  loja_cnpj: '54.978.947/0001-09',
  loja_horario: 'Seg-Sex 8h às 18h | Sáb 8h às 12h',
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
  seo_description: 'Loja oficial Sixxis. Climatizadores, aspiradores e spinning com garantia e entrega rápida para todo o Brasil.',
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
  // WhatsApp números
  social_whatsapp_suporte: '5511934102621',
  // Barra de anúncios
  anuncio_1: '🚚 Frete grátis acima de R$ 500 para todo o Brasil',
  anuncio_2: '💳 Parcele em até 6x sem juros no cartão',
  anuncio_3: '📞 Atendimento: (18) 99747-4701 | Seg-Sex 8h às 18h',
  // Textos do Site
  txt_cta_principal: 'Ver Produtos',
  txt_wa_botao: 'Falar no WhatsApp',
  txt_frete_gratis: 'Frete grátis acima de R$ 500',
  txt_parcelamento: '6x sem juros no cartão',
  txt_atendimento: 'Seg-Sex 8h às 18h',
  trust_1_titulo: 'Entrega para todo o Brasil',
  trust_1_sub: 'Frete grátis acima de R$ 500',
  trust_2_titulo: 'Compra 100% Segura',
  trust_2_sub: 'Seus dados protegidos',
  trust_3_titulo: '6x sem juros no cartão',
  trust_3_sub: 'Débito, crédito e PIX',
  trust_4_titulo: 'Produtos Originais',
  trust_4_sub: 'Garantia Sixxis',
  stat_1_num: '5.000+',
  stat_1_label: 'Clientes Satisfeitos',
  stat_2_num: '12 meses',
  stat_2_label: 'Garantia Sixxis',
  stat_3_num: '100%',
  stat_3_label: 'Entrega para o Brasil',
  stat_4_num: '48h',
  stat_4_label: 'Entrega Expressa SP',
  txt_carrinho_vazio: 'Seu carrinho está vazio',
  txt_sem_produtos: 'Nenhum produto encontrado',
  txt_confirmar_pedido: 'Finalizar Compra',
  // Tipografia
  font_titulo_tamanho: '4xl',
  font_titulo_peso: 'extrabold',
  font_preco_tamanho: 'xl',
  font_titulo_tracking: 'normal',
  // Novas cores
  cor_titulos_secao: '#0a0a0a',
  cor_descricao: '#4b5563',
  cor_precos: '#1f2937',
  cor_precos_promo: '#3cbfb3',
  cor_links: '#3cbfb3',
  cor_links_hover: '#2a9d8f',
  cor_card_fundo: '#ffffff',
  cor_card_borda: '#e5e7eb',
  cor_card_hover: '#f0fffe',
  cor_trustbar_fundo: '#ffffff',
  cor_trustbar_icones: '#3cbfb3',
  cor_badge_oferta: '#f59e0b',
  cor_badge_novo: '#3cbfb3',
  cor_badge_esgotado: '#9ca3af',
  // Cores completas
  cor_principal_dark: '#2a9d8f',
  cor_destaque: '#3cbfb3',
  cor_header_texto: '#ffffff',
  cor_anuncio_fundo: '#0a0a0a',
  cor_anuncio_texto: '#ffffff',
  cor_fundo_alt: '#f8f9fa',
  cor_stats_fundo: '#3cbfb3',
  cor_wa_fundo: '#0a0a0a',
  cor_footer_fundo: '#0a0a0a',
  cor_botoes_texto: '#ffffff',
  cor_botoes_hover: '#2a9d8f',
  cor_textos_sec: '#6b7280',
  cor_titulos: '#0a0a0a',
}

const TABS = [
  { id: 'loja', label: 'Informações da Loja', icon: Store },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
  { id: 'tipografia', label: 'Tipografia', icon: Type },
  { id: 'textos', label: 'Textos do Site', icon: FileText },
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

const CORES_DEFAULTS: Record<string, string> = {
  cor_principal:     '#3cbfb3',
  cor_principal_dark: '#2a9d8f',
  cor_destaque:      '#3cbfb3',
  cor_header:        '#2a9d8f',
  cor_header_texto:  '#ffffff',
  cor_anuncio_fundo: '#0a0a0a',
  cor_anuncio_texto: '#ffffff',
  cor_fundo:         '#ffffff',
  cor_fundo_alt:     '#f8f9fa',
  cor_stats_fundo:   '#3cbfb3',
  cor_wa_fundo:      '#0a0a0a',
  cor_footer_fundo:  '#0a0a0a',
  cor_botoes:        '#3cbfb3',
  cor_botoes_texto:  '#ffffff',
  cor_botoes_hover:  '#2a9d8f',
  cor_textos:           '#0a0a0a',
  cor_textos_sec:       '#6b7280',
  cor_titulos:          '#0a0a0a',
  cor_titulos_secao:    '#0a0a0a',
  cor_descricao:        '#4b5563',
  cor_precos:           '#1f2937',
  cor_precos_promo:     '#3cbfb3',
  cor_links:            '#3cbfb3',
  cor_links_hover:      '#2a9d8f',
  cor_card_fundo:       '#ffffff',
  cor_card_borda:       '#e5e7eb',
  cor_card_hover:       '#f0fffe',
  cor_trustbar_fundo:   '#ffffff',
  cor_trustbar_icones:  '#3cbfb3',
  cor_badge_oferta:     '#f59e0b',
  cor_badge_novo:       '#3cbfb3',
  cor_badge_esgotado:   '#9ca3af',
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('loja')
  const [configs, setConfigs] = useState<Record<string, string>>(DEFAULTS)
  const [cores, setCores] = useState<Record<string, string>>(CORES_DEFAULTS)
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
      .then((data: Record<string, string>) => {
        setConfigs((prev) => ({ ...prev, ...data }))
        setCores((prev) => {
          const updated = { ...prev }
          for (const key of Object.keys(prev)) {
            if (data[key]) updated[key] = data[key]
          }
          return updated
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function set(key: string, value: string) {
    setConfigs((c) => ({ ...c, [key]: value }))
  }

  // Preview live de cores — atualiza CSS vars no documento instantaneamente
  const COR_CSS_MAP: Record<string, string> = {
    cor_principal: '--tiffany',
    cor_botoes:    '--tiffany-dark',
    cor_header:    '--color-header',
  }

  function setCorComPreview(key: string, value: string) {
    set(key, value)
    const cssVar = COR_CSS_MAP[key]
    if (cssVar) document.documentElement.style.setProperty(cssVar, value)
  }

  function handleCorChange(chave: string, valor: string) {
    setCores((prev) => ({ ...prev, [chave]: valor }))
    set(chave, valor)
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
    const coresKeys = Object.keys(CORES_DEFAULTS)
    const FONTES = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Nunito', 'Raleway', 'Open Sans']

    return (
      <div className="space-y-5">

        {/* Fonte */}
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
                  <span className="text-xs font-normal text-gray-400" style={{ fontFamily: fonte }}>Abc 123</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Cores */}
        <Card title="Cores do site">
          <p className="text-xs text-[#3cbfb3] bg-[#e8f8f7] border border-[#3cbfb3]/30 rounded-xl px-4 py-2.5 mb-6 font-medium">
            ✨ Preview ao vivo — o site atualiza instantaneamente enquanto você edita. Salve para persistir.
          </p>

          <div className="space-y-8">
            {/* Grupo 1 */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Cores Principais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <CampoCor label="Cor Principal" chave="cor_principal" cssVar="--tiffany" valor={cores.cor_principal} onChange={handleCorChange} />
                <CampoCor label="Cor Hover / Escura" chave="cor_principal_dark" cssVar="--tiffany-dark" valor={cores.cor_principal_dark} onChange={handleCorChange} />
                <CampoCor label="Cor Destaque" chave="cor_destaque" cssVar="--color-destaque" valor={cores.cor_destaque} onChange={handleCorChange} />
              </div>
            </div>

            {/* Grupo 2 */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Header e Topo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <CampoCor label="Fundo do Header" chave="cor_header" cssVar="--color-header" valor={cores.cor_header} onChange={handleCorChange} />
                <CampoCor label="Texto do Header" chave="cor_header_texto" cssVar="--color-header-texto" valor={cores.cor_header_texto} onChange={handleCorChange} />
                <CampoCor label="Fundo Barra Anúncio" chave="cor_anuncio_fundo" cssVar="--color-anuncio-fundo" valor={cores.cor_anuncio_fundo} onChange={handleCorChange} />
                <CampoCor label="Texto Barra Anúncio" chave="cor_anuncio_texto" cssVar="--color-anuncio-texto" valor={cores.cor_anuncio_texto} onChange={handleCorChange} />
              </div>
            </div>

            {/* Grupo 3 */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Fundos da Página</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <CampoCor label="Fundo Geral" chave="cor_fundo" cssVar="--color-fundo" valor={cores.cor_fundo} onChange={handleCorChange} />
                <CampoCor label="Fundo Seções Alternadas" chave="cor_fundo_alt" cssVar="--color-fundo-alt" valor={cores.cor_fundo_alt} onChange={handleCorChange} />
                <CampoCor label="Fundo Seção Stats" chave="cor_stats_fundo" cssVar="--color-stats" valor={cores.cor_stats_fundo} onChange={handleCorChange} />
                <CampoCor label="Fundo Banner WhatsApp" chave="cor_wa_fundo" cssVar="--color-wa" valor={cores.cor_wa_fundo} onChange={handleCorChange} />
                <CampoCor label="Fundo Footer" chave="cor_footer_fundo" cssVar="--color-footer" valor={cores.cor_footer_fundo} onChange={handleCorChange} />
              </div>
            </div>

            {/* Grupo 4 */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Botões</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <CampoCor label="Fundo do Botão" chave="cor_botoes" cssVar="--color-botoes" valor={cores.cor_botoes} onChange={handleCorChange} />
                <CampoCor label="Texto do Botão" chave="cor_botoes_texto" cssVar="--color-botoes-texto" valor={cores.cor_botoes_texto} onChange={handleCorChange} />
                <CampoCor label="Hover do Botão" chave="cor_botoes_hover" cssVar="--color-botoes-hover" valor={cores.cor_botoes_hover} onChange={handleCorChange} />
              </div>
            </div>

            {/* Grupo 5 */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Textos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <CampoCor label="Texto Principal" chave="cor_textos" cssVar="--color-textos" valor={cores.cor_textos} onChange={handleCorChange} />
                <CampoCor label="Texto Secundário" chave="cor_textos_sec" cssVar="--color-textos-sec" valor={cores.cor_textos_sec} onChange={handleCorChange} />
                <CampoCor label="Títulos" chave="cor_titulos" cssVar="--color-titulos" valor={cores.cor_titulos} onChange={handleCorChange} />
              </div>
            </div>

            {/* Grupo 6 — Textos e Tipografia */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Textos e Tipografia</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <CampoCor label="Títulos das seções" chave="cor_titulos_secao" cssVar="--color-titulos-secao" valor={cores.cor_titulos_secao || '#0a0a0a'} onChange={handleCorChange} />
                <CampoCor label="Textos de descrição" chave="cor_descricao" cssVar="--color-descricao" valor={cores.cor_descricao || '#4b5563'} onChange={handleCorChange} />
                <CampoCor label="Preços" chave="cor_precos" cssVar="--color-precos" valor={cores.cor_precos || '#1f2937'} onChange={handleCorChange} />
                <CampoCor label="Preços promocionais" chave="cor_precos_promo" cssVar="--color-precos-promo" valor={cores.cor_precos_promo || '#3cbfb3'} onChange={handleCorChange} />
                <CampoCor label="Links" chave="cor_links" cssVar="--color-links" valor={cores.cor_links || '#3cbfb3'} onChange={handleCorChange} />
                <CampoCor label="Links (hover)" chave="cor_links_hover" cssVar="--color-links-hover" valor={cores.cor_links_hover || '#2a9d8f'} onChange={handleCorChange} />
              </div>
            </div>

            {/* Grupo 7 — Cards e Componentes */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Cards e Componentes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <CampoCor label="Fundo dos cards" chave="cor_card_fundo" cssVar="--color-card-fundo" valor={cores.cor_card_fundo || '#ffffff'} onChange={handleCorChange} />
                <CampoCor label="Borda dos cards" chave="cor_card_borda" cssVar="--color-card-borda" valor={cores.cor_card_borda || '#e5e7eb'} onChange={handleCorChange} />
                <CampoCor label="Hover dos cards" chave="cor_card_hover" cssVar="--color-card-hover" valor={cores.cor_card_hover || '#f0fffe'} onChange={handleCorChange} />
                <CampoCor label="Fundo da TrustBar" chave="cor_trustbar_fundo" cssVar="--color-trustbar-fundo" valor={cores.cor_trustbar_fundo || '#ffffff'} onChange={handleCorChange} />
                <CampoCor label="Ícones da TrustBar" chave="cor_trustbar_icones" cssVar="--color-trustbar-icones" valor={cores.cor_trustbar_icones || '#3cbfb3'} onChange={handleCorChange} />
              </div>
            </div>

            {/* Grupo 8 — Badges e Etiquetas */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Badges e Etiquetas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <CampoCor label="Badge OFERTA" chave="cor_badge_oferta" cssVar="--color-badge-oferta" valor={cores.cor_badge_oferta || '#f59e0b'} onChange={handleCorChange} />
                <CampoCor label="Badge NOVO" chave="cor_badge_novo" cssVar="--color-badge-novo" valor={cores.cor_badge_novo || '#3cbfb3'} onChange={handleCorChange} />
                <CampoCor label="Badge ESGOTADO" chave="cor_badge_esgotado" cssVar="--color-badge-esgotado" valor={cores.cor_badge_esgotado || '#9ca3af'} onChange={handleCorChange} />
              </div>
            </div>
          </div>
        </Card>

        {/* Logo */}
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
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Trocar Logo
              </button>
              <p className="text-xs text-gray-400 mt-2">PNG ou SVG, fundo transparente recomendado</p>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </div>
          </div>
        </Card>

        {/* Banners */}
        <Card title="Banners do carrossel">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500 flex-1">
              Gerencie os banners do carrossel da home (imagens, ordem, links) em uma página dedicada.
            </p>
            <a
              href="/admin/banners"
              className="inline-flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
            >
              Gerenciar Banners →
            </a>
          </div>
        </Card>

        <SaveButton loading={saving} onClick={() => save(['fonte_principal', ...coresKeys])} />
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
      'social_whatsapp', 'social_whatsapp_suporte', 'social_instagram', 'social_facebook',
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

        <Card title="Redes sociais e contato">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="WhatsApp Vendas" hint="Número completo com DDI: 5518...">
                <Input value={configs.social_whatsapp} onChange={(v) => set('social_whatsapp', v)} placeholder="5518997474701" />
              </Field>
              <Field label="WhatsApp Assistência Técnica" hint="Número completo com DDI: 5511...">
                <Input value={configs.social_whatsapp_suporte} onChange={(v) => set('social_whatsapp_suporte', v)} placeholder="5511934102621" />
              </Field>
            </div>
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
      'hero_titulo','hero_subtitulo','hero_cta_texto','hero_cta_link',
      'pq_sixxis_1_titulo','pq_sixxis_1_texto','pq_sixxis_2_titulo','pq_sixxis_2_texto','pq_sixxis_3_titulo','pq_sixxis_3_texto',
      'newsletter_ativo','newsletter_titulo','newsletter_subtitulo',
      'whatsapp_banner_titulo','whatsapp_banner_subtitulo','rodape_tagline',
    ]
    return (
      <div className="space-y-5">
        <Card title="Texto do Hero (exibido quando não há banners)">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            Estes textos aparecem somente quando não há banners cadastrados.{' '}
            <a href="/admin/banners" className="font-semibold underline">Gerenciar banners →</a>
          </p>
          <div className="space-y-4">
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

  function renderTextos() {
    const ctaKeys = ['txt_cta_principal', 'txt_wa_botao', 'txt_frete_gratis', 'txt_parcelamento', 'txt_atendimento']
    const trustKeys = ['trust_1_titulo','trust_1_sub','trust_2_titulo','trust_2_sub','trust_3_titulo','trust_3_sub','trust_4_titulo','trust_4_sub']
    const statKeys = ['stat_1_num','stat_1_label','stat_2_num','stat_2_label','stat_3_num','stat_3_label','stat_4_num','stat_4_label']
    const sysKeys = ['txt_carrinho_vazio', 'txt_sem_produtos', 'txt_confirmar_pedido']
    const allKeys = [...ctaKeys, ...trustKeys, ...statKeys, ...sysKeys, 'rodape_tagline', 'anuncio_1', 'anuncio_2', 'anuncio_3']

    return (
      <div className="space-y-5">

        <Card title="Mensagens e Chamadas para Ação">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Botão CTA principal">
                <Input value={configs.txt_cta_principal || ''} onChange={(v) => set('txt_cta_principal', v)} placeholder="Ver Produtos" />
              </Field>
              <Field label="Botão WhatsApp">
                <Input value={configs.txt_wa_botao || ''} onChange={(v) => set('txt_wa_botao', v)} placeholder="Falar no WhatsApp" />
              </Field>
              <Field label="Texto frete grátis">
                <Input value={configs.txt_frete_gratis || ''} onChange={(v) => set('txt_frete_gratis', v)} placeholder="Frete grátis acima de R$ 500" />
              </Field>
              <Field label="Texto parcelamento">
                <Input value={configs.txt_parcelamento || ''} onChange={(v) => set('txt_parcelamento', v)} placeholder="6x sem juros no cartão" />
              </Field>
              <Field label="Horário de atendimento">
                <Input value={configs.txt_atendimento || ''} onChange={(v) => set('txt_atendimento', v)} placeholder="Seg-Sex 8h às 18h" />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="TrustBar — Textos">
          <p className="text-xs text-gray-400 mb-4">Ícones e posições são fixos; personalize os textos de cada item.</p>
          <div className="space-y-4">
            {([1,2,3,4] as const).map((n) => (
              <div key={n} className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Item {n}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Título">
                    <Input value={configs[`trust_${n}_titulo`] || ''} onChange={(v) => set(`trust_${n}_titulo`, v)} placeholder={`Título ${n}`} />
                  </Field>
                  <Field label="Subtítulo">
                    <Input value={configs[`trust_${n}_sub`] || ''} onChange={(v) => set(`trust_${n}_sub`, v)} placeholder={`Subtítulo ${n}`} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Stats da Home">
          <div className="space-y-4">
            {([1,2,3,4] as const).map((n) => (
              <div key={n} className="grid grid-cols-2 gap-4">
                <Field label={`Stat ${n} — Número`}>
                  <Input value={configs[`stat_${n}_num`] || ''} onChange={(v) => set(`stat_${n}_num`, v)} placeholder="ex: 5.000+" />
                </Field>
                <Field label={`Stat ${n} — Label`}>
                  <Input value={configs[`stat_${n}_label`] || ''} onChange={(v) => set(`stat_${n}_label`, v)} placeholder="ex: Clientes Satisfeitos" />
                </Field>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Mensagens de Sistema">
          <div className="space-y-4">
            <Field label="Texto carrinho vazio">
              <Input value={configs.txt_carrinho_vazio || ''} onChange={(v) => set('txt_carrinho_vazio', v)} placeholder="Seu carrinho está vazio" />
            </Field>
            <Field label="Texto sem produtos">
              <Input value={configs.txt_sem_produtos || ''} onChange={(v) => set('txt_sem_produtos', v)} placeholder="Nenhum produto encontrado" />
            </Field>
            <Field label="Texto confirmar pedido">
              <Input value={configs.txt_confirmar_pedido || ''} onChange={(v) => set('txt_confirmar_pedido', v)} placeholder="Finalizar Compra" />
            </Field>
          </div>
        </Card>

        <Card title="Rodapé — tagline">
          <Field label="Tagline da empresa" hint="Texto abaixo do logo no rodapé">
            <Input value={configs.rodape_tagline || ''} onChange={(v) => set('rodape_tagline', v)} placeholder="Tecnologia e qualidade para seu conforto e bem-estar." />
          </Field>
        </Card>

        <SaveButton loading={saving} onClick={() => save(allKeys)} />
      </div>
    )
  }

  function renderTipografia() {
    const FONTES = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Nunito', 'Raleway', 'Open Sans']
    const keys = ['fonte_principal', 'font_titulo_tamanho', 'font_titulo_peso', 'font_preco_tamanho', 'font_titulo_tracking']

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
                  <span className="text-xs font-normal text-gray-400" style={{ fontFamily: fonte }}>Abc 123</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Tamanhos e pesos">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tamanho do título principal (h1)">
              <select
                value={configs.font_titulo_tamanho || '4xl'}
                onChange={(e) => set('font_titulo_tamanho', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
              >
                <option value="3xl">3xl — 30px</option>
                <option value="4xl">4xl — 36px</option>
                <option value="5xl">5xl — 48px</option>
                <option value="6xl">6xl — 60px</option>
              </select>
            </Field>
            <Field label="Peso dos títulos">
              <select
                value={configs.font_titulo_peso || 'extrabold'}
                onChange={(e) => set('font_titulo_peso', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
              >
                <option value="bold">Bold (700)</option>
                <option value="extrabold">Extrabold (800)</option>
                <option value="black">Black (900)</option>
              </select>
            </Field>
            <Field label="Tamanho do texto de preço">
              <select
                value={configs.font_preco_tamanho || 'xl'}
                onChange={(e) => set('font_preco_tamanho', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
              >
                <option value="lg">lg — 18px</option>
                <option value="xl">xl — 20px</option>
                <option value="2xl">2xl — 24px</option>
              </select>
            </Field>
            <Field label="Espaçamento entre letras (títulos)">
              <select
                value={configs.font_titulo_tracking || 'normal'}
                onChange={(e) => set('font_titulo_tracking', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
              >
                <option value="normal">Normal</option>
                <option value="wide">Wide</option>
                <option value="wider">Wider</option>
                <option value="widest">Widest</option>
              </select>
            </Field>
          </div>
        </Card>

        <SaveButton loading={saving} onClick={() => save(keys)} />
      </div>
    )
  }

  const TAB_RENDERERS: Record<string, () => React.ReactNode> = {
    loja: renderLoja,
    aparencia: renderAparencia,
    tipografia: renderTipografia,
    textos: renderTextos,
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
