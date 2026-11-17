# Sixxis Store — revisão diferencial da API de leitura v1

Data: 2026-11-17  
Branch: `feat/api-leitura-v1`  
Base revisada: `4fbc3fa`  
Escopo: 69 arquivos, 62.270 adições e 266 remoções, incluindo artefatos OpenAPI gerados.

## Resumo executivo

A mudança introduz uma API HTTP somente leitura, autenticada por chaves com escopos, paginação opaca, auditoria, limites distribuídos, catálogo de 49 recursos e métricas agregadas. O maior risco está na nova superfície pública e no volume de dados acessível; por isso a revisão concentrou-se em autorização, vazamento de PII/segredos, amplificação de consultas, integridade financeira e segurança operacional.

A primeira revisão independente encontrou dois bloqueadores — escrita ilimitada de auditoria em respostas 401 e filtros de PII acessíveis sem `read:pii` — além de oito problemas importantes de disponibilidade, documentação e tracking. Todos foram confirmados no código e receberam controles e testes de regressão. Os gates locais finais estão verdes; a aprovação de rollout ainda depende do parecer adversarial independente final e do smoke após deploy.

## Mudanças e blast radius

- Novas rotas públicas: `/api/v1`, `/api/v1/*`, `/api/tracking` endurecida.
- Novas tabelas técnicas: chaves, auditoria e metadados de leitura; migrações estritamente aditivas.
- Novo registry de 49 recursos com selectors Prisma nominais e serializers allowlist.
- Oito famílias de métricas com janelas temporais e limites de linhas.
- Scripts operacionais de geração/revogação de chave e geração de documentação.
- Consumidores diretos alterados ficam concentrados no router da API v1 e no endpoint de tracking; checkout, pagamento e emissão fiscal não foram modificados.

## Achados bloqueadores resolvidos

### 1. Amplificação de escrita por 401

**Risco anterior:** cada bearer inválido provocava insert de auditoria antes de qualquer limite por chave, permitindo saturar o pool e crescer a tabela indefinidamente.

**Correção:** limite distribuído por IP ocorre antes da autenticação (`src/lib/api-v1/pipeline.ts`); respostas sem identidade e respostas 429 não escrevem auditoria nem atualizam `lastUsed`. O limite falha fechado quando o backend distribuído está indisponível.

**Cobertura:** `src/lib/api-v1/pipeline.test.ts` prova ordem pre-auth, ausência de escrita em 401 e ausência de escrita em 429.

### 2. Oráculo de PII por filtros e busca

**Risco anterior:** uma chave sem `read:pii` podia inferir existência de email, CPF, CNPJ, IP ou ator pelo número de resultados.

**Correção:** filtros aceitam `scope`, recursos aceitam `searchScope`, e a validação ocorre antes da consulta Prisma (`src/lib/api-v1/query.ts`, `src/lib/api-v1/resource.ts`). Campos sensíveis dos registries de clientes, analytics, marketing e vendas foram classificados com `read:pii`.

**Cobertura:** `resource.test.ts` e testes específicos dos registries exercitam negação sem scope e sucesso com scope aditivo.

## Achados importantes resolvidos

1. **Métricas caras:** orçamento máximo de 5.000 linhas, paginação limitada, quota distribuída dedicada de 10 requisições/minuto/chave e drenagem das operações iniciadas antes da resposta. Atribuição financeira usa somente pedidos pagos autoritativos.
2. **`/meta/recursos`:** resultados e promessas concorrentes são compartilhados por registry/escopos por 60 segundos, eliminando 98 queries por chamada repetida.
3. **Endpoints públicos:** health tem cache/collapse de 5 segundos; OpenAPI e docs são artefatos estáticos em memória; todos passam por limite de ingresso por IP.
4. **CLI de chave:** `--output` é obrigatório, arquivo exclusivo `0600`, `fsync` precede persistência do hash, falhas removem o arquivo e não deixam chave ativa no banco; token bruto não vai para stdout.
5. **Kit de sync:** usa contrato por recurso publicado em metadados, janela finita `from/to`, relógio e sort corretos, limite máximo 500 e cursor opaco.
6. **Docs interativas:** removido script CDN mutável e entrada de bearer no browser; página estática possui CSP.
7. **Tracking:** schema estrito por evento, corpo máximo 16 KiB, coerência cookie/sessão, limite por IP, compra validada contra pedido pago e deduplicada. Eventos do cliente não atualizam mais agregados financeiros autoritativos.
8. **Erros OpenAPI:** query inválida retorna 400 antes da geração do documento.

## Controles preservados

- `read:all` não implica `read:pii` nem `read:mensagens`.
- Chaves são armazenadas somente como SHA-256 e comparadas em tempo constante.
- Cursores usam AES-256-GCM e são vinculados a recurso, ordenação e filtros.
- Rotas aceitam somente leitura; 405 ocorre antes de autenticação, auditoria e Prisma.
- Selectors e serializers são nominais; segredos, hashes, PAN e payloads de gateway permanecem fora da superfície mesmo com todos os escopos.
- Migrações revisadas contêm apenas criação/alteração aditiva de tabelas, colunas e índices.

## Verificação local

- `npm test`: **46 arquivos, 932 testes passaram**.
- `npx tsc --noEmit`: passou.
- ESLint focal de API, tracking, scripts, docs e rate limit: passou.
- `git diff --check`: passou.
- `npx prisma migrate deploy` contra MariaDB 11 limpo: 34/34 migrações aplicadas.
- `npm run build` com banco local e segredos descartáveis: passou; os quatro warnings de `instrumentation.ts`/Edge Runtime são preexistentes e não bloqueantes.
- Revisão independente final: em andamento no momento deste registro; deve ser incorporada antes do merge.

## Riscos residuais e limitações

- Não houve `EXPLAIN` nem teste de carga com cardinalidade de produção; os orçamentos de linhas e quotas limitam dano, mas não substituem observação pós-deploy.
- O timeout da aplicação não cancela uma query já enviada ao banco; ele aguarda/drena trabalho já iniciado dentro dos limites definidos.
- Retenção automática da auditoria não foi adicionada nesta entrega; crescimento agora é limitado a identidades autenticadas e requisições não-429, mas precisa de política operacional futura.
- Limite por IP confia nos headers do proxy da plataforma; restrição do origin e WAF continuam recomendações de infraestrutura.
- Logs Railway, performance real e consumidores externos só podem ser verificados após deploy.

## Recomendação

**Condicional antes do merge.** Integrar somente se a revisão adversarial final não encontrar novo bloqueador e todos os gates forem repetidos no estado exato do commit. Após merge, exigir health, contrato público, 401/400/405 e headers em produção, além de inspeção de logs do deployment quando o conector Railway estiver disponível.
