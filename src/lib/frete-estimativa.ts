// ─── Estimativa de frete no carrinho — lógica PURA e testável ────────────────
//
// Reaproveitada pela página /carrinho e pelo CarrinhoDrawer (mini-cart) para
// mostrar o frete ANTES do checkout (menos surpresa = mais conversão). Este
// módulo NÃO calcula frete: ele apenas (1) prepara o corpo da requisição para
// /api/frete — a FONTE ÚNICA de preço (resolverFrete: tabela produto × UF +
// carriers) — e (2) normaliza a resposta PÚBLICA para exibição. A máscara e a
// validação de CEP ficam aqui num único lugar (CEP BR = 8 dígitos), para o
// estimador não duplicar o que já existe espalhado (CalcFrete, checkout).
//
// Puro (sem React/prisma/fetch) como os demais src/lib/*.test.ts.

export type FreteStatus = 'ok' | 'a_combinar' | 'bloqueado'

// Opção de frete como exibida ao cliente (resposta pública de /api/frete; os
// campos internos custoFreteReal/transportadora JÁ são removidos pela rota).
export interface FreteOpcaoView {
  id: string
  nome: string
  prazo: string
  preco: number
}

// Item mínimo do carrinho usado para montar a cotação. Aceita tanto o shape do
// store (produtoId) quanto o da página /carrinho (produtoId? + id de fallback).
export interface ItemCarrinhoFrete {
  produtoId?: string
  id?: string
  quantidade: number
}

// Só dígitos, limitado a 8 (CEP brasileiro).
export function soDigitosCep(valor: string): string {
  return (valor ?? '').replace(/\D/g, '').slice(0, 8)
}

// CEP é válido quando tem exatamente 8 dígitos.
export function cepValido(valor: string): boolean {
  return soDigitosCep(valor).length === 8
}

// Máscara "00000-000" progressiva (mesma forma usada no checkout/CalcFrete).
export function formatarCep(valor: string): string {
  const d = soDigitosCep(valor)
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`
}

// Monta os `produtos` da requisição a partir dos itens do carrinho: usa
// produtoId (com fallback para id), soma quantidades do mesmo produto e descarta
// itens sem id ou com quantidade inválida (< 1). Ordena por id para resultado
// determinístico. A variação não afeta o frete (é por produto), por isso some.
export function montarProdutosFrete(
  itens: ItemCarrinhoFrete[],
): Array<{ id: string; quantidade: number }> {
  const porId = new Map<string, number>()
  for (const item of itens ?? []) {
    const id = String(item.produtoId || item.id || '')
    const q = Math.floor(Number(item.quantidade))
    if (!id || !Number.isFinite(q) || q < 1) continue
    porId.set(id, (porId.get(id) ?? 0) + q)
  }
  return [...porId.entries()]
    .map(([id, quantidade]) => ({ id, quantidade }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

export interface RespostaFreteNormalizada {
  status: FreteStatus
  opcoes: FreteOpcaoView[]
  mensagem: string
}

// Normaliza a resposta pública de /api/frete (status/opcoes/mensagem) para a UI.
// Defensivo: status ausente/desconhecido → 'bloqueado'; preço via Number; as
// opções só sobrevivem quando status === 'ok'.
export function normalizarRespostaFrete(data: unknown): RespostaFreteNormalizada {
  const d = (data ?? {}) as {
    status?: string
    mensagem?: string
    opcoes?: Array<{ id?: string; nome?: string; prazo?: string; preco?: unknown }>
  }
  const status: FreteStatus =
    d.status === 'ok' || d.status === 'a_combinar' ? d.status : 'bloqueado'
  const mensagem = typeof d.mensagem === 'string' ? d.mensagem : ''
  if (status !== 'ok') return { status, opcoes: [], mensagem }
  const opcoes: FreteOpcaoView[] = (d.opcoes ?? []).map((o) => ({
    id: String(o?.id ?? ''),
    nome: String(o?.nome ?? ''),
    prazo: String(o?.prazo ?? ''),
    preco: Number(o?.preco ?? 0),
  }))
  return { status: 'ok', opcoes, mensagem }
}

// Estado apresentacional derivado para a UI do estimador. 'sem-opcoes' é a borda
// defensiva: status ok sem nenhuma modalidade (resolverFrete não produz isso
// hoje, mas a UI trata como "sem resultado" em vez de mostrar lista vazia).
export type EstadoFreteView =
  | 'nada'
  | 'calculando'
  | 'ok'
  | 'sem-opcoes'
  | 'a_combinar'
  | 'bloqueado'

export function estadoFreteView(
  calculando: boolean,
  resultado: RespostaFreteNormalizada | null,
): EstadoFreteView {
  if (calculando) return 'calculando'
  if (!resultado) return 'nada'
  if (resultado.status === 'a_combinar') return 'a_combinar'
  if (resultado.status === 'bloqueado') return 'bloqueado'
  return resultado.opcoes.length > 0 ? 'ok' : 'sem-opcoes'
}
