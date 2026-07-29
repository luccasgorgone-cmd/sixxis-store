'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import React from 'react'
import {
  ChevronDown, ChevronRight, Loader2, ShoppingCart,
  Search, Package, MapPin, CreditCard, Truck, CheckCircle,
  Clock, AlertCircle, Save, DollarSign, FileText, X, Trash2, UserCheck,
  FileCheck, ShieldAlert,
} from 'lucide-react'
import { CrmSyncModal } from './CrmSyncModal'
import { Toast } from '@/components/admin/Toast'
import { formatarPagamento, formatarMpStatus, isStatusPago } from '@/lib/pedido-status'
import { formatarTelefone, formatarCpf } from '@/lib/format'
import { ADMIN_BASE } from '@/lib/admin-path'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Endereco {
  logradouro: string; numero: string; complemento?: string | null
  bairro: string; cidade: string; estado: string; cep: string
}

interface Produto { nome: string; sku: string | null; imagens: string[] }

interface ItemPedido {
  id: string; quantidade: number; precoUnitario: number
  variacaoId: string | null; variacaoNome: string | null
  produto: Produto
}

interface Cliente { nome: string; email: string; telefone?: string | null }

interface Pagamento {
  id: string
  mpPaymentId: string | null
  mpStatus: string
  mpStatusDetail: string | null
  metodo: string
  valor: number
  parcelas: number | null
  bandeira: string | null
  ultimosDigitos: string | null
  createdAt: string
  aprovadoEm: string | null
  rejeitadoEm: string | null
  payerCpf?: string | null
}

interface Pedido {
  id: string; status: string; total: number; frete: number
  formaPagamento: string; mpPaymentId: string | null
  codigoRastreio: string | null; createdAt: string
  transportadora: string | null; linkRastreio: string | null
  notaFiscal: string | null; dataNotaFiscal: string | null
  // NF-e emitida pela Focus NFe (coexiste com o número manual acima).
  nfeStatus: string | null; nfeChave: string | null
  nfeNumero: number | null; nfeSerie: number | null
  nfeDanfeUrl: string | null; nfeXmlUrl: string | null
  nfeMensagemErro: string | null
  crmSincronizadoEm: string | null; crmLeadId: string | null
  custoFreteReal: number | null; enviadoEm: string | null; entregueEm: string | null
  freteTipo: string | null; fretePrazo: number | null
  cliente: Cliente; endereco: Endereco; itens: ItemPedido[]
  pagamentos?: Pagamento[]
}

interface Stats { total: number; pendentes: number; enviados: number; receita: number; aguardandoEnvio: number }

// Cotação por transportadora (sob demanda) — mesmo shape da rota admin/interna.
interface CotTransportadora {
  carrierId: string; transportadora: string; ok: boolean
  preco: number | null; prazoDias: number | null; erro?: string
}
interface CotResposta {
  ok: boolean; uf: string | null; cotacoes: CotTransportadora[]
  maisBarata: { transportadora: string; preco: number; prazoDias: number | null } | null
  status: string; mensagem: string
}

// Exclusão de pedidos — pré-cálculo (preview) da trava e da reversão de saldo.
interface PedidoBloqueado {
  id: string; status: string; motivo: string; cashback: number; pontos: number
}
interface ReverterSaldo { cashback: number; pontos: number; cupomUsos: number }
interface PreviewExcluir {
  aExcluir: number; bloqueados: PedidoBloqueado[]; reverter: ReverterSaldo
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['pendente', 'aguardando_frete', 'pago', 'enviado', 'entregue', 'cancelado']

// Transportadoras oferecidas no select. Qualquer outro nome (inclusive o que o
// resolver de frete grava na criação do pedido) cai em "Outro", que revela um
// campo livre — o valor final sempre grava em Pedido.transportadora.
const TRANSPORTADORAS = ['Braspress', 'Rodonaves', 'Correios'] as const
const TRANSPORTADORA_OUTRO = 'Outro'

// Status oferecidos na ação em massa. 'enviado' fica DE FORA de propósito:
// entrar em "enviado" dispara o e-mail de rastreio ao cliente, e despachar tem
// fluxo próprio por pedido ("Confirmar envio"), que exige o código de rastreio.
// Marcar em massa mandaria e-mails sem ninguém revisar o rastreio.
const STATUSES_EM_MASSA = STATUSES.filter((s) => s !== 'enviado')

const STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  aguardando_frete: 'bg-orange-50 text-orange-700 border-orange-200',
  pago: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  enviado: 'bg-purple-50 text-purple-700 border-purple-200',
  entregue: 'bg-green-50 text-green-700 border-green-200',
  cancelado: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente', aguardando_frete: 'Orçamento (frete a combinar)',
  pago: 'Pago', enviado: 'Enviado',
  entregue: 'Entregue', cancelado: 'Cancelado',
}

// Abas de status (a aba "Pago" é a de atenção — pedidos aguardando despacho).
const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Todos' },
  { key: 'pago', label: 'Pago' },
  { key: 'enviado', label: 'Enviado' },
  { key: 'entregue', label: 'Entregue' },
  { key: 'pendente', label: 'Pendente' },
  { key: 'aguardando_frete', label: 'Orçamento' },
  { key: 'cancelado', label: 'Cancelado' },
]

const TIMELINE_STEPS = ['pendente', 'pago', 'enviado', 'entregue']

function fmt(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Timeline({ status }: { status: string }) {
  if (status === 'cancelado') {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <AlertCircle className="w-4 h-4" />
        Pedido cancelado
      </div>
    )
  }
  const cur = TIMELINE_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= cur
        const last = i === TIMELINE_STEPS.length - 1
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? 'bg-[#3cbfb3] border-[#3cbfb3]' : 'bg-white border-gray-200'
              }`}>
                {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Clock className="w-3 h-3 text-gray-300" />}
              </div>
              <span className={`text-[10px] mt-1 capitalize whitespace-nowrap ${done ? 'text-[#3cbfb3] font-semibold' : 'text-gray-300'}`}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {!last && (
              <div className={`w-16 h-0.5 mb-4 mx-1 ${i < cur ? 'bg-[#3cbfb3]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Modal "Gerar Pedido" — Espelho do Pedido / Solicitação de Faturamento.
// Campos editáveis pré-preenchidos; "Gerar PDF" abre a rota /nf em nova aba.
function PedidoModal({
  pedido,
  onClose,
}: {
  pedido: Pedido
  onClose: () => void
}) {
  const [transportadora, setTransportadora] = useState(pedido.transportadora ?? '')
  const [frete, setFrete] = useState(
    pedido.custoFreteReal != null
      ? String(pedido.custoFreteReal)
      : pedido.frete != null
        ? String(pedido.frete)
        : '',
  )
  const [rastreio, setRastreio] = useState(pedido.codigoRastreio ?? '')
  const [prazo, setPrazo] = useState(
    pedido.fretePrazo ? `cerca de ${pedido.fretePrazo} dias úteis` : '',
  )
  // Frete por conta do cliente? Default: Sim quando o pedido cobrou frete.
  const [freteCliente, setFreteCliente] = useState(Number(pedido.frete) > 0)

  function gerar() {
    const params = new URLSearchParams()
    if (transportadora.trim()) params.set('transportadora', transportadora.trim())
    if (frete.trim()) params.set('frete', frete.trim())
    if (rastreio.trim()) params.set('rastreio', rastreio.trim())
    if (prazo.trim()) params.set('prazo', prazo.trim())
    params.set('freteCliente', freteCliente ? '1' : '0')
    // ADMIN_BASE = alias público (ex.: /painel…) que o proxy reescreve p/ a rota
    // interna. Usar o path interno hardcoded cai em 404.
    window.open(`${ADMIN_BASE}/pedidos/${pedido.id}/nf?${params.toString()}`, '_blank', 'noopener')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#0f2e2b]">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-4 h-4 text-[#3cbfb3]" />
            <div>
              <p className="text-sm font-bold leading-tight">Gerar Pedido</p>
              <p className="text-[11px] text-[#9fd8d1] leading-tight">
                Espelho do Pedido · #{pedido.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            Documento interno para o financeiro faturar. <b>Não é documento fiscal</b> —
            a NF-e é emitida depois.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Transportadora</label>
            <input
              value={transportadora}
              onChange={(e) => setTransportadora(e.target.value)}
              placeholder="Ex: Correios, Jadlog…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor do frete</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input
                  type="number" min="0" step="0.01"
                  value={frete}
                  onChange={(e) => setFrete(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código de rastreio</label>
              <input
                value={rastreio}
                onChange={(e) => setRastreio(e.target.value)}
                placeholder="BR000000000BR"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prazo</label>
            <input
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              placeholder="Ex: cerca de 7 dias úteis"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Frete por conta do cliente?</label>
            <div className="flex gap-2">
              {[
                { val: true, label: 'Sim' },
                { val: false, label: 'Não' },
              ].map(({ val, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFreteCliente(val)}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold border transition ${
                    freteCliente === val
                      ? 'bg-[#3cbfb3] text-white border-[#3cbfb3]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#3cbfb3]/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {freteCliente
                ? 'Frete entra nos totais e soma ao Total do documento.'
                : 'Frete NÃO entra nos totais — fica só como custo interno (não faturado).'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={gerar}
            className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
          >
            <FileText className="w-4 h-4" /> Gerar PDF
          </button>
        </div>
      </div>
    </div>
  )
}

function PedidoDetalhe({
  pedido,
  onUpdate,
  showToast,
  nfeAmbiente,
}: {
  pedido: Pedido
  onUpdate: (id: string, updates: Partial<Pedido>) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  /** 'homologacao' | 'producao' — vem do servidor (a env não é NEXT_PUBLIC_). */
  nfeAmbiente: string
}) {
  const [status, setStatus] = useState(pedido.status)
  // Transportadora: um pedido antigo com valor fora da lista abre em "Outro"
  // já preenchido, sem perder o dado.
  const transpSalva = pedido.transportadora ?? ''
  const transpNaLista = (TRANSPORTADORAS as readonly string[]).includes(transpSalva)
  const [transpOpcao, setTranspOpcao] = useState(
    transpSalva === '' ? '' : transpNaLista ? transpSalva : TRANSPORTADORA_OUTRO,
  )
  const [transpOutro, setTranspOutro] = useState(transpNaLista ? '' : transpSalva)
  const transportadora =
    transpOpcao === TRANSPORTADORA_OUTRO ? transpOutro.trim() : transpOpcao
  const [rastreio, setRastreio] = useState(pedido.codigoRastreio ?? '')
  const [linkRastreio, setLinkRastreio] = useState(pedido.linkRastreio ?? '')
  const [notaFiscal, setNotaFiscal] = useState(pedido.notaFiscal ?? '')
  // Data da NF em "YYYY-MM-DD" p/ o <input type="date">. A API vem em ISO
  // (meio-dia UTC) — o slice(0,10) devolve o dia-calendário correto.
  const [dataNota, setDataNota] = useState(pedido.dataNotaFiscal ? pedido.dataNotaFiscal.slice(0, 10) : '')
  const [custoReal, setCustoReal] = useState(pedido.custoFreteReal != null ? String(pedido.custoFreteReal) : '')
  const [saving, setSaving] = useState<string | null>(null)
  const [pedidoModalOpen, setPedidoModalOpen] = useState(false)
  const [crmOpen, setCrmOpen] = useState(false)
  // NF-e: emissão manual, um clique consciente. `emitindo` cobre os segundos que
  // a SEFAZ leva para responder (a emissão é síncrona).
  const [emitindo, setEmitindo] = useState(false)
  // Cotação por transportadora — sob demanda (só ao clicar), nunca automática.
  const [cotando, setCotando] = useState(false)
  const [cotResp, setCotResp] = useState<CotResposta | null>(null)
  const [cotErro, setCotErro] = useState<string | null>(null)

  const freteCobrado = Number(pedido.frete)
  const custoNum = custoReal.trim() === '' ? null : Number(custoReal)
  const margem = custoNum == null || Number.isNaN(custoNum) ? null : freteCobrado - custoNum

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function patch(payload: Record<string, any>, acao: string, successMsg: string) {
    setSaving(acao)
    try {
      const res = await fetch(`/api/admin/pedidos/${pedido.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'falha')
      }
      const d = await res.json()
      const p = d.pedido
      onUpdate(pedido.id, {
        status: p.status, codigoRastreio: p.codigoRastreio, transportadora: p.transportadora,
        linkRastreio: p.linkRastreio, notaFiscal: p.notaFiscal, dataNotaFiscal: p.dataNotaFiscal,
        custoFreteReal: p.custoFreteReal, enviadoEm: p.enviadoEm, entregueEm: p.entregueEm,
      })
      setStatus(p.status)
      showToast(successMsg + (d.emailEnviado ? ' · email enviado ao cliente' : ''))
    } catch (err) {
      showToast((err as Error).message || 'Erro ao salvar', 'error')
    }
    setSaving(null)
  }

  function confirmarEnvio() {
    if (!rastreio.trim()) { showToast('Informe o código de rastreio.', 'error'); return }
    patch(
      { acao: 'despachar', transportadora, codigoRastreio: rastreio, linkRastreio, notaFiscal, dataNotaFiscal: dataNota, custoFreteReal: custoReal },
      'despachar', 'Envio confirmado — pedido marcado como Enviado',
    )
  }
  function marcarEntregue() {
    patch({ acao: 'entregue' }, 'entregue', 'Pedido marcado como Entregue')
  }
  function salvarEdicao() {
    patch(
      { transportadora, codigoRastreio: rastreio, linkRastreio, notaFiscal, dataNotaFiscal: dataNota, custoFreteReal: custoReal },
      'editar', 'Dados de envio atualizados (sem reenvio de email)',
    )
  }
  function salvarStatus() {
    patch({ status }, 'status', 'Status atualizado')
  }

  // ── NF-e (Focus NFe) ────────────────────────────────────────────────────────
  // A rota revalida o pagamento e a idempotência no servidor — o botão
  // desabilitado é conveniência, não a trava. Rejeição da SEFAZ volta 200 com a
  // mensagem: não é falha de rede, é resposta do fisco.
  async function emitirNfe() {
    setEmitindo(true)
    try {
      const res = await fetch(`${ADMIN_BASE}/pedidos/${pedido.id}/nfe/emitir`, {
        method: 'POST',
        credentials: 'include',
      })
      const d = await res.json().catch(() => null)
      if (!res.ok || !d) throw new Error(d?.error || 'Falha ao emitir a NF-e')

      onUpdate(pedido.id, {
        nfeStatus: d.nfe?.status ?? null,
        nfeChave: d.nfe?.chave ?? null,
        nfeNumero: d.nfe?.numero ?? null,
        nfeSerie: d.nfe?.serie ?? null,
        nfeDanfeUrl: d.nfe?.danfeUrl ?? null,
        nfeXmlUrl: d.nfe?.xmlUrl ?? null,
        nfeMensagemErro: d.nfe?.erro ?? null,
        ...(d.dataNotaFiscal ? { dataNotaFiscal: d.dataNotaFiscal } : {}),
      })
      if (d.dataNotaFiscal) setDataNota(String(d.dataNotaFiscal).slice(0, 10))

      if (d.nfe?.status === 'autorizado') {
        showToast(d.jaEmitida ? 'Este pedido já tinha NF-e autorizada.' : 'NF-e autorizada pela SEFAZ')
      } else if (d.nfe?.status === 'processando') {
        showToast('NF-e em processamento na SEFAZ — clique de novo em instantes.', 'error')
      } else {
        showToast(d.nfe?.erro || 'A SEFAZ recusou a NF-e', 'error')
      }
    } catch (err) {
      showToast((err as Error).message || 'Erro ao emitir a NF-e', 'error')
    }
    setEmitindo(false)
  }

  // Cota Braspress × Melhor Envio para este pedido (endereço + produtos do pedido).
  // SOB DEMANDA. Nunca grava — a escolha é um passo consciente separado.
  async function cotarTransportadoras() {
    setCotando(true)
    setCotErro(null)
    try {
      const res = await fetch(`/api/admin/pedidos/${pedido.id}/cotar-transportadoras`, { method: 'POST' })
      const d = await res.json().catch(() => null)
      if (!res.ok || !d) throw new Error(d?.error || 'Falha ao cotar transportadoras')
      setCotResp(d as CotResposta)
      // Sem nenhuma cotação (carrier off / sem dimensões / CEP inválido): mostra o motivo.
      if (!d.cotacoes?.length) setCotErro(d.mensagem || 'Nenhuma cotação disponível.')
    } catch (err) {
      setCotResp(null)
      setCotErro((err as Error).message || 'Erro ao cotar')
    }
    setCotando(false)
  }

  // Escolhe uma transportadora cotada: pré-preenche o dropdown de despacho +
  // grava Pedido.transportadora e Pedido.custoFreteReal (custo interno p/ margem).
  // NÃO toca no frete/total do cliente. Reusa o MESMO PATCH de edição.
  function escolherCotacao(nome: string, preco: number) {
    if ((TRANSPORTADORAS as readonly string[]).includes(nome)) {
      setTranspOpcao(nome)
      setTranspOutro('')
    } else {
      setTranspOpcao(TRANSPORTADORA_OUTRO)
      setTranspOutro(nome)
    }
    setCustoReal(String(preco))
    patch(
      { transportadora: nome, custoFreteReal: String(preco) },
      'escolher-cotacao',
      `Transportadora definida: ${nome} · custo real ${fmt(preco)}`,
    )
  }

  const end = pedido.endereco
  const payerCpf = pedido.pagamentos?.find(p => p.payerCpf)?.payerCpf
  const statusLower = (pedido.status || '').toLowerCase()

  // NF-e: só depois do pagamento confirmado (mesma regra do servidor).
  const podeEmitirNfe = isStatusPago(pedido.status)
  const nfeHomologacao = nfeAmbiente === 'homologacao'
  const nfeAutorizada = pedido.nfeStatus === 'autorizado'

  return (
    <tr>
      <td colSpan={11} className="bg-gray-50 border-b border-gray-100">
        <div className="px-6 py-5 space-y-6">
          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Progresso</p>
            <Timeline status={status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Itens */}
            <div className="md:col-span-2 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Itens do pedido
              </p>
              {pedido.itens.map((item) => {
                const thumb = (item.produto.imagens as string[])?.[0]
                return (
                  <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {thumb ? (
                        <Image src={thumb} alt={item.produto.nome} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <Package className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {/* Mesmo padrão do PDF da NF: "Nome do Produto (220V)".
                            Pedidos antigos têm variacaoNome null — só o nome. */}
                        {item.variacaoNome ? `${item.produto.nome} (${item.variacaoNome})` : item.produto.nome}
                      </p>
                      {item.produto.sku && <p className="text-xs font-mono text-gray-400">{item.produto.sku}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">{item.quantidade}x {fmt(Number(item.precoUnitario))}</p>
                      <p className="text-sm font-semibold text-gray-900">{fmt(item.quantidade * Number(item.precoUnitario))}</p>
                    </div>
                  </div>
                )
              })}
              <div className="flex justify-end gap-6 text-sm pt-1 pr-1">
                <span className="text-gray-500">Frete: <span className="font-medium">{fmt(Number(pedido.frete))}</span></span>
                <span className="font-bold text-gray-900">Total: {fmt(Number(pedido.total))}</span>
              </div>
            </div>

            {/* Info lateral */}
            <div className="space-y-4">
              {/* Endereço */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5" /> Endereço de entrega
                </p>
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-900">{pedido.cliente.nome}</p>
                  <p>{end.logradouro}, {end.numero}{end.complemento ? `, ${end.complemento}` : ''}</p>
                  <p>{end.bairro} — {end.cidade}/{end.estado}</p>
                  <p>CEP {end.cep}</p>
                  {pedido.cliente?.telefone && <p className="text-gray-400">Telefone: {formatarTelefone(pedido.cliente.telefone)}</p>}
                  {payerCpf && <p className="text-gray-400">CPF: {formatarCpf(payerCpf)}</p>}
                </div>
              </div>

              {/* Pagamento (resumo) */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CreditCard className="w-3.5 h-3.5" /> Forma de pagamento
                </p>
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm space-y-1">
                  <p className="font-medium text-gray-700">{formatarPagamento(pedido.formaPagamento)}</p>
                  {pedido.mpPaymentId && (
                    <p className="text-xs font-mono text-gray-400">MP: {pedido.mpPaymentId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de tentativas de pagamento */}
          {pedido.pagamentos && pedido.pagamentos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <CreditCard className="w-3.5 h-3.5" /> Pagamentos ({pedido.pagamentos.length})
              </p>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Data</th>
                      <th className="px-3 py-2 text-left font-semibold">Método</th>
                      <th className="px-3 py-2 text-left font-semibold">Valor</th>
                      <th className="px-3 py-2 text-left font-semibold">Status</th>
                      <th className="px-3 py-2 text-left font-semibold">Detalhes</th>
                      <th className="px-3 py-2 text-left font-semibold">MP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.pagamentos.map((pg) => (
                      <tr key={pg.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {fmtDate(pg.createdAt)}
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-700">
                          {pg.metodo === 'pix' ? 'PIX' : pg.metodo === 'credit_card' ? 'Cartão' : pg.metodo === 'debit_card' ? 'Débito' : pg.metodo}
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-900">
                          {fmt(pg.valor / 100)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            pg.mpStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            pg.mpStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            pg.mpStatus === 'cancelled' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                            pg.mpStatus === 'refunded' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {formatarMpStatus(pg.mpStatus)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {pg.parcelas && pg.parcelas > 1 ? `${pg.parcelas}x` : ''}
                          {pg.bandeira ? ` ${pg.bandeira}` : ''}
                          {pg.ultimosDigitos ? ` ••${pg.ultimosDigitos}` : ''}
                          {pg.mpStatusDetail ? <p className="text-[10px] text-gray-400">{pg.mpStatusDetail}</p> : null}
                        </td>
                        <td className="px-3 py-2">
                          {pg.mpPaymentId ? (
                            <a
                              href={`https://www.mercadopago.com.br/activities/detail/${pg.mpPaymentId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#3cbfb3] hover:underline font-mono text-[10px]"
                            >
                              {pg.mpPaymentId}
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Despacho e rastreio */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Despacho e rastreio
              </p>
              <div className="flex items-center gap-2">
                {statusLower === 'pago' && !pedido.codigoRastreio && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" /> Aguardando envio
                  </span>
                )}
                <button
                  onClick={() => setPedidoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#3cbfb3] hover:bg-[#2a9d8f] text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Gerar Pedido
                </button>
                <button
                  onClick={emitirNfe}
                  disabled={!podeEmitirNfe || emitindo}
                  title={
                    podeEmitirNfe
                      ? nfeAutorizada
                        ? 'NF-e já autorizada — o botão devolve a nota existente, não emite outra.'
                        : undefined
                      : 'Disponível após confirmação do pagamento'
                  }
                  className={`inline-flex items-center gap-1.5 font-semibold rounded-lg px-3 py-1.5 text-xs transition border ${
                    podeEmitirNfe
                      ? 'bg-[#0f2e2b] hover:bg-[#123b37] text-white border-[#0f2e2b] disabled:opacity-60'
                      : 'bg-white text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  {emitindo
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Emitindo…</>
                    : <><FileCheck className="w-3.5 h-3.5" /> {nfeAutorizada ? 'NF-e emitida' : 'Gerar NF-e'}</>}
                </button>
                <button
                  onClick={() => setCrmOpen(true)}
                  title={statusLower === 'pago' ? undefined : 'Pedido ainda não está pago — envie só quando confirmado.'}
                  className={`inline-flex items-center gap-1.5 font-semibold rounded-lg px-3 py-1.5 text-xs transition border ${
                    statusLower === 'pago'
                      ? 'bg-[#0f2e2b] hover:bg-[#123b37] text-white border-[#0f2e2b]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#3cbfb3]/40'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Enviar dados ao CRM
                </button>
              </div>
            </div>

            {pedido.crmSincronizadoEm && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0f2e2b] bg-[#e8f8f7] border border-[#3cbfb3]/30 px-2.5 py-1 rounded-lg">
                <UserCheck className="w-3.5 h-3.5 text-[#3cbfb3]" />
                Sincronizado com o CRM em {fmtDate(pedido.crmSincronizadoEm)}
              </div>
            )}

            {/* ── NF-e ────────────────────────────────────────────────────────
                O selo de HOMOLOGAÇÃO fica sempre visível enquanto o ambiente for
                de teste — é o que impede confundir uma nota sem valor fiscal com
                uma real. Some sozinho quando FOCUS_NFE_AMBIENTE virar producao. */}
            {(nfeHomologacao || pedido.nfeStatus) && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 space-y-2">
                {nfeHomologacao && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    HOMOLOGAÇÃO — sem valor fiscal
                  </div>
                )}

                {nfeAutorizada && (
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0f2e2b] bg-[#e8f8f7] border border-[#3cbfb3]/30 px-2.5 py-1 rounded-lg">
                      <FileCheck className="w-3.5 h-3.5 text-[#3cbfb3]" />
                      NF-e emitida
                      {pedido.nfeNumero != null && <> · nº {pedido.nfeNumero}</>}
                      {pedido.nfeSerie != null && <> · série {pedido.nfeSerie}</>}
                    </div>
                    {pedido.nfeChave && (
                      <p className="text-[11px] text-gray-500 font-mono break-all">
                        Chave: {pedido.nfeChave}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {pedido.nfeDanfeUrl && (
                        <a
                          href={pedido.nfeDanfeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-[#3cbfb3] hover:bg-[#2a9d8f] rounded-lg px-2.5 py-1 transition"
                        >
                          <FileText className="w-3 h-3" /> DANFE (PDF)
                        </a>
                      )}
                      {pedido.nfeXmlUrl && (
                        <a
                          href={pedido.nfeXmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0f2e2b] bg-white border border-gray-200 hover:border-[#3cbfb3]/50 rounded-lg px-2.5 py-1 transition"
                        >
                          <FileText className="w-3 h-3" /> XML
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {pedido.nfeStatus === 'processando' && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    NF-e enviada, aguardando a SEFAZ. Clique em “Gerar NF-e” de novo para consultar.
                  </p>
                )}

                {pedido.nfeStatus === 'erro' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-red-700 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                      <span>{pedido.nfeMensagemErro || 'A SEFAZ recusou a NF-e.'}</span>
                    </p>
                    <button
                      onClick={emitirNfe}
                      disabled={emitindo}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-[#0f2e2b] hover:bg-[#123b37] rounded-lg px-2.5 py-1 transition disabled:opacity-60"
                    >
                      {emitindo
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Emitindo…</>
                        : <>Tentar de novo</>}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transportadora</label>
                <select
                  value={transpOpcao}
                  onChange={(e) => setTranspOpcao(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                >
                  <option value="">Selecione…</option>
                  {TRANSPORTADORAS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value={TRANSPORTADORA_OUTRO}>{TRANSPORTADORA_OUTRO}</option>
                </select>
                {transpOpcao === TRANSPORTADORA_OUTRO && (
                  <input
                    value={transpOutro}
                    onChange={(e) => setTranspOutro(e.target.value)}
                    placeholder="Nome da transportadora"
                    maxLength={60}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nota Fiscal (NF)</label>
                <input
                  value={notaFiscal}
                  onChange={(e) => setNotaFiscal(e.target.value)}
                  placeholder="Número da NF (opcional)"
                  maxLength={60}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data da NF</label>
                <input
                  type="date"
                  value={dataNota}
                  onChange={(e) => setDataNota(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                />
                <p className="text-[11px] text-gray-400 mt-1">O CRM exige a data para a garantia contar.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código de rastreio</label>
                <input
                  value={rastreio}
                  onChange={(e) => setRastreio(e.target.value)}
                  placeholder="BR000000000BR"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Link de rastreio</label>
                <input
                  value={linkRastreio}
                  onChange={(e) => setLinkRastreio(e.target.value)}
                  placeholder="https://… (cole o link de acompanhamento)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                  Custo real da transportadora
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">INTERNO — cliente não vê</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={custoReal}
                    onChange={(e) => setCustoReal(e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Margem de frete (interno)</label>
                <div className="h-[38px] flex items-center px-3 rounded-xl border border-gray-100 bg-gray-50 text-sm">
                  <span className="text-gray-400 text-xs mr-2">Cobrado {fmt(freteCobrado)} −</span>
                  {margem === null ? (
                    <span className="text-gray-400">informe o custo</span>
                  ) : (
                    <span className={`font-bold ${margem >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {margem >= 0 ? '+' : ''}{fmt(margem)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cotar transportadoras (sob demanda — Braspress × Melhor Envio) */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Cotar transportadoras
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded normal-case">INTERNO — cliente não vê</span>
                </p>
                <button
                  onClick={cotarTransportadoras}
                  disabled={cotando}
                  className="inline-flex items-center gap-1.5 border border-[#3cbfb3] text-[#2a9d8f] hover:bg-[#3cbfb3]/10 disabled:opacity-50 font-semibold rounded-lg px-3 py-1.5 text-xs transition"
                >
                  {cotando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                  {cotando ? 'Cotando…' : cotResp ? 'Recotar' : 'Cotar transportadoras'}
                </button>
              </div>

              <p className="text-[11px] text-gray-400 mb-2">
                Consulta sempre todas as transportadoras ativas (Braspress e Melhor Envio), sem filtro por tipo de produto. Se uma não atender ao item, aparece “não disponível” com o motivo — as demais continuam visíveis.
              </p>

              {cotErro && !cotResp?.cotacoes?.length && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{cotErro}</p>
              )}

              {cotResp && cotResp.cotacoes.length > 0 && (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cotResp.cotacoes.map((c) => {
                    const ehMaisBarata = c.ok && cotResp.maisBarata?.transportadora === c.transportadora
                    const escolhida = pedido.transportadora === c.transportadora
                    return (
                      <div
                        key={c.carrierId}
                        className={`rounded-xl border p-3 ${
                          c.ok
                            ? escolhida
                              ? 'border-[#3cbfb3] bg-[#3cbfb3]/5'
                              : 'border-gray-200 bg-white'
                            : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-gray-700">{c.transportadora}</span>
                          {ehMaisBarata && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">mais barata</span>
                          )}
                        </div>
                        {c.ok ? (
                          <>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="text-lg font-bold text-gray-800">{fmt(Number(c.preco))}</span>
                              <span className="text-xs text-gray-500">
                                {c.prazoDias ? `${c.prazoDias} dias úteis` : 'prazo a confirmar'}
                              </span>
                            </div>
                            <button
                              onClick={() => escolherCotacao(c.transportadora, Number(c.preco))}
                              disabled={saving !== null}
                              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition"
                            >
                              {saving === 'escolher-cotacao'
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <CheckCircle className="w-3.5 h-3.5" />}
                              {escolhida ? 'Selecionada' : 'Usar esta'}
                            </button>
                          </>
                        ) : (
                          <p className="mt-1 text-xs text-gray-400">
                            não disponível{c.erro ? ` — ${c.erro}` : ''}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
                {/* Todas as ativas responderam, mas nenhuma cotou → despacho manual. */}
                {!cotResp.maisBarata && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {cotResp.mensagem || 'Nenhuma transportadora cotou este envio — defina a transportadora e o custo manualmente.'}
                  </p>
                )}
                </>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-2 items-center pt-1">
              {statusLower === 'pago' ? (
                <button
                  onClick={confirmarEnvio}
                  disabled={saving !== null}
                  className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
                >
                  {saving === 'despachar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  Confirmar envio
                </button>
              ) : (
                <button
                  onClick={salvarEdicao}
                  disabled={saving !== null}
                  className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
                >
                  {saving === 'editar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar alterações
                </button>
              )}

              {statusLower === 'enviado' && (
                <button
                  onClick={marcarEntregue}
                  disabled={saving !== null}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition"
                >
                  {saving === 'entregue' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Marcar como entregue
                </button>
              )}

              {pedido.enviadoEm && (
                <span className="text-[11px] text-gray-400">Despachado em {fmtDate(pedido.enviadoEm)}</span>
              )}
              {pedido.entregueEm && (
                <span className="text-[11px] text-gray-400">Entregue em {fmtDate(pedido.entregueEm)}</span>
              )}
            </div>

            {/* Override manual de status (cancelar, etc.) */}
            <div className="flex flex-wrap gap-2 items-end border-t border-gray-100 pt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status (manual)</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <button
                onClick={salvarStatus}
                disabled={saving !== null || status === pedido.status}
                className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-600 font-semibold rounded-xl px-3 py-2 text-sm transition"
              >
                {saving === 'status' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Aplicar status
              </button>
              <p className="text-[11px] text-gray-400 flex-1 min-w-[200px]">
                Edição dos campos acima não reenvia email. O email de despacho é enviado só ao “Confirmar envio”.
              </p>
            </div>
          </div>
        </div>
        {pedidoModalOpen && <PedidoModal pedido={pedido} onClose={() => setPedidoModalOpen(false)} />}
        {crmOpen && (
          <CrmSyncModal
            pedidoId={pedido.id}
            codigo={`#${pedido.id.slice(-8).toUpperCase()}`}
            onClose={() => setCrmOpen(false)}
            onSincronizado={(crmSincronizadoEm, crmLeadId) =>
              onUpdate(pedido.id, { crmSincronizadoEm, crmLeadId })
            }
          />
        )}
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats>({ total: 0, pendentes: 0, enviados: 0, receita: 0, aguardandoEnvio: 0 })
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [pagamento, setPagamento] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  // Fila de trabalho do dono: pagos ainda não sincronizados com o CRM.
  const [crmPendente, setCrmPendente] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkSaving, setBulkSaving] = useState<null | 'status' | 'excluir'>(null)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [preview, setPreview] = useState<PreviewExcluir | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  // Ambiente da NF-e — vem do servidor junto com a listagem. Default de segurança:
  // 'homologacao', para o selo "sem valor fiscal" aparecer se a resposta falhar.
  const [nfeAmbiente, setNfeAmbiente] = useState('homologacao')

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const fetch_ = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), q, status, pagamento, from, to })
      if (crmPendente) params.set('crmPendente', '1')
      const res = await fetch(`/api/admin/pedidos?${params}`, { credentials: 'include', cache: 'no-store' })
      console.log('[admin/pedidos] response:', { ok: res.ok, status: res.status })
      if (!res.ok) throw new Error('Erro ' + res.status)
      const data = await res.json()
      console.log('[admin/pedidos] data:', { pedidos: data.pedidos?.length, total: data.total, stats: data.stats })
      setPedidos(Array.isArray(data.pedidos) ? data.pedidos : [])
      setTotal(Number(data.total) || 0)
      if (data.nfeAmbiente) setNfeAmbiente(String(data.nfeAmbiente))
      setStats({
        total:     Number(data.stats?.total)     || Number(data.total) || 0,
        pendentes: Number(data.stats?.pendentes) || 0,
        enviados:  Number(data.stats?.enviados)  || 0,
        receita:   Number(data.stats?.receita)   || 0,
        aguardandoEnvio: Number(data.stats?.aguardandoEnvio) || 0,
      })
    } catch (err) {
      console.error('[admin/pedidos] fetch falhou:', err)
      setPedidos([])
      setTotal(0)
      setStats({ total: 0, pendentes: 0, enviados: 0, receita: 0, aguardandoEnvio: 0 })
    } finally {
      setLoading(false)
    }
  }, [page, q, status, pagamento, from, to, crmPendente])

  // Mount: fetch imediato + safety-net que força loading=false em 5s se algo travar.
  useEffect(() => {
    let alive = true
    fetch_()
    const safety = setTimeout(() => { if (alive) setLoading(false) }, 5000)
    return () => { alive = false; clearTimeout(safety) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce para filtros subsequentes.
  const primeiroRender = useRef(true)
  useEffect(() => {
    if (primeiroRender.current) { primeiroRender.current = false; return }
    const t = setTimeout(fetch_, 400)
    return () => clearTimeout(t)
  }, [fetch_])

  useEffect(() => setPage(1), [q, status, pagamento, from, to, crmPendente])

  // Trocar de filtro/página some com as linhas da tela. Manter a seleção seria
  // guardar ids invisíveis e agir sobre eles no próximo clique — limpa sempre.
  useEffect(() => { setSelecionados(new Set()) }, [q, status, pagamento, from, to, page, crmPendente])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleUpdate(id: string, updates: Partial<Pedido>) {
    setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p))
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
  }

  // ── Seleção em massa ────────────────────────────────────────────────────────
  // O escopo é sempre "o que está na tela": os pedidos já filtrados desta página.
  const idsVisiveis = pedidos.map((p) => p.id)
  const selecionadosVisiveis = idsVisiveis.filter((id) => selecionados.has(id))
  const todosSelecionados = idsVisiveis.length > 0 && selecionadosVisiveis.length === idsVisiveis.length
  const pedidosSelecionados = pedidos.filter((p) => selecionados.has(p.id))
  const pagosSelecionados = pedidosSelecionados.filter((p) => isStatusPago(p.status))

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodos() {
    setSelecionados(todosSelecionados ? new Set() : new Set(idsVisiveis))
  }

  // Reusa o PATCH por pedido — é ele que carimba datas, dispara o clawback de
  // cashback no cancelamento e envia o e-mail de despacho. Nada disso é
  // reimplementado aqui.
  async function aplicarStatusEmMassa() {
    if (!bulkStatus || selecionadosVisiveis.length === 0) return
    setBulkSaving('status')
    const alvos = [...selecionadosVisiveis]
    const falhas: string[] = []
    for (const id of alvos) {
      try {
        const res = await fetch(`/api/admin/pedidos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: bulkStatus }),
        })
        if (!res.ok) throw new Error(String(res.status))
      } catch {
        falhas.push(id)
      }
    }
    setBulkSaving(null)
    setSelecionados(new Set())
    setBulkStatus('')
    await fetch_()
    const ok = alvos.length - falhas.length
    if (falhas.length === 0) {
      showToast(`${ok} pedido${ok !== 1 ? 's' : ''} atualizado${ok !== 1 ? 's' : ''}`)
    } else {
      showToast(`${ok} atualizado(s), ${falhas.length} falhou(ram)`, 'error')
    }
  }

  // Abre o modal e busca o preview (o que será excluído/revertido/bloqueado)
  // pela MESMA rota, em modo preview — sem apagar nada.
  async function abrirModalExcluir() {
    const alvos = [...selecionadosVisiveis]
    if (alvos.length === 0) return
    setPreview(null)
    setModalExcluir(true)
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/admin/pedidos/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: alvos, preview: true }),
      })
      if (res.ok) setPreview((await res.json()) as PreviewExcluir)
    } catch {
      // Sem preview, o modal ainda funciona (só não mostra os números).
    }
    setPreviewLoading(false)
  }

  async function excluirSelecionados() {
    const alvos = [...selecionadosVisiveis]
    if (alvos.length === 0) return
    setBulkSaving('excluir')
    try {
      const res = await fetch('/api/admin/pedidos/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: alvos }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Falha ao excluir')
      }
      const d = await res.json()
      const bloqueados: number = d.bloqueados?.length ?? 0
      setModalExcluir(false)
      setPreview(null)
      setSelecionados(new Set())
      await fetch_()
      if (d.excluidos === 0 && bloqueados > 0) {
        showToast(`Nenhum excluído — ${bloqueados} bloqueado${bloqueados !== 1 ? 's' : ''} (pago com saldo). Cancele antes de excluir.`, 'error')
      } else {
        const base = `${d.excluidos} pedido${d.excluidos !== 1 ? 's' : ''} excluído${d.excluidos !== 1 ? 's' : ''} permanentemente`
        showToast(bloqueados > 0 ? `${base} · ${bloqueados} bloqueado${bloqueados !== 1 ? 's' : ''}` : base, bloqueados > 0 ? 'error' : 'success')
      }
    } catch (err) {
      showToast((err as Error).message, 'error')
    }
    setBulkSaving(null)
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-5 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
            <p className="text-gray-500 text-sm mt-0.5">{stats.total} pedido{stats.total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Alerta de pedidos aguardando envio */}
        {stats.aguardandoEnvio > 0 && (
          <button
            onClick={() => setStatus('pago')}
            className="w-full flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-left hover:bg-red-100 transition"
          >
            <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-red-700">
              {stats.aguardandoEnvio} pedido{stats.aguardandoEnvio !== 1 ? 's' : ''} pago{stats.aguardandoEnvio !== 1 ? 's' : ''} aguardando envio
            </span>
            <span className="ml-auto text-xs text-red-600 font-semibold">Ver →</span>
          </button>
        )}

        {/* Abas por status */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const ativo = status === tab.key
            const mostrarBadge = tab.key === 'pago' && stats.aguardandoEnvio > 0
            return (
              <button
                key={tab.key || 'todos'}
                onClick={() => setStatus(tab.key)}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold border transition ${
                  ativo
                    ? 'bg-[#3cbfb3] text-white border-[#3cbfb3]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#3cbfb3]/40'
                }`}
              >
                {tab.label}
                {mostrarBadge && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    ativo ? 'bg-white text-red-600' : 'bg-red-500 text-white'
                  }`}>
                    {stats.aguardandoEnvio}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total no período', value: stats.total,     icon: ShoppingCart, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
            { label: 'Pendentes',        value: stats.pendentes, icon: Clock,    iconBg: 'bg-amber-50',  iconColor: 'text-amber-500' },
            { label: 'Enviados',         value: stats.enviados,  icon: Truck,    iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
            {
              label: 'Receita',
              value: stats.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              icon: DollarSign, iconBg: 'bg-[#3cbfb3]/10', iconColor: 'text-[#3cbfb3]',
            },
          ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{label}</p>
                <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por ID, nome do cliente ou NF..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
              />
            </div>
            <select value={pagamento} onChange={(e) => setPagamento(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3] bg-white">
              <option value="">Todos os pagamentos</option>
              <option value="pix">PIX</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Período:</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]" />
            <span className="text-gray-400 text-sm">até</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]" />
            {(from || to) && (
              <button onClick={() => { setFrom(''); setTo('') }}
                className="text-xs text-gray-400 hover:text-gray-600 underline">Limpar</button>
            )}
            <button
              onClick={() => setCrmPendente((v) => !v)}
              title="Pedidos pagos que ainda não foram enviados ao CRM — a sua fila de trabalho."
              className={`ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
                crmPendente
                  ? 'bg-[#0f2e2b] text-white border-[#0f2e2b]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#3cbfb3]/40'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Pagos não sincronizados
            </button>
          </div>
        </div>

        {/* Barra de ações em massa */}
        {selecionadosVisiveis.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-[#0f2e2b] text-white rounded-2xl px-4 py-3">
            <span className="text-sm font-semibold">
              {selecionadosVisiveis.length} pedido{selecionadosVisiveis.length !== 1 ? 's' : ''} selecionado{selecionadosVisiveis.length !== 1 ? 's' : ''}
            </span>
            {pagosSelecionados.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" />
                {pagosSelecionados.length} pago{pagosSelecionados.length !== 1 ? 's' : ''}
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                disabled={bulkSaving !== null}
                className="border border-white/20 bg-white/10 rounded-xl px-3 py-1.5 text-sm text-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#3cbfb3]"
              >
                <option value="" className="text-gray-900">Alterar status para…</option>
                {STATUSES_EM_MASSA.map((s) => (
                  <option key={s} value={s} className="text-gray-900">{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>
              <button
                onClick={aplicarStatusEmMassa}
                disabled={!bulkStatus || bulkSaving !== null}
                className="flex items-center gap-2 bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-40 text-white font-semibold rounded-xl px-3 py-1.5 text-sm transition"
              >
                {bulkSaving === 'status' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Aplicar
              </button>
              <button
                onClick={abrirModalExcluir}
                disabled={bulkSaving !== null}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold rounded-xl px-3 py-1.5 text-sm transition"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
              <button
                onClick={() => setSelecionados(new Set())}
                disabled={bulkSaving !== null}
                className="text-xs text-white/60 hover:text-white underline disabled:opacity-40"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-[#3cbfb3] animate-spin" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-3 py-3.5 w-8">
                      <input
                        type="checkbox"
                        checked={todosSelecionados}
                        onChange={toggleTodos}
                        aria-label="Selecionar todos os pedidos listados"
                        title="Seleciona os pedidos desta página, conforme o filtro atual"
                        className="w-4 h-4 rounded border-gray-300 text-[#3cbfb3] focus:ring-[#3cbfb3] cursor-pointer"
                      />
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 w-8"></th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5">#ID</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5">Cliente</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 whitespace-nowrap">Data</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 hidden xl:table-cell">Itens</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 hidden 2xl:table-cell">Frete</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5">Total</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 hidden xl:table-cell">Pagamento</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3.5 hidden 2xl:table-cell">Rastreio</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => {
                    const isOpen = expanded.has(p.id)
                    return (
                      <React.Fragment key={p.id}>
                        <tr
                          className={`border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${isOpen ? 'bg-gray-50' : ''}`}
                          onClick={() => toggleExpand(p.id)}
                        >
                          {/* stopPropagation: a linha inteira alterna o detalhe. */}
                          <td className="px-3 py-4 w-8" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selecionados.has(p.id)}
                              onChange={() => toggleSelecionado(p.id)}
                              aria-label={`Selecionar pedido ${p.id.slice(-8).toUpperCase()}`}
                              className="w-4 h-4 rounded border-gray-300 text-[#3cbfb3] focus:ring-[#3cbfb3] cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-4 w-8">
                            {isOpen
                              ? <ChevronDown className="w-4 h-4 text-[#3cbfb3]" />
                              : <ChevronRight className="w-4 h-4 text-gray-400" />
                            }
                          </td>
                          <td className="px-3 py-4">
                            <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 rounded-lg px-2 py-1">
                              #{p.id.slice(-8).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-4 max-w-[180px]">
                            <p className="text-sm font-medium text-gray-900 truncate" title={p.cliente.nome}>{p.cliente.nome}</p>
                            <p className="text-xs text-gray-400 truncate" title={p.cliente.email}>{p.cliente.email}</p>
                            {p.crmSincronizadoEm && (
                              <span
                                title={`Sincronizado com o CRM em ${fmtDate(p.crmSincronizadoEm)}`}
                                className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#0f2e2b] bg-[#e8f8f7] border border-[#3cbfb3]/30 px-1.5 py-0.5 rounded"
                              >
                                <UserCheck className="w-3 h-3" /> CRM {new Date(p.crmSincronizadoEm).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden xl:table-cell">{p.itens.length} item{p.itens.length !== 1 ? 's' : ''}</td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden 2xl:table-cell">{fmt(Number(p.frete))}</td>
                          <td className="px-3 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">{fmt(Number(p.total))}</td>
                          <td className="px-3 py-4 hidden xl:table-cell">
                            <span className="text-xs text-gray-500">{formatarPagamento(p.formaPagamento)}</span>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`text-xs font-semibold rounded-full px-2.5 py-1 border capitalize whitespace-nowrap ${STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {STATUS_LABELS[p.status] ?? p.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 hidden 2xl:table-cell">
                            {p.codigoRastreio && (
                              <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                                {p.codigoRastreio}
                              </span>
                            )}
                          </td>
                        </tr>
                        {isOpen && (
                          <PedidoDetalhe pedido={p} onUpdate={handleUpdate} showToast={showToast} nfeAmbiente={nfeAmbiente} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">Anterior</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">Próxima</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900">
                  Tem certeza que deseja excluir {selecionadosVisiveis.length} pedido{selecionadosVisiveis.length !== 1 ? 's' : ''}?
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Esta ação é <strong className="text-gray-900">PERMANENTE</strong> e não pode ser desfeita.
                </p>
              </div>
            </div>

            {previewLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Calculando reversão de saldo…
              </div>
            )}

            {preview && (
              <div className="space-y-3">
                {/* Reversão de saldo do cliente */}
                {(preview.reverter.cashback > 0 || preview.reverter.pontos > 0 || preview.reverter.cupomUsos > 0) ? (
                  <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Será revertido do cliente</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {preview.reverter.cashback > 0 && <span className="text-gray-700">Cashback <strong className="text-gray-900">{fmt(preview.reverter.cashback)}</strong></span>}
                      {preview.reverter.pontos > 0 && <span className="text-gray-700">Pontos <strong className="text-gray-900">{preview.reverter.pontos}</strong></span>}
                      {preview.reverter.cupomUsos > 0 && <span className="text-gray-700">Uso de cupom <strong className="text-gray-900">{preview.reverter.cupomUsos}</strong></span>}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Nenhum saldo (cashback/pontos/cupom) vinculado — nada a reverter.</p>
                )}

                {/* Bloqueados pela trava (pago com saldo) */}
                {preview.bloqueados.length > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-1.5">
                    <p className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {preview.bloqueados.length} pedido{preview.bloqueados.length !== 1 ? 's' : ''} {preview.bloqueados.length !== 1 ? 'não serão' : 'não será'} excluído{preview.bloqueados.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-700">
                      Pago com cashback/pontos vinculados. Cancele o pedido antes de excluir.
                    </p>
                    <ul className="text-[11px] text-amber-700 font-mono space-y-0.5 max-h-24 overflow-auto">
                      {preview.bloqueados.map((b) => (
                        <li key={b.id}>#{b.id.slice(-8)} · {STATUS_LABELS[b.status] ?? b.status}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  {preview.aExcluir > 0 ? (
                    <>Serão excluídos <strong className="text-gray-900">{preview.aExcluir}</strong> pedido{preview.aExcluir !== 1 ? 's' : ''} permanentemente.</>
                  ) : (
                    <span className="text-amber-700 font-semibold">Nenhum pedido será excluído — todos bloqueados.</span>
                  )}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setModalExcluir(false); setPreview(null) }}
                disabled={bulkSaving === 'excluir'}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Cancelar
              </button>
              <button
                onClick={excluirSelecionados}
                disabled={bulkSaving === 'excluir' || previewLoading || (preview != null && preview.aExcluir === 0)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40 transition"
              >
                {bulkSaving === 'excluir' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {preview && preview.aExcluir > 0 ? `Excluir ${preview.aExcluir}` : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
