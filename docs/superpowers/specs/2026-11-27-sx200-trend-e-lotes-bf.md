# SX200 Trend + lotes promocionais BF — especificação

## Objetivo

1. Remover o desconto direto de 10% do SX200 Trend.
2. Excluir SX200 Trend da promoção automática “2ª unidade com 50% OFF”, como o SX200 Prime.
3. Exibir no SX200 Trend: “Prazo de entrega: a partir de 15/12/2026.”
4. Exibir saldos auditáveis dos lotes Black Friday nos cards, PDP e seletor de variação.
5. Divulgar no header o cupom `BLACKFRIDAY10`: 10% em uma unidade elegível, sem acumular com os 50% da segunda unidade.
6. Preservar 5% no Pix, parcelamento, seleção obrigatória de voltagem e os demais fluxos.

## Regras comerciais

- `BLACKFRIDAY10` vale somente para carrinho com exatamente uma unidade.
- SX200 Trend não recebe o desconto direto, não participa dos 50% da segunda unidade e não é elegível ao `BLACKFRIDAY10`.
- SX200 Prime e SX200 Trend ficam fora da promoção de 50%; a ressalva deve aparecer em texto e no banner raster.
- Se a promoção de 50% incidir, nenhum cupom é aplicado. O servidor continua como autoridade.
- A comunicação do header deve dizer explicitamente “10% OFF”, o código, “1 unidade elegível” e “não acumula com 50% na 2ª unidade”.
- O aviso de entrega do SX200 Trend deve aparecer na PDP e no card, inclusive antes da compra direta.

## Lotes Black Friday

Saldo exibido = `min(lote configurado - quantidade de itens em pedidos pagos da campanha, estoque real atual)`, limitado a zero.

A contagem considera pedidos com status pago/enviado/entregue, criados a partir de 23/11/2026. Pedidos pendentes/cancelados não reduzem o lote. O valor é derivado em leitura; não cria contador mutável nem escrita adicional.

- Aspirador Bravo: 30
- SX180 Trend: 28
- SX100 Trend: 12
- SX040: 20
- Life preta: 14
- Life branca: 10
- Cardio: 20
- M45 Trend: 26
- SX070 Trend: 8
- SX060 Prime: 6
- SX120 Prime: 10

Para Sixxis Life, o saldo é por variação de cor. No card sem seleção, mostrar o total das cores; após a seleção, mostrar o saldo da cor.

Os números são “unidades do lote Black Friday”, não alegação de vendas. Uma redução manual futura representa redução real da alocação promocional e será feita na configuração, sem simular pedidos.

## Direção visual

Preservar os tokens e a linguagem visual Sixxis. Criar um componente reutilizável, plano e sem gradiente:
- fundo âmbar suave em campo inteiro;
- detalhe vertical vermelho/âmbar de urgência;
- ícone discreto;
- número com algarismos tabulares e forte hierarquia;
- texto “Últimas N unidades do lote Black Friday” / “Última unidade do lote Black Friday”;
- contraste AA, sem piscar, sem animação contínua;
- compacto no card, mais informativo na PDP e no modal;
- responsivo em 390 px, tablet e desktop.

## Fora de escopo

- Não criar pedidos ou pagamentos reais para testar.
- Não alterar estoque físico.
- Não automatizar uma redução futura sem quantidade e horário definidos.
