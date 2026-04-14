'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCarrinho } from '@/hooks/useCarrinho'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle, ShoppingBag, Truck, CreditCard, Zap, FileText,
  Tag, X, Check, Loader2, Lock, Shield, Award, ChevronDown,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FormaPagamento = 'pix' | 'cartao' | 'boleto'

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

// ─── Campo de input ───────────────────────────────────────────────────────────

function Campo({
  label, value, onChange, placeholder, disabled, required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] disabled:bg-gray-50 disabled:text-gray-400 transition"
      />
    </div>
  )
}

// ─── Seção com número ────────────────────────────────────────────────────────

function Secao({ num, titulo, children }: { num: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 rounded-full bg-[#3cbfb3] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-extrabold">{num}</span>
        </div>
        <h2 className="font-extrabold text-gray-900 text-base">{titulo}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Ícone PIX ────────────────────────────────────────────────────────────────

function PixIcon() {
  return (
    <svg viewBox="0 0 512 512" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H118.4C138.4 391.2 157.3 383.4 171.5 369.2L242.4 292.5zM262.5 219.5C257.1 224.9 247.8 224.9 242.4 219.5L171.5 142.8C157.3 128.6 138.4 120.8 118.4 120.8H103.3L200.7 23.4C231 -6.9 280.2 -6.9 310.5 23.4L407.6 120.5H392.5C372.5 120.5 353.6 128.3 339.4 142.5L262.5 219.5zM112 144.4C96.6 144.3 81.8 150.5 70.9 161.4L16.8 215.4C-5.6 237.8-5.6 274.3 16.8 296.7L70.9 350.7C81.8 361.6 96.6 367.8 112 367.7H118.3C132.3 367.7 145.7 362.1 155.5 352.2L232.5 275.2C236 271.7 240 270 244 270C248 270 252 271.7 255.5 275.2L332.5 352.2C342.3 362.1 355.7 367.7 369.7 367.7H392.6C407.9 367.7 422.8 361.5 433.7 350.6L487.8 296.6C510.2 274.2 510.2 237.7 487.8 215.3L433.7 161.3C422.8 150.4 407.9 144.2 392.6 144.2H369.7C355.7 144.2 342.3 149.8 332.5 159.7L255.5 236.7C252.1 240.1 248 241.9 244 241.9C240 241.9 235.9 240.2 232.5 236.7L155.5 159.7C145.7 149.8 132.3 144.3 118.3 144.3L112 144.4z"/>
    </svg>
  )
}

// ─── Checkout principal ───────────────────────────────────────────────────────

function CheckoutContent() {
  const searchParams = useSearchParams()
  const compraDireta = searchParams.get('compra_direta') === '1'
  const { itens, total, limparCarrinho } = useCarrinho()

  // Endereço
  const [end, setEnd] = useState<EnderecoData>({
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
  })
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([])
  const [freteSel, setFreteSel] = useState<number | null>(null)
  const [carregandoFrete, setCarregandoFrete] = useState(false)

  // Cupom
  const [cupomInput, setCupomInput] = useState('')
  const [cupom, setCupom] = useState<{ codigo: string; desconto: number } | null>(null)
  const [cupomErro, setCupomErro] = useState('')
  const [cupomLoading, setCupomLoading] = useState(false)

  // Pagamento
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [parcelas, setParcelas] = useState(1)

  // Flow
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [pedidoId, setPedidoId] = useState<string | null>(null)
  const [fase, setFase] = useState<'checkout' | 'sucesso'>('checkout')

  // Valores derivados
  const frete    = freteSel ?? 0
  const desconto = cupom?.desconto ?? 0
  const pixDesconto = forma === 'pix' ? total * 0.03 : 0
  const totalFinal  = Math.max(0, total - pixDesconto + frete - desconto)

  // Calcula parcela com juros compostos (2,99% a.m.)
  function calcParcela(n: number): number {
    if (n <= 1) return totalFinal
    const taxa = 0.0299
    return totalFinal * (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1)
  }

  // Busca endereço via ViaCEP + frete
  const buscarCep = useCallback(async (cepRaw: string) => {
    const cepLimpo = cepRaw.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return
    setBuscandoCep(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const d = await r.json()
      if (!d.erro) {
        setEnd(e => ({ ...e, logradouro: d.logradouro ?? '', bairro: d.bairro ?? '', cidade: d.localidade ?? '', estado: d.uf ?? '' }))
      }
      if (itens.length > 0) {
        setCarregandoFrete(true)
        try {
          const fr = await fetch('/api/frete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cepDestino: cepLimpo,
              produtos: itens.map(i => ({ id: i.produtoId, quantidade: i.quantidade })),
            }),
          })
          const fd = await fr.json()
          setOpcoesFrete(fd.opcoes ?? [])
          setFreteSel(null)
        } catch { setOpcoesFrete([]) }
        finally { setCarregandoFrete(false) }
      }
    } catch { /* ignore */ }
    finally { setBuscandoCep(false) }
  }, [itens])

  async function aplicarCupom() {
    if (!cupomInput.trim()) { setCupomErro('Digite um código'); return }
    setCupomErro('')
    setCupomLoading(true)
    try {
      const r = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: cupomInput.trim(), total }),
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

  async function finalizar() {
    const { cep, logradouro, numero, bairro, cidade, estado } = end
    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      setErro('Preencha todos os campos de endereço obrigatórios.')
      return
    }
    if (opcoesFrete.length > 0 && freteSel === null) {
      setErro('Selecione uma opção de frete.')
      return
    }

    setErro('')
    setCarregando(true)

    try {
      const er = await fetch('/api/enderecos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...end, cep: cep.replace(/\D/g, ''), principal: false }),
      })
      if (!er.ok) throw new Error('Erro ao salvar endereço')
      const { enderecoId } = await er.json()

      const pr = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enderecoId,
          formaPagamento: forma,
          frete,
          itens: itens.map(i => ({
            produtoId:    i.produtoId,
            quantidade:   i.quantidade,
            variacaoId:   i.variacaoId,
            variacaoNome: i.variacaoNome,
          })),
          cupomCodigo: cupom?.codigo,
          desconto:    cupom?.desconto ?? 0,
        }),
      })
      if (!pr.ok) throw new Error('Erro ao criar pedido')
      const pedidoData = await pr.json()

      if (forma !== 'cartao') {
        const pagr = await fetch('/api/pagamento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pedidoId: pedidoData.pedido.id }),
        })
        const pagd = await pagr.json()
        if (pagd.initPoint) {
          window.location.href = pagd.initPoint
          return
        }
      }

      setPedidoId(pedidoData.pedido.id)
      limparCarrinho()
      setFase('sucesso')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao processar pedido. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  // ── Carrinho vazio ───────────────────────────────────────────────────────────
  if (itens.length === 0 && fase !== 'sucesso' && !compraDireta) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <ShoppingBag size={32} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Carrinho vazio</h2>
        <p className="text-gray-500 text-sm mb-6">Adicione produtos antes de finalizar a compra.</p>
        <Link href="/produtos"
          className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-8 py-3 rounded-xl transition-colors text-sm">
          Ver Produtos
        </Link>
      </div>
    )
  }

  // ── Sucesso ──────────────────────────────────────────────────────────────────
  if (fase === 'sucesso') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="w-20 h-20 rounded-full bg-[#e8f8f7] flex items-center justify-center mb-5">
          <CheckCircle size={36} className="text-[#3cbfb3]" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Pedido realizado!</h2>
        <p className="text-gray-600 text-sm mb-1">
          Pedido{' '}
          <span className="font-mono font-bold text-[#3cbfb3]">#{pedidoId?.slice(-8).toUpperCase()}</span>{' '}
          confirmado.
        </p>
        <p className="text-gray-400 text-xs mb-8">Você receberá atualizações por e-mail.</p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/pedidos"
            className="bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
            Meus Pedidos
          </Link>
          <Link href="/produtos"
            className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            Continuar Comprando
          </Link>
        </div>
      </div>
    )
  }

  // ── Formulário de checkout ───────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Título */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Finalizar Compra</h1>
        {compraDireta && (
          <span className="inline-flex items-center gap-1.5 bg-[#e8f8f7] text-[#3cbfb3] text-xs font-bold px-3 py-1.5 rounded-full border border-[#3cbfb3]/30">
            <Zap size={12} />
            Compra Rápida
          </span>
        )}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-6">

        {/* ── Coluna esquerda ────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* 1 — Endereço */}
          <Secao num={1} titulo="Endereço de Entrega">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CEP */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  CEP <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={end.cep}
                    onChange={e => setEnd(ev => ({ ...ev, cep: e.target.value }))}
                    onBlur={e => buscarCep(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition pr-10"
                  />
                  {buscandoCep && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3cbfb3] animate-spin" />
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <Campo label="Logradouro" required value={end.logradouro}
                  onChange={v => setEnd(e => ({ ...e, logradouro: v }))} />
              </div>
              <Campo label="Número" required value={end.numero}
                onChange={v => setEnd(e => ({ ...e, numero: v }))} />
              <Campo label="Complemento" value={end.complemento}
                onChange={v => setEnd(e => ({ ...e, complemento: v }))} placeholder="Apto, bloco..." />
              <Campo label="Bairro" required value={end.bairro}
                onChange={v => setEnd(e => ({ ...e, bairro: v }))} />
              <Campo label="Cidade" required value={end.cidade}
                onChange={v => setEnd(e => ({ ...e, cidade: v }))} />
              <Campo label="Estado (UF)" required value={end.estado}
                onChange={v => setEnd(e => ({ ...e, estado: v.toUpperCase().slice(0, 2) }))} placeholder="SP" />
            </div>

            {/* Frete */}
            {carregandoFrete && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#3cbfb3]">
                <Loader2 size={14} className="animate-spin" />
                Calculando frete...
              </div>
            )}
            {opcoesFrete.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Truck size={14} className="text-gray-400" />
                  Opção de Frete
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
                          : 'border-gray-200 hover:border-[#3cbfb3]/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        freteSel === op.price ? 'border-[#3cbfb3]' : 'border-gray-300'
                      }`}>
                        {freteSel === op.price && (
                          <div className="w-2 h-2 rounded-full bg-[#3cbfb3]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{op.name}</p>
                        <p className="text-xs text-gray-500">{op.delivery_time} dias úteis</p>
                      </div>
                      <p className={`text-sm font-bold ${op.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {op.price === 0 ? 'Grátis' : `R$ ${op.price.toFixed(2).replace('.', ',')}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Secao>

          {/* 2 — Cupom */}
          <Secao num={2} titulo="Cupom de Desconto">
            {cupom ? (
              <div className="flex items-center justify-between bg-[#e8f8f7] border border-[#3cbfb3]/30 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-[#3cbfb3] shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Cupom aplicado</p>
                    <p className="text-xs font-mono font-bold text-[#3cbfb3]">{cupom.codigo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">
                    -{cupom.desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setCupom(null); setCupomInput('') }}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 ml-auto mt-0.5 transition"
                  >
                    <X size={11} /> Remover
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={cupomInput}
                      onChange={e => { setCupomInput(e.target.value.toUpperCase()); setCupomErro('') }}
                      onKeyDown={e => e.key === 'Enter' && aplicarCupom()}
                      placeholder="CÓDIGO DO CUPOM"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={aplicarCupom}
                    disabled={cupomLoading}
                    className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition shrink-0"
                  >
                    {cupomLoading ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
                  </button>
                </div>
                {cupomErro && <p className="text-xs text-red-500 mt-2">{cupomErro}</p>}
              </>
            )}
          </Secao>

          {/* 3 — Pagamento */}
          <Secao num={3} titulo="Forma de Pagamento">
            {/* Seletores visuais */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {(
                [
                  { v: 'pix'    as const, label: 'PIX',     icon: <PixIcon />,          badge: '-3%'  },
                  { v: 'cartao' as const, label: 'Cartão',  icon: <CreditCard size={20} />, badge: null },
                  { v: 'boleto' as const, label: 'Boleto',  icon: <FileText size={20} />,  badge: null },
                ]
              ).map(({ v, label, icon, badge }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForma(v)}
                  className={`relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition ${
                    forma === v
                      ? 'border-[#3cbfb3] bg-[#e8f8f7] text-[#3cbfb3]'
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-[#3cbfb3]/40 hover:bg-[#f0fffe]'
                  }`}
                >
                  {badge && (
                    <span className="absolute -top-2 -right-2 text-[10px] bg-green-500 text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {badge}
                    </span>
                  )}
                  {icon}
                  <span className="text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>

            {/* PIX */}
            {forma === 'pix' && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-green-800 mb-0.5">Desconto de 3% no PIX</p>
                <p className="text-xs text-green-600">
                  Aprovação instantânea. QR code gerado ao finalizar o pedido.
                </p>
              </div>
            )}

            {/* Cartão */}
            {forma === 'cartao' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Campo label="Nome no cartão" value="" onChange={() => {}} placeholder="Como aparece no cartão" />
                  </div>
                  <div className="sm:col-span-2">
                    <Campo label="Número do cartão" value="" onChange={() => {}} placeholder="0000 0000 0000 0000" />
                  </div>
                  <Campo label="Validade" value="" onChange={() => {}} placeholder="MM/AA" />
                  <Campo label="CVV" value="" onChange={() => {}} placeholder="123" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parcelas</label>
                  <div className="relative">
                    <select
                      value={parcelas}
                      onChange={e => setParcelas(Number(e.target.value))}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3] transition bg-white pr-10"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
                        const vlr = calcParcela(n)
                        const label =
                          n === 1
                            ? `1x de R$ ${vlr.toFixed(2).replace('.', ',')} (sem juros)`
                            : `${n}x de R$ ${vlr.toFixed(2).replace('.', ',')} (2,99% a.m.)`
                        return <option key={n} value={n}>{label}</option>
                      })}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Boleto */}
            {forma === 'boleto' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-amber-800 mb-0.5">Boleto Bancário</p>
                <p className="text-xs text-amber-600">
                  Vencimento em 3 dias úteis. Compensação bancária em 1–2 dias após o pagamento.
                </p>
              </div>
            )}
          </Secao>

          {/* Erro global */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {erro}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={finalizar}
            disabled={carregando}
            className="w-full bg-[#3cbfb3] hover:bg-[#2a9d8f] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-2xl text-base transition-all shadow-lg shadow-[#3cbfb3]/25 flex items-center justify-center gap-2"
          >
            {carregando ? (
              <><Loader2 size={18} className="animate-spin" /> Processando...</>
            ) : (
              <><Lock size={16} /> Finalizar Pedido · R$ {totalFinal.toFixed(2).replace('.', ',')}</>
            )}
          </button>

          {/* Selos de segurança */}
          <div className="flex items-center justify-center gap-6 py-1">
            <span className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Lock size={11} /> SSL 256-bit
            </span>
            <span className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Shield size={11} /> Compra segura
            </span>
            <span className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Award size={11} /> 100% original
            </span>
          </div>
        </div>

        {/* ── Coluna direita — Resumo ─────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-4 self-start">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-extrabold text-gray-900">Resumo do Pedido</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {itens.length} {itens.length === 1 ? 'item' : 'itens'}
              </p>
            </div>

            {/* Itens */}
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {itens.map(item => (
                <div key={item.produtoId + (item.variacaoId ?? '')} className="flex items-start gap-3">
                  {item.imagem && (
                    <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                      <Image
                        src={item.imagem}
                        alt={item.nome}
                        width={48}
                        height={48}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.nome}</p>
                    {item.variacaoNome && (
                      <p className="text-xs text-gray-400">{item.variacaoNome}</p>
                    )}
                    <p className="text-xs text-gray-500">Qtd: {item.quantidade}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">
                    R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))}
            </div>

            {/* Totais */}
            <div className="px-5 pb-5 pt-4 space-y-2 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              {forma === 'pix' && pixDesconto > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold">
                  <span>Desconto PIX (3%)</span>
                  <span>-R$ {pixDesconto.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {freteSel !== null && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Frete</span>
                  <span className={frete === 0 ? 'text-green-600 font-semibold' : ''}>
                    {frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2).replace('.', ',')}`}
                  </span>
                </div>
              )}
              {cupom && (
                <div className="flex justify-between text-sm text-green-600 font-semibold">
                  <span>Cupom {cupom.codigo}</span>
                  <span>-R$ {cupom.desconto.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-gray-900 text-base pt-2 border-t border-gray-100 mt-2">
                <span>Total</span>
                <span>R$ {totalFinal.toFixed(2).replace('.', ',')}</span>
              </div>
              {forma === 'cartao' && parcelas > 1 && (
                <p className="text-xs text-gray-400 text-right">
                  {parcelas}x de R$ {calcParcela(parcelas).toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}

// ─── Wrapper com Suspense e fundo branco ──────────────────────────────────────

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-100 rounded-xl w-48" />
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-6 mt-8">
              <div className="space-y-4">
                <div className="h-72 bg-gray-100 rounded-2xl" />
                <div className="h-20 bg-gray-100 rounded-2xl" />
                <div className="h-52 bg-gray-100 rounded-2xl" />
              </div>
              <div className="h-80 bg-gray-100 rounded-2xl" />
            </div>
          </div>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </div>
  )
}
