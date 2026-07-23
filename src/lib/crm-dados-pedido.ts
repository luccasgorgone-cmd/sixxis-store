// ─── Montagem do objeto `dados` enviado ao CRM — FONTE ÚNICA ─────────────────
//
// Usado pelas três rotas /api/admin/pedidos/[id]/crm/* (buscar, prévia, aplicar)
// para NUNCA divergirem. Regras de contrato acordadas com o CRM:
//
//  a) `estado` -> `uf` (OBRIGATÓRIO). O CRM espera `dados.endereco.uf`; enviar
//     "estado" faz o campo ser IGNORADO EM SILÊNCIO. É a falha mais traiçoeira.
//  b) Data da NF: SEMPRE "YYYY-MM-DD" (só o dia), via formatarDiaISO do Bloco 1.2.
//  c) CPF/CNPJ e CEP: SOMENTE DÍGITOS.
//  d) Telefone (na busca): como está no cadastro — o CRM já casa variantes.
//  e) Documento: `cpf` (PF) e `cnpj` (PJ) são campos PRÓPRIOS do CRM e
//     MUTUAMENTE EXCLUSIVOS — envia só o que existir, nunca CNPJ dentro de `cpf`.
//     `razaoSocial` vai quando existir (o CRM mapeia p/ a chave `empresa`).
//     `inscricaoEstadual`/`indicadorIE` NÃO são enviados (o CRM não tem destino;
//     ficam só na Loja, para a NF-e).
//
// Campos vazios simplesmente não entram no objeto.

import type { Prisma } from '@prisma/client'
import { formatarDiaISO } from '@/lib/data-nf'
import type { DadosCrm, DadosCrmEndereco } from '@/lib/crm'

// Select mínimo para montar `dados` e a busca. Exportado p/ as três rotas.
export const SELECT_PEDIDO_CRM = {
  id: true,
  notaFiscal: true,
  dataNotaFiscal: true,
  codigoRastreio: true,
  transportadora: true,
  cliente: { select: { nome: true, cpf: true, cnpj: true, razaoSocial: true, email: true, telefone: true } },
  endereco: {
    select: {
      cep: true, logradouro: true, numero: true, complemento: true,
      bairro: true, cidade: true, estado: true,
    },
  },
} satisfies Prisma.PedidoSelect

export type PedidoParaCrm = Prisma.PedidoGetPayload<{ select: typeof SELECT_PEDIDO_CRM }>

function soDigitos(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '')
}

// Documento em campos PRÓPRIOS e mutuamente exclusivos: PF -> { cpf }, PJ ->
// { cnpj } (só dígitos). Cliente sem documento -> {}. Nunca os dois juntos, nunca
// CNPJ dentro de `cpf`.
export function documentoCrm(
  cliente: { cpf: string | null; cnpj: string | null },
): { cpf?: string; cnpj?: string } {
  const cpf = soDigitos(cliente.cpf)
  if (cpf) return { cpf }
  const cnpj = soDigitos(cliente.cnpj)
  if (cnpj) return { cnpj }
  return {}
}

// Objeto `dados` completo (nome/cpf/email + endereço + NF + rastreio).
export function montarDadosCrm(pedido: PedidoParaCrm): DadosCrm {
  const dados: DadosCrm = {}

  const nome = pedido.cliente.nome?.trim()
  if (nome) dados.nome = nome
  // (e) cpf (PF) OU cnpj (PJ) em campos próprios; nunca os dois.
  Object.assign(dados, documentoCrm(pedido.cliente))
  const razao = pedido.cliente.razaoSocial?.trim()
  if (razao) dados.razaoSocial = razao
  const email = pedido.cliente.email?.trim()
  if (email) dados.email = email

  const e = pedido.endereco
  if (e) {
    const endereco: DadosCrmEndereco = {}
    const cep = soDigitos(e.cep)
    if (cep) endereco.cep = cep
    if (e.logradouro?.trim()) endereco.logradouro = e.logradouro.trim()
    if (e.numero?.trim()) endereco.numero = e.numero.trim()
    if (e.complemento?.trim()) endereco.complemento = e.complemento.trim()
    if (e.bairro?.trim()) endereco.bairro = e.bairro.trim()
    if (e.cidade?.trim()) endereco.cidade = e.cidade.trim()
    // (a) estado -> uf. Nunca enviar como "estado".
    if (e.estado?.trim()) endereco.uf = e.estado.trim().toUpperCase()
    if (Object.keys(endereco).length > 0) dados.endereco = endereco
  }

  const numeroNf = pedido.notaFiscal?.trim()
  const dataNf = formatarDiaISO(pedido.dataNotaFiscal) // (b) "YYYY-MM-DD"
  if (numeroNf || dataNf) {
    dados.notaFiscal = {}
    if (numeroNf) dados.notaFiscal.numero = numeroNf
    if (dataNf) dados.notaFiscal.data = dataNf
  }

  const codigo = pedido.codigoRastreio?.trim()
  const transp = pedido.transportadora?.trim()
  if (codigo || transp) {
    dados.rastreio = {}
    if (codigo) dados.rastreio.codigo = codigo
    if (transp) dados.rastreio.transportadora = transp
  }

  return dados
}

// Input da busca a partir do cadastro do cliente do pedido. Envia o documento no
// campo próprio: cpf (PF) ou cnpj (PJ).
export function montarBuscaCrm(
  cliente: { nome: string | null; cpf: string | null; cnpj: string | null; telefone: string | null },
): { telefone?: string; cpf?: string; cnpj?: string; nome?: string } {
  const out: { telefone?: string; cpf?: string; cnpj?: string; nome?: string } = {}
  const tel = cliente.telefone?.trim()
  if (tel) out.telefone = tel // (d) como está no cadastro
  Object.assign(out, documentoCrm(cliente))
  const nome = cliente.nome?.trim()
  if (nome) out.nome = nome
  return out
}
