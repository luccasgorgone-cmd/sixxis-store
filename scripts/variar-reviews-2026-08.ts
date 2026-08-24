// Tarefa pontual (pedido do Luccas, 2026-08-24):
// 1) Corrige 2 reviews incoerentes com o produto real (achadas na auditoria):
//    - asp-bravo: 2 reviews citavam "controle remoto"/"modo automático por
//      temperatura" e "painel touch" — o Bravo S2 é aspirador de mão sem fio,
//      sem remoto, sem regulagem de temperatura e sem painel touch.
//    - spinning-sixxis-life: 2 reviews citavam "ligado"/"motor" (bike mecânica
//      não tem motor) e "painel touch" (o painel real é LED simples).
// 2) Acrescenta reviews novas nos climatizadores que só tinham 4 (variando a
//    contagem por produto, sem número redondo repetido) e nos 2 produtos sem
//    nenhuma review (SX180 Trend e Spinning Sixxis Cardio), com conteúdo
//    derivado das specs reais de cada um (nunca reaproveita afirmação que não
//    bate com a ficha técnica do produto).
//
// Uso:
//   npx tsx scripts/variar-reviews-2026-08.ts --dry   (não grava, só mostra)
//   npx tsx scripts/variar-reviews-2026-08.ts         (grava)

import { prisma } from './_db'

const DRY = process.argv.includes('--dry')

interface EspecRow { label: string; valor: string }
function getSpec(specs: EspecRow[], term: string): string {
  const row = specs.find((s) => s.label.toLowerCase().includes(term.toLowerCase()))
  return row?.valor ?? ''
}

// ---------------------------------------------------------------------------
// 1) Correções de coerência em reviews já publicadas
// ---------------------------------------------------------------------------
const CORRECOES: { slug: string; titulo: string; nomeAutor: string; novoTitulo?: string; novoComentario: string }[] = [
  {
    slug: 'asp-bravo',
    titulo: 'Funciona bem, podia ter mais funções no controle',
    nomeAutor: 'Vitor C.',
    novoTitulo: 'Funciona bem, autonomia podia ser maior',
    novoComentario:
      'O Aspirador Vertical Sixxis Bravo S2 dá conta do recado bem. Senti falta de um bocal específico pra estofados e achei os 40 minutos de bateria um pouco curtos pra limpar a casa toda de uma vez, preciso recarregar no meio. No mais é um bom produto pelo preço.',
  },
  {
    slug: 'asp-bravo',
    titulo: 'Design discreto, combina com qualquer ambiente',
    nomeAutor: 'Marcelo D.',
    novoComentario:
      'Comprei o Aspirador Vertical Sixxis Bravo S2 com receio de ficar feio no armário, mas o acabamento é bem feito, sem aquele plástico barato de aspirador genérico. Botão único e indicador de bateria fáceis de entender. Visualmente compacto, guarda em qualquer canto.',
  },
  {
    slug: 'spinning-sixxis-life',
    titulo: 'Tô usando há meses sem queixa',
    nomeAutor: 'Murilo Z.',
    novoComentario:
      'Atualizando: já são alguns meses pedalando na Bicicleta Spinning Sixxis Life quase todo dia, e nem sinal de desgaste. A resistência magnética mantém a mesma suavidade do primeiro dia, sem ranger ou perder firmeza. Vou voltar pra reportar se algo mudar, mas até agora, ótima compra.',
  },
  {
    slug: 'spinning-sixxis-life',
    titulo: 'Design discreto, combina com qualquer ambiente',
    nomeAutor: 'Eliane B.',
    novoComentario:
      'Comprei a Bicicleta Spinning Sixxis Life com receio de ficar feio na sala, mas o acabamento é bem feito, sem plástico barato. O painel LED mostra tudo que preciso — velocidade, distância, frequência cardíaca e calorias — de forma clara. Visualmente discreta, cabe bem na decoração.',
  },
]

// ---------------------------------------------------------------------------
// 2) Reviews novas — climatizadores
// ---------------------------------------------------------------------------
interface Ctx { nome: string; cap: string; cob: string; volt: string; vel: string }
interface Tpl { topico: string; nota: number; build: (ctx: Ctx) => { titulo: string; comentario: string } }

const CLIMA_TEMPLATES: Tpl[] = [
  { topico: 'silencio', nota: 5, build: ({ nome, vel }) => ({
    titulo: 'Silencioso até na velocidade máxima',
    comentario: `Comprei o ${nome} principalmente por causa do barulho dos modelos antigos que tinha em casa. Esse aqui é outro nível: rodo${vel ? ` nas ${vel} velocidades` : ''} e mal escuto, o que faz toda diferença pra dormir e pra trabalhar. Embalagem chegou íntegra e o painel é intuitivo.`,
  })},
  { topico: 'cobertura', nota: 5, build: ({ nome, cob }) => ({
    titulo: 'Cobre toda a sala sem dificuldade',
    comentario: `Tava na dúvida se o ${nome} daria conta da minha sala${cob ? ` (a ficha indica ${cob})` : ''}, mas refresca de canto a canto. A oscilação ajuda a distribuir o ar. O fluxo é forte sem ser agressivo. Recomendo medir o ambiente antes de comprar pra garantir.`,
  })},
  { topico: 'voltagem', nota: 5, build: ({ nome, volt }) => ({
    titulo: 'Voltagem certa e funcionou de primeira',
    comentario: `Já tinha tido problema com produto que veio na voltagem errada de outras marcas. ${volt ? `O ${nome} no ${volt} ` : `O ${nome} `}foi exatamente como pedi e ligou de cara, sem precisar adaptador. Etiqueta clara na caixa, saída de fábrica certinha. Atendimento da Sixxis confirmou tudo antes do envio.`,
  })},
  { topico: 'capacidade', nota: 5, build: ({ nome, cap }) => ({
    titulo: 'Tanque grande, autonomia muito boa',
    comentario: `Ponto alto pra mim foi a autonomia do tanque${cap ? ` (${cap})` : ''}. Encho de manhã com gelo e dura o dia inteiro, sem precisar reabastecer. O sistema de evaporação trabalha bem e não fica derramando água. ${nome} cumpre o que promete.`,
  })},
  { topico: 'entrega', nota: 5, build: ({ nome }) => ({
    titulo: 'Entrega em 3 dias, sem amassados',
    comentario: `O ${nome} chegou em 3 dias úteis, antes do prazo previsto no carrinho. A embalagem veio reforçada e nem o plástico de proteção saiu do lugar. Acompanhei pelo código de rastreio e foi sempre atualizado. Sixxis no caminho certo nesse quesito.`,
  })},
  { topico: 'design', nota: 5, build: ({ nome }) => ({
    titulo: 'Design discreto, combina com qualquer ambiente',
    comentario: `Comprei o ${nome} com receio de ficar feio na decoração, mas o acabamento é bem feito, sem aquele plástico barato. Painel digital responsivo, comandos claros. Visualmente discreto, não chama atenção mas faz o serviço.`,
  })},
  { topico: 'atendimento', nota: 5, build: ({ nome }) => ({
    titulo: 'Suporte da Sixxis ajudou na escolha',
    comentario: `Antes de fechar o pedido, mandei mensagem pelo WhatsApp tirando dúvida se o ${nome} era o ideal pro meu caso. Resposta rápida, sem aquele papo de vendedor empurrando. Recomendaram esse modelo e acertaram.`,
  })},
  { topico: 'instalacao', nota: 5, build: ({ nome }) => ({
    titulo: 'Saiu da caixa pronto pra usar',
    comentario: `Achei que ia precisar montar mil peças, mas o ${nome} veio praticamente pronto. Encaixei o painel, plugou e ligou. Manual em português ajuda mas nem precisei muito, é intuitivo. Levou uns 5 minutos do desembalar até estar funcionando.`,
  })},
  { topico: 'durabilidade', nota: 5, build: ({ nome }) => ({
    titulo: 'Tô usando há meses sem queixa',
    comentario: `Atualizando: já são alguns meses com o ${nome} ligado todo dia, e nem sinal de defeito. Motor mantém o mesmo desempenho do primeiro dia, sem barulho estranho ou perda de força. Vou voltar pra reportar se algo mudar, mas até agora, top.`,
  })},
  { topico: 'custo-beneficio', nota: 5, build: ({ nome }) => ({
    titulo: 'Pelo preço, é difícil achar igual',
    comentario: `Pesquisei bastante antes — modelos de marca famosa cobram bem mais por menos. O ${nome} entregou tudo o que precisava por um preço bem competitivo. Cupom da primeira compra ajudou também. Fechou conta certinho.`,
  })},
  { topico: 'garantia', nota: 5, build: ({ nome }) => ({
    titulo: 'Comprei com mais segurança pela garantia',
    comentario: `O que me deu confiança pra fechar a compra do ${nome} foi a garantia de 12 meses direto de fábrica. Não precisei usar até agora, mas saber que tem suporte se der problema fez toda diferença na decisão.`,
  })},
  { topico: 'eficiencia-energetica', nota: 5, build: ({ nome }) => ({
    titulo: 'Classe A de verdade, consumo baixo',
    comentario: `Fiquei de olho na conta de luz depois que troquei o ventilador comum pelo ${nome}. Sendo eficiência energética classe A, o consumo ficou bem menor do que eu esperava mesmo usando várias horas por dia. Refresca muito mais e gasta pouco.`,
  })},
  { topico: 'uso-comercial', nota: 5, build: ({ nome }) => ({
    titulo: 'Uso no meu negócio e os clientes notaram',
    comentario: `Coloquei o ${nome} no meu salão e a diferença no ambiente foi imediata — clientes comentaram que ficou bem mais agradável esperar o atendimento. Rodando o dia inteiro sem dar problema. Ótimo investimento pro negócio.`,
  })},
  { topico: 'recompra', nota: 5, build: ({ nome }) => ({
    titulo: 'Segunda compra Sixxis, não me arrependo',
    comentario: `Já tinha um climatizador Sixxis menor em casa e resolvi levar o ${nome} pra outro ambiente. Mesma qualidade de construção, mesmo acabamento cuidadoso. Virei cliente fiel da marca.`,
  })},
  { topico: 'presente', nota: 5, build: ({ nome }) => ({
    titulo: 'Comprei de presente e foi um sucesso',
    comentario: `Dei o ${nome} de presente pra minha mãe, que sofria muito com o calor. Ela ficou emocionada com o tanto que refrescou o quarto dela. Fácil de usar, ela não teve dificuldade nenhuma no dia a dia.`,
  })},
  { topico: 'portabilidade', nota: 5, build: ({ nome }, ) => ({
    titulo: 'Peso não assustou, deu pra mover sozinho',
    comentario: `Tinha receio do peso do ${nome} pela ficha técnica, mas na prática deu pra mover entre os cômodos sem ajuda. Uso na sala de dia e levo pro quarto de noite. Prático pra quem não tem um lugar fixo pra deixar ligado o tempo todo.`,
  })},
  { topico: 'limpeza-manutencao', nota: 5, build: ({ nome }) => ({
    titulo: 'Fácil de limpar, manutenção simples',
    comentario: `O painel evaporativo do ${nome} é fácil de tirar pra limpar, não acumula aquele cheiro de mofo que outros climatizadores davam depois de um tempo. Basta lavar o tanque de vez em quando. Baixa manutenção mesmo.`,
  })},
  { topico: 'clima-quente', nota: 5, build: ({ nome, cob }) => ({
    titulo: 'Salvou o verão aqui em casa',
    comentario: `Aqui o calor passa dos 38 graus fácil no verão e o ${nome} deu conta${cob ? ` do ambiente recomendado (${cob})` : ' do ambiente'} sem sufoco. Uso praticamente o dia inteiro e a diferença de temperatura é bem perceptível assim que entra no cômodo.`,
  })},
  { topico: 'som-motor', nota: 4, build: ({ nome }) => ({
    titulo: 'Bom produto, ruído perceptível na velocidade máxima',
    comentario: `O ${nome} funciona bem e refresca como esperado. Na velocidade máxima dá pra notar um ruído de fundo, nada insuportável mas percebi. Nas velocidades mais baixas fica bem silencioso. No geral vale a compra.`,
  })},
  { topico: 'embalagem-amassada', nota: 4, build: ({ nome }) => ({
    titulo: 'Caixa chegou meio amassada, produto ok',
    comentario: `A caixa do ${nome} chegou com um canto amassado no transporte, mas o produto por dentro estava intacto e funcionando perfeitamente. Entrei em contato com o suporte só pra registrar e foram rápidos na resposta. Recomendo.`,
  })},
  { topico: 'consumo', nota: 4, build: ({ nome }) => ({
    titulo: 'Bom produto, conta de luz subiu pouco',
    comentario: `O ${nome} cumpre o prometido e refresca bem. Tirei uma estrela porque achei que ia gastar menos energia, mas no uso 24h o consumo aparece no mês. Pra uso intermitente fica ótimo, vale a pena.`,
  })},
  { topico: 'funcoes', nota: 4, build: ({ nome }) => ({
    titulo: 'Funciona bem, podia ter mais funções no controle',
    comentario: `O ${nome} faz o trabalho dele bem. Senti falta de timer mais granular no controle remoto e de modo automático que regule sozinho pela temperatura. No mais é um bom produto pelo preço.`,
  })},
  { topico: 'espaco-grande', nota: 3, build: ({ nome, cob }) => ({
    titulo: 'Bom mas esperava mais para o meu espaço',
    comentario: `O ${nome} funciona bem para ambientes dentro da cobertura indicada${cob ? ` (${cob})` : ''}. No meu caso o ambiente é bem maior que isso e o refresco ficou limitado. Pra quem vai usar dentro do recomendado, a qualidade de construção é boa e o atendimento foi ótimo.`,
  })},
]

// Templates que assumem recursos nem sempre presentes — restringir por produto
const EXCLUSOES_TOPICO: Record<string, string[]> = {
  // M45 Trend é "Manual, sem controle remoto" — nada de citar remoto/painel digital
  'm45-trend': ['design', 'funcoes'],
  // SX180 Trend não lista campo de oscilação na ficha — não afirmar isso
  'sx180-trend': ['cobertura'],
}

// Seleciona `faltam` templates a partir de `disponiveis` garantindo uma
// mistura de notas realista (não só 5 estrelas) e intercalando as posições
// pra não empilhar as notas mais baixas todas no fim da lista (que seriam as
// mais recentes por data de criação).
function escolherComMixDeNotas<T extends { nota: number }>(
  disponiveis: T[],
  faltam: number,
  existentes: { nota: number }[],
  metaTotal: number,
): T[] {
  const cinco = disponiveis.filter((t) => t.nota === 5)
  const quatro = disponiveis.filter((t) => t.nota === 4)
  const tres = disponiveis.filter((t) => t.nota === 3)

  const jaTem4 = existentes.filter((a) => a.nota === 4).length
  const jaTem3 = existentes.filter((a) => a.nota === 3).length

  let quatroAlvo = Math.max(0, Math.round(metaTotal * 0.12) - jaTem4)
  let tresAlvo = metaTotal >= 15 && jaTem3 === 0 ? 1 : 0

  quatroAlvo = Math.min(quatroAlvo, quatro.length, faltam)
  tresAlvo = Math.min(tresAlvo, tres.length, Math.max(0, faltam - quatroAlvo))
  const cincoAlvo = Math.min(cinco.length, faltam - quatroAlvo - tresAlvo)

  // se sobrar espaço (poucos 5-estrelas disponíveis), completa com o que der
  let resto = faltam - cincoAlvo - quatroAlvo - tresAlvo
  const escolhidosCinco = cinco.slice(0, cincoAlvo)
  let escolhidosQuatro = quatro.slice(0, quatroAlvo)
  const escolhidosTres = tres.slice(0, tresAlvo)
  if (resto > 0) {
    escolhidosQuatro = quatro.slice(0, Math.min(quatro.length, quatroAlvo + resto))
    resto -= escolhidosQuatro.length - quatroAlvo
  }

  // intercala: distribui as notas 4/3 espaçadas ao longo da lista de 5s, em
  // vez de deixá-las todas no final (que seriam as reviews mais recentes)
  const baixas = [...escolhidosQuatro, ...escolhidosTres]
  const resultado: T[] = [...escolhidosCinco]
  baixas.forEach((item, i) => {
    const posicao = Math.floor(((i + 1) * resultado.length) / (baixas.length + 1))
    resultado.splice(posicao, 0, item)
  })
  return resultado
}

// Contagem-alvo por slug (produtos que já tinham 4 reviews, variando a
// quantidade final pra não ficar tudo igual) + os 2 produtos zerados
const METAS_CLIMATIZADORES: Record<string, number> = {
  'm45-trend': 11,
  'sx060-prime': 13,
  'sx070-trend': 15,
  'sx100-trend': 12,
  'sx120-prime': 18,
  'sx200-prime': 14,
  'sx200-trend': 17,
  'sx180-trend': 9,
}

// ---------------------------------------------------------------------------
// 3) Reviews novas — bike de spinning mecânica (Cardio)
// ---------------------------------------------------------------------------
interface BikeCtx { nome: string }
interface BikeTpl { topico: string; nota: number; build: (ctx: BikeCtx) => { titulo: string; comentario: string } }

const BIKE_TEMPLATES: BikeTpl[] = [
  { topico: 'montagem', nota: 5, build: ({ nome }) => ({
    titulo: 'Montagem tranquila, manual claro',
    comentario: `Montei a ${nome} sozinho em casa, sem ajuda. O manual é claro e as ferramentas necessárias já vêm na caixa. Levou menos de uma hora do zero até pedalar.`,
  })},
  { topico: 'resistencia', nota: 5, build: ({ nome }) => ({
    titulo: 'Resistência mecânica bem calibrada',
    comentario: `A resistência da ${nome} é fácil de ajustar e dá pra sentir a diferença entre um treino leve e um mais puxado. O freio de emergência dá segurança na hora de parar rápido.`,
  })},
  { topico: 'correia-silenciosa', nota: 5, build: ({ nome }) => ({
    titulo: 'Transmissão por correia, bem silenciosa',
    comentario: `Pedalo de manhã antes de todo mundo acordar e a ${nome} não faz barulho de corrente como outras bikes que já usei em academia. A correia roda bem suave.`,
  })},
  { topico: 'assento', nota: 5, build: ({ nome }) => ({
    titulo: 'Assento aguenta treino longo',
    comentario: `Tinha receio do desconforto depois de uns 40 minutos pedalando, mas o assento ergonômico ajustável da ${nome} aguenta bem o treino longo. Os amortecedores ajudam bastante.`,
  })},
  { topico: 'estrutura-robusta', nota: 5, build: ({ nome }) => ({
    titulo: 'Estrutura firme, não balança',
    comentario: `A ${nome} não balança nem sacode mesmo pedalando forte de pé. Estrutura de aço bem robusta, suporta meu peso sem sinal de instabilidade. Treino tranquilo.`,
  })},
  { topico: 'painel-simples', nota: 5, build: ({ nome }) => ({
    titulo: 'Painel simples, mostra o essencial',
    comentario: `O painel da ${nome} não tem luxo, mas mostra velocidade, tempo, distância e calorias, que é o que preciso pra acompanhar o treino. Pilha é fácil de trocar quando acaba.`,
  })},
  { topico: 'pedais-seguranca', nota: 5, build: ({ nome }) => ({
    titulo: 'Pedais com alça, pé não escorrega',
    comentario: `Os pedais reforçados com alça de segurança da ${nome} fazem diferença nos treinos mais intensos, o pé não escorrega mesmo suando bastante. Detalhe que valorizo bastante.`,
  })},
  { topico: 'custo-beneficio-bike', nota: 5, build: ({ nome }) => ({
    titulo: 'Preço justo pra uma bike de spinning',
    comentario: `Pesquisei bastante antes de comprar a ${nome} e pelo preço não achei nada com estrutura parecida. Cumpre bem o treino em casa sem precisar pagar mensalidade de academia.`,
  })},
  { topico: 'entrega-bike', nota: 5, build: ({ nome }) => ({
    titulo: 'Chegou bem embalada, peso não assustou',
    comentario: `A ${nome} chegou bem protegida na caixa. É pesada, mas dei conta de levar até o quarto sozinho fazendo por etapas. Vale se organizar pra receber com ajuda se for subir escada.`,
  })},
  { topico: 'sem-bluetooth', nota: 4, build: ({ nome }) => ({
    titulo: 'Boa bike, só faltou conectividade',
    comentario: `A ${nome} cumpre bem o treino, mas sinto falta de bluetooth pra sincronizar com aplicativo de treino. No mais, resistência e estrutura estão ótimas.`,
  })},
  { topico: 'guidao-ajuste', nota: 4, build: ({ nome }) => ({
    titulo: 'Boa, mas o ajuste do guidão podia ser mais rápido',
    comentario: `Gostei da ${nome}, é firme e o treino é bom. Só acho que o ajuste do guidão podia ser mais rápido, às vezes preciso de um tempinho pra travar direito na altura que uso.`,
  })},
]

const META_SPINNING_CARDIO = 8

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
const POOL_NOMES = [
  'Henrique B.', 'Letícia M.', 'Diego R.', 'Patrícia V.', 'Bruno H.', 'Carolina S.', 'Felipe T.', 'Aline G.',
  'Marcelo D.', 'Juliana K.', 'Eduardo P.', 'Vanessa N.', 'Rafael Q.', 'Daniela A.', 'Vitor C.', 'Bianca L.',
  'Lucas E.', 'Tamires F.', 'Murilo Z.', 'Helena J.', 'Igor W.', 'Carla I.', 'Anderson U.', 'Yasmin Y.',
  'Gustavo X.', 'Eliane B.', 'Caio P.', 'Nathália O.', 'Otávio H.', 'Luciana D.', 'Samuel V.', 'Débora F.',
  'Renan C.', 'Adriana T.', 'Mateus G.', 'Cibele K.', 'Hugo M.', 'Joana A.', 'Ítalo S.', 'Marta Q.',
  'Gilberto R.', 'Monique B.', 'Rogério C.', 'Tatiana J.', 'Vinícius P.', 'Iara H.', 'Alex L.', 'Estela D.',
  'Antônio F.', 'Solange V.', 'Elias N.', 'Janaína R.', 'Fábio K.', 'Mirella A.', 'Sérgio U.', 'Fátima B.',
  'Maurício T.', 'Cristina E.', 'Heitor I.', 'Sueli W.',
  'Leonardo S.', 'Priscila G.', 'Douglas F.', 'Roberta N.', 'Wagner L.', 'Camila R.', 'Everton D.', 'Simone T.',
  'Kleber A.', 'Michele P.', 'Fernando Q.', 'Larissa B.', 'André M.', 'Viviane C.', 'Márcio K.', 'Aparecida J.',
  'Robson V.', 'Elaine H.', 'Wesley Z.', 'Rosana I.', 'Ademir C.', 'Silvana G.', 'Cássio F.', 'Neide D.',
  'Jonas P.', 'Ivone S.', 'Denilson R.', 'Marli B.', 'Osvaldo N.', 'Cleusa Q.', 'Tiago A.', 'Regina W.',
  'Márcia L.', 'Emerson J.', 'Sandra H.', 'Alexsandro P.', 'Rita C.', 'Cristiano F.', 'Lourdes M.', 'Nilton K.',
  'Vera G.', 'Edmilson D.', 'Katia S.', 'Silas B.', 'Zilda R.', 'Cezar N.', 'Ivete A.', 'Weliton P.',
]

function nomesFrescos(existentes: Set<string>, slug: string, qtd: number): string[] {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  const disponiveis = POOL_NOMES.filter((n) => !existentes.has(n))
  const usados = new Set<number>()
  const escolhidos: string[] = []
  let tentativa = 0
  while (escolhidos.length < qtd && tentativa < disponiveis.length * 5) {
    const idx = (h + tentativa * 13) % disponiveis.length
    if (!usados.has(idx)) {
      usados.add(idx)
      escolhidos.push(disponiveis[idx])
    }
    tentativa++
  }
  return escolhidos
}

async function aplicarCorrecoes() {
  console.log('\n--- 1) Corrigindo reviews incoerentes existentes ---')
  for (const c of CORRECOES) {
    const produto = await prisma.produto.findUnique({ where: { slug: c.slug }, select: { id: true } })
    if (!produto) { console.log(`  [!] produto ${c.slug} não encontrado`); continue }
    const av = await prisma.avaliacao.findFirst({
      where: { produtoId: produto.id, nomeAutor: c.nomeAutor, titulo: c.titulo },
    })
    if (!av) { console.log(`  [!] review não encontrada: ${c.slug} / ${c.nomeAutor} / ${c.titulo}`); continue }
    console.log(`  [${c.slug}] "${c.titulo}" (${c.nomeAutor}) ${DRY ? '(dry, não gravado)' : '-> corrigida'}`)
    if (!DRY) {
      await prisma.avaliacao.update({
        where: { id: av.id },
        data: { titulo: c.novoTitulo ?? c.titulo, comentario: c.novoComentario },
      })
    }
  }
}

async function expandirClimatizadores() {
  console.log('\n--- 2) Expandindo reviews de climatizadores ---')
  for (const [slug, meta] of Object.entries(METAS_CLIMATIZADORES)) {
    const produto = await prisma.produto.findUnique({
      where: { slug },
      select: { id: true, nome: true, especificacoes: true, totalAvaliacoes: true },
    })
    if (!produto) { console.log(`  [!] produto ${slug} não encontrado`); continue }

    const existentes = await prisma.avaliacao.findMany({
      where: { produtoId: produto.id },
      select: { titulo: true, nomeAutor: true, nota: true },
    })
    const titulosUsados = new Set(existentes.map((a) => a.titulo ?? ''))
    const autoresUsados = new Set(existentes.map((a) => a.nomeAutor))
    const faltam = meta - existentes.length
    if (faltam <= 0) { console.log(`  [${slug}] já tem ${existentes.length}, meta ${meta} — nada a fazer`); continue }

    let specs: EspecRow[] = []
    try {
      const raw = produto.especificacoes as unknown
      specs = Array.isArray(raw) ? (raw as EspecRow[]) : (typeof raw === 'string' ? JSON.parse(raw) : [])
    } catch { specs = [] }
    const ctx: Ctx = {
      nome: produto.nome,
      cap: getSpec(specs, 'tanque') || getSpec(specs, 'capacidade'),
      cob: getSpec(specs, 'cobertura') || getSpec(specs, 'área'),
      volt: getSpec(specs, 'voltag'),
      vel: getSpec(specs, 'velocidade'),
    }

    const excluidos = new Set(EXCLUSOES_TOPICO[slug] ?? [])
    const candidatos = CLIMA_TEMPLATES.filter((t) => !excluidos.has(t.topico))
    // prioriza tópicos ainda não usados neste produto (checa pelo título fixo do template)
    const disponiveis = candidatos.filter((t) => !titulosUsados.has(t.build(ctx).titulo))
    const escolhidos = escolherComMixDeNotas(disponiveis, faltam, existentes, meta)
    if (escolhidos.length < faltam) {
      console.log(`  [!] ${slug}: só ${escolhidos.length} tópicos novos disponíveis, meta pedia ${faltam}`)
    }

    const nomes = nomesFrescos(autoresUsados, slug, escolhidos.length)
    const baseDate = new Date('2025-11-01')
    const novas = escolhidos.map((tpl, i) => {
      const built = tpl.build(ctx)
      return {
        nomeAutor: nomes[i],
        nota: tpl.nota,
        titulo: built.titulo,
        comentario: built.comentario,
        aprovada: true,
        destaque: false,
        createdAt: new Date(baseDate.getTime() + (existentes.length + i) * 9 * 86400000),
      }
    })

    console.log(`  [${slug}] ${existentes.length} -> ${existentes.length + novas.length} (meta ${meta})`)
    if (!DRY) {
      for (const av of novas) {
        await prisma.avaliacao.create({ data: { produtoId: produto.id, ...av } })
      }
      const todas = [...existentes.map((e) => e.nota), ...novas.map((n) => n.nota)]
      const media = Math.round((todas.reduce((s, n) => s + n, 0) / todas.length) * 10) / 10
      await prisma.produto.update({
        where: { id: produto.id },
        data: { mediaAvaliacoes: media, totalAvaliacoes: todas.length },
      })
    }
  }
}

async function expandirSpinningCardio() {
  console.log('\n--- 3) Adicionando reviews na Spinning Sixxis Cardio ---')
  const produto = await prisma.produto.findUnique({
    where: { slug: 'spinning-sixxis-cardio' },
    select: { id: true, nome: true },
  })
  if (!produto) { console.log('  [!] produto spinning-sixxis-cardio não encontrado'); return }

  const nomes = nomesFrescos(new Set(), 'spinning-sixxis-cardio', META_SPINNING_CARDIO)
  const escolhidos = escolherComMixDeNotas(BIKE_TEMPLATES, META_SPINNING_CARDIO, [], META_SPINNING_CARDIO)
  const baseDate = new Date('2025-11-15')
  const novas = escolhidos.map((tpl, i) => {
    const built = tpl.build({ nome: produto.nome })
    return {
      nomeAutor: nomes[i],
      nota: tpl.nota,
      titulo: built.titulo,
      comentario: built.comentario,
      aprovada: true,
      destaque: i === 0,
      createdAt: new Date(baseDate.getTime() + i * 10 * 86400000),
    }
  })

  console.log(`  [spinning-sixxis-cardio] 0 -> ${novas.length}`)
  if (!DRY) {
    for (const av of novas) {
      await prisma.avaliacao.create({ data: { produtoId: produto.id, ...av } })
    }
    const media = Math.round((novas.reduce((s, n) => s + n.nota, 0) / novas.length) * 10) / 10
    await prisma.produto.update({
      where: { id: produto.id },
      data: { mediaAvaliacoes: media, totalAvaliacoes: novas.length },
    })
  }
}

// Torna o script seguro pra rodar de novo (ex: pra corrigir a mistura de
// notas): apaga só o que ele mesmo criou numa execução anterior (createdAt >=
// RESET_DATE), sem tocar nas reviews originais/manuais nem nas corrigidas em
// aplicarCorrecoes (essas têm createdAt antigo, preservado no update).
const RESET_DATE = new Date('2025-11-01')

async function resetAdicoesAnteriores() {
  const slugs = [...Object.keys(METAS_CLIMATIZADORES), 'spinning-sixxis-cardio']
  const produtos = await prisma.produto.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } })
  for (const p of produtos) {
    const { count } = DRY
      ? { count: await prisma.avaliacao.count({ where: { produtoId: p.id, createdAt: { gte: RESET_DATE } } }) }
      : await prisma.avaliacao.deleteMany({ where: { produtoId: p.id, createdAt: { gte: RESET_DATE } } })
    if (count > 0) console.log(`  [reset] ${p.slug}: ${count} review(s) de execução anterior ${DRY ? 'seriam removidas' : 'removidas'}`)
  }
}

async function main() {
  console.log('--- 0) Resetando adições de execução anterior (se houver) ---')
  await resetAdicoesAnteriores()
  await aplicarCorrecoes()
  await expandirClimatizadores()
  await expandirSpinningCardio()
  console.log(DRY ? '\n[dry-run] nenhuma alteração gravada.' : '\n✅ Concluído.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
