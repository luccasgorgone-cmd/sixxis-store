'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCarrinho, useTotalCarrinho } from '@/hooks/useCarrinho'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle, ShoppingBag, Truck, CreditCard, Zap,
  Tag, X, Check, Loader2, Lock, Shield, Award, ChevronDown,
  User, MapPin, ChevronRight, Package, Star,
} from 'lucide-react'
import { type ItemCarrinho } from '@/hooks/useCarrinho'
import GarantiaEstendidaStep, { type SelecaoGarantia } from '@/components/checkout/GarantiaEstendidaStep'
import EnderecosSalvos, { type EnderecoSalvo } from '@/components/checkout/EnderecosSalvos'
import { useViaCep } from '@/hooks/useViaCep'

const CheckoutBricks = dynamic(() => import('./CheckoutBricks'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

type Etapa = 1 | 2 | 3 | 4
type Fase = 'checkout' | 'bricks' | 'sucesso'

interface ProdutoGarantiaInfo {
  id: string
  garantiaFabricaMeses: number
  garantiaEstendida12Preco: number | string | null
  garantiaEstendida24Preco: number | string | null
}

interface OpcaoFrete {
  name:          string
  price:         number
  delivery_time: number
}

interface EnderecoData {
  cep:         string
  logradouro:  string
  numero:      string
  complemento: string
  bairro:      string
  cidade:      string
  estado:      string
}

interface IdentData {
  nome:     string
  cpf:      string
  email:    string
  telefone: string
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function moeda(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function maskCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

function maskTel(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function maskCep(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0,5)}-${d.slice(5)}`
}

// ─── Campo de input ───────────────────────────────────────────────────────────

function Campo({
  label, value, onChange, placeholder, disabled, required = false, inputMode, type,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-[#3cbfb3] ml-0.5">*</span>}
      </label>
      <input
        type={type ?? 'text'}
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/40 focus:border-[#3cbfb3] disabled:bg-gray-50 disabled:text-gray-400 transition placeholder:text-gray-300"
      />
    </div>
  )
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

const ETAPAS_FULL = [
  { n: 1 as Etapa, label: 'Identificação', icon: User },
  { n: 2 as Etapa, label: 'Entrega',       icon: MapPin },
  { n: 3 as Etapa, label: 'Garantia',      icon: Shield },
  { n: 4 as Etapa, label: 'Pagamento',     icon: CreditCard },
]
const ETAPAS_SEM_GARANTIA = [
  { n: 1 as Etapa, label: 'Identificação', icon: User },
  { n: 2 as Etapa, label: 'Entrega',       icon: MapPin },
  { n: 4 as Etapa, label: 'Pagamento',     icon: CreditCard },
]

function StepIndicator({
  etapa, onBack, mostrarGarantia,
}: { etapa: Etapa; onBack?: () => void; mostrarGarantia: boolean }) {
  const ETAPAS = mostrarGarantia ? ETAPAS_FULL : ETAPAS_SEM_GARANTIA
  return (
    <div className="flex items-center gap-0 mb-8">
      {ETAPAS.map((e, idx) => {
        const done    = e.n < etapa
        const current = e.n === etapa
        const IconC   = e.icon
        return (
          <div key={e.n} className="flex items-center">
            <div className={`flex items-center gap-2 transition-all ${current ? 'opacity-100' : done ? 'opacity-70' : 'opacity-30'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                done    ? 'bg-[#3cbfb3] text-white' :
                current ? 'bg-[#3cbfb3] text-white ring-4 ring-[#3cbfb3]/20' :
                          'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check size={14} strokeWidth={2.5} /> : <IconC size={14} />}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${current ? 'text-gray-900' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                {e.label}
              </span>
            </div>
            {idx < ETAPAS.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-3 rounded-full transition-all ${done ? 'bg-[#3cbfb3]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}

      {etapa > 1 && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition"
        >
          ← Voltar
        </button>
      )}
    </div>
  )
}

// ─── ResumoSidebar ───────────────────────────────────────────────────────────

interface ResumoProps {
  itens:       ItemCarrinho[]
  total:       number
  frete:       number
  freteSel:    number | null
  desconto:    number
  cupom:       { codigo: string; desconto: number } | null
  totalFinal:  number
  totalGarantias?: number
}

function ResumoSidebar({ itens, total, freteSel, frete, desconto, cupom, totalFinal, totalGarantias = 0 }: ResumoProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-extrabold text-gray-900 text-sm">Resumo</p>
          <p className="text-xs text-gray-400 mt-0.5">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</p>
        </div>
        <Package size={16} className="text-gray-300" />
      </div>

      <div className="p-4 space-y-3 max-h-52 overflow-y-auto">
        {itens.map(item => (
          <div key={item.produtoId + (item.variacaoId ?? '')} className="flex items-start gap-3">
            {item.imagem ? (
              <div className="w-11 h-11 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                <Image src={item.imagem} alt={item.nome} width={44} height={44} className="object-contain w-full h-full" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                <ShoppingBag size={14} className="text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">{item.nome}</p>
              {item.variacaoNome && <p className="text-[10px] text-gray-400 mt-0.5">{item.variacaoNome}</p>}
              <p className="text-[10px] text-gray-400">Qtd: {item.quantidade}</p>
            </div>
            <p className="text-xs font-bold text-gray-900 shrink-0 pt-0.5">
              R$ {moeda(item.preco * item.quantidade)}
            </p>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5 pt-3 space-y-2 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Subtotal</span>
          <span>R$ {moeda(total)}</span>
        </div>
        {freteSel !== null && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Frete</span>
            <span className={frete === 0 ? 'text-green-600 font-semibold' : ''}>
              {frete === 0 ? 'Grátis' : `R$ ${moeda(frete)}`}
            </span>
          </div>
        )}
        {totalGarantias > 0 && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Garantia estendida</span>
            <span>R$ {moeda(totalGarantias)}</span>
          </div>
        )}
        {cupom && (
          <div className="flex justify-between text-xs text-green-600 font-semibold">
            <span>Cupom {cupom.codigo}</span>
            <span>-R$ {moeda(desconto)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-gray-900 text-sm pt-2.5 border-t border-gray-100">
          <span>Total</span>
          <span className="text-[#3cbfb3]">R$ {moeda(totalFinal)}</span>
        </div>
      </div>

      <div className="px-5 pb-4 flex items-center justify-between">
        <span className="flex items-center gap-1 text-gray-300 text-[10px]"><Lock size={9} /> SSL 256-bit</span>
        <span className="flex items-center gap-1 text-gray-300 text-[10px]"><Shield size={9} /> Compra segura</span>
        <span className="flex items-center gap-1 text-gray-300 text-[10px]"><Award size={9} /> 100% original</span>
      </div>
    </div>
  )
}

// ─── CupomField ──────────────────────────────────────────────────────────────

function CupomField({
  cupom, cupomInput, setCupomInput, cupomErro, cupomLoading, aplicarCupom, remover,
}: {
  cupom: { codigo: string; desconto: number } | null
  cupomInput: string
  setCupomInput: (v: string) => void
  cupomErro: string
  cupomLoading: boolean
  aplicarCupom: () => void
  remover: () => void
}) {
  if (cupom) {
    return (
      <div className="flex items-center justify-between bg-[#e8f8f7] border border-[#3cbfb3]/30 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Check size={15} className="text-[#3cbfb3] shrink-0" />
          <div>
            <p className="text-xs font-semibold text-gray-700">Cupom aplicado</p>
            <p className="text-sm font-mono font-bold text-[#3cbfb3]">{cupom.codigo}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-green-600">-R$ {moeda(cupom.desconto)}</p>
          <button type="button" onClick={remover} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 ml-auto mt-0.5 transition">
            <X size={10} /> Remover
          </button>
        </div>
      </div>
    )
  }
  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={cupomInput}
            onChange={e => setCupomInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && aplicarCupom()}
            placeholder="CÓDIGO DO CUPOM"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/40 focus:border-[#3cbfb3] transition placeholder:text-gray-300"
          />
        </div>
        <button
          type="button"
          onClick={aplicarCupom}
          disabled={cupomLoading}
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition shrink-0 flex items-center gap-1.5"
        >
          {cupomLoading ? <Loader2 size={13} className="animate-spin" /> : 'Aplicar'}
        </button>
      </div>
      {cupomErro && <p className="text-xs text-red-500 mt-2">{cupomErro}</p>}
    </div>
  )
}

// ─── Checkout principal ───────────────────────────────────────────────────────

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const compraDireta = searchParams.get('compra_direta') === '1'
  const { itens, limparCarrinho } = useCarrinho()
  const total = useTotalCarrinho()

  const [etapa, setEtapa] = useState<Etapa>(1)
  const [fase, setFase] = useState<Fase>('checkout')

  const [ident, setIdent] = useState<IdentData>({ nome: '', cpf: '', email: '', telefone: '' })

  const [end, setEnd] = useState<EnderecoData>({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  })
  const [enderecoSalvoId, setEnderecoSalvoId] = useState<string | null>(null)
  const [mostrandoFormEnd, setMostrandoFormEnd] = useState(false)
  const [opcoesFrete, setOpcoesFrete]         = useState<OpcaoFrete[]>([])
  const [freteSel, setFreteSel]               = useState<number | null>(null)
  const [carregandoFrete, setCarregandoFrete] = useState(false)
  const viaCep = useViaCep()

  const [cupomInput, setCupomInput] = useState('')
  const [cupom, setCupom]           = useState<{ codigo: string; desconto: number } | null>(null)
  const [cupomErro, setCupomErro]   = useState('')
  const [cupomLoading, setCupomLoading] = useState(false)

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]             = useState('')
  const [pedidoId, setPedidoId]     = useState<string | null>(null)

  // Garantia estendida — opcional por item
  const [garantiaSelecao, setGarantiaSelecao] = useState<SelecaoGarantia>({})
  const [garantiaInfo, setGarantiaInfo]       = useState<Record<string, ProdutoGarantiaInfo>>({})

  // Verifica quais produtos do carrinho oferecem garantia. Se nenhum oferecer,
  // a etapa 3 é pulada automaticamente.
  useEffect(() => {
    if (itens.length === 0) { setGarantiaInfo({}); return }
    const ids = [...new Set(itens.map((i) => i.produtoId))].join(',')
    if (!ids) return
    fetch(`/api/produtos/garantia-info?ids=${ids}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, ProdutoGarantiaInfo> = {}
        for (const p of (d.produtos ?? []) as ProdutoGarantiaInfo[]) map[p.id] = p
        setGarantiaInfo(map)
      })
      .catch(() => {})
  }, [itens])

  const temGarantiaDisponivel = Object.values(garantiaInfo).some(
    (p) => p.garantiaEstendida12Preco != null || p.garantiaEstendida24Preco != null,
  )

  const totalGarantias = Object.entries(garantiaSelecao).reduce((acc, [pid, meses]) => {
    if (meses === 0) return acc
    const p = garantiaInfo[pid]
    if (!p) return acc
    const preco = meses === 12 ? p.garantiaEstendida12Preco : p.garantiaEstendida24Preco
    return acc + Number(preco ?? 0)
  }, 0)

  const frete       = freteSel ?? 0
  const desconto    = cupom?.desconto ?? 0
  const totalFinal  = Math.max(0, total + frete + totalGarantias - desconto)

  // Calcular frete por CEP (chamado quando endereço fica completo).
  const calcularFretePorCep = useCallback(async (cepLimpo: string) => {
    if (cepLimpo.length !== 8 || itens.length === 0) return
    setCarregandoFrete(true)
    try {
      const fr = await fetch('/api/frete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          cepDestino: cepLimpo,
          produtos: itens.map(i => ({
            id: i.produtoId,
            quantidade: i.quantidade,
            preco: i.preco,
          })),
        }),
      })
      const fd = await fr.json()
      const opcoes: OpcaoFrete[] = (fd.opcoes ?? []).map(
        (o: { name?: string; nome?: string; price?: number; preco?: number; delivery_time?: number; prazo?: string }) => ({
          name: o.name ?? o.nome ?? 'Frete',
          price: typeof o.price === 'number' ? o.price : Number(o.preco ?? 0),
          delivery_time: o.delivery_time ?? 0,
        }),
      )
      setOpcoesFrete(opcoes)
      setFreteSel(opcoes[0]?.price ?? null)
    } catch { setOpcoesFrete([]) }
    finally { setCarregandoFrete(false) }
  }, [itens])

  // Quando o hook ViaCEP encontra um endereço, popular o formulário.
  useEffect(() => {
    if (!viaCep.result || viaCep.result.notFound) return
    const r = viaCep.result
    setEnd((e) => ({
      ...e,
      logradouro: e.logradouro || r.logradouro,
      bairro: e.bairro || r.bairro,
      cidade: e.cidade || r.cidade,
      estado: e.estado || r.estado,
    }))
    calcularFretePorCep(r.cep)
  }, [viaCep.result, calcularFretePorCep])

  function handleSelecionarEnderecoSalvo(e: EnderecoSalvo) {
    setEnderecoSalvoId(e.id)
    setMostrandoFormEnd(false)
    setEnd({
      cep: maskCep(e.cep),
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento ?? '',
      bairro: e.bairro,
      cidade: e.cidade,
      estado: e.estado,
    })
    calcularFretePorCep(e.cep.replace(/\D/g, ''))
  }

  async function aplicarCupom() {
    if (!cupomInput.trim()) { setCupomErro('Digite um código'); return }
    setCupomErro('')
    setCupomLoading(true)
    try {
      const r = await fetch('/api/cupons/validar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ codigo: cupomInput.trim(), total }),
      })
      const d = await r.json()
      if (d.valido) {
        setCupom({ codigo: d.codigo, desconto: d.desconto })
        setCupomInput('')
      } else {
        setCupomErro(d.erro ?? 'Cupom inválido')
      }
    } catch { setCupomErro('Erro ao validar cupom') }
    finally { setCupomLoading(false) }
  }

  function proximaEtapa() {
    setErro('')
    if (etapa === 1) {
      if (!ident.nome.trim() || !ident.email.trim()) {
        setErro('Preencha nome e e-mail.')
        return
      }
      setEtapa(2)
    } else if (etapa === 2) {
      const { cep, logradouro, numero, bairro, cidade, estado } = end
      if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
        setErro('Preencha todos os campos de endereço obrigatórios.')
        return
      }
      if (opcoesFrete.length > 0 && freteSel === null) {
        setErro('Selecione uma opção de frete.')
        return
      }
      // Pula etapa 3 (Garantia) se nenhum produto oferece — vai direto pra Pagamento.
      setEtapa(temGarantiaDisponivel ? 3 : 4)
    } else if (etapa === 3) {
      setEtapa(4)
    }
  }

  async function irParaPagamento() {
    setErro('')
    setCarregando(true)
    try {
      let enderecoId = enderecoSalvoId
      // Endereço salvo: reaproveita. Caso contrário, cria um novo.
      if (!enderecoId) {
        const er = await fetch('/api/enderecos', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...end, cep: end.cep.replace(/\D/g, ''), principal: false }),
        })
        if (!er.ok) {
          const ed = await er.json().catch(() => ({}))
          throw new Error(ed.error === 'Não autorizado' ? 'Faça login para continuar' : 'Erro ao salvar endereço')
        }
        const data = await er.json()
        enderecoId = data.enderecoId
      }

      const garantiasPayload = Object.entries(garantiaSelecao)
        .filter(([, meses]) => meses === 12 || meses === 24)
        .map(([produtoId, meses]) => ({
          produtoId,
          mesesAdicionais: meses as 12 | 24,
          // valor é validado/sobrescrito no servidor — passa 0 só pra cumprir schema
          valorPago: 0,
        }))

      const pr = await fetch('/api/pedidos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          enderecoId,
          formaPagamento: 'mercado_pago',
          frete,
          itens: itens.map(i => ({
            produtoId:    i.produtoId,
            quantidade:   i.quantidade,
            variacaoId:   i.variacaoId,
            variacaoNome: i.variacaoNome,
          })),
          cupomCodigo: cupom?.codigo,
          desconto:    cupom?.desconto ?? 0,
          garantias:   garantiasPayload.length > 0 ? garantiasPayload : undefined,
        }),
      })
      if (!pr.ok) {
        const d = await pr.json().catch(() => ({}))
        throw new Error(d.error || 'Erro ao criar pedido')
      }
      const pedidoData = await pr.json()
      setPedidoId(pedidoData.pedido.id)
      setFase('bricks')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao processar pedido. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  // ── Carrinho vazio ──
  if (itens.length === 0 && fase === 'checkout' && !compraDireta) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="w-24 h-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-6">
          <ShoppingBag size={34} className="text-gray-200" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Seu carrinho está vazio</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-xs">Adicione produtos incríveis antes de finalizar a compra.</p>
        <Link href="/produtos"
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-[#3cbfb3]/20">
          Ver Produtos
        </Link>
      </div>
    )
  }

  // ── Sucesso fallback (caso o redirect falhe) ──
  if (fase === 'sucesso') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-[#3cbfb3]/10 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-[#e8f8f7] flex items-center justify-center">
            <CheckCircle size={40} className="text-[#3cbfb3]" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Pagamento aprovado!</h2>
        <p className="text-gray-500 text-sm mb-8">Redirecionando...</p>
      </div>
    )
  }

  const resumoProps: ResumoProps = {
    itens, total, frete, freteSel, desconto, cupom, totalFinal,
    totalGarantias,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-xl font-extrabold text-gray-900">Finalizar Compra</h1>
        {compraDireta && (
          <span className="inline-flex items-center gap-1.5 bg-[#e8f8f7] text-[#3cbfb3] text-[10px] font-bold px-3 py-1 rounded-full border border-[#3cbfb3]/30">
            <Zap size={10} /> Compra Rápida
          </span>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div>
          {fase === 'bricks' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock size={14} className="text-[#3cbfb3]" /> Pagamento seguro · Mercado Pago
                </p>
                <button
                  type="button"
                  onClick={() => setFase('checkout')}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ← Voltar
                </button>
              </div>
              {pedidoId && (
                <CheckoutBricks
                  pedidoId={pedidoId}
                  valor={totalFinal}
                  payerEmail={ident.email}
                  payerNome={ident.nome}
                  payerCpf={ident.cpf}
                  onSucesso={() => {
                    limparCarrinho()
                    router.push(`/pedido/${pedidoId}/sucesso`)
                  }}
                />
              )}
            </>
          ) : (
            <>
              <StepIndicator
                etapa={etapa}
                mostrarGarantia={temGarantiaDisponivel}
                onBack={etapa > 1 ? () => {
                  // Voltar respeita o pulo da etapa 3 quando não há garantia
                  if (etapa === 4 && !temGarantiaDisponivel) setEtapa(2)
                  else setEtapa((etapa - 1) as Etapa)
                } : undefined}
              />

              {etapa === 1 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                  <div>
                    <h2 className="font-extrabold text-gray-900 mb-0.5">Seus dados</h2>
                    <p className="text-xs text-gray-400">Utilizados para identificação e envio do pedido.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Campo label="Nome completo" required value={ident.nome}
                        onChange={v => setIdent(d => ({ ...d, nome: v }))}
                        placeholder="João da Silva" />
                    </div>
                    <Campo label="CPF" value={ident.cpf}
                      onChange={v => setIdent(d => ({ ...d, cpf: maskCpf(v) }))}
                      placeholder="000.000.000-00" inputMode="numeric" />
                    <Campo label="Telefone / WhatsApp" value={ident.telefone}
                      onChange={v => setIdent(d => ({ ...d, telefone: maskTel(v) }))}
                      placeholder="(11) 99999-9999" inputMode="tel" />
                    <div className="sm:col-span-2">
                      <Campo label="E-mail" required type="email" value={ident.email}
                        onChange={v => setIdent(d => ({ ...d, email: v }))}
                        placeholder="seu@email.com" />
                    </div>
                  </div>

                  {erro && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{erro}</p>}

                  <button
                    type="button"
                    onClick={proximaEtapa}
                    className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-[#3cbfb3]/20 flex items-center justify-center gap-2"
                  >
                    Continuar para Entrega <ChevronRight size={15} />
                  </button>
                </div>
              )}

              {etapa === 2 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                  <div>
                    <h2 className="font-extrabold text-gray-900 mb-0.5">Endereço de entrega</h2>
                    <p className="text-xs text-gray-400">Selecione um endereço salvo ou digite o CEP para preenchimento automático.</p>
                  </div>

                  <EnderecosSalvos
                    selecionadoId={enderecoSalvoId}
                    onSelecionar={handleSelecionarEnderecoSalvo}
                    onNovoEndereco={() => {
                      setEnderecoSalvoId(null)
                      setMostrandoFormEnd(true)
                      setEnd({ cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
                    }}
                    mostrandoFormulario={mostrandoFormEnd || enderecoSalvoId === null}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        CEP <span className="text-[#3cbfb3]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={end.cep}
                          onChange={e => {
                            const v = maskCep(e.target.value)
                            setEnd(ev => ({ ...ev, cep: v }))
                            viaCep.buscar(v)
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]/40 focus:border-[#3cbfb3] transition pr-10 placeholder:text-gray-300"
                        />
                        {viaCep.loading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3cbfb3] animate-spin" />}
                      </div>
                      {viaCep.error && (
                        <p className="text-[11px] text-amber-600 mt-1.5">{viaCep.error}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <Campo label="Logradouro" required value={end.logradouro}
                        onChange={v => setEnd(e => ({ ...e, logradouro: v }))} />
                    </div>
                    <Campo label="Número" required value={end.numero}
                      onChange={v => setEnd(e => ({ ...e, numero: v }))} inputMode="numeric" />
                    <Campo label="Complemento" value={end.complemento}
                      onChange={v => setEnd(e => ({ ...e, complemento: v }))} placeholder="Apto, bloco..." />
                    <Campo label="Bairro" required value={end.bairro}
                      onChange={v => setEnd(e => ({ ...e, bairro: v }))} />
                    <Campo label="Cidade" required value={end.cidade}
                      onChange={v => setEnd(e => ({ ...e, cidade: v }))} />
                    <Campo label="Estado (UF)" required value={end.estado}
                      onChange={v => setEnd(e => ({ ...e, estado: v.toUpperCase().slice(0, 2) }))} placeholder="SP" />
                  </div>

                  {carregandoFrete && (
                    <div className="flex items-center gap-2 text-xs text-[#3cbfb3]">
                      <Loader2 size={12} className="animate-spin" /> Calculando frete...
                    </div>
                  )}
                  {opcoesFrete.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Truck size={11} /> Opção de Frete
                      </p>
                      <div className="space-y-2">
                        {opcoesFrete.map((op, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFreteSel(op.price)}
                            className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition ${
                              freteSel === op.price
                                ? 'border-[#3cbfb3] bg-[#e8f8f7]'
                                : 'border-gray-200 hover:border-[#3cbfb3]/40 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              freteSel === op.price ? 'border-[#3cbfb3]' : 'border-gray-300'
                            }`}>
                              {freteSel === op.price && <div className="w-2 h-2 rounded-full bg-[#3cbfb3]" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{op.name}</p>
                              <p className="text-xs text-gray-400">{op.delivery_time} dias úteis</p>
                            </div>
                            <p className={`text-sm font-bold ${op.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                              {op.price === 0 ? 'Grátis' : `R$ ${moeda(op.price)}`}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {erro && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{erro}</p>}

                  <button
                    type="button"
                    onClick={proximaEtapa}
                    className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-[#3cbfb3]/20 flex items-center justify-center gap-2"
                  >
                    Continuar para {temGarantiaDisponivel ? 'Garantia' : 'Pagamento'} <ChevronRight size={15} />
                  </button>
                </div>
              )}

              {etapa === 3 && (
                <div className="space-y-4">
                  <GarantiaEstendidaStep
                    itens={itens.map((i) => ({
                      produtoId: i.produtoId,
                      nome: i.nome + (i.variacaoNome ? ` — ${i.variacaoNome}` : ''),
                      imagem: i.imagem,
                      quantidade: i.quantidade,
                    }))}
                    selecao={garantiaSelecao}
                    onChange={setGarantiaSelecao}
                  />
                  <button
                    type="button"
                    onClick={proximaEtapa}
                    className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-[#3cbfb3]/20 flex items-center justify-center gap-2"
                  >
                    Continuar para Pagamento <ChevronRight size={15} />
                  </button>
                </div>
              )}

              {etapa === 4 && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Tag size={11} /> Cupom de Desconto
                    </p>
                    <CupomField
                      cupom={cupom} cupomInput={cupomInput} setCupomInput={v => { setCupomInput(v); setCupomErro('') }}
                      cupomErro={cupomErro} cupomLoading={cupomLoading} aplicarCupom={aplicarCupom}
                      remover={() => { setCupom(null); setCupomInput('') }}
                    />
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={11} /> Forma de Pagamento
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Você poderá escolher entre <strong className="text-[#0f2e2b]">PIX</strong>,{' '}
                      <strong className="text-[#0f2e2b]">cartão de crédito</strong> ou{' '}
                      <strong className="text-[#0f2e2b]">cartão de débito</strong> na próxima etapa, com checkout
                      transparente e seguro do Mercado Pago.
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><Lock size={10} /> SSL 256-bit</span>
                      <span className="flex items-center gap-1"><Shield size={10} /> Antifraude MP</span>
                    </div>
                  </div>

                  {erro && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
                      {erro}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={irParaPagamento}
                    disabled={carregando}
                    className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-[#3cbfb3]/25 flex items-center justify-center gap-2"
                  >
                    {carregando ? (
                      <><Loader2 size={16} className="animate-spin" /> Criando pedido...</>
                    ) : (
                      <><Lock size={14} /> Ir para pagamento · R$ {moeda(totalFinal)}</>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-6 pt-1">
                    <span className="flex items-center gap-1.5 text-gray-300 text-[10px]"><Lock size={9} /> SSL 256-bit</span>
                    <span className="flex items-center gap-1.5 text-gray-300 text-[10px]"><Shield size={9} /> Compra segura</span>
                    <span className="flex items-center gap-1.5 text-gray-300 text-[10px]"><Star size={9} /> 100% original</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-6 self-start">
          <ResumoSidebar {...resumoProps} />
        </aside>
      </div>

      <MobileResumo {...resumoProps} />
    </div>
  )
}

function MobileResumo(props: ResumoProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,.06)]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3"
      >
        <span className="text-xs font-semibold text-gray-600">Ver resumo do pedido</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-[#3cbfb3]">R$ {moeda(props.totalFinal)}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100 max-h-80 overflow-y-auto">
          <ResumoSidebar {...props} />
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Suspense fallback={
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-7 bg-gray-100 rounded-xl w-40" />
            <div className="h-10 bg-gray-100 rounded-xl w-full" />
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-6 mt-4">
              <div className="h-80 bg-gray-100 rounded-2xl" />
              <div className="h-72 bg-gray-100 rounded-2xl" />
            </div>
          </div>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </div>
  )
}
