# SX200 Trend e Lotes Black Friday Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar as novas regras do SX200 Trend, comunicar o cupom no header e mostrar lotes BF auditáveis e elegantes.

**Architecture:** Regras puras e centralizadas para promoção, cupom, entrega e lotes; consultas server-side agregam apenas pedidos pagos. Os componentes recebem dados serializáveis e não consultam banco no cliente.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma/MySQL, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-27-sx200-trend-e-lotes-bf.md`

## Global Constraints

- Testes primeiro: cada nova regra deve falhar antes da implementação.
- Sem escrita crua em produção; mudança de schema apenas aditiva.
- Voltagem nunca pré-selecionada.
- Cupom e promoção de 50% nunca acumulam; servidor é a autoridade.
- Contadores representam lote promocional real, não vendas simuladas.
- Sem dependências novas.
- QA em desktop, tablet e celular; sem criar pedido ou pagamento real.

## Review Focus

- SKU de variação do SX200 Trend também precisa ser excluído dos 50%.
- Um carrinho com duas unidades deve recusar `BLACKFRIDAY10` mesmo sem promo elegível.
- Pedidos pendentes/cancelados não podem reduzir o lote.
- Sixxis Life precisa separar preta e branca.
- Estoque real menor que o lote precisa limitar o número exibido.

---

### Task 1: Regras comerciais e entrega do SX200 Trend

**Files:**
- Modify: `src/lib/promo-segunda-unidade.ts`
- Modify: `src/lib/promo-segunda-unidade.paridade.test.ts`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261127150000_sx200_trend_regras_comerciais/migration.sql`
- Modify: `src/lib/cupom.ts`
- Modify: `src/lib/cupom-unidade-unica.test.ts`
- Create: `src/lib/produto-disponibilidade.ts`
- Create: `src/lib/produto-disponibilidade.test.ts`

- [ ] Escrever e executar testes RED para exclusão da promoção, cupom e aviso.
- [ ] Implementar a menor mudança para os testes passarem.
- [ ] Atualizar a ressalva textual e o banner BF raster.

### Task 2: Saldos auditáveis do lote BF

**Files:**
- Create: `src/lib/estoque-promocional-bf.ts`
- Create: `src/lib/estoque-promocional-bf.test.ts`
- Create: `src/lib/estoque-promocional-bf.server.ts`
- Modify: `src/types/index.ts`
- Modify: `src/app/api/produtos/route.ts`
- Modify: `src/app/(loja)/page.tsx`
- Modify: `src/app/(loja)/ofertas/page.tsx`
- Modify: `src/app/(loja)/produtos/[slug]/page.tsx`

- [ ] Escrever e executar testes RED para configuração, pagos, limites e Life por cor.
- [ ] Implementar cálculo puro e agregação server-side.
- [ ] Anexar os saldos às respostas e páginas sem waterfalls desnecessários.

### Task 3: Comunicação visual no header, cards, PDP e modal

**Files:**
- Create: `src/components/produto/AvisoUltimasUnidades.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/produto/CardProduto.tsx`
- Modify: `src/components/produto/InfoProdutoCB.tsx`
- Modify: `src/components/produto/ProdutoGaleriaInfo.tsx`
- Modify: `src/components/produto/SelectVariacaoModal.tsx`
- Modify: `src/components/bf/BlocosHome.tsx`

- [ ] Implementar o componente no design Sixxis, acessível e sem animação enganosa.
- [ ] Mostrar cupom e regra de não acumulação no header.
- [ ] Mostrar lote e entrega nos caminhos de card/PDP/modal.

### Task 4: Gates, revisão, publicação e QA

- [ ] Rodar Prisma validate/generate, testes focados, suíte completa, tsc, lint comparativo e build.
- [ ] Fazer revisão independente no HEAD exato e corrigir achados reproduzíveis.
- [ ] Commitar, publicar em `main`, observar Railway e validar produção.
- [ ] Capturar screenshots em 390 px, tablet e desktop; testar carrinho/checkout até antes do pagamento.
- [ ] Registrar receipt e memória, incluindo o que foi e não foi verificado.
