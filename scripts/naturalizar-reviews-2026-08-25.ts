// Tarefa pontual (pedido do Luccas, 2026-08-25): reviews estavam repetindo o
// nome completo do produto em quase todo comentário ("a Sixxis Life", "o
// Climatizador SX120 Prime" etc) — robótico, cliente real comentando na
// própria página do produto normalmente usa pronome, termo genérico ("a
// bike"/"o climatizador") ou nem cita o nome. Baseline orgânico observado no
// SX040 (25 reviews reais, não escritas por agente): só 16% citam o nome.
//
// Este script SÓ corrige o texto de comentario de reviews já existentes
// (match por produtoId + nomeAutor + titulo) — não mexe em nota, titulo,
// createdAt, aprovada nem cria/apaga nenhuma review.
//
// Uso:
//   npx tsx scripts/naturalizar-reviews-2026-08-25.ts --dry
//   npx tsx scripts/naturalizar-reviews-2026-08-25.ts

import { prisma } from './_db'

const DRY = process.argv.includes('--dry')

interface EspecRow { label: string; valor: string }
function getSpec(specs: EspecRow[], term: string): string {
  const row = specs.find((s) => s.label.toLowerCase().includes(term.toLowerCase()))
  return row?.valor ?? ''
}

// ---------------------------------------------------------------------------
// 1) Climatizadores (7 produtos + m45-trend) — templates corrigidos, aplicados
// por título (cada título é único por produto e identifica o tópico do
// template original em variar-reviews-2026-08.ts, já corrigido lá também).
// ---------------------------------------------------------------------------
interface ClimaCtx { nome: string; cap: string; cob: string; volt: string; vel: string }

const CLIMA_FIX: Record<string, (ctx: ClimaCtx) => string> = {
  'Silencioso até na velocidade máxima': ({ vel }) =>
    `Comprei esse climatizador principalmente por causa do barulho dos modelos antigos que eu tinha em casa. Esse aqui é outro nível: rodo${vel ? ` nas ${vel} velocidades` : ''} e mal escuto, o que faz toda diferença pra dormir e pra trabalhar. Embalagem chegou íntegra e o painel é intuitivo.`,
  'Cobre toda a sala sem dificuldade': ({ cob }) =>
    `Tava na dúvida se ele daria conta da minha sala${cob ? ` (a ficha indica ${cob})` : ''}, mas refresca de canto a canto. A oscilação ajuda a distribuir o ar. O fluxo é forte sem ser agressivo. Recomendo medir o ambiente antes de comprar pra garantir.`,
  'Voltagem certa e funcionou de primeira': ({ nome, volt }) =>
    `Já tinha tido problema com produto que veio na voltagem errada de outras marcas. ${volt ? `Esse ${nome.replace(/^Climatizador /, '')}, no ${volt}, ` : `Esse aqui `}foi exatamente como pedi e ligou de cara, sem precisar adaptador. Etiqueta clara na caixa, saída de fábrica certinha. Atendimento da Sixxis confirmou tudo antes do envio.`,
  'Tanque grande, autonomia muito boa': ({ cap }) =>
    `Ponto alto pra mim foi a autonomia do tanque${cap ? ` (${cap})` : ''}. Encho de manhã com gelo e dura o dia inteiro, sem precisar reabastecer. O sistema de evaporação trabalha bem e não fica derramando água. Cumpre o que promete.`,
  'Entrega em 3 dias, sem amassados': () =>
    `Chegou em 3 dias úteis, antes do prazo previsto no carrinho. A embalagem veio reforçada e nem o plástico de proteção saiu do lugar. Acompanhei pelo código de rastreio e foi sempre atualizado. Sixxis no caminho certo nesse quesito.`,
  'Design discreto, combina com qualquer ambiente': () =>
    `Comprei com receio de ficar feio na decoração, mas o acabamento é bem feito, sem aquele plástico barato. Painel digital responsivo, comandos claros. Visualmente discreto, não chama atenção mas faz o serviço.`,
  'Suporte da Sixxis ajudou na escolha': () =>
    `Antes de fechar o pedido, mandei mensagem pelo WhatsApp tirando dúvida se esse modelo era o ideal pro meu caso. Resposta rápida, sem aquele papo de vendedor empurrando. Recomendaram e acertaram.`,
  'Saiu da caixa pronto pra usar': () =>
    `Achei que ia precisar montar mil peças, mas veio praticamente pronto pra usar. Encaixei o painel, plugou e ligou. Manual em português ajuda mas nem precisei muito, é intuitivo. Levou uns 5 minutos do desembalar até estar funcionando.`,
  'Tô usando há meses sem queixa': () =>
    `Atualizando: já são alguns meses com ele ligado todo dia, e nem sinal de defeito. Motor mantém o mesmo desempenho do primeiro dia, sem barulho estranho ou perda de força. Vou voltar pra reportar se algo mudar, mas até agora, top.`,
  'Pelo preço, é difícil achar igual': () =>
    `Pesquisei bastante antes — modelos de marca famosa cobram bem mais por menos. Entregou tudo o que eu precisava por um preço bem competitivo. Cupom da primeira compra ajudou também. Fechou conta certinho.`,
  'Comprei com mais segurança pela garantia': () =>
    `O que me deu confiança pra fechar a compra foi a garantia de 12 meses direto de fábrica. Não precisei usar até agora, mas saber que tem suporte se der problema fez toda diferença na decisão.`,
  'Classe A de verdade, consumo baixo': ({ nome }) =>
    `Fiquei de olho na conta de luz depois que troquei o ventilador comum por esse ${nome.replace(/^Climatizador /, '')}. Sendo eficiência energética classe A, o consumo ficou bem menor do que eu esperava mesmo usando várias horas por dia. Refresca muito mais e gasta pouco.`,
  'Uso no meu negócio e os clientes notaram': () =>
    `Coloquei esse climatizador no meu salão e a diferença no ambiente foi imediata — clientes comentaram que ficou bem mais agradável esperar o atendimento. Rodando o dia inteiro sem dar problema. Ótimo investimento pro negócio.`,
  'Segunda compra Sixxis, não me arrependo': ({ nome }) =>
    `Já tinha um climatizador Sixxis menor em casa e resolvi levar o ${nome.replace(/^Climatizador /, '')} pra outro ambiente. Mesma qualidade de construção, mesmo acabamento cuidadoso. Virei cliente fiel da marca.`,
  'Comprei de presente e foi um sucesso': () =>
    `Dei de presente pra minha mãe, que sofria muito com o calor. Ela ficou emocionada com o tanto que refrescou o quarto dela. Fácil de usar, ela não teve dificuldade nenhuma no dia a dia.`,
  'Peso não assustou, deu pra mover sozinho': () =>
    `Tinha receio do peso pela ficha técnica, mas na prática deu pra mover entre os cômodos sem ajuda. Uso na sala de dia e levo pro quarto de noite. Prático pra quem não tem um lugar fixo pra deixar ligado o tempo todo.`,
  'Fácil de limpar, manutenção simples': () =>
    `O painel evaporativo é fácil de tirar pra limpar, não acumula aquele cheiro de mofo que outros climatizadores davam depois de um tempo. Basta lavar o tanque de vez em quando. Baixa manutenção mesmo.`,
  'Salvou o verão aqui em casa': ({ cob }) =>
    `Aqui o calor passa dos 38 graus fácil no verão e ele deu conta${cob ? ` do ambiente recomendado (${cob})` : ' do ambiente'} sem sufoco. Uso praticamente o dia inteiro e a diferença de temperatura é bem perceptível assim que entra no cômodo.`,
  'Bom produto, ruído perceptível na velocidade máxima': () =>
    `Funciona bem e refresca como esperado. Na velocidade máxima dá pra notar um ruído de fundo, nada insuportável mas percebi. Nas velocidades mais baixas fica bem silencioso. No geral vale a compra.`,
  'Caixa chegou meio amassada, produto ok': () =>
    `A caixa chegou com um canto amassado no transporte, mas o produto por dentro estava intacto e funcionando perfeitamente. Entrei em contato com o suporte só pra registrar e foram rápidos na resposta. Recomendo.`,
  'Bom produto, conta de luz subiu pouco': () =>
    `Cumpre o prometido e refresca bem. Tirei uma estrela porque achei que ia gastar menos energia, mas no uso 24h o consumo aparece no mês. Pra uso intermitente fica ótimo, vale a pena.`,
  'Funciona bem, podia ter mais funções no controle': () =>
    `Faz o trabalho dele bem. Senti falta de timer mais granular no controle remoto e de modo automático que regule sozinho pela temperatura. No mais é um bom produto pelo preço.`,
  'Bom mas esperava mais para o meu espaço': ({ cob }) =>
    `Funciona bem para ambientes dentro da cobertura indicada${cob ? ` (${cob})` : ''}. No meu caso o ambiente é bem maior que isso e o refresco ficou limitado. Pra quem vai usar dentro do recomendado, a qualidade de construção é boa e o atendimento foi ótimo.`,
}

const CLIMA_SLUGS = ['sx060-prime', 'sx070-trend', 'sx100-trend', 'sx120-prime', 'sx180-trend', 'sx200-prime', 'sx200-trend', 'm45-trend']

// ---------------------------------------------------------------------------
// 2) Spinning Sixxis Cardio — 8 reviews originais (BIKE_TEMPLATES corrigido)
// ---------------------------------------------------------------------------
const BIKE_FIX: Record<string, string> = {
  'Montagem tranquila, manual claro':
    'Montei sozinho em casa, sem ajuda. O manual é claro e as ferramentas necessárias já vêm na caixa. Levou menos de uma hora do zero até pedalar.',
  'Resistência mecânica bem calibrada':
    'A resistência é fácil de ajustar e dá pra sentir a diferença entre um treino leve e um mais puxado. O freio de emergência dá segurança na hora de parar rápido.',
  'Transmissão por correia, bem silenciosa':
    'Pedalo de manhã antes de todo mundo acordar e não faz barulho de corrente como outras bikes que já usei em academia. A correia roda bem suave.',
  'Assento aguenta treino longo':
    'Tinha receio do desconforto depois de uns 40 minutos pedalando, mas o assento ergonômico ajustável aguenta bem o treino longo. Os amortecedores ajudam bastante.',
  'Estrutura firme, não balança':
    'Não balança nem sacode mesmo pedalando forte de pé. Estrutura de aço bem robusta, suporta meu peso sem sinal de instabilidade. Treino tranquilo.',
  'Painel simples, mostra o essencial':
    'O painel não tem luxo, mas mostra velocidade, tempo, distância e calorias, que é o que preciso pra acompanhar o treino. Pilha é fácil de trocar quando acaba.',
  'Pedais com alça, pé não escorrega':
    'Os pedais reforçados com alça de segurança fazem diferença nos treinos mais intensos, o pé não escorrega mesmo suando bastante. Detalhe que valorizo bastante.',
  'Boa bike, só faltou conectividade':
    'Cumpre bem o treino, mas sinto falta de bluetooth pra sincronizar com aplicativo de treino. No mais, resistência e estrutura estão ótimas.',
}

// ---------------------------------------------------------------------------
// 3) Correções pontuais (produtoId + nomeAutor + titulo) — CORRECOES do
// variar-reviews-2026-08.ts (asp-bravo, spinning-sixxis-life) e as reviews
// novas de 2026-08-24 que citavam demais o nome do produto.
// ---------------------------------------------------------------------------
interface Fix { slug: string; nomeAutor: string; titulo: string | null; comentario: string }

const HARDCODED_FIX: Fix[] = [
  // --- CORRECOES (variar-reviews-2026-08.ts) ---
  { slug: 'asp-bravo', nomeAutor: 'Vitor C.', titulo: 'Funciona bem, autonomia podia ser maior', comentario: 'Dá conta do recado bem. Senti falta de um bocal específico pra estofados e achei os 40 minutos de bateria um pouco curtos pra limpar a casa toda de uma vez, preciso recarregar no meio. No mais é um bom produto pelo preço.' },
  { slug: 'asp-bravo', nomeAutor: 'Marcelo D.', titulo: 'Design discreto, combina com qualquer ambiente', comentario: 'Comprei com receio de ficar feio no armário, mas o acabamento é bem feito, sem aquele plástico barato de aspirador genérico. Botão único e indicador de bateria fáceis de entender. Visualmente compacto, guarda em qualquer canto.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Murilo Z.', titulo: 'Tô usando há meses sem queixa', comentario: 'Atualizando: já são alguns meses pedalando quase todo dia, e nem sinal de desgaste. A resistência magnética mantém a mesma suavidade do primeiro dia, sem ranger ou perder firmeza. Vou voltar pra reportar se algo mudar, mas até agora, ótima compra.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Eliane B.', titulo: 'Design discreto, combina com qualquer ambiente', comentario: 'Comprei com receio de ficar feio na sala, mas o acabamento é bem feito, sem plástico barato. O painel LED mostra tudo que preciso — velocidade, distância, frequência cardíaca e calorias — de forma clara. Visualmente discreta, cabe bem na decoração.' },

  // --- spinning-sixxis-cardio (reviews novas de 2026-08-24, texto corrigido) ---
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Ricardo F.', titulo: 'Chegou embalada com capricho', comentario: 'Veio numa caixa reforçada, nada amassado apesar do peso. Consegui abrir e conferir as peças sem susto, tudo dentro do esperado.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Elenice M.', titulo: 'Guidão trava, mas exige um pouco de força pra ajustar', comentario: 'O guidão ajustável trava firme depois de regulado, só que preciso fazer uma certa força na trava pra soltar e reajustar. Uma vez travado, fica seguro.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Tarcísio V.', titulo: 'Volante de 8kg dá inércia boa pro treino', comentario: 'O volante de inércia de 8kg dá aquela sensação de pedalada contínua, sem parar de repente quando solto o pedal. Faz diferença no treino.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Grazi P.', titulo: 'Freio de emergência dá segurança', comentario: 'Uso o freio de emergência sempre que preciso parar rápido durante o treino mais puxado. Ela responde na hora, sem susto.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Wallace L.', titulo: 'Pilha não vem na caixa, um detalhe chato', comentario: 'O painel usa 2 pilhas AAA que não vêm inclusas, tive que comprar separado pra usar no mesmo dia. Fora isso, mostra tudo que preciso.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Ilma R.', titulo: 'Carenagem protege meu filho pequeno da correia', comentario: 'Tenho um filho pequeno em casa e a carenagem deixa a correia bem protegida, sem risco dele colocar a mão sem querer.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Douglas B.', titulo: 'Achei a altura máxima meio justa pra mim', comentario: 'Tenho quase 1,80m, no limite da altura máxima recomendada pela ficha técnica, e senti que o ajuste do guidão e do assento ficou meio no limite pra minha altura. Funciona, mas sem muita folga.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Sônia T.', titulo: 'Aguenta meu peso numa boa', comentario: 'Peso perto de 100kg e aguenta numa boa, dentro do limite de 120kg da ficha técnica. Estrutura firme, sem sinal de fraqueza.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Ederson G.', titulo: 'Odômetro ajuda a acompanhar evolução', comentario: 'O painel mostra velocidade, tempo, distância e calorias, e o odômetro ajuda bastante a acompanhar quanto já rodei desde que comprei. Motivação extra pro treino.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Fabrício Q.', titulo: 'Estrutura de aço não balança nem de pé', comentario: 'Pedalo de pé nos treinos mais intensos e a estrutura de aço não balança nem sacode. Sensação de firmeza total.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Neuza H.', titulo: 'Sem bluetooth, mas não fez falta pra mim', comentario: 'Sabia que não tinha bluetooth antes de comprar e realmente não senti falta, uso só o painel mesmo pra acompanhar o treino. Preço compensa a ausência.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Adalberto K.', titulo: 'Amortecedores do assento seguram bem', comentario: 'O assento ergonômico ajustável tem uns amortecedores que ajudam bastante nos treinos mais longos, não fico dolorido depois.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Valdir C.', titulo: 'Medidas cabem até em apartamento pequeno', comentario: 'Meu apartamento é pequeno e ela, com suas medidas montada de 88x46x113cm, cabe bem num cantinho da sala sem atrapalhar.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Gislaine D.', titulo: 'Dá pra ouvir a correia de perto, nada absurdo', comentario: 'A transmissão por correia é bem mais silenciosa que corrente, mas de bem perto dá pra ouvir um leve som. De longe nem percebo.' },
  { slug: 'spinning-sixxis-cardio', nomeAutor: 'Osmar R.', titulo: 'Pedalando todo dia sem enjoar', comentario: 'Já é rotina pedalar nela todo dia de manhã. A resistência mecânica dá pra variar o treino e não enjoa fácil.' },

  // --- spinning-sixxis-life (reviews novas de 2026-08-24, texto corrigido) ---
  { slug: 'spinning-sixxis-life', nomeAutor: 'Marcelo R.', titulo: '10 níveis dão pra variar bastante o treino', comentario: 'Os 10 níveis de resistência dão liberdade pra fazer treino leve de recuperação ou puxado de intervalo no mesmo dia, só ajustando na hora.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Vanuza S.', titulo: 'Sensor cardíaco bateu com meu relógio', comentario: 'Conferi o sensor cardíaco integrado com meu relógio esportivo e os números bateram certinho. Confio no dado que aparece no painel.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Célio T.', titulo: 'App reconhece a bike rápido', comentario: 'Testei os 3 aplicativos exclusivos e o reconhecimento foi rápido, sem ficar tentando conectar. Acompanho o treino direto pelo celular.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Adélia B.', titulo: 'Emagreci pedalando quase todo dia', comentario: 'Uso ela quase todo dia há uns meses e realmente senti a queima de calorias que prometem, cheguei a perder alguns quilos combinando com a dieta.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Miriam D.', titulo: 'Aguenta meu peso sem susto', comentario: 'Peso perto de 110kg e ela aguenta numa boa, dentro do limite de 120kg. Estrutura de aço não dá sinal de fraqueza.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Nilson P.', titulo: 'Cabe pessoa alta, uso com 1,88m', comentario: 'Tenho 1,88m e estava com receio de não caber direito, mas ajusta até a altura máxima de 190cm sem problema. Guidão e assento com bastante curso.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Ivanildo G.', titulo: 'Painel LED mostra tudo que preciso', comentario: 'O painel LED é simples mas mostra velocidade, distância, frequência cardíaca e calorias, que é exatamente o que acompanho no treino.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Cleuza N.', titulo: 'Pedal com tira segura bem o pé', comentario: 'As tiras de fixação dos pedais seguram bem o pé mesmo nos treinos mais intensos, sem escorregar.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Wagner Q.', titulo: 'Guidão ajusta rápido', comentario: 'O guidão ajustável é rápido de regular, encontro minha posição em segundos antes de começar o treino.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Rosane K.', titulo: 'Estrutura de aço não balança', comentario: 'Mesmo nos treinos de pé, a estrutura de aço de alta qualidade fica firme, sem balançar.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Toninho C.', titulo: 'Montagem levou um tempinho, mas o manual ajuda', comentario: 'A montagem demorou mais do que eu esperava, quase uma hora, mas o manual é bem detalhado e consegui sozinho sem complicação.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Delma W.', titulo: 'Assento ajustável resolveu meu desconforto', comentario: 'Tinha desconforto com bike de academia genérica, mas o assento ergonômico ajustável resolveu, consigo treinar bem mais tempo sem incômodo.' },
  { slug: 'spinning-sixxis-life', nomeAutor: 'Nívea R.', titulo: 'Silenciosa o suficiente pra treinar de madrugada', comentario: 'Pedalo antes das 6h sem acordar ninguém em casa. Ela é silenciosa o suficiente pra isso.' },

  // --- m45-trend (reviews novas de 2026-08-24, texto corrigido) ---
  { slug: 'm45-trend', nomeAutor: 'Osvaldo T.', titulo: 'Uso na oficina e os funcionários agradeceram', comentario: 'Coloquei esse climatizador na oficina onde trabalho e o ambiente ficou muito mais agradável no calor. Roda o expediente inteiro sem dar problema.' },
  { slug: 'm45-trend', nomeAutor: 'Genivaldo R.', titulo: 'Dei de presente pro meu pai e ele adorou', comentario: 'Meu pai sofria bastante com o calor no quarto dele. Resolveu e ele não teve dificuldade nenhuma pra usar no dia a dia, é bem simples.' },
  { slug: 'm45-trend', nomeAutor: 'Ivone C.', titulo: '15kg, mas dá pra mover sozinho', comentario: 'Pela ficha técnica achei que ia ser difícil de deslocar, mas na prática consigo levar da sala pro quarto sozinho sem esforço.' },
  { slug: 'm45-trend', nomeAutor: 'Anselmo D.', titulo: 'Painel evaporativo fácil de limpar', comentario: 'O painel evaporativo de 4cm é simples de remover pra lavar. Não fica com cheiro de mofo depois de um tempo, diferente de climatizador antigo que já tive.' },
  { slug: 'm45-trend', nomeAutor: 'Adelaide F.', titulo: 'Segurou o calorão do verão aqui em casa', comentario: 'Aqui bate fácil os 38 graus no verão e ele deu conta bem do meu quarto. Uso praticamente o dia todo e a diferença de temperatura é bem perceptível assim que entra no ambiente.' },
  { slug: 'm45-trend', nomeAutor: 'Wanderley S.', titulo: 'Ruído baixo, mas dá pra notar de perto', comentario: 'Cumpre o que promete de silêncio, mas bem de perto dá pra notar um zumbido do motor. De uma certa distância nem percebo mais.' },
  { slug: 'm45-trend', nomeAutor: 'Iracema G.', titulo: 'Caixa veio com um amasso, produto ok', comentario: 'A caixa chegou com um canto meio amassado no transporte, mas por dentro o climatizador estava intacto e ligou sem problema.' },
  { slug: 'm45-trend', nomeAutor: 'Belmiro N.', titulo: 'Bom, mas pro meu galpão não foi suficiente', comentario: 'Funciona bem dentro da cobertura indicada de até 45m². No meu galpão, que é bem maior que isso, o refresco ficou bem limitado. Pra ambiente residencial deve ser ótimo.' },
  { slug: 'm45-trend', nomeAutor: 'Cecília Q.', titulo: 'Não preciso ficar reabastecendo toda hora', comentario: 'O tanque de 45 litros segura bem, encho de manhã e não preciso mexer de novo até a noite. Bem prático pro dia a dia.' },
  { slug: 'm45-trend', nomeAutor: 'Amaro H.', titulo: 'Sala inteira ficou fresca', comentario: 'Minha sala tem uns 30m², dentro da cobertura indicada, e ele refresca de ponta a ponta. O alcance do fluxo de ar ajuda bastante a levar o vento mais longe.' },
  { slug: 'm45-trend', nomeAutor: 'Valter B.', titulo: 'Só 3 velocidades, mas já dá pra variar bem', comentario: 'Gostaria de mais opções de velocidade, mas as 3 já dão uma boa margem entre o modo mais suave e o mais forte. Não senti falta no dia a dia.' },
  { slug: 'm45-trend', nomeAutor: 'Neide M.', titulo: 'Oscilação horizontal automática ajuda muito', comentario: 'A oscilação horizontal automática distribui o ar pro quarto todo sem eu precisar ficar ajustando. Facilita bastante.' },
  { slug: 'm45-trend', nomeAutor: 'Josias L.', titulo: 'Oscilação vertical é manual, mas funciona bem', comentario: 'A oscilação vertical é ajustada na mão, não é automática, mas depois de regular do jeito que eu gosto nem mexo mais. Só um detalhe pra quem já sabia antes de comprar.' },
  { slug: 'm45-trend', nomeAutor: 'Aparecida R.', titulo: 'Controle é manual, sem remoto — bom saber antes de comprar', comentario: 'Não vem com controle remoto, é tudo no painel mesmo. Não é um problema porque fica do lado da cama, mas quem espera controle remoto vai se decepcionar.' },
  { slug: 'm45-trend', nomeAutor: 'Sebastião P.', titulo: 'Recomendo pra quem tem alergia', comentario: 'Minha esposa tem rinite e o ar mais úmido dele ajudou bastante a reduzir as crises comparado ao ar-condicionado seco que tínhamos antes.' },
]

// ---------------------------------------------------------------------------
async function corrigirClimatizadores() {
  console.log('\n--- 1) Climatizadores (templates) ---')
  for (const slug of CLIMA_SLUGS) {
    const produto = await prisma.produto.findUnique({ where: { slug }, select: { id: true, nome: true, especificacoes: true } })
    if (!produto) { console.log(`  [!] produto ${slug} não encontrado`); continue }
    let specs: EspecRow[] = []
    try {
      const raw = produto.especificacoes as unknown
      specs = Array.isArray(raw) ? (raw as EspecRow[]) : (typeof raw === 'string' ? JSON.parse(raw) : [])
    } catch { specs = [] }
    const ctx: ClimaCtx = {
      nome: produto.nome,
      cap: getSpec(specs, 'tanque') || getSpec(specs, 'capacidade'),
      cob: getSpec(specs, 'cobertura') || getSpec(specs, 'área'),
      volt: getSpec(specs, 'voltag'),
      vel: getSpec(specs, 'velocidade'),
    }
    const avs = await prisma.avaliacao.findMany({ where: { produtoId: produto.id }, select: { id: true, titulo: true } })
    let n = 0
    for (const av of avs) {
      if (!av.titulo || !CLIMA_FIX[av.titulo]) continue
      const novoComentario = CLIMA_FIX[av.titulo](ctx)
      n++
      if (!DRY) await prisma.avaliacao.update({ where: { id: av.id }, data: { comentario: novoComentario } })
    }
    console.log(`  [${slug}] ${n} review(s) corrigida(s)`)
  }
}

async function corrigirCardioOriginais() {
  console.log('\n--- 2) Spinning Sixxis Cardio (originais) ---')
  const produto = await prisma.produto.findUnique({ where: { slug: 'spinning-sixxis-cardio' }, select: { id: true } })
  if (!produto) { console.log('  [!] produto não encontrado'); return }
  const avs = await prisma.avaliacao.findMany({ where: { produtoId: produto.id }, select: { id: true, titulo: true } })
  let n = 0
  for (const av of avs) {
    if (!av.titulo || !BIKE_FIX[av.titulo]) continue
    n++
    if (!DRY) await prisma.avaliacao.update({ where: { id: av.id }, data: { comentario: BIKE_FIX[av.titulo] } })
  }
  console.log(`  [spinning-sixxis-cardio] ${n} review(s) corrigida(s)`)
}

async function corrigirHardcoded() {
  console.log('\n--- 3) Correções pontuais (produtoId + nomeAutor + titulo) ---')
  const slugs = [...new Set(HARDCODED_FIX.map((f) => f.slug))]
  const produtos = await prisma.produto.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } })
  const idBySlug = new Map(produtos.map((p) => [p.slug, p.id]))
  let n = 0, naoEncontrado = 0
  for (const fix of HARDCODED_FIX) {
    const produtoId = idBySlug.get(fix.slug)
    if (!produtoId) { console.log(`  [!] produto ${fix.slug} não encontrado`); continue }
    const av = await prisma.avaliacao.findFirst({
      where: { produtoId, nomeAutor: fix.nomeAutor, titulo: fix.titulo ?? undefined },
      select: { id: true },
    })
    if (!av) { console.log(`  [!] não encontrado: ${fix.slug} / ${fix.nomeAutor} / ${fix.titulo}`); naoEncontrado++; continue }
    n++
    if (!DRY) await prisma.avaliacao.update({ where: { id: av.id }, data: { comentario: fix.comentario } })
  }
  console.log(`  ${n} review(s) corrigida(s), ${naoEncontrado} não encontrada(s)`)
}

async function main() {
  await corrigirClimatizadores()
  await corrigirCardioOriginais()
  await corrigirHardcoded()
  console.log(DRY ? '\n[dry-run] nenhuma alteração gravada.' : '\n✅ Concluído.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
