// ─── Validação de cupom no CLIENTE — chamada única a /api/cupons/validar ─────
// Fonte única do fetch. Toda superfície (carrinho, checkout e a revalidação
// automática do cupom persistido) passa por aqui. A autoridade
// continua sendo o servidor: `avaliarCupom` (src/lib/cupom.ts). Este módulo só
// fala com a rota e NORMALIZA a resposta.
//
// O ponto sutil, e a razão deste módulo existir:
//
//   "cupom inválido" ≠ "não consegui saber se é válido"
//
// A rota responde `{ valido: false }` tanto quando o cupom realmente não vale
// quanto quando o RATE LIMIT estourou (HTTP 429, 20 validações/min por IP).
// Se o chamador olhar só `valido === false`, um 429 — ou uma queda de rede —
// apagaria o cupom LEGÍTIMO de um cliente. Por isso devolvemos três estados e
// só o `invalido` autoriza remover o cupom do store.

import type { TipoCupom } from './preco-cupom'

export interface CupomValidado {
  codigo:   string
  tipo:     TipoCupom
  valor:    number
  desconto: number
}

export type ResultadoValidacao =
  /** O servidor respondeu e o cupom vale. Use estes números, não os do store. */
  | { estado: 'valido'; cupom: CupomValidado }
  /** O servidor respondeu e RECUSOU o cupom. Único caso que autoriza remover. */
  | { estado: 'invalido'; erro: string }
  /** Rede caiu, 429, 5xx, JSON quebrado. NÃO mexer no cupom aplicado. */
  | { estado: 'indeterminado'; erro: string }

export async function validarCupomRemoto(
  codigo: string,
  total: number,
  opts?: { signal?: AbortSignal },
): Promise<ResultadoValidacao> {
  const cod = codigo.trim().toUpperCase()
  if (!cod) return { estado: 'invalido', erro: 'Digite um código' }

  let res: Response
  try {
    res = await fetch('/api/cupons/validar', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ codigo: cod, total }),
      signal:  opts?.signal,
    })
  } catch {
    return { estado: 'indeterminado', erro: 'Não foi possível validar o cupom. Tente novamente.' }
  }

  // 429 (rate limit) e 5xx não são veredito sobre o cupom — são falha nossa.
  if (res.status === 429) {
    return { estado: 'indeterminado', erro: 'Muitas tentativas. Aguarde um momento.' }
  }
  if (res.status >= 500) {
    return { estado: 'indeterminado', erro: 'Erro ao validar cupom. Tente novamente.' }
  }

  let d: {
    valido?: boolean; erro?: string; error?: string
    tipo?: TipoCupom; valor?: number; desconto?: number; codigo?: string
  }
  try {
    d = await res.json()
  } catch {
    return { estado: 'indeterminado', erro: 'Erro ao validar cupom. Tente novamente.' }
  }

  if (!res.ok || d.valido !== true) {
    return { estado: 'invalido', erro: d.erro || d.error || 'Cupom inválido ou expirado.' }
  }

  return {
    estado: 'valido',
    cupom: {
      codigo:   d.codigo ?? cod,
      tipo:     d.tipo ?? 'PERCENTUAL',
      valor:    Number(d.valor) || 0,
      desconto: Number(d.desconto) || 0,
    },
  }
}
