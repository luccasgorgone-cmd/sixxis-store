'use client'

// Central de lucratividade. Somente admin.
//
//   Margem de contribuição = venda − taxa MP − frete        (não depende do COGS)
//   Lucro real             = margem de contribuição − COGS  (exige o custo)
//
// A margem de contribuição NUNCA é exibida como lucro: ela ignora o custo da
// mercadoria. Custo desconhecido vira "a definir", jamais R$ 0 — em nenhum card,
// gráfico, insight ou linha do CSV.
//
// O filtro por forma de pagamento é client-side sobre as linhas JÁ carregadas, e
// os totais/gráficos filtrados são recalculados pelas MESMAS funções puras que a
// rota usa (src/lib/margem-agregacoes.ts). Nenhuma matemática duplicada aqui.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, RefreshCcw, AlertCircle, Loader2, Percent, History, Download, Lightbulb,
} from 'lucide-react'
import { ADMIN_BASE } from '@/lib/admin-path'
import { formatBRL } from '@/lib/format'
import { gerarCsv, baixarCsv, numeroBR } from '@/lib/csv'
import { gerarInsights } from '@/lib/margem-insights'
import {
  agregarTotais, agregarSerieTemporal, agregarPorForma,
  type LinhaMargem, type PontoSerie, type LinhaForma,
} from '@/lib/margem-agregacoes'
import {
  Painel, GraficoEvolucao, GraficoPorForma, BarraDestino, DonutCustos,
} from '@/components/admin/margem/GraficosMargem'

interface ProdutosSemCusto {
  total: number
  totalProdutos: number
  lista: { id: string; nome: string }[]
}

type Periodo = 'hoje' | '7d' | '30d' | 'mes' | 'personalizado'
type FiltroForma = 'Todos' | 'PIX' | 'Cartão à vista' | 'Parcelado' | 'Outros'

const FILTROS_FORMA: FiltroForma[] = ['Todos', 'PIX', 'Cartão à vista', 'Parcelado']

const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

const fmtPct = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`)

export default function MargemPage() {
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroForma, setFiltroForma] = useState<FiltroForma>('Todos')

  const [linhas, setLinhas] = useState<LinhaMargem[]>([])
  const [serieServidor, setSerieServidor] = useState<PontoSerie[]>([])
  const [formasServidor, setFormasServidor] = useState<LinhaForma[]>([])
  const [granularidade, setGranularidade] = useState('dia')
  const [semCusto, setSemCusto] = useState<ProdutosSemCusto | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sincronizando, setSincronizando] = useState(false)
  const [msgSync, setMsgSync] = useState('')
  const [snapshotando, setSnapshotando] = useState(false)
  const [msgSnapshot, setMsgSnapshot] = useState('')

  // Período "personalizado" só busca quando as duas datas estiverem preenchidas —
  // sem isso, o fetch disparava com `periodo=personalizado` sem `from`/`to`, e o
  // relatório mostrava dado de outro período com "Personalizado" marcado, sem aviso.
  const personalizadoIncompleto = periodo === 'personalizado' && (!dataInicio || !dataFim)

  const carregar = useCallback(async () => {
    if (personalizadoIncompleto) return
    setCarregando(true)
    setErro('')
    try {
      const p = new URLSearchParams({ periodo })
      if (periodo === 'personalizado' && dataInicio && dataFim) {
        p.set('from', dataInicio)
        p.set('to', dataFim)
      }
      const r = await fetch(`/api/admin/relatorios/margem?${p}`, { cache: 'no-store' })
      if (!r.ok) throw new Error('Falha ao carregar o relatório')
      const d = await r.json()
      setLinhas(d.linhas)
      setSerieServidor(d.serieTemporal)
      setFormasServidor(d.porFormaPagamento)
      setGranularidade(d.granularidade)
      setSemCusto(d.produtosSemCusto)
    } catch (e) {
      setErro((e as Error).message)
    }
    setCarregando(false)
  }, [periodo, dataInicio, dataFim, personalizadoIncompleto])

  useEffect(() => { carregar() }, [carregar])

  // Filtro por forma: recalcula com as MESMAS funções da rota, sem refetch.
  const filtrando = filtroForma !== 'Todos'
  const linhasFiltradas = useMemo(
    () => (filtrando ? linhas.filter((l) => l.forma === filtroForma) : linhas),
    [linhas, filtroForma, filtrando],
  )
  const totais = useMemo(() => agregarTotais(linhasFiltradas), [linhasFiltradas])
  const serie = useMemo(
    () => (filtrando ? agregarSerieTemporal(linhasFiltradas, granularidade === 'semana') : serieServidor),
    [filtrando, linhasFiltradas, granularidade, serieServidor],
  )
  // O gráfico por forma sempre mostra TODAS as formas — é o seletor do drill-down.
  const porForma = useMemo(
    () => (linhas.length ? agregarPorForma(linhas) : formasServidor),
    [linhas, formasServidor],
  )

  const insights = useMemo(() => gerarInsights(totais, porForma), [totais, porForma])

  async function sincronizarTaxas() {
    setSincronizando(true)
    setMsgSync('')
    try {
      const r = await fetch('/api/admin/pagamentos/sincronizar-taxas', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Falha na sincronização')
      setMsgSync(
        `${d.atualizados} atualizado(s) · ${d.semTaxa} sem taxa no MP · ` +
        `${d.falhas} falha(s) · ${d.restantes} restante(s)`,
      )
      await carregar()
    } catch (e) {
      setMsgSync(`Erro: ${(e as Error).message}`)
    }
    setSincronizando(false)
  }

  async function snapshotCustos() {
    setSnapshotando(true)
    setMsgSnapshot('')
    try {
      const r = await fetch('/api/admin/pedidos/snapshot-custos', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Falha no snapshot')
      setMsgSnapshot(
        `${d.atualizados} item(ns) congelado(s) · ${d.pendentes} sem custo` +
        (d.produtosSemCusto ? ` · ${d.produtosSemCusto} produto(s) sem custo cadastrado` : ''),
      )
      await carregar()
    } catch (e) {
      setMsgSnapshot(`Erro: ${(e as Error).message}`)
    }
    setSnapshotando(false)
  }

  // Exporta o que está NA TELA (período + filtro de forma). Campo vazio para
  // valor desconhecido — nunca 0, que o Excel somaria como se fosse real.
  function exportar() {
    const cabecalho = [
      'Data', 'Pedido', 'Cliente', 'Forma', 'Venda', 'Taxa MP', 'Frete',
      'Custo produto', 'Margem contribuicao', 'Margem contribuicao %',
      'Lucro real', 'Lucro real %',
    ]
    const corpo = linhasFiltradas.map((l) => [
      fmtData(l.data),
      l.pedidoId,
      l.cliente,
      l.forma,
      numeroBR(l.venda),
      numeroBR(l.taxaMp),
      numeroBR(l.custoFrete),
      numeroBR(l.custoProdutos),
      numeroBR(l.margemContrib),
      numeroBR(l.margemContribPct, 1),
      numeroBR(l.lucroReal),
      numeroBR(l.lucroRealPct, 1),
    ])
    const sufixo = filtrando ? `-${filtroForma.replace(/\s+/g, '-').toLowerCase()}` : ''
    baixarCsv(`lucratividade-${periodo}${sufixo}.csv`, gerarCsv(cabecalho, corpo))
  }

  const cards = [
    { label: 'Vendas', valor: formatBRL(totais.vendas), sub: `${totais.pedidos} pedido(s) pagos`, destaque: false },
    { label: '(−) Taxa MP', valor: formatBRL(totais.taxaMp), sub: totais.taxasPendentes ? `${totais.taxasPendentes} pendente(s)` : 'todas sincronizadas', destaque: false },
    { label: '(−) Frete', valor: formatBRL(totais.custoFrete), sub: totais.fretesPendentes ? `${totais.fretesPendentes} sem custo lançado` : 'todos lançados', destaque: false },
    {
      label: '= Margem de contribuição',
      valor: formatBRL(totais.margemContrib),
      sub: `antes do custo do produto · ${totais.linhasComContrib} de ${totais.pedidos} linha(s) · ${fmtPct(totais.margemContribPctMedia)}`,
      destaque: true,
    },
    {
      label: '(−) Custo produto',
      valor: totais.lucroDisponivel ? formatBRL(totais.custoProdutos) : 'a definir',
      sub: totais.custosPendentes ? `${totais.custosPendentes} pedido(s) sem custo` : 'todos cadastrados',
      destaque: false,
    },
    {
      label: '= Lucro real (com custo)',
      // Sem nenhuma linha com custo, R$ 0,00 seria uma mentira: mostra o estado.
      valor: totais.lucroDisponivel ? formatBRL(totais.lucroReal) : 'aguardando custos',
      sub: totais.lucroDisponivel
        ? `${totais.linhasComLucro} de ${totais.pedidos} linha(s) · ${fmtPct(totais.lucroRealPctMedia)}`
        : 'preencha o custo dos produtos',
      destaque: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Cabeçalho + período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp size={22} className="text-[#3cbfb3]" /> Lucratividade
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            <strong>Margem de contribuição</strong> = venda − taxa MP − frete (antes do custo do
            produto). <strong>Lucro real</strong> = margem de contribuição − custo dos produtos.
            Interno: o cliente nunca vê.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            {(['hoje','7d','30d','mes','personalizado'] as const).map((p) => {
              const LABELS: Record<string,string> = {hoje:'Hoje','7d':'7 dias','30d':'30 dias',mes:'Mês',personalizado:'Personalizado'}
              return (
                <button key={p} onClick={() => setPeriodo(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    periodo === p ? 'bg-[#3cbfb3] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                  }`}>
                  {LABELS[p]}
                </button>
              )
            })}
          </div>
          {periodo === 'personalizado' && (
            <div className="flex items-center gap-2">
              <input type="date" value={dataInicio} max={dataFim || undefined}
                onChange={e=>setDataInicio(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
              <span className="text-gray-400 text-sm">até</span>
              <input type="date" value={dataFim} min={dataInicio || undefined}
                onChange={e=>setDataFim(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
              {personalizadoIncompleto && (
                <span className="text-xs text-amber-600 font-semibold">Escolha as duas datas</span>
              )}
            </div>
          )}
          <button onClick={carregar}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#3cbfb3] hover:border-[#3cbfb3]/40 transition-all">
            <RefreshCcw size={15} className={carregando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      {periodo === 'personalizado' && !personalizadoIncompleto && (
        <p className="text-xs text-gray-400 -mt-4">
          Exibindo: {fmtData(dataInicio)} – {fmtData(dataFim)}
        </p>
      )}

      {/* Filtro por forma + exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm overflow-x-auto">
          {FILTROS_FORMA.map((f) => (
            <button key={f} onClick={() => setFiltroForma(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filtroForma === f ? 'bg-[#0f2e2b] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={exportar} disabled={linhasFiltradas.length === 0}
          className="border border-gray-200 bg-white hover:border-[#3cbfb3]/40 hover:text-[#3cbfb3] disabled:opacity-40 text-gray-600 font-semibold rounded-xl px-4 py-2 text-sm transition flex items-center justify-center gap-2 shrink-0">
          <Download size={14} /> Exportar CSV ({linhasFiltradas.length})
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={15} /> {erro}
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-black text-gray-900 flex items-center gap-2 mb-2">
            <Lightbulb size={15} className="text-[#3cbfb3]" /> Insights do período
          </p>
          <ul className="space-y-1.5">
            {insights.map((i, n) => (
              <li key={n} className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${i.tom === 'alerta' ? 'bg-amber-500' : 'bg-[#3cbfb3]'}`} />
                <span className={`text-xs ${i.tom === 'alerta' ? 'text-amber-800' : 'text-gray-600'}`}>{i.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Totais do período */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border shadow-sm p-4 ${
            c.destaque ? 'bg-[#f0fffe] border-[#3cbfb3]/30' : 'bg-white border-gray-100'
          }`}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{c.label}</p>
            <p className="text-lg font-black text-gray-900 mt-1">{c.valor}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lg:col-span-2">
          <Painel titulo="Evolução no tempo"
            sub={`Vendas, margem de contribuição e lucro real por ${granularidade}${filtrando ? ` · ${filtroForma}` : ''}`}>
            <GraficoEvolucao dados={serie} granularidade={granularidade} />
          </Painel>
        </div>

        <Painel titulo="Margem por forma de pagamento" sub="Clique numa barra para filtrar o relatório">
          <GraficoPorForma dados={porForma} onSelecionar={(f) => setFiltroForma(f as FiltroForma)} />
        </Painel>

        <Painel titulo="Composição de custos" sub="Taxa MP, frete e custo do produto no período">
          <DonutCustos
            taxaMp={totais.taxaMp}
            custoFrete={totais.custoFrete}
            custoProdutos={totais.custoProdutos}
            lucroDisponivel={totais.lucroDisponivel}
          />
        </Painel>

        <div className="lg:col-span-2">
          <Painel titulo="Para onde vai o dinheiro" sub="De cada R$ 100 vendidos no período">
            <BarraDestino
              vendas={totais.vendas}
              taxaMp={totais.taxaMp}
              custoFrete={totais.custoFrete}
              custoProdutos={totais.custoProdutos}
              lucro={totais.lucroReal}
              lucroDisponivel={totais.lucroDisponivel}
            />
          </Painel>
        </div>
      </div>

      {/* Ações de manutenção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <Percent size={16} className="text-[#3cbfb3] mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500">
              A taxa é gravada automaticamente quando o pagamento é aprovado. Use o botão para
              preencher pedidos antigos (ou os que falharam). É idempotente.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            {msgSync && <span className="text-xs text-gray-500">{msgSync}</span>}
            <button onClick={sincronizarTaxas} disabled={sincronizando}
              className="bg-[#3cbfb3] hover:bg-[#2a9d8f] disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2 text-sm transition flex items-center gap-2 ml-auto">
              {sincronizando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
              Sincronizar taxas do MP
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <History size={16} className="text-[#3cbfb3] mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500">
              Vendas novas já congelam o custo do produto no momento da compra. Para os pedidos
              antigos, este botão grava o custo <strong>atual</strong> (aproximação — o custo
              histórico real não existe).{' '}
              <strong className="text-amber-700">Preencha o custo dos produtos antes de rodar.</strong>{' '}
              Itens já congelados não são sobrescritos.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            {msgSnapshot && <span className="text-xs text-gray-500">{msgSnapshot}</span>}
            <button onClick={snapshotCustos} disabled={snapshotando}
              className="border border-gray-200 bg-white hover:border-[#3cbfb3]/40 hover:text-[#3cbfb3] disabled:opacity-50 text-gray-600 font-semibold rounded-xl px-4 py-2 text-sm transition flex items-center gap-2 ml-auto">
              {snapshotando ? <Loader2 size={14} className="animate-spin" /> : <History size={14} />}
              Snapshot de custos (pedidos antigos)
            </button>
          </div>
        </div>
      </div>

      {/* Checklist: o que falta para o Lucro real existir */}
      {semCusto && semCusto.total > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-amber-800">
              <strong>{semCusto.total} de {semCusto.totalProdutos} produtos</strong> ainda sem custo
              cadastrado — o Lucro real fica em aberto até preenchê-los.
            </p>
            <Link href={`${ADMIN_BASE}/produtos`}
              className="text-xs font-bold text-amber-800 hover:underline whitespace-nowrap shrink-0">
              Cadastrar custos →
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {semCusto.lista.map((p) => (
              <Link key={p.id} href={`${ADMIN_BASE}/produtos/${p.id}`}
                className="text-[11px] bg-white border border-amber-200 text-amber-800 rounded-lg px-2 py-0.5 hover:border-amber-400 transition">
                {p.nome}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Linhas: cartões no mobile, tabela no desktop ─────────────────────── */}

      {/* Mobile: um cartão por venda. Sem scroll horizontal. */}
      <div className="md:hidden space-y-3">
        {carregando && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <Loader2 size={18} className="animate-spin inline" />
          </div>
        )}
        {!carregando && linhasFiltradas.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            Nenhuma venda paga no período{filtrando ? ` em ${filtroForma}` : ''}.
          </div>
        )}
        {!carregando && linhasFiltradas.map((l) => (
          <div key={l.pedidoId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <Link href={`${ADMIN_BASE}/pedidos?q=${l.pedidoId}`}
                className="font-mono text-xs font-bold text-[#3cbfb3] hover:underline">
                #{l.pedidoId.slice(-8).toUpperCase()}
              </Link>
              <span className="text-[11px] text-gray-400">{fmtData(l.data)} · {l.forma}</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">{l.cliente}</p>

            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-gray-500">Venda</dt>
                <dd className="font-bold text-gray-900">{formatBRL(l.venda)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">(−) Taxa MP</dt>
                <dd className={l.taxaPendente ? 'text-amber-600 font-bold' : 'text-gray-600'}>
                  {l.taxaPendente ? 'pendente' : formatBRL(l.taxaMp)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">(−) Frete</dt>
                <dd className={l.fretePendente ? 'text-amber-600 font-bold' : 'text-gray-600'}>
                  {l.fretePendente ? 'não lançado' : formatBRL(l.custoFrete)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-50 pt-1.5 bg-[#f0fffe] -mx-4 px-4 py-1.5">
                <dt className="text-gray-600 font-semibold">= Margem contrib.</dt>
                <dd className="font-black text-gray-900">
                  {l.margemContrib == null
                    ? <span className="text-amber-600 text-[11px]">falta {l.taxaPendente ? 'taxa' : 'frete'}</span>
                    : <>{formatBRL(l.margemContrib)} <span className="font-normal text-gray-400">({fmtPct(l.margemContribPct)})</span></>}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">(−) Custo produto</dt>
                <dd className={l.custoPendente ? 'text-amber-600 font-bold' : 'text-gray-600'}>
                  {l.custoPendente ? 'a definir' : formatBRL(l.custoProdutos)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-50 pt-1.5 bg-[#f0fffe] -mx-4 px-4 py-1.5">
                <dt className="text-gray-600 font-semibold">= Lucro real</dt>
                <dd className="font-black">
                  {l.lucroReal == null
                    ? <span className="text-gray-400 text-[11px] font-bold">{l.custoPendente ? 'adicione o custo' : '—'}</span>
                    : <span className={l.lucroReal >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                        {formatBRL(l.lucroReal)} <span className="font-normal text-gray-400">({fmtPct(l.lucroRealPct)})</span>
                      </span>}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* Desktop: tabela. */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Forma</th>
                <th className="px-4 py-3 text-right">Venda</th>
                <th className="px-4 py-3 text-right">(−) Taxa MP</th>
                <th className="px-4 py-3 text-right">(−) Frete</th>
                <th className="px-4 py-3 text-right bg-[#f0fffe]">= Margem contrib.</th>
                <th className="px-4 py-3 text-right bg-[#f0fffe]">%</th>
                <th className="px-4 py-3 text-right">(−) Custo produto</th>
                <th className="px-4 py-3 text-right bg-[#f0fffe]">= Lucro real</th>
                <th className="px-4 py-3 text-right bg-[#f0fffe]">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {carregando && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                  <Loader2 size={18} className="animate-spin inline" />
                </td></tr>
              )}
              {!carregando && linhasFiltradas.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                  Nenhuma venda paga no período{filtrando ? ` em ${filtroForma}` : ''}.
                </td></tr>
              )}
              {!carregando && linhasFiltradas.map((l) => (
                <tr key={l.pedidoId} className="hover:bg-gray-50/60 transition">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtData(l.data)}</td>
                  <td className="px-4 py-3">
                    <Link href={`${ADMIN_BASE}/pedidos?q=${l.pedidoId}`}
                      className="font-mono text-xs font-bold text-[#3cbfb3] hover:underline">
                      #{l.pedidoId.slice(-8).toUpperCase()}
                    </Link>
                    <p className="text-[11px] text-gray-400">{l.cliente}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{l.forma}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{formatBRL(l.venda)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {l.taxaPendente
                      ? <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">taxa pendente</span>
                      : <span className="text-gray-600">{formatBRL(l.taxaMp)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {l.fretePendente
                      ? <span className="text-[11px] font-bold text-gray-400">não lançado</span>
                      : <span className="text-gray-600">{formatBRL(l.custoFrete)}</span>}
                  </td>

                  {/* Nível 1 — margem de contribuição (não depende do custo). */}
                  <td className="px-4 py-3 text-right whitespace-nowrap bg-[#f0fffe]/40">
                    {l.margemContrib == null
                      ? <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">
                          falta {l.taxaPendente ? 'taxa' : 'frete'}
                        </span>
                      : <span className={`font-bold ${l.margemContrib >= 0 ? 'text-gray-900' : 'text-red-500'}`}>{formatBRL(l.margemContrib)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap bg-[#f0fffe]/40">{fmtPct(l.margemContribPct)}</td>

                  {/* Nível 2 — COGS e lucro real. */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {l.custoPendente
                      ? <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">a definir</span>
                      : <span className="text-gray-600">{formatBRL(l.custoProdutos)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap bg-[#f0fffe]/40">
                    {l.lucroReal == null
                      ? <span className="text-[11px] font-bold text-gray-400">
                          {l.custoPendente ? 'adicione o custo' : '—'}
                        </span>
                      : <span className={`font-black ${l.lucroReal >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatBRL(l.lucroReal)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap bg-[#f0fffe]/40">{fmtPct(l.lucroRealPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
