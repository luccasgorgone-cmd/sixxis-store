'use client'

// ─── Revalidação do cupom PERSISTIDO (localStorage) ──────────────────────────
// Problema: o cupom aplicado vive no store persistido (sixxis-carrinho →
// cupomAplicado). Se ele for desativado/alterado no admin DEPOIS de o cliente
// aplicar, o carrinho continua exibindo um desconto fantasma que só some no
// passo final (onde /api/pedidos rebate). Ex.: SIXXIS10 (10%) desativado e o
// carrinho ainda mostrando -R$ 850.
//
// Solução: ao montar /carrinho e /checkout, se há cupom no store, reconfirmar
// contra /api/cupons/validar com o subtotal ATUAL e obedecer ao servidor.
//   • invalido      → remove do store + aviso discreto
//   • valido        → regrava tipo/valor/desconto que a API devolveu AGORA
//                     (não confia nos números salvos)
//   • indeterminado → não toca em nada (rede/429/5xx). Ver cupom-client.ts.
//
// Silencioso e idempotente: nada de spinner, nada de piscar. O desconto some
// só se o servidor disser que deve sumir.

import { useEffect, useRef, useState } from 'react'
import { useCarrinho } from '@/hooks/useCarrinho'
import { validarCupomRemoto } from '@/lib/cupom-client'
import { descricaoCupom } from '@/lib/preco-cupom'

// Debounce: a base muda a cada +/- de quantidade. Sem isso, um cliente clicando
// rápido gastaria o rate limit (20/min) e cairia em 'indeterminado'.
const DEBOUNCE_MS = 350

/**
 * @param base subtotal de PRODUTOS sobre o qual o cupom incide — o mesmo número
 *             que a página passa a `calcularDescontoCupom`.
 */
export function useRevalidarCupomPersistido(base: number) {
  const cupom       = useCarrinho((s) => s.cupomAplicado)
  const setCupom    = useCarrinho((s) => s.setCupom)
  const hasHydrated = useCarrinho((s) => s._hasHydrated)

  const [aviso, setAviso] = useState('')
  // Última combinação (código × base) já confirmada. Evita refazer a chamada a
  // cada re-render — inclusive no re-render que a própria escrita no store causa.
  const jaChecado = useRef<string | null>(null)

  useEffect(() => {
    // Antes da reidratação o store ainda é o default (cupom null): não decidir cedo.
    if (!hasHydrated || !cupom || !(base > 0)) return

    const chave = `${cupom.codigo}|${base.toFixed(2)}`
    if (jaChecado.current === chave) return

    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      const r = await validarCupomRemoto(cupom.codigo, base, { signal: ctrl.signal })
      if (ctrl.signal.aborted) return

      if (r.estado === 'indeterminado') return // sem veredito: tenta de novo depois

      jaChecado.current = chave

      if (r.estado === 'invalido') {
        setCupom(null)
        setAviso(`O cupom ${cupom.codigo} não está mais disponível.`)
        return
      }

      // Válido: só regrava se o servidor discordar do que está salvo — assim o
      // caso comum (cupom intacto) não dispara nenhum re-render.
      const mudou =
        r.cupom.tipo !== cupom.tipo ||
        r.cupom.valor !== cupom.valor ||
        r.cupom.codigo !== cupom.codigo
      if (mudou) {
        setCupom({
          codigo:    r.cupom.codigo,
          tipo:      r.cupom.tipo,
          valor:     r.cupom.valor,
          desconto:  r.cupom.desconto,
          descricao: descricaoCupom(r.cupom.tipo, r.cupom.valor),
        })
      }
    }, DEBOUNCE_MS)

    return () => { ctrl.abort(); clearTimeout(timer) }
  }, [hasHydrated, cupom, base, setCupom])

  return { aviso, limparAviso: () => setAviso('') }
}
