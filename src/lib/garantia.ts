// A CRIAÇÃO de novas garantias estendidas (criarGarantiasPedido) foi
// descontinuada — garantia estendida é seguro sob regulação SUSEP, fora do
// enquadramento da Sixxis. As garantias JÁ VENDIDAS permanecem no banco e a
// gestão delas (admin) segue usando `statusGarantia` abaixo.

export function statusGarantia(g: { status: string; fimVigencia: Date }): string {
  if (g.status === 'cancelada') return 'cancelada'
  if (g.status === 'acionada') return 'acionada'
  if (new Date() > g.fimVigencia) return 'expirada'
  return 'ativa'
}
