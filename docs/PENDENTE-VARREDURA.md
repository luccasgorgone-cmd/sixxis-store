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
- [ ] **MOB-4**: `npx prisma db push` para criar a coluna nova
      `Banner.imagemMobile` (nullable, sem perda de dados). Depois,
      em `/adm-a7f9c2b4/banners`, fazer upload de um banner mobile (1:1 ou
      4:3) com imagem distinta do wallpaper escuro e CTA visível.
- [ ] **MOB-3**: substituir as URLs hardcoded das 2 imagens 404 da home
      (`1775737122831-k4d1lc1.jpg`, `1775754930452-4ixi773.png`) por imagens
      reais de produtos no R2 OU re-uploadar via /adm-a7f9c2b4/editor-home.
      Enquanto isso, o componente `<CategoriaImagemHero>` exibe ícone
      de fallback (Wind/Bike/Fan).
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

## Mobile (validação dos fixes MOB-1..13)

- [ ] **MOB-1** Tap targets: inspect via DevTools — todos botões qty +/- e
      remover do carrinho devem ter ≥ 44×44px.
- [ ] **MOB-2** Header height ao topo da página: medir via
      `document.querySelector('header').offsetHeight` em viewport 390px.
      Meta ≤ 110px (atual após fix: ~95px scrollado, ~135px no topo).
- [ ] **MOB-3** Validar que as imagens de categoria mostram fallback
      Wind/Bike quando R2 retorna 404 (testar setando URLs quebradas).
- [ ] **MOB-4** Após `prisma db push`, validar upload de imagemMobile
      no admin e que `<picture>` no front troca a imagem em ≤767px.
- [ ] **MOB-5** Em iPhone real, focar inputs de login/checkout/cupom
      e confirmar que NÃO há zoom forçado.
- [ ] **MOB-6** FAB Luna em iPhone com home indicator: confirmar que
      respeita o safe-area inset (não fica atrás da barra).
- [ ] **MOB-7** Bottom nav fixo (4 ícones home/categorias/carrinho/conta)
      ainda não foi implementado — decisão estratégica para próxima sprint.
- [ ] **MOB-8** Ticker do cupom: confirmar fade rotativo a cada 3s.
- [ ] **MOB-9** Galeria de produto: testar swipe esquerda/direita no mobile
      real (handlers nativos onTouchStart/End adicionados).
- [ ] **MOB-10** Cart drawer: 100% width em mobile (≤640px), 420px em ≥640.
- [ ] **MOB-11** Checkout steps: validar visualmente que 5 etapas cabem
      em 390px sem quebrar linha.
- [ ] **MOB-12** Lighthouse Performance Mobile: deve subir após reduzir
      de 7 para 2 fontes. Meta ≥ 70.
- [ ] **MOB-13** Lazy load: já estava OK, validar que apenas hero/primeiros
      3 cards têm `priority`.
- [ ] Hamburger menu admin (< lg)
- [ ] Drawer de filtros em /produtos no mobile (375px)

## Sprint 2C residual

- [ ] Loyalty icons em `/clientes` (admin) e `/minha-conta` (cliente)
      usam o mesmo componente `<NivelLoyaltyIcon>` — confirmar visualmente
- [ ] Pop-up cliente: visitante anônimo na home, fechar X, F5, nova aba,
      mobile
- [ ] Cancelar pedido fluxo end-to-end (`/minha-conta/pedidos/[id]` →
      cancelar → janela 48h → estoque devolvido → cupom liberado → email)
