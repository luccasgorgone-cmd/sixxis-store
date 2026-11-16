export function textoMontagemProduto(categoria?: string | null): string | null {
  if (categoria === 'climatizadores') {
    return 'Chega quase pronto: é só encaixar as rodinhas.'
  }

  if (categoria === 'spinning') {
    return 'Montagem simples: siga o manual que acompanha o produto para finalizar os ajustes antes do uso.'
  }

  return null
}
