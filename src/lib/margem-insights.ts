// ─── Insights automáticos da central de lucratividade ────────────────────────
// Funções PURAS a partir dos totais/agregações que a rota já devolve. Nada de
// consulta, nada hardcoded.
//
// Regra de ouro: um insight só é emitido se for VERDADEIRO com os dados que
// existem. Sem custo cadastrado → nenhuma frase sobre lucro. Sem PIX ou sem
// Parcelado no período → nenhuma frase comparando os dois. Melhor não dizer
// nada do que dizer algo que o número não sustenta.

export interface TotaisInsight {
  vendas: number
  taxaMp: number
  custoFrete: number
  margemContribPctMedia: number | null
  lucroRealPctMedia: number | null
  lucroDisponivel: boolean
  taxasPendentes: number
  fretesPendentes: number
  custosPendentes: number
  pedidos: number
}

export interface FormaInsight {
  forma: string
  count: number
  margemContribPct: number | null
  lucroRealPct: number | null
}

export interface Insight {
  /** 'info' = observação; 'alerta' = merece ação. */
  tom: 'info' | 'alerta'
  texto: string
}

const pct = (v: number) => `${v.toFixed(1)}%`

export function gerarInsights(totais: TotaisInsight, formas: FormaInsight[]): Insight[] {
  const out: Insight[] = []
  if (totais.vendas <= 0) return out

  // 1) PIX vs Parcelado — só se AMBOS existirem no período e tiverem margem.
  const pix = formas.find((f) => f.forma === 'PIX' && f.margemContribPct != null)
  const parc = formas.find((f) => f.forma === 'Parcelado' && f.margemContribPct != null)
  if (pix && parc) {
    const delta = pix.margemContribPct! - parc.margemContribPct!
    if (Math.abs(delta) >= 0.1) {
      const menor = delta > 0 ? 'Parcelado' : 'PIX'
      const maior = delta > 0 ? 'PIX' : 'Parcelado'
      out.push({
        tom: Math.abs(delta) >= 3 ? 'alerta' : 'info',
        texto: `Vendas em ${menor} têm margem de contribuição ${Math.abs(delta).toFixed(1)} pontos menor que em ${maior} ` +
               `(${pct(parc.margemContribPct!)} vs ${pct(pix.margemContribPct!)}).`,
      })
    }
  }

  // 2) Peso da taxa do MP. Só faz sentido se TODAS as taxas estão sincronizadas —
  // com taxas pendentes o numerador está incompleto e o % sairia baixo demais.
  if (totais.taxasPendentes === 0 && totais.taxaMp > 0) {
    out.push({
      tom: 'info',
      texto: `A taxa do Mercado Pago consumiu ${pct((totais.taxaMp / totais.vendas) * 100)} das suas vendas no período.`,
    })
  }

  // 3) Peso do frete. Mesmo critério: só com todos os fretes lançados.
  if (totais.fretesPendentes === 0 && totais.custoFrete > 0) {
    out.push({
      tom: 'info',
      texto: `O frete representou ${pct((totais.custoFrete / totais.vendas) * 100)} das suas vendas no período.`,
    })
  }

  // 4) Lucro real — só quando existe.
  if (totais.lucroDisponivel && totais.lucroRealPctMedia != null) {
    out.push({
      tom: totais.lucroRealPctMedia < 0 ? 'alerta' : 'info',
      texto: `Seu lucro real médio foi ${pct(totais.lucroRealPctMedia)} das vendas.`,
    })
  } else if (totais.custosPendentes > 0) {
    out.push({
      tom: 'alerta',
      texto: `${totais.custosPendentes} de ${totais.pedidos} pedidos estão sem custo de produto — o lucro real ainda não pode ser calculado.`,
    })
  }

  return out
}
