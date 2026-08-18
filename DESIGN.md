---
name: Sixxis Store
description: E-commerce da Sixxis para climatizadores, aspiradores e bikes de spinning
colors:
  tiffany: "#3cbfb3"
  tiffany-dark: "#2a9d8f"
  tiffany-medium: "#1a4f4a"
  tiffany-deep: "#0f2e2b"
  tiffany-light: "#e8f8f7"
  tiffany-soft: "#d0f0ed"
  destaque: "#f59e0b"
  brand-black: "#0a0a0a"
  brand-gray: "#f9fafb"
  brand-gray2: "#f1f3f4"
  brand-muted: "#4b5563"
  texto-titulo: "#0a0a0a"
  texto-corpo: "#1f2937"
  texto-secundario: "#4b5563"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
  display:
    fontFamily: "Poppins, Inter, system-ui, sans-serif"
    fontWeight: 700
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.tiffany}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.tiffany-dark}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  badge-promo:
    backgroundColor: "{colors.tiffany}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  card-produto:
    backgroundColor: "#ffffff"
    rounded: "{rounded.lg}"
---

# Design System: Sixxis Store

## Overview

**Creative North Star: "A Vitrine de Confiança"**

O sistema visual da Sixxis Store é o de uma loja de eletrodomésticos/fitness que quer parecer segura e organizada antes de parecer moderna — cartões brancos com borda sutil, um único verde-tiffany usado com moderação para ação e confiança, e hierarquia de preço/parcelamento sempre mais evidente que decoração. Não é uma marca editorial ou experimental; é comércio direto, otimizado para decisão rápida de compra (climatizador, aspirador, bike de spinning), com a mesma disciplina visual que a regra de negócio mais crítica do produto impõe: nunca esconder ou pré-decidir algo que o cliente precisa escolher com atenção (a variação de voltagem nunca vem marcada por padrão).

A paleta é estreita de propósito: um verde-tiffany (`#3cbfb3`) carrega toda a marca — CTA, links ativos, badges de promoção, foco de campo — sobre uma base neutra de branco e cinzas frios. Não há gradientes, não há roxo/azul genérico de "SaaS", e a cor de destaque secundária (laranja `#f59e0b`) está reservada para urgência/oferta, não para decoração geral.

**Key Characteristics:**
- Cartões brancos com borda cinza clara (`border-gray-200/80`), raio grande (16px) e elevação só no hover (nunca em repouso).
- Um verde-tiffany único como cor de ação — não dividido entre múltiplos "primary" concorrentes.
- Tipografia utilitária (Inter) para texto de produto/preço; nenhuma fonte decorativa carregando personalidade.
- Densidade de e-commerce tradicional: prioriza escaneabilidade de preço/parcela/frete sobre respiro editorial.

## Colors

Paleta estreita e funcional: um verde-tiffany como único acento de marca, laranja reservado para urgência, e o resto é neutro.

### Primary
- **Verde Tiffany** (`#3cbfb3`): cor de ação — botões primários (adicionar ao carrinho, buscar), links ativos em hover, badges de "oferta"/desconto, foco de campo (`focus:ring-[#3cbfb3]`), preço de destaque no card de produto.
- **Verde Tiffany Escuro** (`#2a9d8f`): estado hover/pressed do verde primário — usado em todo botão/CTA ao passar o mouse.
- **Verde Tiffany Profundo** (`#0f2e2b`): fundo do header/anúncio no topo do site (área institucional, não de ação).

### Secondary
- **Laranja Destaque** (`#f59e0b`): reservado para urgência/promoção pontual — não é usado como acento geral, é uma cor de "chame atenção aqui" configurável pelo admin.

### Neutral
- **Preto Marca** (`#0a0a0a`): títulos e texto de maior peso.
- **Cinza Corpo** (`#1f2937`): texto de parágrafo/produto padrão.
- **Cinza Secundário** (`#4b5563`): texto auxiliar, legendas, contagem de avaliações.
- **Cinza Fundo** (`#f9fafb` / `#f1f3f4`): fundos alternados de seção, hover leve de linha.
- **Branco** (`#ffffff`): fundo padrão de cartão e página.

### Named Rules
**The One Accent Rule.** O verde-tiffany é a única cor com peso de "ação" no sistema. Nenhum componente novo deve introduzir uma segunda cor de CTA — se precisar de ênfase adicional, usa o laranja de urgência (`#f59e0b`), nunca um azul/roxo genérico.

## Typography

**Body Font:** Inter (com fallback `system-ui, sans-serif`)
**Display Font:** Poppins — disponível e carregado (`next/font/google`), mas hoje configurável pelo admin por página/tema (`fontePrincipal`, padrão `Inter`); não há evidência no código de que Poppins seja aplicado de forma consistente em todos os títulos do site hoje.

**Character:** Utilitária e neutra — o peso visual da loja vem de contraste de tamanho/negrito (preço em `font-black`, título em `font-medium`/`font-semibold`), não de uma fonte com personalidade própria.

### Hierarchy
- **Preço de card** (`font-black`, `text-[17px]`): maior peso visual da página de listagem — o preço domina antes do nome do produto.
- **Título de produto** (`font-medium`, `text-xs`/`text-sm`, `line-clamp-2`): sempre truncado em 2 linhas nos cards.
- **Body/legendas** (`text-xs`/`text-sm`, cinza secundário): parcelamento, frete, contagem de avaliação.
- **Badge/label** (`font-black`/`font-bold`, `text-[10px]`–`text-[11px]`, maiúsculo implícito por contexto): tags de desconto e "esgotado".

### Named Rules
**The Price-First Rule.** Em qualquer card ou listagem de produto, o preço leva peso tipográfico maior (`font-black`) que o nome do produto (`font-medium`) — decisão de compra por preço é priorizada sobre descoberta de marca.

## Layout

Grade de e-commerce tradicional: grid de cards de produto responsivo (2 colunas mobile → mais colunas em telas largas, inferido do padrão `sm:`/`md:` nas classes), com o card de produto como unidade atômica repetida. Espaçamento interno de card é compacto (`px-3 pt-3 pb-3`), priorizando densidade de itens visíveis por rolagem sobre respiro. Header fixo no topo com barra de anúncio/ticker rotativo acima da navegação principal.

## Elevation & Depth

Sistema plano por padrão, com elevação reservada para resposta a interação, não para hierarquia em repouso — três níveis de sombra padronizados existem (`--shadow-sm/md/lg`), e o padrão observado nos cards de produto é elevação zero em repouso, sombra + leve `translateY(-2px)` só no hover.

### Shadow Vocabulary
- **sm** (`0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)`): elevação mínima — barra de busca, dropdown leve.
- **md** (`0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.05)`): cards em hover.
- **lg** (`0 12px 28px rgba(0,0,0,.10), 0 4px 8px rgba(0,0,0,.06)`): modais, dropdown de busca expandido.

### Named Rules
**The Hover-Only Elevation Rule.** Cartões e botões ficam planos em repouso; sombra e leve elevação (`-translate-y-0.5`) só aparecem em `:hover`, nunca como estado padrão — reforça a leitura de "clicável" sem poluir a grade visualmente.

## Shapes

Cantos arredondados em duas escalas coexistentes: a escala custom do projeto (`--radius-sm 8px` / `md 12px` / `lg 16px` / `xl 20px`) definida em `globals.css`, e as classes padrão do Tailwind (`rounded-lg`, `rounded-xl`, `rounded-2xl`) usadas diretamente nos componentes — na prática elas convergem (`rounded-lg` Tailwind ≈ 8px = `--radius-sm`; `rounded-2xl` ≈ 16px = `--radius-lg`), mas o código usa as classes Tailwind soltas, não as variáveis, na maior parte dos componentes de vitrine. Botões usam raio pequeno (8px); cards de produto usam raio grande (16px, `rounded-2xl`); avatares/ícones circulares usam `rounded-full`.

## Components

### Buttons
- **Shape:** raio pequeno, 8px (`rounded-lg`).
- **Primary:** fundo `#3cbfb3`, texto branco, `font-semibold`, padding `10px 24px` (`px-6 py-2.5`).
- **Hover / Focus:** fundo muda para `#2a9d8f`, ganha `shadow-lg` e `-translate-y-0.5`, transição `200ms`.
- **Estado de sucesso (ex.: "Adicionado!"):** fundo verde `bg-green-500` com `scale-95`, ícone de check — feedback de confirmação instantâneo e temporário, não permanente.

### Badges / Tags
- **Style:** fundo sólido (verde-tiffany para promoção, vermelho `#dc2626` para "mais vendido"/urgência, cinza para "esgotado"), texto branco, `font-black`, raio pequeno (`rounded-md`), padding compacto (`px-2 py-0.5`).
- **Posição:** absoluta, canto superior esquerdo da imagem do produto.

### Cards / Containers (Card de Produto)
- **Corner Style:** 16px (`rounded-2xl`).
- **Background:** branco.
- **Border:** `border-gray-200/80` em repouso, muda para `hover:border-[#3cbfb3]/30` no hover.
- **Shadow Strategy:** nenhuma em repouso; `hover:shadow-lg` + `-translate-y-0.5` no hover (ver Elevation).
- **Internal Padding:** `px-3 pt-3 pb-3` — compacto, prioriza densidade da grade.

### Inputs / Fields
- **Style:** borda cinza clara (`border-gray-200`/`border-gray-300`), raio médio-grande (`rounded-xl`/`rounded-lg`), fundo branco.
- **Focus:** anel de foco na cor de marca (`focus:ring-2 focus:ring-[#3cbfb3] focus:border-[#3cbfb3]`).

### Navigation
- **Style:** header com barra de anúncio/ticker de fundo verde-profundo (`#0f2e2b`) rotacionando mensagens (frete, entrega, parcelamento, Pix), barra de busca com botão de ação verde-tiffany integrado (`rounded-xl`, `shadow-sm`), dropdown de resultado de busca com `shadow-2xl` e itens com hover cinza claro.
- **Mobile:** mesma paleta, componentes reempilhados (ticker unificado mobile/desktop desde a mudança recente do cupom→parcelamento).

## Do's and Don'ts

### Do:
- **Do** usar o verde-tiffany (`#3cbfb3`) como única cor de ação/CTA em toda a superfície pública.
- **Do** manter cards planos em repouso, com elevação só reagindo a hover (The Hover-Only Elevation Rule).
- **Do** dar ao preço mais peso tipográfico que o nome do produto em qualquer listagem (The Price-First Rule).
- **Do** manter o raio de card grande (16px) e o de botão pequeno (8px) — não inverter a hierarquia de forma entre container e ação.

### Don't:
- **Don't** introduzir uma segunda cor de CTA (azul, roxo ou qualquer acento novo) competindo com o verde-tiffany.
- **Don't** pré-selecionar ou esconder a escolha de variação (voltagem) em nenhum componente novo de compra — é regra de produto, não só visual, e o sistema visual já reflete essa disciplina (nunca pré-marcar o que exige atenção do cliente).
- **Don't** adicionar sombra permanente/decorativa a cards em repouso — quebra a convenção hover-only do sistema.
- **Don't** assumir que Poppins está em uso consistente como fonte de display — hoje é opção configurável pelo admin, não um padrão confirmado de marca.
