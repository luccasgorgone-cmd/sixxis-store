// Quando o checkout pode sincronizar o nome do cadastro com o nome digitado no
// pagamento (cobre contas Google com nome incompleto, ex.: "08GEOVANNI").
//
// SÓ com sessão do próprio dono. O token de posse do pedido (x-pedido-token)
// NÃO basta: no checkout convidado o pedido é ligado ao Cliente pelo e-mail
// digitado, que pode ser o e-mail de uma conta existente de outra pessoa. Sem
// esta regra, quem soubesse o e-mail de um cliente criava um pedido convidado
// com ele e, no pagamento, reescrevia o nome do cadastro dessa pessoa (que vai
// para NF-e, e-mails e etiqueta) sem login. O nome do convidado novo já é
// gravado na criação do pedido (guest-checkout.ts), então nada se perde.
export function deveSincronizarNomeCadastro(params: {
  clienteSessaoId: string | null
  pedidoClienteId: string
  payerNome: string | undefined
  nomeAtual: string
}): boolean {
  const { clienteSessaoId, pedidoClienteId, payerNome, nomeAtual } = params
  if (!payerNome || payerNome === nomeAtual) return false
  return clienteSessaoId != null && clienteSessaoId === pedidoClienteId
}
