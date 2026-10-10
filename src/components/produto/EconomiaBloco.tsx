'use client'
import { useState, useRef, useEffect } from 'react'
import { TrendingDown, AirVent, Wind, Zap, BadgeCheck } from 'lucide-react'

// ── AC por modelo, ESCALADO pela área que o climatizador cobre ────────────────
// O AC fixo de 9.000 BTU subestimava os modelos grandes (fazia o climatizador
// parecer caro). Aqui cada modelo é comparado com o setup de ar-condicionado que
// climatizaria a MESMA área. `wattsAC` é a soma do consumo desse setup; o custo é
// SEMPRE derivado dos watts (não hardcoded). Chave = slug canônico.
//   area: m² cobertos · wattsAC: consumo do setup AC · setup: texto do subtítulo
//   descricaoAC: rótulo curto do AC nos cards/tabela
const AC_POR_MODELO: Record<string, { area: number; wattsAC: number; setup: string; descricaoAC: string }> = {
  'm45-trend':   { area: 45,  wattsAC: 2900,  setup: '1× ar-condicionado 30.000 BTU',                 descricaoAC: '1× 30.000 BTU' },
  'sx040':       { area: 45,  wattsAC: 2900,  setup: '1× ar-condicionado 30.000 BTU',                 descricaoAC: '1× 30.000 BTU' },
  'sx060-prime': { area: 60,  wattsAC: 3770,  setup: '1× ar-condicionado 30.000 BTU + 1× 9.000 BTU',  descricaoAC: '30.000 + 9.000 BTU' },
  'sx070-trend': { area: 70,  wattsAC: 4050,  setup: '1× ar-condicionado 30.000 BTU + 1× 12.000 BTU', descricaoAC: '30.000 + 12.000 BTU' },
  'sx100-trend': { area: 120, wattsAC: 6950,  setup: '2× ar-condicionado 30.000 BTU + 1× 12.000 BTU', descricaoAC: '2× 30.000 + 12.000 BTU' },
  'sx120-prime': { area: 140, wattsAC: 8700,  setup: '3× ar-condicionado 30.000 BTU',                 descricaoAC: '3× 30.000 BTU' },
  'sx180-trend': { area: 180, wattsAC: 11600, setup: '4× ar-condicionado 30.000 BTU',                 descricaoAC: '4× 30.000 BTU' },
  'sx200-trend': { area: 200, wattsAC: 11600, setup: '4× ar-condicionado 30.000 BTU',                 descricaoAC: '4× 30.000 BTU' },
  'sx200-prime': { area: 250, wattsAC: 14500, setup: '5× ar-condicionado 30.000 BTU',                 descricaoAC: '5× 30.000 BTU' },
}

// ── REGRAS DE ECONOMIA — NUNCA ALTERAR
const TARIFA = 0.85     // R$/kWh
const HORAS_DIA = 8
const DIAS_MES = 30

// Fallback (modelo fora da tabela): dimensiona o AC pela área de cobertura.
// 600 BTU/m², arredondado pra cima em unidades de 30.000 BTU (2.900 W cada).
const BTU_POR_M2 = 600
const BTU_UNIDADE = 30000
const W_UNIDADE   = 2900

function resolverChave(slug: string): string {
  const s = slug.toLowerCase()
  if (s.includes('sx200') && s.includes('prime')) return 'sx200-prime'
  if (s.includes('sx200')) return 'sx200-trend'
  if (s.includes('sx180')) return 'sx180-trend'
  if (s.includes('sx120')) return 'sx120-prime'
  if (s.includes('sx100')) return 'sx100-trend'
  if (s.includes('sx070')) return 'sx070-trend'
  if (s.includes('sx060')) return 'sx060-prime'
  if (s.includes('sx040')) return 'sx040'
  if (s.includes('m45'))   return 'm45-trend'
  return ''
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  slug: string
  consumoW: number       // Potência do climatizador, em W (NUNCA a Vazão de Ar)
  preco: number
  coberturaM2?: number   // Área de cobertura (spec) — usada no fallback
}

export function EconomiaBloco({ slug, consumoW, preco, coberturaM2 }: Props) {
  const [visivel, setVisivel] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisivel(true); obs.disconnect() }
    }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  // AC da tabela (por modelo) ou, fora dela, escalado pela área de cobertura.
  const chave = resolverChave(slug)
  let ac = AC_POR_MODELO[chave] as { area: number; wattsAC: number; setup: string; descricaoAC: string } | undefined
  if (!ac && coberturaM2 && coberturaM2 > 0) {
    const unidades = Math.max(1, Math.ceil((coberturaM2 * BTU_POR_M2) / BTU_UNIDADE))
    ac = {
      area: coberturaM2,
      wattsAC: unidades * W_UNIDADE,
      setup: `${unidades}× ar-condicionado 30.000 BTU`,
      descricaoAC: `${unidades}× 30.000 BTU`,
    }
  }
  if (!ac || !consumoW) return null

  // Custos SEMPRE derivados dos watts (consistência). 240 = 8h × 30 dias.
  const custoAC      = (ac.wattsAC / 1000) * HORAS_DIA * DIAS_MES * TARIFA
  const custoProduto = (consumoW   / 1000) * HORAS_DIA * DIAS_MES * TARIFA
  const economiaMes  = custoAC - custoProduto
  const economiaAno  = economiaMes * 12
  const percentual   = Math.round((economiaMes / custoAC) * 100)
  const retornoAnos  = economiaAno > 0 ? (preco / economiaAno).toFixed(1) : '—'

  // Largura da barra do climatizador relativa ao AC (piso de 6% p/ legibilidade).
  const pctBarraProduto = Math.max(6, Math.round((custoProduto / custoAC) * 100))

  return (
    <div
      ref={ref}
      className="mt-8 transition-all duration-700"
      style={{
        opacity: visivel ? 1 : 0,
        transform: visivel ? 'translateY(0)' : 'translateY(24px)',
      }}
    >
      <div
        className="rounded-[20px] overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid rgba(15,46,43,0.12)', boxShadow: '0 18px 50px -24px rgba(15,46,43,0.45)' }}
      >
        {/* ── HERO escuro: título + destaque da economia ──────────────── */}
        <div
          className="relative px-5 sm:px-7 pt-5 pb-6 sm:pt-6 sm:pb-7 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f2e2b 0%, #1a4f4a 100%)' }}
        >
          {/* glow decorativo tiffany */}
          <div
            aria-hidden
            className="absolute -top-16 -right-10 w-52 h-52 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(60,191,179,0.22) 0%, rgba(60,191,179,0) 70%)' }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <TrendingDown size={18} strokeWidth={2.25} color="#3cbfb3" className="mt-0.5 shrink-0 sm:w-5 sm:h-5" />
              <h3 className="font-bold text-sm sm:text-[15px] leading-snug text-white">
                Quanto você deixa de pagar por mês
              </h3>
            </div>
            <span
              className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0"
              style={{ backgroundColor: 'rgba(60,191,179,0.14)', color: '#3cbfb3', border: '1px solid rgba(60,191,179,0.35)' }}
            >
              <BadgeCheck size={13} strokeWidth={2.5} />
              Comprovado
            </span>
          </div>

          <div className="relative mt-4 sm:mt-5 text-center">
            <p className="font-black leading-none text-[44px] sm:text-[60px] tracking-tight" style={{ color: '#3cbfb3' }}>
              R$ {fmt(economiaMes)}
            </p>
            <p className="text-sm font-semibold mt-1.5 text-white/90">
              de economia <span className="text-white/60">todo mês</span>
            </p>
          </div>

          {/* pills de reforço */}
          <div className="relative mt-4 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black" style={{ backgroundColor: '#3cbfb3', color: '#0f2e2b' }}>
              {percentual}% menos energia
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold text-white/85" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
              se paga em {retornoAnos} anos
            </span>
          </div>
        </div>

        {/* ── Comparação visual: barras proporcionais de custo/mês ────── */}
        <div className="px-5 sm:px-7 pt-5 pb-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#0f2e2b', opacity: 0.55 }}>
            Custo de energia por mês
          </p>

          {/* Linha AC */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold" style={{ color: '#0f2e2b' }}>
                <AirVent size={16} strokeWidth={2} color="#0f2e2b" />
                Ar-condicionado
                <span className="hidden sm:inline text-[11px] font-normal" style={{ opacity: 0.55 }}>· {ac.descricaoAC}</span>
              </span>
              <span className="text-sm font-bold tabular-nums" style={{ color: '#0f2e2b' }}>R$ {fmt(custoAC)}</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(15,46,43,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: visivel ? '100%' : '0%', backgroundColor: 'rgba(15,46,43,0.55)' }}
              />
            </div>
          </div>

          {/* Linha Climatizador Sixxis (destaque) */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold" style={{ color: '#0f2e2b' }}>
                <Wind size={16} strokeWidth={2} color="#0f2e2b" />
                Climatizador Sixxis
              </span>
              <span className="text-sm font-bold tabular-nums" style={{ color: '#3cbfb3' }}>R$ {fmt(custoProduto)}</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(15,46,43,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-700 delay-150"
                style={{ width: visivel ? `${pctBarraProduto}%` : '0%', background: 'linear-gradient(90deg, #3cbfb3 0%, #2aa89c 100%)' }}
              />
            </div>
          </div>
        </div>

        {/* ── Detalhe comparativo: consumo e custo anual ──────────────── */}
        <div className="px-5 sm:px-7 pt-3 pb-5">
          <div className="grid grid-cols-2 gap-2.5">
            {/* AC */}
            <div className="rounded-xl p-3" style={{ border: '1px solid rgba(15,46,43,0.12)', backgroundColor: 'rgba(15,46,43,0.025)' }}>
              <p className="text-[11px] font-bold mb-2 flex items-center gap-1.5" style={{ color: '#0f2e2b' }}>
                <AirVent size={14} strokeWidth={2} color="#0f2e2b" /> Ar-condicionado
              </p>
              <dl className="space-y-1 text-[11px] sm:text-xs">
                <div className="flex justify-between"><dt style={{ color: '#0f2e2b', opacity: 0.6 }}>Consumo</dt><dd className="font-semibold tabular-nums" style={{ color: '#0f2e2b' }}>{ac.wattsAC} W</dd></div>
                <div className="flex justify-between"><dt style={{ color: '#0f2e2b', opacity: 0.6 }}>Por ano</dt><dd className="font-semibold tabular-nums" style={{ color: '#0f2e2b' }}>R$ {fmt(custoAC * 12)}</dd></div>
              </dl>
            </div>
            {/* Climatizador */}
            <div className="rounded-xl p-3" style={{ border: '1px solid rgba(60,191,179,0.45)', backgroundColor: 'rgba(60,191,179,0.06)' }}>
              <p className="text-[11px] font-bold mb-2 flex items-center gap-1.5" style={{ color: '#0f2e2b' }}>
                <Wind size={14} strokeWidth={2} color="#0f2e2b" /> Climatizador Sixxis
              </p>
              <dl className="space-y-1 text-[11px] sm:text-xs">
                <div className="flex justify-between"><dt style={{ color: '#0f2e2b', opacity: 0.6 }}>Consumo</dt><dd className="font-bold tabular-nums" style={{ color: '#3cbfb3' }}>{consumoW} W</dd></div>
                <div className="flex justify-between"><dt style={{ color: '#0f2e2b', opacity: 0.6 }}>Por ano</dt><dd className="font-bold tabular-nums" style={{ color: '#3cbfb3' }}>R$ {fmt(custoProduto * 12)}</dd></div>
              </dl>
            </div>
          </div>
        </div>

        {/* ── Métricas em 3 colunas ───────────────────────────────────── */}
        <div className="grid grid-cols-3 items-stretch" style={{ borderTop: '1px solid rgba(15,46,43,0.10)' }}>
          <div className="p-3 text-center flex flex-col justify-between min-h-[78px]" style={{ borderRight: '1px solid rgba(15,46,43,0.10)' }}>
            <p className="text-[10px] sm:text-[11px] leading-tight" style={{ color: '#0f2e2b', opacity: 0.6 }}>Economia/mês</p>
            <p className="text-base sm:text-lg font-bold mt-1 tabular-nums" style={{ color: '#3cbfb3' }}>R$ {fmt(economiaMes)}</p>
          </div>
          <div className="p-3 text-center flex flex-col justify-between min-h-[78px]" style={{ borderRight: '1px solid rgba(15,46,43,0.10)' }}>
            <p className="text-[10px] sm:text-[11px] leading-tight" style={{ color: '#0f2e2b', opacity: 0.6 }}>Economia/ano</p>
            <p className="text-base sm:text-lg font-bold mt-1 tabular-nums" style={{ color: '#3cbfb3' }}>
              R$ {(economiaAno / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="p-3 text-center flex flex-col justify-between min-h-[78px]">
            <p className="text-[10px] sm:text-[11px] leading-tight" style={{ color: '#0f2e2b', opacity: 0.6 }}>Produto se<br />paga em</p>
            <p className="text-base sm:text-lg font-bold mt-1 tabular-nums" style={{ color: '#0f2e2b' }}>{retornoAnos} anos</p>
          </div>
        </div>

        {/* ── Rodapé de disclaimer ────────────────────────────────────── */}
        <div className="px-4 sm:px-5 py-2.5" style={{ borderTop: '1px solid rgba(15,46,43,0.10)', backgroundColor: 'rgba(15,46,43,0.03)' }}>
          <p className="text-[10px] leading-relaxed flex items-start gap-1.5" style={{ color: '#0f2e2b', opacity: 0.65 }}>
            <Zap strokeWidth={2} color="#0f2e2b" style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2 }} />
            <span>
              Equivale a {ac.setup} para climatizar {ac.area} m². Base: {HORAS_DIA}h/dia × {DIAS_MES} dias × R$ {TARIFA.toFixed(2)}/kWh (tarifa ANEEL 2024). Consumo real pode variar conforme uso.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
