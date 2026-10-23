import { z } from 'zod'
import { cpfValido, cnpjValido } from './validacao-documento'
import { nomeCompletoValido } from './validacao-nome'
import { canonTelefone } from './telefone'

// ─── Guest checkout (Option A: pseudo-cliente) ───────────────────────────────
//
// Visitante sem login finaliza a compra. Como Pedido.clienteId e
// Pedido.enderecoId são FKs NOT NULL, a rota cria/reaproveita um Cliente
// "guest" (chaveado pelo email, upsert) e um Endereco sob ele. NENHUMA migração
// de schema. Este módulo é PURO (sem prisma) para ficar testável como os demais
// src/lib/*.test.ts — a rota só consome o schema + o builder.

function soDigitos(v: string): string {
  return (v ?? '').replace(/\D/g, '')
}

// Telefone BR aceito: 10 (fixo) ou 11 (celular) dígitos com DDD — mesma regra do
// checkout. A persistência usa a forma canônica DDD+8 (canonTelefone), helper
// único já usado na busca de cliente por telefone.
function telefoneAceito(tel: string): boolean {
  const d = soDigitos(tel)
  return d.length === 10 || d.length === 11
}

export const guestDadosSchema = z
  .object({
    nome:              z.string().min(1).max(191),
    email:             z.string().trim().email().max(191),
    telefone:          z.string().min(8).max(32),
    tipoPessoa:        z.enum(['PF', 'PJ']),
    // CPF (PF) ou CNPJ (PJ), com ou sem máscara.
    documento:         z.string().min(1).max(32),
    razaoSocial:       z.string().max(191).optional(),
    inscricaoEstadual: z.string().max(32).optional(),
    isentoIE:          z.boolean().optional(),
  })
  .superRefine((g, ctx) => {
    if (!nomeCompletoValido(g.nome)) {
      ctx.addIssue({ code: 'custom', path: ['nome'], message: 'Informe nome e sobrenome.' })
    }
    if (!telefoneAceito(g.telefone)) {
      ctx.addIssue({ code: 'custom', path: ['telefone'], message: 'Telefone inválido.' })
    }
    if (g.tipoPessoa === 'PJ') {
      if (!cnpjValido(g.documento)) {
        ctx.addIssue({ code: 'custom', path: ['documento'], message: 'CNPJ inválido.' })
      }
      if (!g.razaoSocial || !g.razaoSocial.trim()) {
        ctx.addIssue({ code: 'custom', path: ['razaoSocial'], message: 'Informe a razão social.' })
      }
      if (!g.isentoIE && !(g.inscricaoEstadual && g.inscricaoEstadual.trim())) {
        ctx.addIssue({ code: 'custom', path: ['inscricaoEstadual'], message: 'Informe a Inscrição Estadual ou marque Isento.' })
      }
    } else if (!cpfValido(g.documento)) {
      ctx.addIssue({ code: 'custom', path: ['documento'], message: 'CPF inválido.' })
    }
  })

export type GuestDados = z.infer<typeof guestDadosSchema>

// Endereço do guest — mesmo shape do /api/enderecos, mas o CEP chega só com
// dígitos (o checkout já envia replace(/\D/g,'')).
export const guestEnderecoSchema = z.object({
  cep:         z.string().regex(/^\d{8}$/),
  logradouro:  z.string().min(3),
  numero:      z.string().min(1),
  complemento: z.string().optional(),
  bairro:      z.string().min(2),
  cidade:      z.string().min(2),
  estado:      z.string().length(2),
})

export type GuestEndereco = z.infer<typeof guestEnderecoSchema>

/** Dados do Cliente guest para prisma.cliente.upsert (create). */
export interface ClienteGuestData {
  nome:              string
  email:             string
  telefone:          string
  senha:             string
  indicadorIE:       number
  cpf?:              string
  cnpj?:             string
  razaoSocial?:      string
  inscricaoEstadual: string | null
}

// indicadorIE (NF-e): PJ com IE → 1, PJ isento → 2, PF → 9 (consumidor final).
// Mesma convenção do PATCH /api/conta/perfil usada no checkout logado.
export function montarClienteGuestData(g: GuestDados): ClienteGuestData {
  const base = {
    nome:     g.nome.trim(),
    email:    g.email.trim().toLowerCase(),
    telefone: canonTelefone(g.telefone), // DDD+8 (helper único)
    senha:    '', // sentinela OAuth-first: não loga via credentials (auth.ts:73-74)
  }
  if (g.tipoPessoa === 'PJ') {
    return {
      ...base,
      cnpj:              soDigitos(g.documento),
      razaoSocial:       g.razaoSocial?.trim(),
      inscricaoEstadual: g.isentoIE ? null : soDigitos(g.inscricaoEstadual ?? ''),
      indicadorIE:       g.isentoIE ? 2 : 1,
    }
  }
  return {
    ...base,
    cpf:               soDigitos(g.documento),
    inscricaoEstadual: null,
    indicadorIE:       9,
  }
}
