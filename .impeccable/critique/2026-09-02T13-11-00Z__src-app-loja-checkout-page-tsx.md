---
target: src/app/(loja)/checkout/page.tsx
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-02T13-11-00Z
slug: src-app-loja-checkout-page-tsx
---
Method: dual-agent (A: general-purpose design-review · B: general-purpose detector+browser-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Toda fronteira assíncrona tem estado explícito (prefill, cálculo de frete, cupom, overlay "Processando pagamento...", indicador de etapa). |
| 2 | Match System / Real World | 4 | CPF/CNPJ, IE, "frete a combinar", Pix — vocabulário e modelo mental corretos para o comprador brasileiro; saudação personalizada. |
| 3 | User Control and Freedom | 3 | Voltar por etapa, cupom removível, cashback opcional. Mas o pedido já é criado no servidor antes do Brick de pagamento renderizar, e "← Voltar" a partir do Brick não avisa que já existe um pedido criado. |
| 4 | Consistency and Standards | 2 | Página é autoconsistente, mas diverge do DESIGN.md do projeto: botões em `rounded-xl` (deveria ser `rounded-lg`), cards com `shadow-sm/md` em repouso e `border-gray-100` (deveria ser flat + `border-gray-200/80`) — viola a Hover-Only Elevation Rule documentada. |
| 5 | Error Prevention | 4 | Validação por etapa antes de avançar, guarda final re-checando CPF/telefone antes de abrir pagamento, idempotency key evita pedido duplicado. |
| 6 | Recognition Rather Than Recall | 3 | Prefill de perfil/sessão, endereço principal auto-selecionado, total sempre visível no mobile mesmo com o resumo colapsado. |
| 7 | Flexibility and Efficiency of Use | 3 | Endereços salvos aceleram recompra, "compra direta" pula o carrinho, checkout multi-método existe por trás de flag. Nada específico para usuário avançado além disso. |
| 8 | Aesthetic and Minimalist Design | 2 | Selo de confiança (SSL/segurança/qualidade) repetido 3 vezes na mesma tela quase com o mesmo texto — reforço vira ruído. |
| 9 | Help Users Recognize/Diagnose/Recover from Errors | 4 | Erros específicos e acionáveis por campo; copy de recusa de cartão no MP Brick explicitamente tira a culpa do cliente e oferece Pix — melhor microcopy do fluxo. |
| 10 | Help and Documentation | 2 | Zero ajuda contextual pra "Inscrição Estadual"/"Isento de IE" — termo fiscal sem explicação, e errar bloqueia o avanço. |
| **Total** | | **31/40** | **Good** |

## Design Specificity Verdict

**Avaliação (Assessment A, leitura de código):** Não é um template genérico com o logo trocado. O toggle CPF/CNPJ com máscara e label trocando ao vivo, Inscrição Estadual + isenção pra PJ, desconto Pix mostrado com o percentual real em 3 pontos diferentes, "frete a combinar" degradando pra um pedido tipo orçamento em vez de erro duro, e a copy de recusa de cartão que explicitamente desculpa o cliente ("não é um erro nos dados digitados... tente outro cartão ou pague com Pix") — tudo isso é específico de como o comprador brasileiro compra eletrodoméstico online. O Brick do Mercado Pago é até re-skinado com os tokens de cor/raio da marca. A camada de *conteúdo e fluxo* é claramente autoral; onde ele escorrega pra genérico é só na camada de estilo de componente (cards/botões — ver Issues).

**Varredura determinística (Assessment B):** 2 achados no arquivo — `side-tab` (linha 223, `border-l-4`, severidade warning) e `design-system-color` (linha 937, `#e5e7eb`, severidade advisory). Nenhum outro achado no arquivo.

**Overlay visual:** não disponível nesta rodada — sem injeção no navegador (ver limitação abaixo).

## Overall Impression

O checkout é substancialmente bem-feito no que mais importa em e-commerce real (prevenção de erro, feedback de status, copy de recuperação de erro) — mas visualmente diverge do próprio sistema de design da loja bem na tela de maior risco (pagamento, dinheiro real), com cards e botões que não seguem as regras documentadas em DESIGN.md. A maior oportunidade não é decoração: é fazer a confirmação de voltagem — a regra de negócio mais crítica do produto — pesar visualmente tanto quanto pesa em consequência.

## What's Working

1. **Unificação CPF/CNPJ** — um campo só, com label/máscara/validação trocando com o toggle PF/PJ, em vez de dois conjuntos de campos paralelos. Redução real de complexidade, não só limpeza visual.
2. **Copy de recusa de pagamento** (CheckoutBricks.tsx) — reassegura explicitamente que a recusa é análise de risco do banco, não erro do cliente, e oferece Pix como alternativa imediata. A melhor peça de copy de todo o fluxo.
3. **Idempotência + reentrada guardada no pagamento** — clique repetido e navegação de volta pra um formulário parcialmente preenchido não produzem pedido duplicado ou quebrado.

## Priority Issues

**[P1] Cards e botões do checkout divergem do próprio design system documentado**
- **Por que importa:** DESIGN.md documenta cards planos em repouso (`border-gray-200/80`, elevação só no hover) e botões `rounded-lg` com hover lift. Todo card do checkout (linhas 223, 1118, 1225, 1364) usa `shadow-sm`/`shadow-md` em repouso + `border-gray-100`, e todo botão primário (366, 952, 977, 1217, 1353, 1411) usa `rounded-xl` sem o lift documentado. É a tela de maior risco (dinheiro real) divergindo mais do que qualquer outra do sistema visual construído pra parecer "seguro e organizado".
- **Fix:** trocar `shadow-sm`/`shadow-md` em repouso por flat + `hover:shadow-md`, `border-gray-100`→`border-gray-200/80`, `rounded-xl`→`rounded-lg` nos CTAs, com o hover lift documentado. Inclui remover o `border-l-4 border-l-[#3cbfb3]` do ResumoSidebar (achado do detector, linha 223) — confirmado como decorativo, não funcional (não marca seleção nem alerta), aparece em só 1 dos 4 cards da página, e é exatamente o "tell" que o próprio DESIGN.md (One Accent Rule) existe pra evitar.
- **Suggested command:** `/impeccable polish`

**[P1] Confirmação de variação/voltagem fica visualmente achatada no resumo final**
- **Por que importa:** `item.variacaoNome` (linha 246) renderiza com o mesmo peso baixo de "Qtd: 2" — mas essa é a última olhada do cliente na voltagem escolhida antes de pagar, e a regra inegociável do produto é que errar isso queima o aparelho. Tratar como metadado incidental em vez de checkpoint é uma incoerência real entre peso visual e risco de verdade.
- **Fix:** dar à linha de variação um destaque distinto no `ResumoSidebar` (badge no estilo do "Padrão" já usado em `EnderecosSalvos.tsx`, ou microcopy tipo "Confira: 110V").
- **Suggested command:** `/impeccable clarify`

**[P2] Selo de confiança repetido 3 vezes na mesma tela**
- **Por que importa:** rodapé do `ResumoSidebar`, o grid completo de `SelosConfianca`, e o rodapé da etapa 3 repetem quase a mesma alegação (SSL/segurança/qualidade). Repetição sem informação nova é ruído, não reforço — contra a preferência do próprio sistema por organização em vez de decoração.
- **Fix:** manter `SelosConfianca` como bloco canônico de confiança; remover os trios inline de SSL/Shield/Award que o duplicam.
- **Suggested command:** `/impeccable distill`

**[P2] Etapa 1 (PJ) sem agrupamento de campos nem ajuda contextual**
- **Por que importa:** 7 campos num grid só quando PJ é selecionado, "Inscrição Estadual"/"Isento de IE" sem nenhuma explicação pra um comprador que pode não ser contador — e errar aqui bloqueia o avanço.
- **Fix:** subheader separando dados pessoais de dados fiscais, e um "O que é isso?" ao lado de Inscrição Estadual.
- **Suggested command:** `/impeccable clarify`

**[P3] Três verdes diferentes competem na mesma tela**
- **Por que importa:** acento da marca é `#3cbfb3`; `UsarCashback.tsx` usa um teal distinto (`#0f9488`); `ResumoSidebar`/cupom usam `text-green-600`/`700` genérico do Tailwind pra frete grátis/desconto. Dilui a intenção da One Accent Rule mesmo sem nenhum deles ser uma segunda cor de CTA.
- **Fix:** padronizar texto de valor positivo/economia pro `#0f9488` (ou `#3cbfb3` direto) em vez do verde padrão do Tailwind.
- **Suggested command:** `/impeccable polish`

**Achado do detector reavaliado como falso-positivo:** `#e5e7eb` na linha 937 é o hex exato de `gray-200` do Tailwind — não é cor fora da paleta, é o cinza documentado reaplicado via `style` inline em vez de classe utilitária (um spinner de 2 tons). Não é miss de design system; no máximo é um nit de estilo de código (`border-[3px] border-gray-200 border-t-[#3cbfb3]` seria mais consistente, não mais correto).

## Persona Red Flags

**Casey (Mobile, distraído):** o `StepIndicator` some o rótulo de texto em mobile (`hidden sm:block`) — só ícone/check aparece, sem fallback tipo "Etapa 2 de 3". No dispositivo que a maioria dos compradores brasileiros realmente usa, é o maior custo de compreensão da página.

**Riley (Testador metódico):** o pedido é criado no servidor (`POST /api/pedidos`) antes do Brick do Mercado Pago sequer renderizar, e o cliente pode clicar "← Voltar" livremente de volta pro formulário — não há evidência de que esses pedidos órfãos/pendentes sejam reconciliados automaticamente em algum lugar do fluxo revisado.

**Jordan (Primeira vez):** "Inscrição Estadual" e "Isento de IE" aparecem sem nenhuma explicação pra quem nunca vendeu/comprou como pessoa jurídica — e errar bloqueia o checkout (mesmo achado do P2 acima, agora pela ótica de quem nunca viu esse termo).

## Minor Observations

- O spinner de hidratação (linhas 935–938) usa `style` inline em vez de classes Tailwind, quebrando a consistência baseada em classe do resto do arquivo — mesma família do achado #e5e7eb.
- "Isento de Inscrição Estadual" vem desmarcado por padrão — razoável, mas vale conferir uso real: PJ pequena isenta de IE é comum e pode esbarrar no erro de validação antes de notar o checkbox.
- Três verdes diferentes (ver P3) também aparecem fora do checkout (`UsarCashback.tsx`) — pode valer uma varredura maior que só esta página.

## Limitação desta rodada (evidência de navegador)

`/checkout` exige sessão autenticada com itens no carrinho, e não há preview público. Login e cadastro têm o mesmo bloqueio: o widget Cloudflare Turnstile não consegue alcançar `challenges.cloudflare.com` a partir deste sandbox (sem saída de rede), então os botões de envio ficam permanentemente desabilitados — não é um defeito do produto, é limitação do ambiente de teste. A Assessment B confirmou isso ao vivo e coletou evidência das páginas públicas alcançáveis (home, produtos, login, cadastro) que usam os mesmos componentes de card/botão/campo — nenhuma delas mostra o padrão de borda lateral colorida (`border-l-*`) encontrado no checkout, reforçando que é uma exceção pontual, não um padrão do site.

## Questions to Consider

- O DESIGN.md diz que cards são planos em repouso sem exceção documentada — o checkout foi deliberadamente isentado como "área funcional" vs. card de vitrine, ou só divergiu com o tempo sem ninguém atualizar o DESIGN.md?
- Alguém reconcilia os pedidos criados no servidor antes do pagamento quando o cliente volta e nunca completa? Ou isso fica pra alguém do financeiro descobrir depois?
- As três repetições de selo de confiança e as três cores de verde foram decisão deliberada de "reforçar confiança por repetição", ou é só acréscimo de várias pessoas mexendo no arquivo sem reler o que já existia?
