# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary audiences:
- **Consumidores finais (PF e PJ)** navegando e comprando climatizadores evaporativos, aspiradores e bicicletas de spinning direto em sixxis.com.br — de casa, no navegador, decidindo uma compra de eletrodoméstico/fitness de ticket médio.
- **Luccas (dono/operador)**, via painel admin (`adm-a7f9c2b4`): gerencia pedidos, produtos, estoque, emissão de NF-e, frete, cupons e relatórios.
- **Sistemas irmãos** (CRM de atendimento WhatsApp, ERP em retomada) consomem a Loja como fonte de dados via rotas internas autenticadas — não são usuários visuais, mas consumidores de API.

*Inferido do código e do briefing técnico do projeto, não confirmado em entrevista direta com o usuário (rodada de interview pulada por instrução explícita para não bloquear — ver nota no fim do documento).*

## Product Purpose

E-commerce próprio da Sixxis: vender ao consumidor final climatizadores evaporativos, aspiradores e bicicletas de spinning, cobrindo o ciclo completo — catálogo, carrinho, checkout (Pix/cartão via Mercado Pago), emissão de nota fiscal, pós-venda e um painel administrativo de gestão. Sucesso = pedido pago, corretamente configurado (variação certa) e faturado.

## Positioning

Não há uma claim de posicionamento de mercado documentada ou verbalizada em algum lugar do código/briefing (nenhuma copy de "por que Sixxis e não um concorrente" foi encontrada). O que é verificável e diferenciador na *operação*, não necessariamente comunicado ao visitante hoje:
- Disciplina de segurança na venda de variação (voltagem 110V/220V nunca pré-selecionada — evita o cliente receber o produto errado e queimar o aparelho).
- Garantia de fábrica declarada (12 meses, usado como fallback de descrição de produto no feed).
- Frete cotado por UF (Braspress/Melhor Envio), não flat-rate genérico.

**Pendência marcada, não inventada:** não crio aqui uma proposta de valor/mecanismo de mercado — isso precisa vir do Luccas quando ele quiser fechar esse campo.

## Operating Context

- Vitrine pública: navegação por categoria (climatizadores/aspiradores/spinning), página de produto com variações (voltagem/cor), carrinho, checkout PF/PJ (CPF ou CNPJ+IE).
- Pagamento: Mercado Pago (Bricks) — Pix, cartão de crédito/débito; checkout multi-método (dois cartões, Pix+cartão) em desenvolvimento recente.
- Pós-venda: emissão de NF-e via Focus NFe (hoje só em **homologação**, não produção — pendente aval da contadora sobre CSOSN 500 do climatizador-PJ fora de SP), rastreio, garantia.
- Painel admin: gestão de pedidos/produtos/estoque/cupons/fidelidade/frete/campanhas/relatórios/auditoria.
- Integração com o ecossistema: Loja empurra contato pro CRM (WhatsApp); CRM consulta pedidos por telefone pra fechar "Ganho" no kanban; ERP ainda não integrado (envs já preparadas).
- Deploy: push em `main` → Railway builda e aplica migração automaticamente (sem staging separado visível no código).

## Capabilities and Constraints

- 3 linhas de produto fixas: climatizadores evaporativos, aspiradores, bicicletas de spinning.
- Produto com variações (`temVariacoes=true`) não pode ser vendido sem `variacaoId` — validado no front E no servidor. **Voltagem nunca vem pré-selecionada** (regra crítica de segurança do produto físico); cor pode vir pré-selecionada.
- Checkout PF e PJ, com regras fiscais distintas por indicador de IE.
- Fiscal: matriz NCM/CFOP/CSOSN por categoria × UF × indicador de IE; nota real de climatizador-PJ fora de SP bloqueada até confirmação contábil.
- Sem suíte de testes automatizada — validação hoje é manual/ao vivo em produção.
- Stack já documentado no briefing técnico do projeto (Next.js 16 + React 19, Prisma/MySQL, Mercado Pago, Focus NFe, Cloudflare R2) — não repetido aqui.

## Brand Commitments

- Nome: **Sixxis** (razão social: SIXXIS - IMPORTAÇÃO, EXPORTAÇÃO E COMÉRCIO LTDA).
- Logo existente em `public/logo-sixxis.png` (+ variante sem fundo/sem "Brasil").
- Cor de marca em uso hoje no código: teal/tiffany `#3cbfb3` (com variações `-dark`/`-medium`/`-deep`/`-light`/`-soft`) como cor primária; preto `#0a0a0a` e cinzas neutros como base; laranja `#f59e0b` como cor de destaque/promoção.
- Tipografia em uso: Inter + Poppins (`next/font/google`), reduzida recentemente de 7 fontes pra 2.
- Nenhuma diretriz de voz/tom escrita foi encontrada — o que existe hoje é o que está implementado no código, sem documento de brand separado.

*Estas são leituras do código (evidência), não confirmações verbais do Luccas sobre o que é intencional vs. incidental na marca.*

## Evidence on Hand

- Catálogo real: 14 produtos ativos confirmados via Google Merchant Center (checado nesta sessão).
- Modelo de dados para avaliações de cliente existe (`Avaliacao`/`AvaliacaoFoto`/`AvaliacaoParceiro`) — infraestrutura pronta, mas conteúdo real (quantidade, nota média) não foi verificado nesta passada.
- **Não fabricar**: nenhum testimonial, benchmark, case de cliente ou número de vendas foi confirmado além do que está no banco — não inventar prova social específica sem checar o dado real.

## Product Principles

1. Segurança do produto físico vem antes de conveniência de UI — nunca pré-selecionar voltagem, mesmo que isso adicione um clique ao checkout.
2. A Loja é a fonte de verdade de catálogo, pedido, pagamento, estoque e fiscal-do-site pro ecossistema Sixxis (CRM é fonte de verdade de atendimento/lead) — decisões de dado devem respeitar essa fronteira.
3. Cobertura nacional com frete tarifado por estado, não uma promessa genérica de frete único.
4. Disciplina fiscal: não emitir nota real fora do que já foi validado com a contadora, mesmo sob pressão de lançar rápido.
5. Cultura de validação manual/ao vivo (sem suíte automatizada) — mudanças em produção são conferidas contra comportamento real, não só contra teste local.

---

**Nota de proveniência:** esta rodada de `init` foi feita por instrução explícita (via sessão `main`, repassando decisão do Luccas) para não bloquear numa entrevista interativa — os fatos acima vêm do briefing técnico do projeto (`briefing-tecnico-sixxis-store.md`) e de leitura direta do código nesta sessão, não de uma confirmação verbal campo a campo. Marcados como pendência explícita: **Positioning** (mecanismo de diferenciação de mercado) e a intencionalidade da paleta/tipografia atual (evidência de código, não confirmação de marca). Revisar com o Luccas quando ele tiver tempo.
