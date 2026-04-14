'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Categoria {
  val: string
  label: string
  count?: number
}

interface Faixa {
  label: string
  min: number
  max: number
}

interface Props {
  categorias: Categoria[]
  faixas: Faixa[]
  categoria: string
  precoMin: string
  precoMax: string
  onCategoria: (val: string) => void
  onFaixa: (min: string, max: string) => void
}

// ── FiltroSecao ────────────────────────────────────────────────────────────────

function FiltroSecao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(true)

  return (
    <div className="border-b border-white/10 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between text-white font-bold text-sm mb-3 hover:text-[#3cbfb3] transition-colors"
      >
        {titulo}
        <ChevronDown
          size={16}
          className={`text-white/50 transition-transform duration-200 ${aberto ? '' : '-rotate-90'}`}
        />
      </button>
      {aberto && <div>{children}</div>}
    </div>
  )
}

// ── FiltroOpcao ────────────────────────────────────────────────────────────────

function FiltroOpcao({
  label,
  count,
  ativo,
  onClick,
}: {
  label: string
  count?: number
  ativo: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-sm transition-all ${
        ativo
          ? 'bg-[#3cbfb3] text-white font-semibold'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
            ativo ? 'border-white bg-white' : 'border-white/30 bg-transparent'
          }`}
        >
          {ativo && (
            <svg className="w-2.5 h-2.5 text-[#3cbfb3]" fill="none" viewBox="0 0 10 10">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        {label}
      </span>
      {count !== undefined && (
        <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${ativo ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

// ── SidebarFiltros ─────────────────────────────────────────────────────────────

export default function SidebarFiltros({
  categorias,
  faixas,
  categoria,
  precoMin,
  precoMax,
  onCategoria,
  onFaixa,
}: Props) {
  const activeFaixaKey = precoMin && precoMax ? `${precoMin}-${precoMax}` : ''

  return (
    <div className="space-y-0">
      {/* Categorias */}
      <FiltroSecao titulo="Categoria">
        <div className="space-y-0.5">
          <FiltroOpcao
            label="Todos os produtos"
            ativo={!categoria}
            onClick={() => onCategoria('')}
          />
          {categorias.map(c => (
            <FiltroOpcao
              key={c.val}
              label={c.label}
              count={c.count}
              ativo={categoria === c.val}
              onClick={() => onCategoria(c.val)}
            />
          ))}
        </div>
      </FiltroSecao>

      {/* Faixa de Preço */}
      <FiltroSecao titulo="Faixa de Preço">
        <div className="space-y-0.5">
          <FiltroOpcao
            label="Todos os preços"
            ativo={!precoMin && !precoMax}
            onClick={() => onFaixa('', '')}
          />
          {faixas.map(f => {
            const key = `${f.min}-${f.max}`
            return (
              <FiltroOpcao
                key={key}
                label={f.label}
                ativo={activeFaixaKey === key}
                onClick={() => onFaixa(String(f.min), String(f.max))}
              />
            )
          })}
        </div>
      </FiltroSecao>

      {/* Filtros específicos — Climatizadores */}
      {categoria === 'climatizadores' && (
        <>
          <FiltroSecao titulo="Voltagem">
            <div className="space-y-0.5">
              {['110V', '220V', 'Bivolt'].map(v => (
                <FiltroOpcao key={v} label={v} ativo={false} onClick={() => {}} />
              ))}
            </div>
          </FiltroSecao>

          <FiltroSecao titulo="Potência">
            <div className="space-y-0.5">
              {['Até 7.500 BTU', '7.500 – 12.000 BTU', '12.000 – 18.000 BTU', 'Acima de 18.000 BTU'].map(v => (
                <FiltroOpcao key={v} label={v} ativo={false} onClick={() => {}} />
              ))}
            </div>
          </FiltroSecao>

          <FiltroSecao titulo="Capacidade (Litros)">
            <div className="space-y-0.5">
              {['Até 7L', '7L – 15L', '15L – 25L', 'Acima de 25L'].map(v => (
                <FiltroOpcao key={v} label={v} ativo={false} onClick={() => {}} />
              ))}
            </div>
          </FiltroSecao>

          <FiltroSecao titulo="Cor">
            <div className="space-y-0.5">
              {['Branco', 'Preto', 'Cinza', 'Azul'].map(v => (
                <FiltroOpcao key={v} label={v} ativo={false} onClick={() => {}} />
              ))}
            </div>
          </FiltroSecao>
        </>
      )}

      {/* Filtros específicos — Aspiradores */}
      {categoria === 'aspiradores' && (
        <FiltroSecao titulo="Tipo">
          <div className="space-y-0.5">
            {['Portátil', 'Robô', 'Vertical', 'Piso e parede'].map(t => (
              <FiltroOpcao key={t} label={t} ativo={false} onClick={() => {}} />
            ))}
          </div>
        </FiltroSecao>
      )}
    </div>
  )
}
