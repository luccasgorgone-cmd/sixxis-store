# Sixxis Store API de Leitura v1

API server-to-server, autenticada e somente leitura. A fonte executável do contrato é `openapi.json`; exemplos são sintéticos.

## Entregáveis

- `openapi.json` e `openapi.yaml`: contrato OpenAPI 3.1.
- `colecao.postman.json`: coleção com `{{baseUrl}}` e `{{token}}`.
- `sync-exemplo.ts`: cliente executável que carrega o contrato em `/api/v1/meta/recursos` e pagina o recurso selecionado.

## Autenticação e escopos

Envie `Authorization: Bearer <token>`. Nunca coloque token em URL, log ou repositório. A chave operacional `luccas-programa-externo` não expira (`expiraEm: null`) e permanece válida até revogação explícita. `read:all` concede os domínios; `read:pii` e `read:mensagens` são aditivos. Segredos, hashes, tokens, payloads de gateway e PAN nunca são retornados, mesmo com todos os escopos.

Escopos disponíveis: `read:all`, `read:clientes`, `read:catalogo`, `read:pedidos`, `read:marketing`, `read:analytics`, `read:auditoria`, `read:configuracoes`, `read:financeiro`, `read:pii`, `read:mensagens`.

## Paginação e sincronização

Use `limit` (máximo global 500; respeite `sync.maxLimit` do recurso) e repita `nextCursor` até `hasMore=false`. O cursor é opaco, criptografado e vinculado ao recurso, filtros e ordenação; não o interprete. Cada item de `/api/v1/meta/recursos` publica `sync.sort`, `watermarkField`, `watermarkFormat`, parâmetros `from`/`to` e `maxDays: null`, indicando que qualquer intervalo cronológico válido é aceito. Congele os dois limites da janela durante todas as páginas, deduplique por `id`, persista o maior watermark confirmado e faça reconciliação periódica de IDs para detectar exclusões físicas (a v1 não inventa tombstones).

```bash
curl -sS -H "Authorization: Bearer $SIXXIS_API_TOKEN" \
  "https://www.sixxis.com.br/api/v1/produtos?limit=500&sort=updatedAt&atualizadoDesde=2026-11-01T00:00:00.000Z&atualizadoAte=2026-11-17T00:00:00.000Z"
```

O exemplo não depende de pacote instalado globalmente. Informe o token somente pela variável de ambiente; os três argumentos são recurso, início inclusivo e fim inclusivo em ISO 8601. A saída contém apenas `count` e `watermark`.

```bash
read -rsp 'Token da API: ' SIXXIS_API_TOKEN; export SIXXIS_API_TOKEN; echo
# Carga inicial
npx tsx docs/api-v1/sync-exemplo.ts produtos 2026-11-01T00:00:00.000Z 2026-11-17T23:59:59.999Z
# Carga incremental: use o watermark confirmado da execução anterior como início
npx tsx docs/api-v1/sync-exemplo.ts produtos 2026-11-17T20:15:30.000Z 2026-11-18T23:59:59.999Z
unset SIXXIS_API_TOKEN
```

## Erros, limites e cache

Erros usam RFC 9457 (`application/problem+json`) e incluem `requestId`. Status previstos: 400, 401, 403, 404, 405, 429, 500 e 503. Chaves válidas autenticadas operam sem limite de requests ou de período, inclusive em métricas. Cada processo aceita no máximo 1 métrica em execução por chave e 2 no total. A sessão SQL recebe orçamento de 10 segundos; se esse orçamento expirar, a API aguarda a consulta em curso terminar para liberar a conexão e então responde 503. A proteção de brute-force por IP atua somente em tentativas de autenticação recusadas; nesses casos, respeite `Retry-After` ao receber 429. Respostas autenticadas usam `Cache-Control: no-store`; OpenAPI e docs estáticos usam cache público de uma hora. CORS não é habilitado para navegador.

## Endpoints transversais

- Públicos: `GET /api/v1`, `/api/v1/health`, `/api/v1/openapi.json`, `/api/v1/docs`.
- Autenticados: `GET /api/v1/me` e `/api/v1/meta/recursos`.
- Recursos: `GET /api/v1/{recurso}` e `GET /api/v1/{recurso}/{id}`.
- Métricas: `GET /api/v1/metricas/{slug}?de=YYYY-MM-DD&ate=YYYY-MM-DD&agrupar=dia|semana|mes`.
- Outros métodos retornam 405 sem executar autenticação, auditoria ou mutação.

## Recursos (49)

### `clientes`

Escopo: `read:clientes`. Filtros: clienteId, email, cpf, cnpj, bloqueado, erpClienteId. Expansões: enderecos, pedidos, pontos, cashback.

- `id` (string) — campo allowlisted
- `nome` (string) — campo allowlisted
- `email` (string) — campo allowlisted
- `cpf` (string; nullable) — campo allowlisted
- `cnpj` (string; nullable) — campo allowlisted
- `razaoSocial` (string; nullable) — campo allowlisted
- `inscricaoEstadual` (string; nullable) — campo allowlisted
- `indicadorIE` (integer; nullable) — campo allowlisted
- `telefone` (string; nullable) — campo allowlisted
- `erpClienteId` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `bloqueado` (boolean) — campo allowlisted
- `motivoBloqueio` (string; nullable) — campo allowlisted
- `bloqueadoEm` (string; nullable) — campo allowlisted
- `cashbackSaldo` (string) — Valor monetário em BRL.
- `cashbackPendente` (string) — Valor monetário em BRL.
- `totalGasto` (string) — Valor monetário em BRL.
- `totalPedidos` (integer) — campo allowlisted
- `ultimaCompra` (string; nullable) — campo allowlisted
- `carrinhoAbandon` (object; nullable) — campo allowlisted
- `dataNascimento` (string; nullable) — campo allowlisted
- `genero` (string; nullable) — campo allowlisted
- `avatar` (string; nullable) — campo allowlisted
- `avatarGradiente` (string; nullable) — campo allowlisted
- `notifEmail` (boolean) — campo allowlisted
- `notifWhatsapp` (boolean) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `enderecos`

Escopo: `read:clientes`. Filtros: clienteId, uf, cidade, principal. Expansões: cliente, pedidos.

- `id` (string) — campo allowlisted
- `clienteId` (string) — campo allowlisted
- `cep` (string) — campo allowlisted
- `logradouro` (string) — campo allowlisted
- `numero` (string) — campo allowlisted
- `complemento` (string; nullable) — campo allowlisted
- `bairro` (string) — campo allowlisted
- `cidade` (string) — campo allowlisted
- `estado` (string) — campo allowlisted
- `principal` (boolean) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `historico-pontos`

Escopo: `read:clientes`. Filtros: clienteId, pedidoId, tipo. Expansões: cliente.

- `id` (string) — campo allowlisted
- `clienteId` (string) — campo allowlisted
- `pontos` (integer) — campo allowlisted
- `tipo` (string) — campo allowlisted
- `descricao` (string; nullable) — campo allowlisted
- `pedidoId` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `pontos-clientes`

Escopo: `read:clientes`. Filtros: clienteId. Expansões: cliente.

- `id` (string) — campo allowlisted
- `clienteId` (string) — campo allowlisted
- `pontos` (integer) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `cashback-transacoes`

Escopo: `read:clientes`. Filtros: clienteId, pedidoId, tipo, status. Expansões: cliente.

- `id` (string) — campo allowlisted
- `clienteId` (string) — campo allowlisted
- `tipo` (string; enum=credito|debito) — campo allowlisted
- `status` (string; enum=pendente|disponivel|cancelado) — campo allowlisted
- `valor` (string) — Valor monetário em BRL.
- `descricao` (string; nullable) — campo allowlisted
- `pedidoId` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `niveis-fidelidade`

Escopo: `read:clientes`. Filtros: slug. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `slug` (string) — campo allowlisted
- `nome` (string) — campo allowlisted
- `iconeUrl` (string; nullable) — campo allowlisted
- `iconeLucide` (string; nullable) — campo allowlisted
- `cor` (string) — campo allowlisted
- `gastoMin` (string) — Valor monetário em BRL.
- `gastoMax` (string; nullable) — Valor monetário em BRL.
- `cashbackPc` (number) — Percentual de cashback, não valor monetário.
- `ordem` (integer) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `produtos`

Escopo: `read:catalogo`. Filtros: produtoId, categoria, sku, slug, modelo, ativo, erpProdutoId. Expansões: variacoes, avaliacoes, destaques, freteRegras.

- `id` (string) — campo allowlisted
- `erpProdutoId` (string) — campo allowlisted
- `nome` (string) — campo allowlisted
- `slug` (string) — campo allowlisted
- `descricao` (string; nullable) — campo allowlisted
- `preco` (string) — Valor monetário em BRL.
- `precoPromocional` (string; nullable) — Valor monetário em BRL.
- `custoProduto` (string; nullable) — Valor monetário em BRL.
- `imagens` (array) — campo allowlisted
- `estoque` (integer) — campo allowlisted
- `categoria` (string) — campo allowlisted
- `modelo` (string; nullable) — campo allowlisted
- `ativo` (boolean) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `sku` (string; nullable) — campo allowlisted
- `temVariacoes` (boolean) — campo allowlisted
- `videoUrl` (string; nullable) — campo allowlisted
- `especificacoes` (array; nullable) — campo allowlisted
- `faqs` (array; nullable) — campo allowlisted
- `imagensPorVariacao` (object; nullable) — campo allowlisted
- `vendidos` (integer) — campo allowlisted
- `mediaAvaliacoes` (number) — campo allowlisted
- `totalAvaliacoes` (integer) — campo allowlisted
- `garantiaFabricaMeses` (integer) — campo allowlisted
- `garantiaEstendida12Preco` (string; nullable) — Valor monetário em BRL.
- `garantiaEstendida24Preco` (string; nullable) — Valor monetário em BRL.
- `pesoKg` (string; nullable) — Peso em kg; decimal com precisão preservada.
- `alturaCm` (string; nullable) — Altura em cm; decimal com precisão preservada.
- `larguraCm` (string; nullable) — Largura em cm; decimal com precisão preservada.
- `comprimentoCm` (string; nullable) — Comprimento em cm; decimal com precisão preservada.
- `volumes` (integer; nullable) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `avaliacoes`

Escopo: `read:catalogo`. Filtros: produtoId, clienteId, nota, aprovada, destaque. Expansões: cliente, produto, fotos.

- `id` (string) — campo allowlisted
- `produtoId` (string) — campo allowlisted
- `clienteId` (string; nullable) — campo allowlisted
- `nomeAutor` (string) — campo allowlisted
- `emailAutor` (string; nullable) — campo allowlisted
- `nota` (integer) — campo allowlisted
- `titulo` (string; nullable) — campo allowlisted
- `comentario` (string; nullable) — campo allowlisted
- `aprovada` (boolean) — campo allowlisted
- `destaque` (boolean) — campo allowlisted
- `ordem` (integer) — campo allowlisted
- `resposta` (string; nullable) — campo allowlisted
- `respostaEm` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `avaliacoes-fotos`

Escopo: `read:catalogo`. Filtros: avaliacaoId. Expansões: avaliacao.

- `id` (string) — campo allowlisted
- `avaliacaoId` (string) — campo allowlisted
- `url` (string) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `banners`

Escopo: `read:catalogo`. Filtros: ativo. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `imagem` (string) — campo allowlisted
- `imagemTablet` (string; nullable) — campo allowlisted
- `imagemMobile` (string; nullable) — campo allowlisted
- `titulo` (string; nullable) — campo allowlisted
- `subtitulo` (string; nullable) — campo allowlisted
- `link` (string; nullable) — campo allowlisted
- `ordem` (integer) — campo allowlisted
- `ativo` (boolean) — campo allowlisted
- `tempoCads` (integer) — campo allowlisted
- `aspectMobile` (string; nullable) — campo allowlisted
- `aspectTablet` (string; nullable) — campo allowlisted
- `aspectDesktop` (string; nullable) — campo allowlisted
- `maxHeightDesktop` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `configuracoes`

Escopo: `read:configuracoes`. Filtros: chave. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `chave` (string) — campo allowlisted
- `valor` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `formas-pagamento`

Escopo: `read:catalogo`. Filtros: ativo. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `nome` (string) — campo allowlisted
- `iconeUrl` (string) — campo allowlisted
- `ordem` (integer) — campo allowlisted
- `ativo` (boolean) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `produtos-destaques`

Escopo: `read:catalogo`. Filtros: produtoId, secao. Expansões: produto.

- `id` (string) — campo allowlisted
- `produtoId` (string) — campo allowlisted
- `ordem` (integer) — campo allowlisted
- `secao` (string) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `variacoes-produto`

Escopo: `read:catalogo`. Filtros: produtoId, sku, ativo. Expansões: produto.

- `id` (string) — campo allowlisted
- `produtoId` (string) — campo allowlisted
- `nome` (string) — campo allowlisted
- `sku` (string) — campo allowlisted
- `preco` (string; nullable) — Valor monetário em BRL.
- `estoque` (integer) — campo allowlisted
- `ativo` (boolean) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `frete-regras`

Escopo: `read:catalogo`. Filtros: uf, produtoId, bloqueado, aCombinar, freteGratis. Expansões: produto.

- `id` (string) — campo allowlisted
- `produtoId` (string) — campo allowlisted
- `uf` (string) — campo allowlisted
- `precoNormal` (string; nullable) — Valor monetário em BRL.
- `prazoNormal` (integer; nullable) — Legado; preferir prazoNormalMin e prazoNormalMax (dias úteis).
- `precoExpresso` (string; nullable) — Valor monetário em BRL.
- `prazoExpresso` (integer; nullable) — Legado; preferir prazoExpressoMin e prazoExpressoMax (dias úteis).
- `prazoNormalMin` (integer; nullable) — campo allowlisted
- `prazoNormalMax` (integer; nullable) — campo allowlisted
- `prazoExpressoMin` (integer; nullable) — campo allowlisted
- `prazoExpressoMax` (integer; nullable) — campo allowlisted
- `aCombinar` (boolean) — Solicita orçamento; não permite finalizar compra automaticamente.
- `bloqueado` (boolean) — Não entrega nesta UF.
- `freteGratis` (boolean) — Entrega grátis; somente o prazo normal é utilizado.
- `criadoEm` (string) — campo allowlisted
- `atualizadoEm` (string) — campo allowlisted

### `email-templates`

Escopo: `read:configuracoes`. Filtros: tipo, ativo. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `tipo` (string) — campo allowlisted
- `ativo` (boolean) — campo allowlisted
- `assunto` (string) — campo allowlisted
- `corpo` (string) — campo allowlisted
- `prazo` (integer) — campo allowlisted
- `unidadePrazo` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `avaliacoes-parceiros`

Escopo: `read:catalogo`. Filtros: nota, aprovada, destaque. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `nomeCompleto` (string) — campo allowlisted
- `empresa` (string; nullable) — campo allowlisted
- `cargo` (string; nullable) — campo allowlisted
- `cidade` (string; nullable) — campo allowlisted
- `nota` (integer) — campo allowlisted
- `titulo` (string) — campo allowlisted
- `comentario` (string) — campo allowlisted
- `avatarInicial` (string; nullable) — campo allowlisted
- `corAvatar` (string) — campo allowlisted
- `aprovada` (boolean) — campo allowlisted
- `destaque` (boolean) — campo allowlisted
- `ordem` (integer) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `popup-inicial`

Escopo: `read:catalogo`. Filtros: ativado, frequencia. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `ativado` (boolean) — campo allowlisted
- `bannerDesktop` (string; nullable) — campo allowlisted
- `bannerTablet` (string; nullable) — campo allowlisted
- `bannerMobile` (string; nullable) — campo allowlisted
- `altText` (string; nullable) — campo allowlisted
- `linkDestino` (string; nullable) — campo allowlisted
- `abrirNovaAba` (boolean) — campo allowlisted
- `titulo` (string; nullable) — campo allowlisted
- `texto` (string; nullable) — campo allowlisted
- `corBotao` (string; nullable) — campo allowlisted
- `textoBotao` (string; nullable) — campo allowlisted
- `delaySegundos` (integer) — campo allowlisted
- `frequencia` (string; enum=sessao|dia|semana) — campo allowlisted
- `paginas` (array; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `pedidos`

Escopo: `read:pedidos`. Filtros: pedidoId, clienteId, enderecoId, erpPedidoId, status, formaPagamento, mpPaymentId, multiMetodoStatus, nfeStatus, nfeAmbiente, cupom, cupomCodigo, uf, cidade, produtoId, variacaoId, pagamentoStatus, metodo, gclid, gbraid, wbraid, fbc. Expansões: cliente, endereco, itens, pagamentos, garantias.

- `id` (string) — campo allowlisted
- `clienteId` (string) — campo allowlisted
- `status` (string; enum=pago|enviado|entregue|PAGO|ENVIADO|ENTREGUE|pendente|pendente_pagamento|aguardando_pagamento|PENDENTE|PENDENTE_PAGAMENTO|AGUARDANDO_PAGAMENTO|cancelado|cancelado_cliente|cancelado_admin|rejeitado|estornado|expirado_sem_pagamento|CANCELADO|CANCELADO_CLIENTE|CANCELADO_ADMIN|REJEITADO|ESTORNADO|EXPIRADO_SEM_PAGAMENTO) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `total` (string) — Valor monetário em BRL.
- `frete` (string) — Valor monetário em BRL.
- `formaPagamento` (string; enum=pix|credit_card|debit_card|boleto|dois_cartoes|pix_mais_cartao|cashback|cartao|credito|debito|mercado_pago) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `mpPaymentId` (string; nullable) — campo allowlisted
- `enderecoId` (string) — campo allowlisted
- `erpPedidoId` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `pagoEm` (string; nullable) — campo allowlisted
- `codigoRastreio` (string; nullable) — campo allowlisted
- `cupomCodigo` (string; nullable) — campo allowlisted
- `desconto` (string) — Valor monetário em BRL.
- `cashbackUsado` (string) — Valor monetário em BRL.
- `freteTipo` (string; nullable; enum=normal|expresso|a_combinar) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `fretePrazo` (integer; nullable) — campo allowlisted
- `transportadora` (string; nullable) — campo allowlisted
- `linkRastreio` (string; nullable) — campo allowlisted
- `notaFiscal` (string; nullable) — campo allowlisted
- `dataNotaFiscal` (string; nullable) — campo allowlisted
- `nfeRef` (string; nullable) — campo allowlisted
- `nfeChave` (string; nullable) — campo allowlisted
- `nfeStatus` (string; nullable; enum=autorizado|erro|processando|cancelado) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `nfeNumero` (integer; nullable) — campo allowlisted
- `nfeSerie` (integer; nullable) — campo allowlisted
- `nfeDanfeUrl` (string; nullable) — campo allowlisted
- `nfeXmlUrl` (string; nullable) — campo allowlisted
- `nfeMensagemErro` (string; nullable) — campo allowlisted
- `nfeAmbiente` (string; nullable; enum=homologacao|producao) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `crmSincronizadoEm` (string; nullable) — campo allowlisted
- `crmLeadId` (string; nullable) — campo allowlisted
- `custoFreteReal` (string; nullable) — Valor monetário em BRL.
- `mpTaxaReal` (string; nullable) — Valor monetário em BRL.
- `enviadoEm` (string; nullable) — campo allowlisted
- `entregueEm` (string; nullable) — campo allowlisted
- `canceladoEm` (string; nullable) — campo allowlisted
- `canceladoMotivo` (string; nullable) — campo allowlisted
- `fbp` (string; nullable) — campo allowlisted
- `fbc` (string; nullable) — campo allowlisted
- `clientIp` (string; nullable) — campo allowlisted
- `clientUserAgent` (string; nullable) — campo allowlisted
- `capiPurchaseEnviadoEm` (string; nullable) — campo allowlisted
- `gaClientId` (string; nullable) — campo allowlisted
- `gaSessionId` (string; nullable) — campo allowlisted
- `gclid` (string; nullable) — campo allowlisted
- `gbraid` (string; nullable) — campo allowlisted
- `wbraid` (string; nullable) — campo allowlisted
- `ga4PurchaseEnviadoEm` (string; nullable) — campo allowlisted
- `multiMetodoStatus` (string; nullable; enum=aguardando_pix|aguardando_pagamento_restante|falhou|cancelado) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `mpOrderId` (string; nullable) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `garantias-estendidas`

Escopo: `read:pedidos`. Filtros: pedidoId, pedidoItemId, produtoId, status. Expansões: pedido, produto.

- `id` (string) — campo allowlisted
- `pedidoId` (string) — campo allowlisted
- `pedidoItemId` (string; nullable) — campo allowlisted
- `produtoId` (string) — campo allowlisted
- `mesesAdicionais` (integer) — campo allowlisted
- `valorPago` (string) — Valor monetário em BRL.
- `inicioVigencia` (string) — campo allowlisted
- `fimVigencia` (string) — campo allowlisted
- `status` (string; enum=ativa|acionada|expirada|cancelada) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `acionamentos` (array; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `pagamentos`

Escopo: `read:pedidos`. Filtros: pedidoId, mpPaymentId, mpStatus, metodo, tentativaMultiMetodoId, perna, estornoStatus. Expansões: pedido, tentativaMultiMetodo.

- `id` (string) — campo allowlisted
- `pedidoId` (string) — campo allowlisted
- `mpPaymentId` (string; nullable) — campo allowlisted
- `mpPreferenceId` (string; nullable) — campo allowlisted
- `mpStatus` (string; enum=pending|pending_waiting_transfer|approved|authorized|in_process|in_mediation|rejected|cancelled|refunded|charged_back) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `mpStatusDetail` (string; nullable) — campo allowlisted
- `metodo` (string; enum=pix|credit_card|debit_card|boleto|account_money) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `valor` (string) — Valor em BRL; armazenado em centavos e convertido na resposta.
- `pixExpiraEm` (string; nullable) — campo allowlisted
- `parcelas` (integer; nullable) — campo allowlisted
- `bandeira` (string; nullable) — campo allowlisted
- `ultimosDigitos` (string; nullable) — campo allowlisted
- `payerEmail` (string; nullable) — campo allowlisted
- `payerCpf` (string; nullable) — campo allowlisted
- `payerNome` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted
- `aprovadoEm` (string; nullable) — campo allowlisted
- `rejeitadoEm` (string; nullable) — campo allowlisted
- `tentativaMultiMetodoId` (string; nullable) — campo allowlisted
- `perna` (string; nullable; enum=A|B|pix|restante) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `estornoStatus` (string; nullable; enum=nao_aplicavel|pendente|estornado|cancelado|falhou_estorno) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `estornoTentativas` (integer) — campo allowlisted
- `estornoErro` (string; nullable) — campo allowlisted

### `tentativas-multimetodo`

Escopo: `read:pedidos`. Filtros: pedidoId, tipo, status. Expansões: pedido, pagamentos.

- `id` (string) — campo allowlisted
- `pedidoId` (string) — campo allowlisted
- `tipo` (string; enum=dois_cartoes|pix_mais_cartao) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `status` (string; enum=em_andamento|aguardando_confirmacao|aguardando_pix|aguardando_pagamento_restante|pago|falhou|cancelado) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `totalCentavos` (integer) — Total inteiro em centavos (não BRL); unidade explícita no nome.
- `prazoExpiracao` (string; nullable) — campo allowlisted
- `erro` (string; nullable) — campo allowlisted
- `detalhe` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `itens-pedido`

Escopo: `read:pedidos`. Filtros: pedidoId, produtoId, variacaoId. Expansões: pedido, produto.

- `id` (string) — campo allowlisted
- `pedidoId` (string) — campo allowlisted
- `produtoId` (string) — campo allowlisted
- `quantidade` (integer) — campo allowlisted
- `precoUnitario` (string) — Valor monetário em BRL.
- `custoUnitario` (string; nullable) — Valor monetário em BRL.
- `variacaoId` (string; nullable) — campo allowlisted
- `variacaoNome` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `carrinhos`

Escopo: `read:pedidos`. Filtros: clienteId, sessionId. Expansões: cliente, itens.

- `id` (string) — campo allowlisted
- `clienteId` (string; nullable) — campo allowlisted
- `sessionId` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `itens-carrinho`

Escopo: `read:pedidos`. Filtros: carrinhoId, produtoId. Expansões: carrinho, produto.

- `id` (string) — campo allowlisted
- `carrinhoId` (string) — campo allowlisted
- `produtoId` (string) — campo allowlisted
- `quantidade` (integer) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `cupons`

Escopo: `read:pedidos`. Filtros: codigo, tipo, ativo, primeiraCompra. Expansões: usos.

- `id` (string) — campo allowlisted
- `codigo` (string) — campo allowlisted
- `tipo` (string; enum=PERCENTUAL|VALOR_FIXO|FRETE_GRATIS|percentual|valor_fixo|frete_gratis) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `valor` (string) — Percentual quando tipo=PERCENTUAL; BRL quando tipo=VALOR_FIXO; sem efeito em FRETE_GRATIS.
- `usoMaximo` (integer; nullable) — campo allowlisted
- `totalUsos` (integer) — campo allowlisted
- `pedidoMinimo` (string) — Valor monetário em BRL.
- `validade` (string; nullable) — campo allowlisted
- `ativo` (boolean) — campo allowlisted
- `descricao` (string; nullable) — campo allowlisted
- `primeiraCompra` (boolean) — campo allowlisted
- `produtoIds` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `cupons-usos`

Escopo: `read:pedidos`. Filtros: cupomId, clienteId, pedidoId, emailCliente. Expansões: cupom, cliente.

- `id` (string) — campo allowlisted
- `cupomId` (string) — campo allowlisted
- `clienteId` (string; nullable) — campo allowlisted
- `pedidoId` (string; nullable) — campo allowlisted
- `emailCliente` (string; nullable) — campo allowlisted
- `nomeCliente` (string; nullable) — campo allowlisted
- `valorDesconto` (string) — Valor monetário em BRL.
- `valorPedido` (string) — Valor monetário em BRL.
- `usadoEm` (string) — campo allowlisted

### `carrinhos-clientes`

Escopo: `read:pedidos`. Filtros: clienteId, status, etapaAtual. Expansões: cliente.

- `id` (string) — campo allowlisted
- `clienteId` (string) — campo allowlisted
- `itens` (array) — campo allowlisted
- `valorTotal` (string) — Valor monetário em BRL.
- `etapaAtual` (integer) — campo allowlisted
- `status` (string; enum=ativo|convertido|abandonado|recuperado) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `atualizadoEm` (string) — campo allowlisted
- `criadoEm` (string) — campo allowlisted

### `lista-espera`

Escopo: `read:marketing`. Filtros: produtoId, email, notificado. Expansões: produto.

- `id` (string) — campo allowlisted
- `produtoId` (string) — campo allowlisted
- `email` (string) — campo allowlisted
- `notificado` (boolean) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `campanhas`

Escopo: `read:marketing`. Filtros: tipo, status, whatsappNumeroId, produtoDestaqueId, cupomId, canal. Expansões: whatsappNumero, destinatarios.

- `id` (string) — campo allowlisted
- `tipo` (string; enum=promocional|sazonal|recuperacao|aniversario|lancamento|reengajamento|EMAIL|WHATSAPP) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `nome` (string) — campo allowlisted
- `assunto` (string; nullable) — campo allowlisted
- `mensagem` (string) — campo allowlisted
- `status` (string; enum=rascunho|agendada|enviando|enviada|pausada|cancelada|erro|RASCUNHO|AGENDADA|ENVIANDO|ENVIADA|PAUSADA|CANCELADA|ERRO) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `agendadoPara` (string; nullable) — campo allowlisted
- `enviadaEm` (string; nullable) — campo allowlisted
- `totalDestinatarios` (integer) — campo allowlisted
- `totalEnviados` (integer) — campo allowlisted
- `totalErros` (integer) — campo allowlisted
- `taxaAbertura` (number) — campo allowlisted
- `filtroSegmento` (object; nullable) — campo allowlisted
- `whatsappNumeroId` (string; nullable) — campo allowlisted
- `publicoAlvo` (object; nullable) — campo allowlisted
- `tituloCopy` (string; nullable) — campo allowlisted
- `corpoCopy` (string; nullable) — campo allowlisted
- `ctaTexto` (string; nullable) — campo allowlisted
- `ctaUrl` (string; nullable) — campo allowlisted
- `produtoDestaqueId` (string; nullable) — campo allowlisted
- `cupomId` (string; nullable) — campo allowlisted
- `canais` (array; nullable) — campo allowlisted
- `emailAssunto` (string; nullable) — campo allowlisted
- `whatsappTexto` (string; nullable) — campo allowlisted
- `dataAgendamento` (string; nullable) — campo allowlisted
- `totalAlvo` (integer) — campo allowlisted
- `totalAbertos` (integer) — campo allowlisted
- `totalCliques` (integer) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `campanhas-destinatarios`

Escopo: `read:marketing`. Filtros: campanhaId, clienteId, email, telefone, status. Expansões: campanha, cliente.

- `id` (string) — campo allowlisted
- `campanhaId` (string) — campo allowlisted
- `clienteId` (string; nullable) — campo allowlisted
- `nome` (string) — campo allowlisted
- `email` (string; nullable) — campo allowlisted
- `telefone` (string; nullable) — campo allowlisted
- `status` (string; enum=PENDENTE|ENVIADO|ERRO|ABERTO|CLICADO|pendente|enviado|erro|aberto|clicado) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `enviadoEm` (string; nullable) — campo allowlisted
- `erroMsg` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `whatsapp-numeros`

Escopo: `read:configuracoes`. Filtros: ativo, status, ehPadrao. Expansões: campanhas.

- `id` (string) — campo allowlisted
- `nome` (string) — campo allowlisted
- `numero` (string) — campo allowlisted
- `ativo` (boolean) — campo allowlisted
- `status` (string; enum=DESCONECTADO|CONECTADO|CONECTANDO|ERRO|desconectado|conectado|conectando|erro) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `ehPadrao` (boolean) — campo allowlisted
- `totalEnviados` (integer) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `envios-logs`

Escopo: `read:marketing`. Filtros: campanhaId, tipo, destinatario, status, canal. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `campanhaId` (string; nullable) — campo allowlisted
- `tipo` (string; enum=EMAIL|WHATSAPP|email|whatsapp) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `destinatario` (string) — campo allowlisted
- `status` (string; enum=ENVIADO|ERRO|enviado|erro|pendente|PENDENTE) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `erroMsg` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `luna-conversas`

Escopo: `read:mensagens`. Filtros: conversaId, sessaoId, clienteId, status, leadGerado, produtoInteresse. Expansões: mensagens.

- `id` (string) — campo allowlisted
- `sessaoId` (string) — campo allowlisted
- `paginaOrigem` (string; nullable) — campo allowlisted
- `userAgent` (string; nullable) — campo allowlisted
- `ip` (string; nullable) — campo allowlisted
- `clienteId` (string; nullable) — campo allowlisted
- `status` (string; enum=ativa|encerrada|transferida|abandonada) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `totalMensagens` (integer) — campo allowlisted
- `primeiraMensagem` (string; nullable) — campo allowlisted
- `ultimaMensagem` (string; nullable) — campo allowlisted
- `duracaoSegundos` (integer; nullable) — campo allowlisted
- `leadGerado` (boolean) — campo allowlisted
- `produtoInteresse` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `luna-mensagens`

Escopo: `read:mensagens`. Filtros: conversaId, role. Expansões: conversa.

- `id` (string) — campo allowlisted
- `conversaId` (string) — campo allowlisted
- `role` (string; enum=user|assistant|system|tool) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `conteudo` (string) — campo allowlisted
- `tokens` (integer; nullable) — campo allowlisted
- `latenciaMs` (integer; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `solicitacoes-parceiros`

Escopo: `read:marketing`. Filtros: tipo, status, email, telefone, cpf, cnpj, uf, cidade, segmento. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `tipo` (string; enum=pj|pf) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `nome` (string) — campo allowlisted
- `email` (string) — campo allowlisted
- `telefone` (string) — campo allowlisted
- `cpf` (string; nullable) — campo allowlisted
- `cnpj` (string; nullable) — campo allowlisted
- `razaoSocial` (string; nullable) — campo allowlisted
- `nomeFantasia` (string; nullable) — campo allowlisted
- `cidade` (string; nullable) — campo allowlisted
- `estado` (string; nullable) — campo allowlisted
- `cep` (string; nullable) — campo allowlisted
- `endereco` (string; nullable) — campo allowlisted
- `segmento` (string; nullable; enum=Varejo|Atacado|E-commerce|Distribuidor|Outro) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `mensagem` (string; nullable) — campo allowlisted
- `status` (string; enum=novo|em_analise|aprovado|recusado) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `mensagens-contato`

Escopo: `read:mensagens`. Filtros: status, email, telefone, assunto. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `nome` (string) — campo allowlisted
- `email` (string) — campo allowlisted
- `telefone` (string; nullable) — campo allowlisted
- `assunto` (string) — campo allowlisted
- `mensagem` (string) — campo allowlisted
- `status` (string; enum=novo|lido|respondido|arquivado) — Valores conhecidos; caixa legada preservada. Valores desconhecidos continuam strings e são auditados no rollout.
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `cookies-consentimentos`

Escopo: `read:analytics`. Filtros: sessionId, aceitou. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `sessionId` (string) — campo allowlisted
- `ip` (string; nullable) — campo allowlisted
- `userAgent` (string; nullable) — campo allowlisted
- `aceitou` (boolean) — campo allowlisted
- `categorias` (string) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `eventos-analiticos`

Escopo: `read:analytics`. Filtros: sessionId, userId, tipo. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `sessionId` (string) — campo allowlisted
- `userId` (string; nullable) — campo allowlisted
- `tipo` (string) — campo allowlisted
- `dados` (string) — campo allowlisted
- `pagina` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `clientes-insights`

Escopo: `read:analytics`. Filtros: sessionId, userId, dispositivo, fonte. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `sessionId` (string) — campo allowlisted
- `userId` (string; nullable) — campo allowlisted
- `primeiraVisita` (string) — campo allowlisted
- `ultimaVisita` (string) — campo allowlisted
- `totalVisitas` (integer) — campo allowlisted
- `totalPaginas` (integer) — campo allowlisted
- `carrinhosAbertos` (integer) — campo allowlisted
- `comprasFeitas` (integer) — campo allowlisted
- `totalGasto` (string) — campo allowlisted
- `produtosVistos` (string) — campo allowlisted
- `buscas` (string) — campo allowlisted
- `dispositivo` (string; nullable) — campo allowlisted
- `cidade` (string; nullable) — campo allowlisted
- `fonte` (string; nullable) — campo allowlisted
- `cookieCategs` (string) — campo allowlisted

### `sessoes-visitantes`

Escopo: `read:analytics`. Filtros: sessaoId, userId, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, dispositivo, browser, os, pais, converteu. Expansões: eventos.

- `id` (string) — campo allowlisted
- `sessaoId` (string) — campo allowlisted
- `userId` (string; nullable) — campo allowlisted
- `ip` (string; nullable) — campo allowlisted
- `pais` (string; nullable) — campo allowlisted
- `cidade` (string; nullable) — campo allowlisted
- `userAgent` (string; nullable) — campo allowlisted
- `dispositivo` (string; nullable) — campo allowlisted
- `browser` (string; nullable) — campo allowlisted
- `os` (string; nullable) — campo allowlisted
- `utmSource` (string; nullable) — campo allowlisted
- `utmMedium` (string; nullable) — campo allowlisted
- `utmCampaign` (string; nullable) — campo allowlisted
- `utmContent` (string; nullable) — campo allowlisted
- `utmTerm` (string; nullable) — campo allowlisted
- `gclid` (string; nullable) — campo allowlisted
- `gbraid` (string; nullable) — campo allowlisted
- `wbraid` (string; nullable) — campo allowlisted
- `referer` (string; nullable) — campo allowlisted
- `landingPage` (string; nullable) — campo allowlisted
- `totalPaginas` (integer) — campo allowlisted
- `duracaoSegundos` (integer) — campo allowlisted
- `converteu` (boolean) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `eventos-tracking`

Escopo: `read:analytics`. Filtros: sessaoId, tipo, produtoId, produtoSlug. Expansões: sessao.

- `id` (string) — campo allowlisted
- `sessaoId` (string) — campo allowlisted
- `tipo` (string) — campo allowlisted
- `pagina` (string; nullable) — campo allowlisted
- `produtoId` (string; nullable) — campo allowlisted
- `produtoSlug` (string; nullable) — campo allowlisted
- `valor` (string; nullable) — campo allowlisted
- `dados` (object; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `relatorios-venda-hora`

Escopo: `read:analytics`. Filtros: hora, diaSemana. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `data` (string) — campo allowlisted
- `hora` (integer) — campo allowlisted
- `diaSemana` (integer) — campo allowlisted
- `totalPedidos` (integer) — campo allowlisted
- `totalReceita` (string) — campo allowlisted
- `totalItens` (integer) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `tentativas-login`

Escopo: `read:auditoria`. Filtros: ip, sucesso, rota. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `ip` (string) — campo allowlisted
- `userAgent` (string; nullable) — campo allowlisted
- `sucesso` (boolean) — campo allowlisted
- `rota` (string) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `bloqueios-ip`

Escopo: `read:auditoria`. Filtros: ip. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `ip` (string) — campo allowlisted
- `motivo` (string) — campo allowlisted
- `bloqueadoAte` (string) — campo allowlisted
- `createdAt` (string) — campo allowlisted
- `updatedAt` (string) — campo allowlisted

### `auditoria`

Escopo: `read:auditoria`. Filtros: actor, action, target. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `actor` (string) — campo allowlisted
- `action` (string) — campo allowlisted
- `target` (string; nullable) — campo allowlisted
- `metadata` (object; nullable) — campo allowlisted
- `ip` (string; nullable) — campo allowlisted
- `userAgent` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `presencas`

Escopo: `read:analytics`. Filtros: sessaoId, dispositivo. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `sessaoId` (string) — campo allowlisted
- `path` (string; nullable) — campo allowlisted
- `dispositivo` (string; nullable) — campo allowlisted
- `ultimoPing` (string) — campo allowlisted

### `trafego-bruto`

Escopo: `read:analytics`. Filtros: dispositivo, browser, os, pais, path, referrer, hora. Expansões: nenhum.

- `id` (string) — campo allowlisted
- `dia` (string) — campo allowlisted
- `hora` (integer) — campo allowlisted
- `path` (string) — campo allowlisted
- `dispositivo` (string; nullable) — campo allowlisted
- `browser` (string; nullable) — campo allowlisted
- `os` (string; nullable) — campo allowlisted
- `pais` (string; nullable) — campo allowlisted
- `referrer` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted

### `bloqueios-fraude`

Escopo: `read:auditoria`. Filtros: clienteId, acao. Expansões: cliente.

- `id` (string) — campo allowlisted
- `clienteId` (string) — campo allowlisted
- `acao` (string; enum=bloqueio|desbloqueio) — Valores conhecidos; valores desconhecidos permanecem strings e são auditados no rollout.
- `motivo` (string) — campo allowlisted
- `criadoPor` (string; nullable) — campo allowlisted
- `createdAt` (string) — campo allowlisted

## Métricas (8)

### `vendas`

Escopo: `read:financeiro`. Janela cronológica obrigatória, sem duração máxima. Fuso civil: `America/Sao_Paulo`.

- Pedidos pagos = status pago, enviado ou entregue no período BRT.
- Receita bruta = Σ(preço unitário × quantidade) + garantias pagas.
- Receita líquida comercial = Σ(Pedido.total). Lucro conhecido fica null se algum custo necessário estiver ausente.
- Atribuição correlaciona purchase por transaction_id com lookahead de 7 dias; click-id bruto nunca é exposto.

### `funil`

Escopo: `read:analytics`. Janela cronológica obrigatória, sem duração máxima. Fuso civil: `America/Sao_Paulo`.

- Sessões tracked distintas por bucket: sessão → view_item → add_to_cart → begin_checkout → pagamento_submit → purchase.
- Abandono comercial: checkout sem compra e sem erro técnico, inativo por pelo menos 1 hora.
- Abandono técnico: rejected, api_error ou brick_error; cobertura depende de consentimento analítico.

### `carrinhos`

Escopo: `read:analytics`. Janela cronológica obrigatória, sem duração máxima. Fuso civil: `America/Sao_Paulo`.

- Carrinhos persistentes atualizados no período; abandono comercial exige carrinho ativo, itens e inatividade de 1 hora.
- checkoutTracked usa somente eventos consentidos.

### `cupons-cashback-fidelidade`

Escopo: `read:financeiro`. Janela cronológica obrigatória, sem duração máxima. Fuso civil: `America/Sao_Paulo`.

- Cupons usam CupomUso.usadoEm; cashback ignora movimentos cancelados; fidelidade é snapshot atual por faixa inclusiva.

### `frete`

Escopo: `read:financeiro`. Janela cronológica obrigatória, sem duração máxima. Fuso civil: `America/Sao_Paulo`.

- Seleções vêm de add_shipping_info consentido e representam valor do carrinho.
- Pedidos pagos usam frete cobrado; custo real desconhecido permanece null; prazo é média simples em dias úteis.

### `avaliacoes`

Escopo: `read:analytics`. Janela cronológica obrigatória, sem duração máxima. Fuso civil: `America/Sao_Paulo`.

- Período por Avaliacao.createdAt; média = Σ(nota) ÷ quantidade. Conteúdo de comentário/resposta não é selecionado.

### `estoque-catalogo`

Escopo: `read:analytics`. Janela cronológica obrigatória, sem duração máxima. Fuso civil: `America/Sao_Paulo`.

- Snapshot atual sem série histórica; variações ativas substituem estoque do produto.
- Valor de venda = unidades × preço efetivo; não usa custo interno.

### `clientes`

Escopo: `read:financeiro`. Janela cronológica obrigatória, sem duração máxima. Fuso civil: `America/Sao_Paulo`.

- Comprador é cliente distinto com pedido pago/enviado/entregue.
- Novo tem primeiro pedido pago no período; LTV médio usa todo o histórico pago dos compradores do período.

## Versionamento e changelog

Versão inicial `v1`: contrato aditivo. Remoções ou mudanças incompatíveis exigem nova versão de URL. ETag foi adiado porque `no-store` é obrigatório. Tabelas técnicas de chave/auditoria não são recursos de negócio e ficam fora do catálogo.
