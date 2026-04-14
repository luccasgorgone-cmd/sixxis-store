'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import AvaliacoesProduto from '@/components/produto/AvaliacoesProduto'

interface Props {
  descricao: string | null
  produtoId: string
}

const ABAS = ['Descrição', 'Especificações', 'Perguntas Frequentes', 'Avaliações']

const ESPECIFICACOES = [
  ['Modelo',                  'SX040'],
  ['Cor',                     'Preto e Branco'],
  ['Voltagem',                '110V / 220V (Bivolt)'],
  ['Potência',                '180 W'],
  ['Vazão de Ar',             '5.500 m³/h'],
  ['Capacidade do Tanque',    '45 litros'],
  ['Consumo de Água',         '4 a 6 L/h'],
  ['Área Recomendada',        'até 45 m²'],
  ['Nível de Ruído',          'inferior a 60 dB'],
  ['Velocidades',             '3 velocidades'],
  ['Oscilação Vertical',      'Automática'],
  ['Oscilação Horizontal',    'Manual'],
  ['Tipo de Ventilação',      'Hélice'],
  ['Colmeias',                '4 cm com Filtro ANTI-PÓ'],
  ['Eficiência Energética',   'Classe A'],
  ['É Umidificador',          'Sim'],
  ['É Purificador de Ar',     'Sim'],
  ['Controle Remoto',         'Incluso'],
  ['Painel',                  'Touch Screen'],
  ['Peso',                    '15 kg'],
  ['Dimensões (A×L×C)',       '105.5 × 46 × 36 cm'],
  ['Garantia',                '12 meses'],
]

const FAQS = [
  {
    pergunta: 'Qual a potência do climatizador SX040?',
    resposta: 'O climatizador SX040 possui potência de 180 W, garantindo refrigeração eficiente com baixo consumo de energia — 90% mais econômico que um ar condicionado convencional.',
  },
  {
    pergunta: 'Para qual tamanho de ambiente ele é recomendado?',
    resposta: 'É ideal para ambientes de até 45 m², como salas, quartos, escritórios e comércio de pequeno porte. Para melhores resultados, utilize em ambientes semi-abertos com ventilação.',
  },
  {
    pergunta: 'Qual a voltagem disponível?',
    resposta: 'O SX040 é bivolt — funciona tanto em 110V quanto em 220V, sem necessidade de adaptador.',
  },
  {
    pergunta: 'Como funciona a oscilação vertical?',
    resposta: 'A oscilação vertical é automática, distribuindo o ar uniformemente por todo o ambiente. A oscilação horizontal é ajustada manualmente conforme sua preferência.',
  },
  {
    pergunta: 'O climatizador é silencioso?',
    resposta: 'Sim! O nível de ruído é inferior a 60 decibéis na velocidade máxima — equivalente a uma conversa normal. Nas velocidades mais baixas é ainda mais silencioso.',
  },
  {
    pergunta: 'Vem com controle remoto?',
    resposta: 'Sim! O SX040 inclui controle remoto e também possui painel touch screen frontal, permitindo ajuste de velocidade, oscilação e timer diretamente no aparelho.',
  },
  {
    pergunta: 'Como realizar a limpeza das colmeias?',
    resposta: 'A limpeza é simples: retire as colmeias pelo painel frontal, lave com água corrente e deixe secar. O filtro ANTI-PÓ pode ser limpo com aspirador. Recomenda-se limpeza mensal para melhor desempenho.',
  },
  {
    pergunta: 'Quanto tempo leva para encher o tanque?',
    resposta: 'O tanque tem capacidade de 45 litros. O consumo varia de 4 a 6 litros por hora dependendo da velocidade e umidade do ambiente. Recomenda-se verificar o nível diariamente.',
  },
]

export default function AbasProduto({ descricao, produtoId }: Props) {
  const [aba, setAba] = useState('Descrição')
  const [faqAberto, setFaqAberto] = useState<number | null>(null)

  return (
    <div className="mt-16 border-t border-gray-100 pt-2">
      {/* Header das abas */}
      <div className="border-b border-gray-100 mb-8">
        <div className="flex gap-0 overflow-x-auto">
          {ABAS.map(a => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                aba === a
                  ? 'border-[#3cbfb3] text-[#3cbfb3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* ABA: Descrição */}
      {aba === 'Descrição' && (
        <div className="max-w-3xl">
          {descricao ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: descricao }}
            />
          ) : (
            <p className="text-gray-500 text-sm">Descrição não disponível.</p>
          )}
        </div>
      )}

      {/* ABA: Especificações */}
      {aba === 'Especificações' && (
        <div className="max-w-2xl">
          <h3 className="text-lg font-extrabold text-gray-900 mb-4">Especificações Técnicas</h3>
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            {ESPECIFICACOES.map(([label, valor], i) => (
              <div
                key={label}
                className={`flex items-start gap-4 px-5 py-3.5 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <span className="text-sm text-gray-500 w-48 shrink-0 font-medium">{label}</span>
                <span className="text-sm text-gray-900 font-semibold">{valor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: Perguntas Frequentes */}
      {aba === 'Perguntas Frequentes' && (
        <div className="max-w-2xl space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-2xl overflow-hidden hover:border-[#3cbfb3]/30 transition"
            >
              <button
                onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-900 text-sm pr-4">{faq.pergunta}</span>
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    faqAberto === i
                      ? 'border-[#3cbfb3] bg-[#3cbfb3] rotate-180'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <ChevronDown size={14} className={faqAberto === i ? 'text-white' : 'text-gray-400'} />
                </div>
              </button>
              {faqAberto === i && (
                <div className="px-6 py-4 bg-[#f8fffe] border-t border-[#3cbfb3]/15">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.resposta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ABA: Avaliações */}
      {aba === 'Avaliações' && (
        <AvaliacoesProduto produtoId={produtoId} />
      )}
    </div>
  )
}
