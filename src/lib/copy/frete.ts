// Microcopy ÚNICO de frete — fonte de verdade dos textos exibidos ao cliente em
// CalcFrete (produto), /carrinho, /checkout e no CarrinhoDrawer. Aqui é SÓ texto:
// nenhuma lógica de frete/preço/prazo vive neste módulo.
//
// Padronizações:
//  • Verbo de cálculo unificado ("Calcular frete") em toda superfície com botão.
//  • Frete grátis: rótulo "Frete Grátis"; a célula de PREÇO de uma opção usa a
//    forma curta "Grátis" (evita repetir "Frete Grátis" ao lado do nome da opção).
//  • "A combinar" com uma capitalização e UMA frase de explicação.
//  • Loading unificado: "Calculando frete...".

export const FRETE_COPY = {
  // Ação de cálculo (superfícies com botão: produto e carrinho)
  calcular: 'Calcular frete',
  calculando: 'Calculando frete...',
  naoSeiCep: 'Não sei meu CEP',

  // Frete grátis
  gratis: 'Frete Grátis', // rótulo/summary do frete
  gratisPreco: 'Grátis', // célula de preço de uma opção com frete grátis

  // A combinar
  aCombinar: 'A combinar', // rótulo curto (linha de resumo)
  aCombinarTitulo: 'Frete a combinar', // título do bloco de aviso
  aCombinarDescricao:
    'Frete a combinar para a sua região. Registramos o pedido como orçamento e entramos em contato para finalizar.',

  // Resumo
  calculeAcima: 'Calcule acima',
  calculadoNoCheckout: 'Frete calculado no checkout',
} as const
