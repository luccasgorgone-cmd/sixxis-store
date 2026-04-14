'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Check, Star } from 'lucide-react'

const FAIXAS_PRECO = [
  { label: 'Até R$ 500', min: 0, max: 500 },
  { label: 'R$ 500 – R$ 1.000', min: 500, max: 1000 },
  { label: 'R$ 1.000 – R$ 2.000', min: 1000, max: 2000 },
  { label: 'R$ 2.000 – R$ 5.000', min: 2000, max: 5000 },
  { label: 'Acima de R$ 5.000', min: 5000, max: 999999 },
]

function FiltroGrupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(true)
  return (
    <div className="py-3">
      <button
        onClick={() => setAberto(a => !a)}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="text-sm font-bold text-gray-800">{titulo}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`} />
      </button>
      {aberto && <div className="space-y-0.5">{children}</div>}
    </div>
  )
}

function FiltroLink({ label, href, ativo }: { label: string; href: string; ativo: boolean }) {
  return (
    <Link href={href}
      className={`block text-sm py-1.5 px-2 rounded-lg transition ${
        ativo ? 'text-[#3cbfb3] font-bold bg-[#e8f8f7]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}>
      {label}
    </Link>
  )
}

function FiltroSubLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href}
      className="block text-xs py-1 px-2 ml-3 text-gray-500 hover:text-[#3cbfb3] rounded-lg transition">
      {label}
    </Link>
  )
}

function FiltroCheckbox({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 w-full py-1.5 px-1 text-sm text-left rounded-lg hover:bg-gray-50 transition group">
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
        ativo ? 'bg-[#3cbfb3] border-[#3cbfb3]' : 'border-gray-300 group-hover:border-[#3cbfb3]'
      }`}>
        {ativo && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
      <span className={ativo ? 'text-[#3cbfb3] font-semibold' : 'text-gray-600'}>{label}</span>
    </button>
  )
}

function Divisor() {
  return <div className="border-t border-gray-100" />
}

interface Props {
  categoria: string
  precoMin: string
  precoMax: string
  onFaixa: (min: string, max: string) => void
}

export default function SidebarFiltrosCB({ categoria, precoMin, precoMax, onFaixa }: Props) {
  const [notaMin, setNotaMin] = useState<number | null>(null)

  const activeFaixa = FAIXAS_PRECO.find(
    f => String(f.min) === precoMin && String(f.max) === precoMax
  )

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      {/* Categoria */}
      <FiltroGrupo titulo="Categoria">
        <FiltroLink label="Todos" href="/produtos" ativo={!categoria} />
        <FiltroLink label="Climatizadores" href="/produtos?categoria=climatizadores" ativo={categoria === 'climatizadores'} />
        {categoria === 'climatizadores' && (
          <>
            <FiltroSubLink label="Residencial" href="/produtos?categoria=climatizadores&tipo=residencial" />
            <FiltroSubLink label="Comercial" href="/produtos?categoria=climatizadores&tipo=comercial" />
            <FiltroSubLink label="Com Filtro HEPA" href="/produtos?categoria=climatizadores&filtro=hepa" />
          </>
        )}
        <FiltroLink label="Aspiradores" href="/produtos?categoria=aspiradores" ativo={categoria === 'aspiradores'} />
        {categoria === 'aspiradores' && (
          <>
            <FiltroSubLink label="Portátil" href="/produtos?categoria=aspiradores&tipo=portatil" />
            <FiltroSubLink label="Robô" href="/produtos?categoria=aspiradores&tipo=robo" />
          </>
        )}
        <FiltroLink label="Spinning" href="/produtos?categoria=spinning" ativo={categoria === 'spinning'} />
      </FiltroGrupo>

      <Divisor />

      {/* Preço */}
      <FiltroGrupo titulo="Preço">
        <FiltroCheckbox
          label="Todos os preços"
          ativo={!precoMin && !precoMax}
          onClick={() => onFaixa('', '')}
        />
        {FAIXAS_PRECO.map(f => (
          <FiltroCheckbox
            key={f.label}
            label={f.label}
            ativo={activeFaixa?.label === f.label}
            onClick={() => onFaixa(String(f.min), String(f.max))}
          />
        ))}
      </FiltroGrupo>

      <Divisor />

      {/* Avaliação */}
      <FiltroGrupo titulo="Avaliação">
        {[5, 4, 3].map(nota => (
          <button key={nota}
            onClick={() => setNotaMin(notaMin === nota ? null : nota)}
            className={`flex items-center gap-1.5 w-full py-1.5 px-1 rounded-lg text-sm transition ${
              notaMin === nota ? 'text-[#3cbfb3] font-bold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12}
                  className={s <= nota ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200 fill-gray-200'} />
              ))}
            </div>
            <span className="text-xs">ou mais</span>
          </button>
        ))}
      </FiltroGrupo>

      {/* Filtros específicos Climatizadores */}
      {categoria === 'climatizadores' && (
        <>
          <Divisor />
          <FiltroGrupo titulo="Voltagem">
            {['110V', '220V', 'Bivolt'].map(v => (
              <FiltroCheckbox key={v} label={v} ativo={false} onClick={() => {}} />
            ))}
          </FiltroGrupo>

          <Divisor />
          <FiltroGrupo titulo="Potência">
            {['até 150W', '150W a 250W', 'acima de 250W'].map(p => (
              <FiltroCheckbox key={p} label={p} ativo={false} onClick={() => {}} />
            ))}
          </FiltroGrupo>

          <Divisor />
          <FiltroGrupo titulo="Vazão de Ar">
            {['até 3.000 m³/h', '3.000 a 6.000 m³/h', 'acima de 6.000 m³/h'].map(v => (
              <FiltroCheckbox key={v} label={v} ativo={false} onClick={() => {}} />
            ))}
          </FiltroGrupo>

          <Divisor />
          <FiltroGrupo titulo="Capacidade do Tanque">
            {['até 20 litros', '20 a 45 litros', 'acima de 45 litros'].map(l => (
              <FiltroCheckbox key={l} label={l} ativo={false} onClick={() => {}} />
            ))}
          </FiltroGrupo>

          <Divisor />
          <FiltroGrupo titulo="Cor">
            {['Preto', 'Branco', 'Cinza', 'Preto e Branco'].map(cor => (
              <FiltroCheckbox key={cor} label={cor} ativo={false} onClick={() => {}} />
            ))}
          </FiltroGrupo>

          <Divisor />
          <FiltroGrupo titulo="Desconto">
            {['10% ou mais', '20% ou mais', '30% ou mais'].map(d => (
              <FiltroCheckbox key={d} label={d} ativo={false} onClick={() => {}} />
            ))}
          </FiltroGrupo>
        </>
      )}

      {categoria === 'aspiradores' && (
        <>
          <Divisor />
          <FiltroGrupo titulo="Tipo">
            {['Portátil', 'Robô', 'Vertical', 'Piso e Parede'].map(t => (
              <FiltroCheckbox key={t} label={t} ativo={false} onClick={() => {}} />
            ))}
          </FiltroGrupo>
        </>
      )}
    </aside>
  )
}
