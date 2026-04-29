# Varredura pendente — pós-polimento (branch `polimento-pos-2c`)

Itens que **NÃO foram resolvidos nesta branch** porque dependem de testes ao
vivo (Chrome MCP / sandbox MP) ou ações operacionais (rodar scripts em prod
com backup). Devem ser feitos na próxima sessão.

## Operacional (rodar em prod, com backup)

- [ ] `npx tsx scripts/limpar-secrets-loja.ts` — apaga secrets vazadas no DB.
      **Antes**, garantir que `ANTHROPIC_API_KEY`, `MP_ACCESS_TOKEN`,
      `MP_PUBLIC_KEY`, `MELHORENVIO_TOKEN`, `JADLOG_TOKEN`, `TOTALEXPRESS_TOKEN`,
      `FOCUSNFE_TOKEN`, `MELHORENVIO_SANDBOX_TOKEN`, `MELHORENVIO_PROD_TOKEN`
      estejam definidas como ENV vars no Railway.
- [ ] `npx tsx scripts/limpar-reviews-duplicadas.ts` — remove duplicatas.
- [ ] `npx tsx scripts/seed-reviews-realistas.ts` — gera reviews únicas por
      produto (preserva SX040).
- [ ] `npx tsx scripts/seed-sixxis10.ts` — garante cupom SIXXIS10 no DB.
- [ ] `npx tsx src/scripts/seed-garantia-estendida.ts` — recalcula garantia
      estendida (12% / 20%) com base nos preços atuais.
- [ ] Backup MySQL Railway antes de rodar qualquer um dos scripts acima.

## Validações ao vivo (Chrome MCP / browser)

- [ ] **C2 confirmação**: `/adm-a7f9c2b4/produtos` lista os 10+ produtos.
      A query Prisma já não tem filtro padrão restritivo; a UX agora mostra
      "Carregando..." enquanto o fetch resolve. Se ainda zerar, investigar
      auth cookie ou cold-start Railway.
- [ ] **C10 confirmação**: `/produtos` cliente lista todos os ativos com
      paginação (LIMIT subiu para 24).
- [ ] **M2/M4/M5 confirmação**: `/pagamentos`, `/garantias`, `/auditoria`
      param de carregar dentro de 8s mesmo com Railway frio.
- [ ] **M9**: Confirmar valores reais de garantia +12m / +24m do SX040 via
      query Prisma e ajustar briefing OU rodar seed-garantia-estendida.
- [ ] **M10**: Investigar frete R$ 0,00 — código de fallback retorna valores
      ≥ R$ 28; confirmar se Melhor Envio está retornando preço zero ou se
      é cupom de frete grátis aplicado.
- [ ] **M11**: 1 pedido legado com `metodoPagamento = 'pix'` string.
      Decisão: ignorar (1 registro só) ou criar `scripts/migrar-pedidos-legacy.ts`.
- [ ] **M13**: Validar visualmente que botões "Categoria" e "Preço" em
      `/produtos` abrem dropdown e aplicam filtros via searchParams.

## Sidebar admin (C4-C9)

Já estava limpa antes desta branch — todos os 6 paths apontam para rotas
existentes:

| Antigo path 404 | Atual (existe) |
|---|---|
| `/editor-mobile` | `/mobile` |
| `/editor-minha-conta` | `/minha-conta-editor` |
| `/configuracoes-gerais` | `/configuracoes` |
| `/bloqueios-ip` | `/bloqueios` |
| `/analises` | `/analytics` |
| `/whatsapp` | `/configuracoes/whatsapp` |

Confirmar visualmente clicando em cada item da sidebar.

## Smoke tests sugeridos

- [ ] Login admin → `/adm-a7f9c2b4` → dashboard
- [ ] `/adm-a7f9c2b4/configuracoes-loja` mostra ≤30 chaves, sem
      `anthropic_api_key`, `*_token`, `*_secret`, `*_password*`
- [ ] `/adm-a7f9c2b4/configuracoes` aba Integrações mostra "Configurado via
      variável de ambiente" para MP/ME/Focus
- [ ] `/adm-a7f9c2b4/configuracoes` NÃO tem mais aba "Agente Luna" — o
      card no topo redireciona para `/adm-a7f9c2b4/luna`
- [ ] `/adm-a7f9c2b4/clientes` mostra CPF mascarado
- [ ] `/produtos/sx040` ainda exibe garantia 12m/24m com valores
- [ ] Adicionar produto ao carrinho, aplicar SIXXIS10, ir para checkout

## Footer paths (validar como public)

- [ ] /politica-de-troca, /privacidade, /cookies, /garantia, /sobre, /faq,
      /contato, /seja-revendedor, /ofertas

## Mobile

- [ ] Hamburger menu admin (< lg)
- [ ] Bottom sheet do carrinho
- [ ] Drawer de filtros em /produtos no mobile (375px)

## Sprint 2C residual

- [ ] Loyalty icons em `/clientes` (admin) e `/minha-conta` (cliente)
      usam o mesmo componente `<NivelLoyaltyIcon>` — confirmar visualmente
- [ ] Pop-up cliente: visitante anônimo na home, fechar X, F5, nova aba,
      mobile
- [ ] Cancelar pedido fluxo end-to-end (`/minha-conta/pedidos/[id]` →
      cancelar → janela 48h → estoque devolvido → cupom liberado → email)
