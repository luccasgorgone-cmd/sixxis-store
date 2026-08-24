// Infere o rótulo de exibição (Voltagem/Cor/Tamanho/Capacidade/Variação) a
// partir dos nomes das variações — usado no seletor da PDP e no modal de
// seleção rápida do card de produto, pra sempre mostrarem o mesmo rótulo.
export function inferirTipoVariacao(nomes: string[]): string {
  if (!nomes.length) return 'Variação'
  const joined = nomes.join(' ')
  if (/\d+\s*v\b|bivolt/i.test(joined)) return 'Voltagem'
  const cores = ['preto', 'branco', 'azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'cinza', 'laranja', 'roxo', 'marrom', 'bege', 'prata', 'dourado', 'grafite']
  if (cores.some((c) => joined.toLowerCase().includes(c))) return 'Cor'
  if (/\b(pp|p|m|g{1,2}|xg|xxg|xs|s|l|xl{1,2}|xxl)\b/i.test(joined)) return 'Tamanho'
  if (/\b\d+(cm|mm|ml|l|kg|g|w|hz|gb|tb|pol)\b/i.test(joined)) return 'Capacidade'
  return 'Variação'
}
