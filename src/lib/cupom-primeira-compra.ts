// ─── Cupom de PRIMEIRA COMPRA — FONTE ÚNICA DE VERDADE (texto) ───────────────
// Toda superfície que EXIBE o cupom de boas-vindas (banner do topo, carrinho,
// e-mails, WhatsApp, área do cliente, prompt da Luna) importa daqui. Trocar o
// código ou o percentual abaixo cascateia para o site inteiro.
//
// ATENÇÃO — o que este módulo NÃO é:
//   • NÃO é a fonte de verdade do DESCONTO aplicado. O desconto real vive no
//     banco (model Cupom) e é validado/recalculado server-side por
//     `avaliarCupom` (src/lib/cupom.ts), consumido por /api/cupons/validar e
//     rebatido em /api/pedidos. Nenhuma tela pode conceder desconto sozinha.
//   • Logo, mudar PERCENTUAL aqui NÃO muda o que o cliente paga. Para mudar o
//     desconto de fato, atualize o registro no banco (admin /cupons ou
//     `npx tsx scripts/seed-cupom-primeira-compra.ts`) — este módulo só mantém
//     o texto exibido em sincronia com ele.
//
// Ou seja: `CODIGO`/`PERCENTUAL` aqui devem ESPELHAR o registro do banco. Se
// divergirem, o site anuncia um desconto que a validação não concede.

export const CUPOM_PRIMEIRA_COMPRA = {
  /** Código que o cliente digita. Espelha `Cupom.codigo` no banco. */
  CODIGO: 'SIXXIS05',
  /** Percentual anunciado. Espelha `Cupom.valor` (tipo PERCENTUAL) no banco. */
  PERCENTUAL: 5,
} as const

export const CUPOM_PC_CODIGO = CUPOM_PRIMEIRA_COMPRA.CODIGO
export const CUPOM_PC_PERCENTUAL = CUPOM_PRIMEIRA_COMPRA.PERCENTUAL

/** "5% OFF" */
export const CUPOM_PC_OFF = `${CUPOM_PC_PERCENTUAL}% OFF`
/** "5% OFF na 1ª compra" — forma curta (banner, botões). */
export const CUPOM_PC_LABEL = `${CUPOM_PC_OFF} na 1ª compra`
/** "5% OFF na primeira compra" — forma longa (e-mail, textos corridos). */
export const CUPOM_PC_DESCRICAO = `${CUPOM_PC_OFF} na primeira compra`
/** "CUPOM SIXXIS05 — 5% OFF na 1ª compra" — banner do topo. */
export const CUPOM_PC_BANNER = `CUPOM ${CUPOM_PC_CODIGO} — ${CUPOM_PC_LABEL}`
/** Descrição gravada no registro do banco. */
export const CUPOM_PC_DESCRICAO_DB = `Cupom padrão — ${CUPOM_PC_LABEL}`
