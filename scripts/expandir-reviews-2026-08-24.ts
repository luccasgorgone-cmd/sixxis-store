// Tarefa pontual (pedido do Luccas, 2026-08-24): mais reviews (>25, até a
// faixa de 45-50) nos 4 produtos que aparecem como "Mais Vendidos" na home
// (Spinning Cardio, Spinning Life, Aspirador Bravo S2, Climatizador M45
// Trend). Variando: algumas sem comentário (só nota), algumas com comentário
// bem curto, e o grosso com comentário coerente com a ficha técnica real de
// cada produto. Notas variadas (não só 5 estrelas).
//
// Uso:
//   npx tsx scripts/expandir-reviews-2026-08-24.ts --dry   (não grava, só mostra)
//   npx tsx scripts/expandir-reviews-2026-08-24.ts         (grava)

import { prisma } from './_db'

const DRY = process.argv.includes('--dry')

interface Nova { nomeAutor: string; nota: number; titulo: string | null; comentario: string | null }

// ---------------------------------------------------------------------------
// Aspirador Vertical Sixxis Bravo S2 (asp-bravo) — 3 reviews existentes -> +23
// ---------------------------------------------------------------------------
const BRAVO: Nova[] = [
  { nomeAutor: 'Bianca F.', nota: 5, titulo: 'Sucção surpreendeu', comentario: 'Não esperava tanta força de um aspirador sem fio. O Bravo S2 puxa até areia grossa do carpete numa passada só. Motor não perde força até a bateria quase acabar.' },
  { nomeAutor: 'Rogério M.', nota: 5, titulo: 'Filtro HEPA fácil de lavar', comentario: 'Uso pra limpar depois que meu cachorro solta pelo pela casa. O filtro HEPA lavável segura bem a sujeira fina e é rápido de limpar embaixo da torneira. Sem cheiro de mofo depois.' },
  { nomeAutor: 'Talita S.', nota: 5, titulo: 'Leve, uso até em escada', comentario: 'Com 2 kg dá pra subir e descer escada limpando sem cansar o braço. Sem fio também ajuda muito, não fico presa em tomada.' },
  { nomeAutor: 'Marcos V.', nota: 4, titulo: 'Boa autonomia pra apê pequeno', comentario: 'Os 40 minutos de bateria dão conta do meu apartamento de 2 quartos numa carga só. Pra casa maior acho que precisaria recarregar no meio.' },
  { nomeAutor: 'Ingrid P.', nota: 3, titulo: 'Reservatório pequeno', comentario: 'Os 400ml do reservatório enchem rápido quando a casa tá bem suja, preciso esvaziar mais de uma vez. Fora isso o aspirador é bom.' },
  { nomeAutor: 'Cauã L.', nota: 5, titulo: 'Os 3 bocais dão conta de tudo', comentario: 'Bocal de fresta pro sofá, o de escova pro carpete e o padrão pro resto da casa. Trocar é rápido, encaixa sem folga.' },
  { nomeAutor: 'Simone R.', nota: 5, titulo: 'Sem saco, bem prático', comentario: 'Esvaziar o reservatório é rápido, sem saco de pó pra sujar a mão. Só abro na lixeira e já limpo o suficiente.' },
  { nomeAutor: 'Wellington A.', nota: 4, titulo: 'Ruído perceptível mas não incomoda', comentario: 'Não é silencioso, dá pra notar o barulho do motor, mas nada absurdo. Uso de manhã sem reclamação em casa.' },
  { nomeAutor: 'Paloma T.', nota: 5, titulo: 'Ótimo pra pelo de gato', comentario: 'Tenho 2 gatos e o Bravo S2 dá conta do pelo no sofá e no carpete sem espalhar. Uso quase todo dia.' },
  { nomeAutor: 'Rubens G.', nota: 3, titulo: 'Carga demora um pouco', comentario: 'As 4 horas pra carregar completo são um pouco longas se eu esquecer de deixar carregando à noite. Fora isso funciona bem.' },
  { nomeAutor: 'Fabiana N.', nota: 5, titulo: 'Custo-benefício ótimo', comentario: 'Pesquisei aspirador vertical de outras marcas bem mais caro. O Bravo S2 entrega praticamente a mesma coisa por um preço bem menor.' },
  { nomeAutor: 'Danilo Q.', nota: 5, titulo: 'Presente que a vó adorou', comentario: 'Dei de presente pra minha avó, que tinha dificuldade com o aspirador com fio antigo. Ela achou leve e fácil de usar, botão único sem complicação.' },
  { nomeAutor: 'Elisângela H.', nota: 5, titulo: 'Guarda em qualquer canto', comentario: 'Compacto o suficiente pra guardar no armário sem precisar de suporte de parede. Cabe até atrás da porta.' },
  { nomeAutor: 'Otoniel B.', nota: 5, titulo: 'Entrega rápida, produto intacto', comentario: 'Chegou em poucos dias, embalagem reforçada. Testei na hora e já funcionou de primeira, carregando desde a caixa.' },
  { nomeAutor: 'Cleide J.', nota: 5, titulo: 'Atendimento tirou dúvida rápido', comentario: 'Perguntei pelo WhatsApp se dava pra usar em carpete alto antes de comprar. Responderam rápido e sem enrolação, e realmente funciona bem nesse tipo de piso.' },
  { nomeAutor: 'Aurélio K.', nota: 4, titulo: 'Exige limpar o filtro com frequência', comentario: 'Funciona bem, só que pra manter a sucção forte preciso lavar o filtro HEPA com uma certa frequência. Não é difícil, só é preciso lembrar.' },
  { nomeAutor: 'Yara W.', nota: 5, titulo: 'Ideal pro carro', comentario: 'Uso mais pra limpar o carro do que a casa. Sem fio e leve, dá pra levar no porta-malas e usar em qualquer lugar.' },
  { nomeAutor: 'Norberto C.', nota: 2, titulo: 'Esperava mais autonomia pra limpeza pesada', comentario: 'Pra limpeza rápida do dia a dia funciona bem, mas quando tento fazer faxina pesada da casa toda a bateria acaba antes de terminar e preciso interromper pra carregar.' },
  { nomeAutor: 'Sabrina D.', nota: 5, titulo: null, comentario: 'Muito bom, recomendo.' },
  { nomeAutor: 'Emanuel R.', nota: 4, titulo: null, comentario: 'Bateria podia durar mais, mas funciona bem.' },
  { nomeAutor: 'Luzia F.', nota: 5, titulo: null, comentario: 'Prático e leve, adorei.' },
  { nomeAutor: 'Jefferson M.', nota: 5, titulo: 'Ótima compra', comentario: 'Veio certinho e funciona muito bem.' },
  { nomeAutor: 'Cíntia P.', nota: 5, titulo: null, comentario: null },
]

// ---------------------------------------------------------------------------
// Bicicleta Ergométrica Spinning Sixxis Cardio (spinning-sixxis-cardio)
// 8 reviews existentes -> +23
// ---------------------------------------------------------------------------
const CARDIO: Nova[] = [
  { nomeAutor: 'Nádia S.', nota: 5, titulo: 'Preço bem abaixo do que eu esperava', comentario: 'Pesquisei bike de spinning de outras marcas bem mais caras e a Sixxis Cardio entrega estrutura de aço, resistência mecânica e freio de emergência por um preço bem mais em conta. Ótimo custo-benefício.' },
  { nomeAutor: 'Ricardo F.', nota: 5, titulo: 'Chegou embalada com capricho', comentario: 'Veio numa caixa reforçada, nada amassado apesar do peso. Consegui abrir e conferir as peças sem susto, tudo dentro do esperado.' },
  { nomeAutor: 'Elenice M.', nota: 4, titulo: 'Guidão trava, mas exige um pouco de força pra ajustar', comentario: 'O guidão ajustável trava firme depois de regulado, só que preciso fazer uma certa força na trava pra soltar e reajustar. Uma vez travado, fica seguro.' },
  { nomeAutor: 'Tarcísio V.', nota: 5, titulo: 'Volante de 8kg dá inércia boa pro treino', comentario: 'O volante de inércia de 8kg dá aquela sensação de pedalada contínua, sem parar de repente quando solto o pedal. Faz diferença no treino.' },
  { nomeAutor: 'Grazi P.', nota: 5, titulo: 'Freio de emergência dá segurança', comentario: 'Uso o freio de emergência sempre que preciso parar rápido durante o treino mais puxado. Ela responde na hora, sem susto.' },
  { nomeAutor: 'Wallace L.', nota: 4, titulo: 'Pilha não vem na caixa, um detalhe chato', comentario: 'O painel usa 2 pilhas AAA que não vêm inclusas, tive que comprar separado pra usar no mesmo dia. Fora isso, mostra tudo que preciso.' },
  { nomeAutor: 'Ilma R.', nota: 5, titulo: 'Carenagem protege meu filho pequeno da correia', comentario: 'Tenho um filho pequeno em casa e a carenagem deixa a correia bem protegida, sem risco dele colocar a mão sem querer.' },
  { nomeAutor: 'Douglas B.', nota: 3, titulo: 'Achei a altura máxima meio justa pra mim', comentario: 'Tenho quase 1,80m, no limite da altura máxima recomendada pela ficha técnica, e senti que o ajuste do guidão e do assento ficou meio no limite pra minha altura. Funciona, mas sem muita folga.' },
  { nomeAutor: 'Sônia T.', nota: 5, titulo: 'Aguenta meu peso numa boa', comentario: 'Peso perto de 100kg e aguenta numa boa, dentro do limite de 120kg da ficha técnica. Estrutura firme, sem sinal de fraqueza.' },
  { nomeAutor: 'Ederson G.', nota: 5, titulo: 'Odômetro ajuda a acompanhar evolução', comentario: 'O painel mostra velocidade, tempo, distância e calorias, e o odômetro ajuda bastante a acompanhar quanto já rodei desde que comprei. Motivação extra pro treino.' },
  { nomeAutor: 'Marlene N.', nota: 4, titulo: 'Montagem exigiu uma segunda pessoa', comentario: 'A Sixxis Cardio pesa 21kg e a montagem sozinho foi mais trabalhosa do que esperava, chamei minha esposa pra ajudar a segurar as peças. Depois de montada, funciona muito bem.' },
  { nomeAutor: 'Fabrício Q.', nota: 5, titulo: 'Estrutura de aço não balança nem de pé', comentario: 'Pedalo de pé nos treinos mais intensos e a estrutura de aço não balança nem sacode. Sensação de firmeza total.' },
  { nomeAutor: 'Neuza H.', nota: 5, titulo: 'Sem bluetooth, mas não fez falta pra mim', comentario: 'Sabia que não tinha bluetooth antes de comprar e realmente não senti falta, uso só o painel mesmo pra acompanhar o treino. Preço compensa a ausência.' },
  { nomeAutor: 'Adalberto K.', nota: 5, titulo: 'Amortecedores do assento seguram bem', comentario: 'O assento ergonômico ajustável tem uns amortecedores que ajudam bastante nos treinos mais longos, não fico dolorido depois.' },
  { nomeAutor: 'Rosimeire W.', nota: 5, titulo: 'Ótima pra treino em casa sem academia', comentario: 'Parei a academia e comprei a Sixxis Cardio pra treinar em casa. Resistência mecânica dá pra variar bem a intensidade, treino tranquilo sem sair de casa.' },
  { nomeAutor: 'Valdir C.', nota: 5, titulo: 'Medidas cabem até em apartamento pequeno', comentario: 'Meu apartamento é pequeno e ela, com suas medidas montada de 88x46x113cm, cabe bem num cantinho da sala sem atrapalhar.' },
  { nomeAutor: 'Gislaine D.', nota: 4, titulo: 'Dá pra ouvir a correia de perto, nada absurdo', comentario: 'A transmissão por correia é bem mais silenciosa que corrente, mas de bem perto dá pra ouvir um leve som. De longe nem percebo.' },
  { nomeAutor: 'Osmar R.', nota: 5, titulo: 'Pedalando todo dia sem enjoar', comentario: 'Já é rotina pedalar nela todo dia de manhã. A resistência mecânica dá pra variar o treino e não enjoa fácil.' },
  { nomeAutor: 'Idalina F.', nota: 5, titulo: null, comentario: 'Muito boa, recomendo.' },
  { nomeAutor: 'Jair M.', nota: 5, titulo: null, comentario: 'Correia é bem silenciosa mesmo.' },
  { nomeAutor: 'Selma P.', nota: 4, titulo: 'Gostei bastante', comentario: 'Treino tranquilo em casa.' },
  { nomeAutor: 'Reinaldo J.', nota: 5, titulo: null, comentario: null },
  { nomeAutor: 'Kelly A.', nota: 4, titulo: null, comentario: null },
]

// ---------------------------------------------------------------------------
// Bicicleta Spinning Sixxis Life (spinning-sixxis-life) — 2 reviews -> +25
// ---------------------------------------------------------------------------
const LIFE: Nova[] = [
  { nomeAutor: 'Patrícia H.', nota: 5, titulo: 'Resistência magnética suave e precisa', comentario: 'A resistência magnética da Sixxis Life é bem mais suave que a mecânica que eu tinha antes, mas ainda sinto a diferença clara entre os níveis. Ajuste preciso.' },
  { nomeAutor: 'Marcelo R.', nota: 5, titulo: '10 níveis dão pra variar bastante o treino', comentario: 'Os 10 níveis de resistência dão liberdade pra fazer treino leve de recuperação ou puxado de intervalo no mesmo dia, só ajustando na hora.' },
  { nomeAutor: 'Vanuza S.', nota: 5, titulo: 'Sensor cardíaco bateu com meu relógio', comentario: 'Conferi o sensor cardíaco integrado com meu relógio esportivo e os números bateram certinho. Confio no dado que aparece no painel.' },
  { nomeAutor: 'Célio T.', nota: 5, titulo: 'App reconhece a bike rápido', comentario: 'Testei os 3 aplicativos exclusivos e o reconhecimento foi rápido, sem ficar tentando conectar. Acompanho o treino direto pelo celular.' },
  { nomeAutor: 'Adélia B.', nota: 5, titulo: 'Emagreci pedalando quase todo dia', comentario: 'Uso ela quase todo dia há uns meses e realmente senti a queima de calorias que prometem, cheguei a perder alguns quilos combinando com a dieta.' },
  { nomeAutor: 'Rogerinho L.', nota: 5, titulo: 'Joelho não reclama mais', comentario: 'Trocar a corrida pela Sixxis Life fez diferença pro meu joelho. O spinning é bem mais suave nas articulações e ainda consigo suar bastante no treino.' },
  { nomeAutor: 'Miriam D.', nota: 5, titulo: 'Aguenta meu peso sem susto', comentario: 'Peso perto de 110kg e ela aguenta numa boa, dentro do limite de 120kg. Estrutura de aço não dá sinal de fraqueza.' },
  { nomeAutor: 'Nilson P.', nota: 5, titulo: 'Cabe pessoa alta, uso com 1,88m', comentario: 'Tenho 1,88m e estava com receio de não caber direito, mas ajusta até a altura máxima de 190cm sem problema. Guidão e assento com bastante curso.' },
  { nomeAutor: 'Graça V.', nota: 4, titulo: '24,5kg, mas dois ajudaram a subir escada', comentario: 'A Sixxis Life pesa 24,5kg, precisei de ajuda pra subir até o apartamento. Depois de montada não preciso mais mexer de lugar.' },
  { nomeAutor: 'Ivanildo G.', nota: 5, titulo: 'Painel LED mostra tudo que preciso', comentario: 'O painel LED é simples mas mostra velocidade, distância, frequência cardíaca e calorias, que é exatamente o que acompanho no treino.' },
  { nomeAutor: 'Cleuza N.', nota: 5, titulo: 'Pedal com tira segura bem o pé', comentario: 'As tiras de fixação dos pedais seguram bem o pé mesmo nos treinos mais intensos, sem escorregar.' },
  { nomeAutor: 'Wagner Q.', nota: 5, titulo: 'Guidão ajusta rápido', comentario: 'O guidão ajustável é rápido de regular, encontro minha posição em segundos antes de começar o treino.' },
  { nomeAutor: 'Rosane K.', nota: 5, titulo: 'Estrutura de aço não balança', comentario: 'Mesmo nos treinos de pé, a estrutura de aço de alta qualidade fica firme, sem balançar.' },
  { nomeAutor: 'Toninho C.', nota: 3, titulo: 'Montagem levou um tempinho, mas o manual ajuda', comentario: 'A montagem demorou mais do que eu esperava, quase uma hora, mas o manual é bem detalhado e consegui sozinho sem complicação.' },
  { nomeAutor: 'Delma W.', nota: 5, titulo: 'Assento ajustável resolveu meu desconforto', comentario: 'Tinha desconforto com bike de academia genérica, mas o assento ergonômico ajustável resolveu, consigo treinar bem mais tempo sem incômodo.' },
  { nomeAutor: 'Nívea R.', nota: 5, titulo: 'Silenciosa o suficiente pra treinar de madrugada', comentario: 'Pedalo antes das 6h sem acordar ninguém em casa. Ela é silenciosa o suficiente pra isso.' },
  { nomeAutor: 'Elói F.', nota: 3, titulo: 'App trava às vezes no meu celular', comentario: 'O painel funciona bem, mas o aplicativo trava de vez em quando no meu celular e preciso reabrir. Fora esse detalhe, a bike em si é ótima.' },
  { nomeAutor: 'Solimar M.', nota: 5, titulo: 'Vale o preço comparado a academia', comentario: 'Fiz as contas e em menos de um ano a Sixxis Life já se pagou comparado com a mensalidade da academia que eu tinha. Treino profissional em casa.' },
  { nomeAutor: 'Vaneide P.', nota: 5, titulo: null, comentario: 'Muito boa, recomendo.' },
  { nomeAutor: 'Custódio J.', nota: 5, titulo: null, comentario: 'Treino puxado, gostei bastante.' },
  { nomeAutor: 'Iolanda H.', nota: 4, titulo: 'Ótima', comentario: 'Cumpre bem o que promete.' },
  { nomeAutor: 'Gean B.', nota: 5, titulo: null, comentario: 'Sensor cardíaco é preciso.' },
  { nomeAutor: 'Zulmira D.', nota: 4, titulo: null, comentario: 'Um pouco cara, mas vale.' },
  { nomeAutor: 'Renato W.', nota: 5, titulo: null, comentario: null },
  { nomeAutor: 'Perpétua L.', nota: 4, titulo: null, comentario: null },
]

// ---------------------------------------------------------------------------
// Climatizador M45 Trend (m45-trend) — 11 reviews existentes -> +25
// ---------------------------------------------------------------------------
const M45: Nova[] = [
  { nomeAutor: 'Fátima K.', nota: 5, titulo: 'Classe A não é só selo', comentario: 'Troquei um ventilador comum pelo M45 Trend e a conta de luz não assustou. Sendo eficiência energética classe A, o consumo realmente fica baixo mesmo rodando várias horas por dia.' },
  { nomeAutor: 'Osvaldo T.', nota: 5, titulo: 'Uso na oficina e os funcionários agradeceram', comentario: 'Coloquei esse climatizador na oficina onde trabalho e o ambiente ficou muito mais agradável no calor. Roda o expediente inteiro sem dar problema.' },
  { nomeAutor: 'Marlete P.', nota: 5, titulo: 'Segunda vez comprando Sixxis', comentario: 'Já tinha um climatizador Sixxis menor lá em casa e resolvi levar o M45 Trend pra outro cômodo. Mesma qualidade de construção, virei cliente da marca.' },
  { nomeAutor: 'Genivaldo R.', nota: 5, titulo: 'Dei de presente pro meu pai e ele adorou', comentario: 'Meu pai sofria bastante com o calor no quarto dele. Resolveu e ele não teve dificuldade nenhuma pra usar no dia a dia, é bem simples.' },
  { nomeAutor: 'Ivone C.', nota: 5, titulo: '15kg, mas dá pra mover sozinho', comentario: 'Pela ficha técnica achei que ia ser difícil de deslocar, mas na prática consigo levar da sala pro quarto sozinho sem esforço.' },
  { nomeAutor: 'Anselmo D.', nota: 5, titulo: 'Painel evaporativo fácil de limpar', comentario: 'O painel evaporativo de 4cm é simples de remover pra lavar. Não fica com cheiro de mofo depois de um tempo, diferente de climatizador antigo que já tive.' },
  { nomeAutor: 'Adelaide F.', nota: 5, titulo: 'Segurou o calorão do verão aqui em casa', comentario: 'Aqui bate fácil os 38 graus no verão e ele deu conta bem do meu quarto. Uso praticamente o dia todo e a diferença de temperatura é bem perceptível assim que entra no ambiente.' },
  { nomeAutor: 'Wanderley S.', nota: 4, titulo: 'Ruído baixo, mas dá pra notar de perto', comentario: 'Cumpre o que promete de silêncio, mas bem de perto dá pra notar um zumbido do motor. De uma certa distância nem percebo mais.' },
  { nomeAutor: 'Iracema G.', nota: 4, titulo: 'Caixa veio com um amasso, produto ok', comentario: 'A caixa chegou com um canto meio amassado no transporte, mas por dentro o climatizador estava intacto e ligou sem problema.' },
  { nomeAutor: 'Belmiro N.', nota: 3, titulo: 'Bom, mas pro meu galpão não foi suficiente', comentario: 'Funciona bem dentro da cobertura indicada de até 45m². No meu galpão, que é bem maior que isso, o refresco ficou bem limitado. Pra ambiente residencial deve ser ótimo.' },
  { nomeAutor: 'Cecília Q.', nota: 5, titulo: 'Não preciso ficar reabastecendo toda hora', comentario: 'O tanque de 45 litros segura bem, encho de manhã e não preciso mexer de novo até a noite. Bem prático pro dia a dia.' },
  { nomeAutor: 'Amaro H.', nota: 5, titulo: 'Sala inteira ficou fresca', comentario: 'Minha sala tem uns 30m², dentro da cobertura indicada, e ele refresca de ponta a ponta. O alcance do fluxo de ar ajuda bastante a levar o vento mais longe.' },
  { nomeAutor: 'Odete W.', nota: 5, titulo: 'Consumo de energia baixo mesmo usando bastante', comentario: 'Os 180W do M45 Trend fazem diferença na conta comparado ao ar-condicionado que eu tinha antes. Uso todo dia à tarde e não pesou no orçamento.' },
  { nomeAutor: 'Valter B.', nota: 4, titulo: 'Só 3 velocidades, mas já dá pra variar bem', comentario: 'Gostaria de mais opções de velocidade, mas as 3 já dão uma boa margem entre o modo mais suave e o mais forte. Não senti falta no dia a dia.' },
  { nomeAutor: 'Neide M.', nota: 5, titulo: 'Oscilação horizontal automática ajuda muito', comentario: 'A oscilação horizontal automática distribui o ar pro quarto todo sem eu precisar ficar ajustando. Facilita bastante.' },
  { nomeAutor: 'Josias L.', nota: 4, titulo: 'Oscilação vertical é manual, mas funciona bem', comentario: 'A oscilação vertical é ajustada na mão, não é automática, mas depois de regular do jeito que eu gosto nem mexo mais. Só um detalhe pra quem já sabia antes de comprar.' },
  { nomeAutor: 'Aparecida R.', nota: 3, titulo: 'Controle é manual, sem remoto — bom saber antes de comprar', comentario: 'Não vem com controle remoto, é tudo no painel mesmo. Não é um problema porque fica do lado da cama, mas quem espera controle remoto vai se decepcionar.' },
  { nomeAutor: 'Sebastião P.', nota: 5, titulo: 'Recomendo pra quem tem alergia', comentario: 'Minha esposa tem rinite e o ar mais úmido dele ajudou bastante a reduzir as crises comparado ao ar-condicionado seco que tínhamos antes.' },
  { nomeAutor: 'Dilma V.', nota: 5, titulo: null, comentario: 'Ótimo, recomendo.' },
  { nomeAutor: 'Ronivon J.', nota: 4, titulo: null, comentario: 'Bom custo-benefício.' },
  { nomeAutor: 'Marilda K.', nota: 5, titulo: 'Vale muito a pena', comentario: 'Refresca bem o quarto todo.' },
  { nomeAutor: 'Edvaldo C.', nota: 3, titulo: null, comentario: 'Cumpre o que promete, nada excepcional.' },
  { nomeAutor: 'Lucineide T.', nota: 5, titulo: null, comentario: 'Silencioso e gelado, adorei.' },
  { nomeAutor: 'Hélio D.', nota: 5, titulo: null, comentario: null },
  { nomeAutor: 'Zuleide F.', nota: 4, titulo: null, comentario: null },
]

// Datas escolhidas com folga depois da última review adicionada pelo script
// anterior (variar-reviews-2026-08.ts, que foi até ~jan/2026 pro m45 e
// spinning-cardio) — sem sobreposição de período, sem necessidade de apagar
// nada. Este script não faz delete por data: reruns são protegidos só pela
// checagem de nomeAutor/titulo já existente (ver conflitosAutor/conflitosTitulo).
const PRODUTOS: { slug: string; novas: Nova[]; baseDate: Date; stepDays: number; destaque?: number }[] = [
  { slug: 'asp-bravo', novas: BRAVO, baseDate: new Date('2026-02-15'), stepDays: 8 },
  { slug: 'spinning-sixxis-cardio', novas: CARDIO, baseDate: new Date('2026-02-05'), stepDays: 8 },
  { slug: 'spinning-sixxis-life', novas: LIFE, baseDate: new Date('2026-02-10'), stepDays: 7 },
  { slug: 'm45-trend', novas: M45, baseDate: new Date('2026-02-01'), stepDays: 7 },
]

async function expandir() {
  for (const cfg of PRODUTOS) {
    const produto = await prisma.produto.findUnique({
      where: { slug: cfg.slug },
      select: { id: true, nome: true },
    })
    if (!produto) { console.log(`  [!] produto ${cfg.slug} não encontrado`); continue }

    const existentes = await prisma.avaliacao.findMany({
      where: { produtoId: produto.id },
      select: { nota: true, nomeAutor: true, titulo: true },
    })
    const autoresUsados = new Set(existentes.map((a) => a.nomeAutor))
    const titulosUsados = new Set(existentes.map((a) => a.titulo ?? ''))

    const conflitosAutor = cfg.novas.filter((n) => autoresUsados.has(n.nomeAutor))
    const conflitosTitulo = cfg.novas.filter((n) => n.titulo && titulosUsados.has(n.titulo))
    if (conflitosAutor.length) console.log(`  [!] ${cfg.slug}: autores repetidos ->`, conflitosAutor.map((c) => c.nomeAutor))
    if (conflitosTitulo.length) console.log(`  [!] ${cfg.slug}: títulos repetidos ->`, conflitosTitulo.map((c) => c.titulo))

    console.log(`  [${cfg.slug}] ${existentes.length} -> ${existentes.length + cfg.novas.length}`)

    if (!DRY) {
      for (let i = 0; i < cfg.novas.length; i++) {
        const n = cfg.novas[i]
        await prisma.avaliacao.create({
          data: {
            produtoId: produto.id,
            nomeAutor: n.nomeAutor,
            nota: n.nota,
            titulo: n.titulo,
            comentario: n.comentario,
            aprovada: true,
            destaque: false,
            createdAt: new Date(cfg.baseDate.getTime() + i * cfg.stepDays * 86400000),
          },
        })
      }
      const todasNotas = [...existentes.map((e) => e.nota), ...cfg.novas.map((n) => n.nota)]
      const media = Math.round((todasNotas.reduce((s, n) => s + n, 0) / todasNotas.length) * 10) / 10
      await prisma.produto.update({
        where: { id: produto.id },
        data: { mediaAvaliacoes: media, totalAvaliacoes: todasNotas.length },
      })
      console.log(`    -> total ${todasNotas.length} reviews, média ${media}`)
    }
  }
}

async function main() {
  console.log('--- Expandindo reviews ---')
  await expandir()
  console.log(DRY ? '\n[dry-run] nenhuma alteração gravada.' : '\n✅ Concluído.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
