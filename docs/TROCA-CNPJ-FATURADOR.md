# Troca do CNPJ faturador do site — Sixxis Importação → Sixxis Comercial

**Status:** planejamento (nenhum código alterado ainda)
**Data:** 2026-09-28
**Autor:** Jarvis Site (a pedido do Luccas)

---

## 1. Objetivo

Fazer o storefront passar a **faturar e receber** pela **Sixxis Comercial** (outro CNPJ),
mantendo o funcionamento idêntico ao atual. Onde hoje aparece a
`SIXXIS IMPORTAÇÃO, EXPORTAÇÃO E COMÉRCIO LTDA`, passa a aparecer a Comercial.

## 2. Cenário confirmado (o que torna isto simples)

| Dado | Importação (atual) | Comercial (novo) |
|---|---|---|
| CNPJ | 54.978.947/0001-09 | **(a definir)** |
| Razão social | SIXXIS IMPORTAÇÃO, EXPORTAÇÃO E COMÉRCIO LTDA | **(a definir)** |
| Inscrição Estadual | 117.633.347.114 | **(a definir)** |
| UF | SP | **SP (mesma)** |
| Cidade | Araçatuba | **Araçatuba (mesma)** |
| Endereço | R. Anhanguera, 1711 - Icaray, 16020-355 | **(diferente — a definir)** |
| Regime | Simples Nacional (CRT=1) | **Simples Nacional (mesmo)** |

**Consequência crítica:** como UF e regime NÃO mudam, a **matriz fiscal**
(`src/lib/nfe-regras.ts` — CSOSN/CFOP/NCM/CEST) permanece **intacta**. Nenhum recálculo
de imposto. O trabalho é trocar dados de identificação + credenciais.

## 3. Fora de escopo

- **Mercado Livre:** não existe integração de ML neste repositório. Trocar o CNPJ do site
  não afeta o marketplace. Faturar ML pela Comercial se resolve no painel do próprio ML.
- **ERP / CRM:** não faz parte desta troca; só avisar o financeiro sobre a nova conta MP.

## 4. Onde a empresa está acoplada (mapeamento completo)

### 4a. NF-e — LOAD-BEARING (é o que sai na nota real)
- `src/lib/focusnfe.ts:52` — `CNPJ_EMITENTE = '54978947000109'` → **trocar pelo novo CNPJ**.
  É o único dado do emitente que o código envia. Razão social, IE, endereço e regime
  **não estão no código** — vivem no **portal da Focus NFe**, cadastrados por CNPJ.
- `src/lib/nfe-regras.ts:67` — `UF_EMITENTE = 'SP'` → **conferir, mantém SP** (não muda).
- Regime Simples / CSOSN / CRT=1 (`nfe-regras.ts:57-64`, `focusnfe.ts:300`) → **mantém**.

### 4b. Exibição (CNPJ/IE/endereço chumbados em UI, e-mail e PDF)
Trocar em todos:
- `src/lib/nf-pdf.ts:32-37` — objeto `EMPRESA` do PDF "Espelho do Pedido".
- `src/lib/sixxis-email-design.ts:23-24` — `BRAND.cnpj`, `BRAND.enderecoRodape`.
- `src/lib/email-templates-seed.ts:24,27` — rodapé + endereço dos e-mails.
- `src/components/layout/Footer.tsx:295-301` — razão social, CNPJ, IE, endereço.
- `src/app/(loja)/sobre/page.tsx:365-367` — CNPJ, IE, razão social, endereço.
- `src/app/(loja)/contato/page.tsx:31,110-120` — endereço + Google Maps embed.
- `src/app/(loja)/privacidade/page.tsx:192-193` — CNPJ + endereço (texto LGPD).
- `src/app/(loja)/exclusao-de-dados/page.tsx:123` — CNPJ + endereço (LGPD).
- `src/app/(conta)/minha-conta/garantias/page.tsx:168` — razão social + CNPJ.
- `src/app/api/revendedor/solicitar/route.ts:104,141` — CNPJ no rodapé do e-mail.
- `scripts/seed-luna-prompt.ts:49-50` — CNPJ/sede no prompt da IA "Luna" (re-seed no banco).

### 4c. Credenciais em env var (trocar no Railway, sem código)
- Mercado Pago: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`.
- Focus NF-e: `FOCUS_NFE_TOKEN_PRODUCAO`, `FOCUS_NFE_TOKEN_HOMOLOGACAO`.
- Frete: `BRASPRESS_CNPJ_REMETENTE` (se o contrato Braspress for por CNPJ — confirmar).

### 4d. Órfãos / sem vínculo (NÃO mexer)
- Model `Configuracao` tem `loja_cnpj`/`loja_endereco`, mas **não são lidos** em lugar
  nenhum (só `nf_logo_url` é usado). Trocar não faz efeito — ignorar.
- Cloudflare R2: armazenamento de imagem, sem vínculo fiscal.

## 5. Decisão de arquitetura: centralizar antes de trocar

Hoje o CNPJ está espalhado in-place em ~11 arquivos. **Recomendado:** criar
`src/lib/empresa.ts` exportando um objeto único (`nome`, `razaoSocial`, `cnpj`,
`cnpjDigitos`, `ie`, `endereco`, `uf`, `cidade`, `contato`) e fazer todos os pontos de
exibição (4b) e o `CNPJ_EMITENTE` (4a) lerem dele. Ganho: a **próxima** troca vira 1
arquivo. Custo: ~1h a mais. `nfe-regras.ts` (matriz fiscal) fica fora — é regra, não dado.

Alternativa mais rápida: trocar in-place nos 11 arquivos (sem centralizar). Escolha do Luccas.

## 6. Divisão de responsabilidades

| # | Tarefa | Responsável | Bloqueia? |
|---|---|---|---|
| 1 | Definir dados cadastrais da Comercial (CNPJ, IE, endereço) | Luccas | — |
| 2 | Emitir/instalar **certificado digital A1** da Comercial na Focus | Luccas + contadora | **SIM** (sem isso, nota real não sai) |
| 3 | Cadastrar emitente (razão/IE/endereço/regime) no portal Focus | Luccas + contadora | SIM |
| 4 | Gerar tokens Focus (homolog + prod) do novo CNPJ | Luccas | SIM |
| 5 | Obter tokens da conta MP da Comercial | Luccas | SIM (recebível) |
| 6 | Centralizar `empresa.ts` + trocar dados no código (4a+4b) | Jarvis | — |
| 7 | Re-seed do prompt Luna (`seed-luna-prompt.ts`) | Jarvis | — |
| 8 | Trocar env vars no Railway (MP, Focus, Braspress) | Luccas | — |
| 9 | Validar 1ª nota em **homologação** (foco: climatizador-PJ CSOSN 500) | Jarvis + Luccas | — |
| 10 | Aval da contadora + virar `FOCUS_NFE_AMBIENTE=producao` | Luccas + contadora | — |
| 11 | Definir data de corte de pedidos em trânsito | Luccas + contadora | — |

## 7. Ordem de execução

1. Luccas junta dados (1) e alinha certificado + tokens com a contadora (2-5). **Gargalo.**
2. Jarvis faz o código (6-7) em branch, sem deploy — pode rodar em paralelo ao passo 1.
3. Luccas troca env vars no Railway (8), ainda em `FOCUS_NFE_AMBIENTE=homologacao`.
4. Deploy da branch → teste de nota em homologação (9): climatizador-PJ, bike, aspirador.
5. Aval da contadora sobre CSOSN 500 climatizador-PJ (já pendência aberta no briefing).
6. Virar produção (10), emitir 1ª nota real controlada, conferir.
7. Definir corte (11): pedidos pagos na Importação e não faturados saem por qual CNPJ.

## 8. Checklist de verificação (homologação → produção)

- [ ] `CNPJ_EMITENTE` no código = CNPJ da Comercial (dígitos, sem pontuação).
- [ ] Todos os pontos de exibição (4b) mostram CNPJ/IE/endereço novos.
- [ ] Rodapé de e-mail transacional com dados novos (enviar e-mail de teste).
- [ ] PDF "Espelho do Pedido" com empresa nova.
- [ ] Tokens Focus/MP novos no Railway; webhook MP validando HMAC.
- [ ] Nota de teste em homologação autoriza para as 3 categorias-chave.
- [ ] Certificado A1 válido e dentro da validade na Focus.
- [ ] Financeiro ciente da nova conta MP (conciliação).

## 9. Riscos

- **Certificado A1 é o caminho crítico.** Sem ele, tudo pronto mas nota real não emite.
- **Data de corte mal definida** pode gerar nota no CNPJ errado para pedido em trânsito.
- **Braspress:** se o contrato de frete for atrelado ao CNPJ remetente, o cálculo de frete
  pode falhar até atualizar `BRASPRESS_CNPJ_REMETENTE` — confirmar com a transportadora.
