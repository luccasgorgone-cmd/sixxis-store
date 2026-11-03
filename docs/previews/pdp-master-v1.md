# Sixxis PDP Master V1 — preview de integração

## Estado

- **Candidato visual:** admitido para preview/staging.
- **Produção:** bloqueada até confirmação final direta do Luccas.
- **Expansão para outros SKUs:** não iniciada.
- **Catálogo/R2/banco:** nenhuma escrita.

## Rota

`/preview/pdp-master-v1`

- Em desenvolvimento, a rota fica disponível automaticamente.
- Em builds com `NODE_ENV=production`, retorna `404` por padrão.
- Para um ambiente de staging dedicado, definir `ENABLE_PDP_MASTER_PREVIEW=true`.
- A página declara `noindex`, `nofollow` e `nocache`.

O protótipo roda dentro de um `iframe` com
`sandbox="allow-scripts allow-modals allow-forms"`. `allow-forms` é necessário para
que o submit demonstrativo do CEP dispare; o próprio script cancela a navegação.
CSS, JavaScript, fonte e imagens são incorporados no `srcDoc`; nenhum arquivo do pacote
fica publicamente acessível por uma rota estática separada.

Evidência visual local:

- [`pdp-master-v1-desktop.png`](./pdp-master-v1-desktop.png) — 1440 × 900.
- [`pdp-master-v1-mobile.png`](./pdp-master-v1-mobile.png) — 390 × 844.
- [`pdp-master-v1-editorial-desktop.png`](./pdp-master-v1-editorial-desktop.png) — capítulo 4:5 completo em desktop.
- [`pdp-master-v1-editorial-mobile.png`](./pdp-master-v1-editorial-mobile.png) — capítulo 4:5 completo em mobile.

As duas capturas editoriais foram feitas no protótipo estático equivalente, sem o overlay
de diagnóstico do Next. O route preview integrado foi validado separadamente no Next.

## Fonte admitida

Pacote do Jarvis Artes:

`/home/pzxx1010/.openclaw/agents/artes/workspace/output/sixxis-pdp-master-standard-v1-2026-11-02`

Manifesto original: **17/17 OK** em 2026-11-02.

O preview preserva na galeria:

1. frontal oficial do SX120 Prime Branco;
2. controles oficiais;
3. reservatório oficial.

Também incorpora, em um capítulo editorial separado e sem crop, as 6 peças 4:5
READY-INTERNAL derivadas dos vídeos reais: hero, traseira/3⁄4, abastecimento,
painel, contexto com apresentador e fluxo/9 velocidades.

Não contém SX100, SX180, variante preta simulada, recoloração ou mídia gerada por IA.

## Mapa para integração definitiva

| Bloco candidato | Destino no app | Regra de integração |
| --- | --- | --- |
| Galeria e zoom | `ProdutoGaleriaInfo` / `GaleriaCB` | Reusar dados reais e troca por variação; não duplicar estado. |
| Oferta e variação | `InfoProdutoCB` | Preservar preço, estoque, analytics e variação obrigatória. Voltagem nunca pré-selecionada. |
| Frete | `CalcFrete` | Usar a API real existente; remover resposta demonstrativa do protótipo. |
| Carrinho/checkout | store atual + `InfoProdutoCB` | Manter `variacaoId` obrigatório nas duas ações. |
| Métricas e capítulos | novos componentes orientados a dados | Só publicar valores presentes no catálogo/ficha oficial do SKU. |
| Capítulo editorial 4:5 | bloco próprio após detalhes | Preservar as 6 peças em 1080×1350, sem crop; não misturar com a galeria 1:1. |
| Cobertura contextual | componente por categoria | Climatizador usa área; outras categorias exigem ferramenta própria. |
| Especificações | `SpecsExpandiveis` / dados da PDP | Renderizar a fonte real; sem hardcode por produto. |
| Avaliação | agregação Prisma atual | Nunca inventar depoimentos ou contagens. |

## Limite desta etapa

O iframe é deliberado: entrega revisão fiel e isolada sem acoplar o protótipo candidato ao
fluxo comercial antes da escolha oficial. Após aprovação, a implementação definitiva deve
substituí-lo por componentes React conectados aos dados e serviços reais da PDP.

O teste `preview-document.test.ts` impede regressão do adaptador: CSS, JavaScript, fonte e
imagens precisam estar incorporados, e nenhum caminho relativo `assets/` pode sobreviver no
documento final.

## Plano de mudança e rollback

1. Aprovar esta composição desktop/mobile antes de qualquer deploy.
2. Na integração real, manter os 3 JPGs canônicos como galeria e publicar as 6 editoriais
   em um bloco de conteúdo específico do SX120 Prime Branco.
3. Fazer rollout somente do SKU CLIM-SX120-PRIME, sem criar variante Preto.
4. Validar PDP desktop/mobile, zoom, seleção obrigatória 220V, OG, JSON-LD e feed.
5. Rollback: reverter o commit do bloco editorial; os 3 assets canônicos e o catálogo
   atual permanecem intactos. Não excluir objetos R2 durante o rollout.
