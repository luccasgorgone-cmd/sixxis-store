# Task 8 report — Métricas Site com fórmulas explícitas

## Estado

✅ Implementado e testado no branch `feat/api-leitura-v1`, BASE `1d1c9b194555ce6330825a50225501052d3e920e`.

Commit local: `929de24` (`feat(api-v1): add documented store metrics`).

## Entrega

- 8 famílias registradas: `vendas`, `funil`, `carrinhos`, `cupons-cashback-fidelidade`, `frete`, `avaliacoes`, `estoque-catalogo`, `clientes`.
- Query obrigatória `de`, `ate`, `agrupar=dia|semana|mes`; intervalo civil BRT inclusivo, máximo 366 dias; semana começa segunda-feira.
- Vendas: fórmulas exatas de pedidos pagos, receita bruta, receita líquida comercial, lucro conhecido nullable e ticket; séries e quebras por status MP, método real, produto, variação, UF, cidade e atribuição/canal de click-id.
- Funil `tracked`: progressão cumulativa sessão → view_item → add_to_cart → begin_checkout → submit → purchase; abandono comercial/ técnico; follow-up posterior à janela evita falso abandono.
- Carrinhos persistentes e checkout tracked; cupons/cashback/fidelidade; frete selecionado/persistido; avaliações; estoque/catálogo; clientes novos/recorrentes e LTV histórico.
- Dinheiro em strings decimais; seletores Prisma nominais; número constante de queries por família, sem query por linha; nenhum identificador de cliente/sessão/click-id bruto no payload.

## TDD — RED observado

1. `npm test -- src/lib/api-v1/metricas`
   - RED esperado: 6 suites falharam por imports ausentes; 0 testes carregados.
2. `npm test -- src/lib/api-v1/metricas/operacao.test.ts`
   - RED: 3 testes falharam por séries agrupadas ausentes.
3. `npm test -- src/lib/api-v1/metricas/operacao.test.ts`
   - RED: 1 teste falhou porque o seletor buscava `resposta` em vez do relógio seguro `respostaEm`.
4. `npm test -- src/lib/api-v1/metricas/funil.test.ts`
   - RED: sessão ativa no período, criada antes, não entrava no denominador.
5. `npm test -- src/lib/api-v1/metricas/funil.test.ts src/lib/api-v1/metricas/vendas.test.ts`
   - RED: 3 testes falharam reproduzindo os achados da revisão: estágios não cumulativos, conversão posterior classificada como abandono e PII livre em cidade.

## GREEN e gates finais

- `npm test -- src/lib/api-v1/metricas`
  - PASS: 6 arquivos, 30 testes.
- `npm test`
  - PASS: 40 arquivos, 873 testes.
- `npx tsc --noEmit`
  - PASS, exit 0, sem saída.
- `npx eslint src/lib/api-v1/metricas`
  - PASS, exit 0, sem saída.
- `git diff --cached --check`
  - PASS, exit 0, sem saída.
- Pre-commit do commit `929de24`
  - `prisma generate`, `tsc --noEmit`, suíte 40/873 e eslint staged: PASS.
  - Build pulado pelo hook por ausência de `DATABASE_URL`, reportado explicitamente.
- `~/.openclaw/workspace/scripts/review-diff.sh "$PWD" barato-codigo`
  - Sensor inferencial indisponível nos níveis barato/grátis; degradou sem alterar arquivos.
- Revisão read-only com GitHub Copilot CLI
  - 3 achados Medium: funil não cumulativo; abandono sem follow-up; cidade livre sem redação PII.
  - Todos reproduzidos por testes RED e corrigidos no mesmo fix pass; foco e suíte completa voltaram a verde.

## O que verifiquei

- Limites UTC exatos de dias civis BRT, inclusive transição histórica de DST.
- Máximo inclusivo de 366 dias e rejeição de parâmetros ausentes/invertidos/inválidos antes da query.
- Semana de segunda a domingo.
- Fórmulas monetárias, custo ausente → lucro `null`, agrupamentos e todas as quebras pedidas.
- Sem PII/click-id bruto nas dimensões agregadas testadas; cidade livre passa pelo redator.
- Seletores controlados não leem `Pagamento.rawResponse`, conteúdo de resposta de avaliação nem campos PII desnecessários.
- Escopos: cada métrica declara `read:analytics` ou `read:financeiro`; execução pelo registry exige scope e aceita `read:all` conforme contrato.
- Consultas em lote/constantes, sem N+1 por pedido, item, sessão ou cliente.

## O que NÃO verifiquei

- Não rodei build Next/Railway: Task 8 não altera rota e o build real exige `DATABASE_URL` válido; permanece gate de rollout da Task 10.
- Não consultei banco/Railway/produção nem validei cardinalidade/performance com volume real.
- Router HTTP, OpenAPI, docs e smoke de `/api/v1/metricas/*` pertencem às Tasks 9–10 e ainda não existem neste recorte.
- O warning Node `DEP0205 module.register()` aparece no Vitest e é baseline externo; não houve falha.

## Fix round 1/5 — achados Important da revisão

### Correções

- Frete: `shipping_tier` e transportadora agora aceitam somente rótulos operacionais conhecidos; valores livres caem em `outra`, sem emitir e-mail, telefone ou nome. Rótulos úteis como `Normal` e `Braspress` permanecem.
- Funil/carrinhos: a consulta do período carrega todos os tipos de atividade para o denominador e relógio de inatividade; estágios continuam restritos à sequência do funil. Follow-up histórico é limitado às sessões com `begin_checkout` e ao intervalo até `now`.
- Método de pagamento: somente pernas `approved|captured` entram na quebra por método; tentativas rejeitadas permanecem apenas na quebra por status.
- Clientes: cada comprador aparece em todo bucket em que comprou; primeira compra histórica classifica como novo apenas no bucket inicial e como recorrente nos posteriores.
- Atribuição: eventos `purchase` são correlacionados fora da fronteira BRT por filtros JSON exatos de `transaction_id`, em lotes de no máximo 200 IDs vindos dos pedidos pagos selecionados; nenhum scan livre é feito.
- Produto/variação: garantia é alocada ao produto por `GarantiaEstendida.produtoId`; usa `pedidoItemId` para a variação quando possível e o bucket explícito `garantia_nao_alocada` quando não. As duas quebras reconciliam com receita bruta.
- Seletores não utilizados `Pedido.clienteId` e `Pedido.status` foram removidos da leitura de vendas.

### TDD — RED observado

- `npx vitest run src/lib/api-v1/metricas/vendas.test.ts src/lib/api-v1/metricas/funil.test.ts src/lib/api-v1/metricas/operacao.test.ts src/lib/api-v1/metricas/clientes.test.ts`
  - RED esperado: 4 arquivos falharam; 7 testes falharam e 15 passaram.
  - Reproduzidos: comprador ausente no segundo bucket; `tipo` ainda restringindo atividade/follow-up; falso abandono após `search`; PII bruto no frete; rejeição contando como método; atribuição presa à janela; garantias ausentes das quebras.

### GREEN e gates finais do fix

- `npx vitest run src/lib/api-v1/metricas/vendas.test.ts src/lib/api-v1/metricas/funil.test.ts src/lib/api-v1/metricas/operacao.test.ts src/lib/api-v1/metricas/clientes.test.ts`
  - PASS: 4 arquivos, 22 testes.
- `npx vitest run`
  - PASS: 40 arquivos, 878 testes.
- `npx tsc --noEmit`
  - PASS, exit 0, sem saída.
- `npx eslint src/lib/api-v1/metricas/vendas.ts src/lib/api-v1/metricas/vendas.test.ts src/lib/api-v1/metricas/funil.ts src/lib/api-v1/metricas/funil.test.ts src/lib/api-v1/metricas/operacao.ts src/lib/api-v1/metricas/operacao.test.ts src/lib/api-v1/metricas/clientes.ts src/lib/api-v1/metricas/clientes.test.ts`
  - PASS, exit 0, sem saída.
- `git diff --check`
  - PASS, exit 0, sem saída.

### Verificado / não verificado

- Verificado por testes: ausência dos valores PII de nome/e-mail/telefone no frete; atividade não-funil sem avançar estágio; pagamento rejeitado fora do método; buyer por bucket; query de atribuição limitada por IDs; somas de produto e variação iguais à receita bruta.
- Não verificado: cardinalidade/performance em banco real e smoke HTTP permanecem fora desta rodada; expansão detalhada dos schemas/OpenAPI segue para Task 10 e otimização de escala do LTV permanece deferida.

## Fix round 2/5 — minimização e planos limitados

### Correções

- `Pedido.freteTipo` passa pela mesma allowlist conservadora de transportadora/opção; a probe exata `Maria Silva maria@example.com 11988887777` agrega como `outra` e não aparece no payload.
- Funil/carrinhos separam eventos funcionais de relógios: somente tipos do funil selecionam `dados`; toda atividade é reduzida no banco com `groupBy sessaoId + _max(createdAt)`, sem ler JSON livre.
- Follow-up é limitado a sete dias após o fim do período e executado serialmente em lotes de no máximo 200 sessões. Dentro de cada lote há no máximo duas consultas concorrentes (outcomes e relógio agregado).
- A definição de recorrente explicita a diferença entre resumo e série: no bucket do primeiro pedido pago histórico o comprador é novo; em buckets posteriores, recorrente.
- Atribuição usa uma única consulta `purchase` limitada por `createdAt` indexado, do início do período até sete dias após o fim, e correlaciona `transaction_id` em memória. Isso preserva cross-midnight sem fan-out por quantidade de pedidos; eventos após sete dias ficam honestamente não atribuídos.

### TDD — RED observado

- `npx vitest run src/lib/api-v1/metricas/vendas.test.ts src/lib/api-v1/metricas/funil.test.ts src/lib/api-v1/metricas/operacao.test.ts src/lib/api-v1/metricas/clientes.test.ts`
  - RED esperado: 4 arquivos falharam; 8 testes falharam e 15 passaram.
  - Reproduzidos: PII em `freteTipo`; atividade antiga/recente ausente da agregação; follow-up ainda sem filtro/batch; definição de recorrente divergente; atribuição com OR/fan-out (6 consultas para 1.001 pedidos).

### GREEN e gates finais

- `npx vitest run src/lib/api-v1/metricas/vendas.test.ts src/lib/api-v1/metricas/funil.test.ts src/lib/api-v1/metricas/operacao.test.ts src/lib/api-v1/metricas/clientes.test.ts`
  - PASS: 4 arquivos, 24 testes.
- `npx vitest run`
  - PASS: 40 arquivos, 880 testes.
- `npx tsc --noEmit`
  - PASS, exit 0, sem saída.
- `npx eslint src/lib/api-v1/metricas/vendas.ts src/lib/api-v1/metricas/vendas.test.ts src/lib/api-v1/metricas/funil.ts src/lib/api-v1/metricas/funil.test.ts src/lib/api-v1/metricas/operacao.ts src/lib/api-v1/metricas/operacao.test.ts src/lib/api-v1/metricas/clientes.ts src/lib/api-v1/metricas/clientes.test.ts`
  - PASS, exit 0, sem saída e sem warnings.
- `git diff --check`
  - PASS, exit 0, sem saída.

### Verificado / não verificado

- Verificado por probes: PII exato ausente das três dimensões de frete; `groupBy` de atividade não seleciona `dados`; 401 sessões geram lotes 200/200/1 com pico de concorrência 2 e horizonte fixo; 1.001 pedidos geram exatamente uma consulta de atribuição; evento cross-midnight dentro de sete dias é atribuído; repeat buyer conserva classificação por bucket.
- Não verificado: plano `EXPLAIN`/latência e cardinalidade em MySQL de produção. A janela de atribuição/follow-up deliberadamente não associa eventos posteriores a sete dias; schema/OpenAPI detalhado permanece Task 10 e escala histórica de LTV segue deferida.

## Fix round 3/5 — sessões distintas por bucket

### Correção e plano

- A atividade do período não usa mais `groupBy sessaoId + max`, que apagava buckets anteriores. Ela é lida por paginação keyset determinística em `(createdAt,id)`, serialmente, com `take=500`.
- Cada página seleciona somente `id`, `sessaoId` e `createdAt`; nunca lê `dados`. As linhas são imediatamente reduzidas em `Set<sessaoId>` por bucket e em um único relógio máximo por sessão, sem acumular todas as atividades em um resultado gigante.
- O scan de atividade e a consulta limitada de eventos de funil formam um `Promise.all` fixo de duas operações; páginas posteriores são estritamente seriais. O follow-up de sete dias/lotes de 200 da rodada anterior foi preservado.
- Como o schema tinha apenas `@@index([createdAt])`, foi adicionada a migração aditiva `20261116200500_evento_tracking_activity_cursor_index` com índice `EventoTracking(createdAt,id)`, correspondente ao `orderBy`/cursor testado.

### TDD — RED observado

- `npx vitest run src/lib/api-v1/metricas/funil.test.ts`
  - RED esperado: 2 falhas e 7 passes.
  - A mesma sessão teve `sessoes=0` no primeiro de dois dias ativos; o probe de 1.001 eventos observou zero páginas porque o código ainda usava `groupBy` global.

### GREEN e gates finais

- `npx vitest run src/lib/api-v1/metricas/vendas.test.ts src/lib/api-v1/metricas/funil.test.ts src/lib/api-v1/metricas/operacao.test.ts src/lib/api-v1/metricas/clientes.test.ts`
  - PASS: 4 arquivos, 26 testes.
- `npx vitest run`
  - PASS: 40 arquivos, 882 testes.
- `npx tsc --noEmit`
  - PASS, exit 0, sem saída.
- `npx eslint src/lib/api-v1/metricas/funil.ts src/lib/api-v1/metricas/funil.test.ts src/lib/api-v1/metricas/operacao.test.ts`
  - PASS, exit 0, sem saída e sem warnings.
- `npx prisma validate`
  - PASS: `prisma/schema.prisma` válido.
- `git diff --check`
  - PASS, exit 0, sem saída.

### Verificado / não verificado

- Verificado: uma sessão ativa em dois dias aparece em ambos; 1.001 atividades geram exatamente páginas 500/500/1, cursores `e-0499`/`e-0999`, `orderBy createdAt,id`, seleção mínima sem JSON e pico de concorrência <=2; denominador e relógio de atividade continuam corretos; follow-up permanece limitado.
- Não verificado: `EXPLAIN` e tempo de criação do índice em volume real. A migração é somente `CREATE INDEX`, sem alteração ou remoção de dados; não foi aplicada a banco/Railway nesta tarefa.
