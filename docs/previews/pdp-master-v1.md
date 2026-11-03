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

## Fonte admitida

Pacote do Jarvis Artes:

`/home/pzxx1010/.openclaw/agents/artes/workspace/output/sixxis-pdp-master-standard-v1-2026-11-02`

Manifesto original: **17/17 OK** em 2026-11-02.

O preview preserva somente:

1. frontal oficial do SX120 Prime Branco;
2. controles oficiais;
3. reservatório oficial.

Não contém SX100, variante preta simulada, recoloração ou mídia gerada por IA.

## Mapa para integração definitiva

| Bloco candidato | Destino no app | Regra de integração |
| --- | --- | --- |
| Galeria e zoom | `ProdutoGaleriaInfo` / `GaleriaCB` | Reusar dados reais e troca por variação; não duplicar estado. |
| Oferta e variação | `InfoProdutoCB` | Preservar preço, estoque, analytics e variação obrigatória. Voltagem nunca pré-selecionada. |
| Frete | `CalcFrete` | Usar a API real existente; remover resposta demonstrativa do protótipo. |
| Carrinho/checkout | store atual + `InfoProdutoCB` | Manter `variacaoId` obrigatório nas duas ações. |
| Métricas e capítulos | novos componentes orientados a dados | Só publicar valores presentes no catálogo/ficha oficial do SKU. |
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
