import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

// Load R2 URLs from upload output if available
let urlsR2: Record<string, { arquivo: string; url: string }[]> = {}
const urlsPath = path.join(process.cwd(), 'scripts', 'urls-r2.json')
if (fs.existsSync(urlsPath)) {
  urlsR2 = JSON.parse(fs.readFileSync(urlsPath, 'utf-8'))
  console.log('✅ Carregado scripts/urls-r2.json')
} else {
  console.log('⚠️  scripts/urls-r2.json não encontrado — usando URLs placeholder')
}

function getUrls(pasta: string): string[] {
  if (urlsR2[pasta] && urlsR2[pasta].length > 0) {
    return urlsR2[pasta].map(u => u.url)
  }
  // Return empty array — product images will be empty until uploaded
  return []
}

// ─── DESCRIPTIONS ─────────────────────────────────────────────────────────────

const DESC_M45 = `<div class="produto-hero">
  <h2>Climatizador Sixxis M45 Trend</h2>
  <p>Refresque seu espaço, eleve seu conforto. A solução econômica e eficiente para ambientes de até 45 m².</p>
</div>
<h2>Sobre o Produto</h2>
<p>
  Transforme sua experiência de conforto com o <strong>Climatizador M45 Sixxis</strong>! Desfrute de uma climatização eficiente, economize energia e desfrute de um ambiente fresco durante todo o ano. Com reservatório de <strong>45 litros</strong> e vazão de ar de <strong>5.500 m³/h</strong>, o M45 é o companheiro ideal para o seu lar.
</p>
<p>
  Diferente do ar-condicionado convencional, o climatizador umidifica e refresca o ar simultaneamente, sendo ideal para regiões com clima seco. Com consumo <strong>90% menor que um ar-condicionado</strong>, você mantém o ambiente agradável sem pesar na conta de luz.
</p>
<h2>Principais Benefícios</h2>
<ul>
  <li>Refresca e umidifica o ar simultaneamente, combatendo o ressecamento</li>
  <li>Consumo 90% menor que ar-condicionado convencional</li>
  <li>Reservatório de 45 litros com alto rendimento</li>
  <li>3 velocidades de ventilação ajustáveis</li>
  <li>Filtro ANTI-PÓ com colmeias de 4 cm remove impurezas do ar</li>
  <li>Oscilação vertical automática para distribuição uniforme do ar</li>
  <li>Oscilação horizontal manual</li>
  <li>Rodízios reforçados para mobilidade total</li>
  <li>Design moderno e elegante</li>
  <li>Operação silenciosa abaixo de 60 dB</li>
</ul>
<h2>Características Técnicas</h2>
<ul>
  <li><strong>Cor:</strong> Preto e Branco</li>
  <li><strong>Vazão de Ar:</strong> 5.500 m³/h</li>
  <li><strong>Potência:</strong> 180 W</li>
  <li><strong>Capacidade do Tanque:</strong> 45 L</li>
  <li><strong>Área do Ambiente:</strong> Até 45 m²</li>
  <li><strong>Nível de Ruído:</strong> &lt;60 dB</li>
  <li><strong>Velocidades:</strong> 3</li>
  <li><strong>Consumo de Água:</strong> 4 a 6 L/h</li>
</ul>
<div class="garantia-block">
  <h3>Garantia Sixxis</h3>
  <p>O <strong>Climatizador M45 Trend</strong> possui <strong>12 meses de garantia</strong> contra defeitos de fabricação. Suporte técnico especializado via WhatsApp. Sixxis — mais de 30 anos de experiência em climatização.</p>
</div>`

const DESC_SX060 = `<div class="produto-hero">
  <h2>Climatizador Sixxis SX060 Prime</h2>
  <p>Resfresque seu ambiente, amplie seu conforto. Tecnologia Prime para ambientes de até 60 m² com 9 velocidades de ventilação.</p>
</div>
<h2>Sobre o Produto</h2>
<p>
  Explore uma nova dimensão de conforto com o <strong>Climatizador SX060 Prime Sixxis</strong>! Com <strong>60 litros de capacidade</strong>, <strong>9 velocidades</strong> e inversor integrado, o SX060 Prime entrega climatização eficaz enquanto economiza energia em todas as estações.
</p>
<p>
  O sistema <strong>Prime</strong> combina motor Inversor com Corrente Alternada, garantindo maior eficiência energética e controle preciso de velocidade. A vazão de <strong>6.000 m³/h</strong> garante ar fresco em todo o ambiente.
</p>
<h2>Principais Benefícios</h2>
<ul>
  <li>Motor Inversor + Corrente Alternada para máxima eficiência</li>
  <li>9 velocidades de ventilação para controle preciso</li>
  <li>Reservatório de 60 litros — menos enchimentos, mais conforto</li>
  <li>Filtragem ANTI-PÓ com colmeias de 4 cm</li>
  <li>Controle remoto incluso</li>
  <li>Oscilação vertical automática</li>
  <li>90% mais econômico que ar-condicionado convencional</li>
  <li>Indicador frontal de nível de água</li>
  <li>Rodízios reforçados para mobilidade</li>
  <li>Operação silenciosa abaixo de 60 dB</li>
</ul>
<h2>Características Técnicas</h2>
<ul>
  <li><strong>Cor:</strong> Preto e Branco</li>
  <li><strong>Vazão de Ar:</strong> 6.000 m³/h</li>
  <li><strong>Potência:</strong> 125 W + Inversor &amp; Corrente Alternada</li>
  <li><strong>Capacidade do Tanque:</strong> 60 L</li>
  <li><strong>Área do Ambiente:</strong> Até 60 m²</li>
  <li><strong>Nível de Ruído:</strong> &lt;60 dB</li>
  <li><strong>Velocidades:</strong> 9</li>
  <li><strong>Consumo de Água:</strong> 4 a 6 L/h</li>
</ul>
<div class="garantia-block">
  <h3>Garantia Sixxis</h3>
  <p>O <strong>Climatizador SX060 Prime</strong> possui <strong>12 meses de garantia</strong> contra defeitos de fabricação. Sixxis — mais de 30 anos de experiência em climatização.</p>
</div>`

const DESC_SX070 = `<div class="produto-hero">
  <h2>Climatizador Sixxis SX070 Trend</h2>
  <p>O conforto e eficiência que você merece. Potente, silencioso e econômico para ambientes de até 70 m².</p>
</div>
<h2>Sobre o Produto</h2>
<p>
  Eleve seu conforto e bem-estar com o <strong>Climatizador SX070 Trend Sixxis</strong>! Com reservatório de <strong>70 litros</strong> e vazão de <strong>8.000 m³/h</strong>, o SX070 entrega climatização eficiente, economia de energia e ar fresco em todas as estações.
</p>
<p>
  Ideal para salas de estar, escritórios e ambientes comerciais de médio porte. Seu sistema de filtragem ANTI-PÓ remove impurezas, garantindo um ambiente mais saudável para toda a família.
</p>
<h2>Principais Benefícios</h2>
<ul>
  <li>Reservatório de 70 litros para uso prolongado</li>
  <li>Vazão de 8.000 m³/h para ambientes de até 70 m²</li>
  <li>3 velocidades de ventilação ajustáveis</li>
  <li>Controle remoto incluso para operação à distância</li>
  <li>Filtro ANTI-PÓ com colmeias de 4 cm</li>
  <li>Oscilação vertical automática e horizontal manual</li>
  <li>90% mais econômico que ar-condicionado</li>
  <li>Rodízios reforçados para mobilidade total</li>
  <li>Design elegante e moderno</li>
  <li>Operação silenciosa abaixo de 60 dB</li>
</ul>
<h2>Características Técnicas</h2>
<ul>
  <li><strong>Cor:</strong> Preto e Branco</li>
  <li><strong>Vazão de Ar:</strong> 8.000 m³/h</li>
  <li><strong>Potência:</strong> 280 W</li>
  <li><strong>Capacidade do Tanque:</strong> 70 L</li>
  <li><strong>Área do Ambiente:</strong> Até 70 m²</li>
  <li><strong>Nível de Ruído:</strong> &lt;60 dB</li>
  <li><strong>Velocidades:</strong> 3</li>
  <li><strong>Consumo de Água:</strong> 4 a 6 L/h</li>
</ul>
<div class="garantia-block">
  <h3>Garantia Sixxis</h3>
  <p>O <strong>Climatizador SX070 Trend</strong> possui <strong>12 meses de garantia</strong>. Sixxis — mais de 30 anos de experiência em climatização.</p>
</div>`

const DESC_SX100 = `<div class="produto-hero">
  <h2>Climatizador Sixxis SX100 Trend</h2>
  <p>Resfresque seu ambiente, amplie seu conforto. Alta capacidade para ambientes de até 120 m².</p>
</div>
<h2>Sobre o Produto</h2>
<p>
  Explore uma nova dimensão de conforto com o <strong>Climatizador SX100 Trend Sixxis</strong>! Com <strong>100 litros de capacidade</strong> e vazão de <strong>12.000 m³/h</strong>, o SX100 é a solução perfeita para ambientes amplos como lojas, galpões e salões de festas.
</p>
<p>
  Com potência de <strong>400W</strong> e 3 velocidades de ventilação, garante climatização rápida e eficaz mesmo nos dias mais quentes. O filtro ANTI-PÓ com colmeias de 4 cm purifica o ar enquanto você refresca o ambiente.
</p>
<h2>Principais Benefícios</h2>
<ul>
  <li>Reservatório de 100 litros para uso intensivo</li>
  <li>Vazão de 12.000 m³/h cobre até 120 m²</li>
  <li>Potência de 400W para máxima refrigeração</li>
  <li>3 velocidades de ventilação</li>
  <li>Controle remoto incluso</li>
  <li>Filtro ANTI-PÓ com colmeias de 4 cm</li>
  <li>Oscilação vertical automática</li>
  <li>90% mais econômico que ar-condicionado convencional</li>
  <li>Ideal para ambientes comerciais e industriais</li>
  <li>Rodízios reforçados com trava</li>
</ul>
<h2>Características Técnicas</h2>
<ul>
  <li><strong>Cor:</strong> Preto e Branco</li>
  <li><strong>Vazão de Ar:</strong> 12.000 m³/h</li>
  <li><strong>Potência:</strong> 400 W</li>
  <li><strong>Capacidade do Tanque:</strong> 100 L</li>
  <li><strong>Área do Ambiente:</strong> Até 120 m²</li>
  <li><strong>Nível de Ruído:</strong> &lt;60 dB</li>
  <li><strong>Velocidades:</strong> 3</li>
  <li><strong>Consumo de Água:</strong> 4 a 6 L/h</li>
</ul>
<div class="garantia-block">
  <h3>Garantia Sixxis</h3>
  <p>O <strong>Climatizador SX100 Trend</strong> possui <strong>12 meses de garantia</strong>. Sixxis — mais de 30 anos de experiência em climatização.</p>
</div>`

const DESC_SX120 = `<div class="produto-hero">
  <h2>Climatizador Sixxis SX120 Prime</h2>
  <p>A potência Prime para grandes ambientes. 9 velocidades, 120 litros e cobertura de até 140 m².</p>
</div>
<h2>Sobre o Produto</h2>
<p>
  Explore uma nova dimensão de conforto com o <strong>Climatizador SX120 Prime Sixxis</strong>! Com <strong>120 litros de capacidade</strong>, <strong>9 velocidades</strong> e vazão de <strong>14.000 m³/h</strong>, o SX120 Prime é a escolha profissional para grandes ambientes comerciais e industriais.
</p>
<p>
  A linha <strong>Prime</strong> oferece controle preciso de velocidade e máxima eficiência energética. Ideal para galpões, salões de eventos, fábricas e grandes espaços comerciais que precisam de refrigeração de alto desempenho.
</p>
<h2>Principais Benefícios</h2>
<ul>
  <li>9 velocidades de ventilação para controle preciso</li>
  <li>Reservatório de 120 litros para uso contínuo</li>
  <li>Vazão de 14.000 m³/h cobre até 140 m²</li>
  <li>Potência de 450W para máxima eficiência</li>
  <li>Controle remoto incluso</li>
  <li>Filtro ANTI-PÓ com colmeias de 4 cm</li>
  <li>Oscilação vertical automática e horizontal manual</li>
  <li>90% mais econômico que ar-condicionado convencional</li>
  <li>Estrutura robusta com rodízios industriais</li>
  <li>Operação silenciosa abaixo de 60 dB</li>
</ul>
<h2>Características Técnicas</h2>
<ul>
  <li><strong>Cor:</strong> Preto e Branco</li>
  <li><strong>Vazão de Ar:</strong> 14.000 m³/h</li>
  <li><strong>Potência:</strong> 450 W</li>
  <li><strong>Capacidade do Tanque:</strong> 120 L</li>
  <li><strong>Área do Ambiente:</strong> Até 140 m²</li>
  <li><strong>Nível de Ruído:</strong> &lt;60 dB</li>
  <li><strong>Velocidades:</strong> 9</li>
  <li><strong>Consumo de Água:</strong> 4 a 6 L/h</li>
</ul>
<div class="garantia-block">
  <h3>Garantia Sixxis</h3>
  <p>O <strong>Climatizador SX120 Prime</strong> possui <strong>12 meses de garantia</strong>. Sixxis — mais de 30 anos de experiência em climatização.</p>
</div>`

const DESC_SX200_PRIME = `<div class="produto-hero">
  <h2>Climatizador Sixxis SX200 Prime</h2>
  <p>O ápice da climatização evaporativa. 50 velocidades, 200 litros e cobertura de até 250 m².</p>
</div>
<h2>Sobre o Produto</h2>
<p>
  Explore uma nova dimensão de conforto com o <strong>Climatizador SX200 Prime Sixxis</strong>! Com <strong>200 litros de capacidade</strong>, <strong>50 velocidades</strong> e vazão impressionante de <strong>25.000 m³/h</strong>, o SX200 Prime é o maior e mais potente climatizador evaporativo da Sixxis.
</p>
<p>
  Com motor <strong>1100W + Inversor &amp; Corrente Alternada</strong>, o SX200 Prime oferece controle total sobre o ambiente. Disponível nas cores <strong>Branco</strong> e <strong>Preto</strong>, com design premium que combina com qualquer ambiente corporativo ou industrial.
</p>
<h2>Principais Benefícios</h2>
<ul>
  <li>50 velocidades para controle absoluto da climatização</li>
  <li>Reservatório de 200 litros para uso contínuo</li>
  <li>Vazão de 25.000 m³/h cobre até 250 m²</li>
  <li>Motor 1100W com Inversor e Corrente Alternada</li>
  <li>Disponível em Branco e Preto</li>
  <li>Controle remoto incluso</li>
  <li>Filtro ANTI-PÓ com colmeias de 4 cm</li>
  <li>Oscilação vertical automática e horizontal manual</li>
  <li>90% mais econômico que ar-condicionado convencional</li>
  <li>Estrutura industrial com rodízios reforçados</li>
</ul>
<h2>Características Técnicas</h2>
<ul>
  <li><strong>Cores disponíveis:</strong> Branco, Preto</li>
  <li><strong>Vazão de Ar:</strong> 25.000 m³/h</li>
  <li><strong>Potência:</strong> 1100W + Inversor &amp; Corrente Alternada</li>
  <li><strong>Capacidade do Tanque:</strong> 200 L</li>
  <li><strong>Área do Ambiente:</strong> Até 250 m²</li>
  <li><strong>Nível de Ruído:</strong> &lt;60 dB</li>
  <li><strong>Velocidades:</strong> 50</li>
  <li><strong>Consumo de Água:</strong> 4 a 6 L/h</li>
</ul>
<div class="garantia-block">
  <h3>Garantia Sixxis</h3>
  <p>O <strong>Climatizador SX200 Prime</strong> possui <strong>12 meses de garantia</strong>. Sixxis — mais de 30 anos de experiência em climatização.</p>
</div>`

const DESC_SX200_TREND = `<div class="produto-hero">
  <h2>Climatizador Sixxis SX200 Trend</h2>
  <p>Alta capacidade para grandes espaços. 175 litros e cobertura de até 200 m² com excelente custo-benefício.</p>
</div>
<h2>Sobre o Produto</h2>
<p>
  Explore uma nova dimensão de conforto com o <strong>Climatizador SX200 Trend Sixxis</strong>! Com <strong>175 litros de capacidade</strong> e vazão de <strong>20.000 m³/h</strong>, o SX200 Trend oferece performance de alto nível para grandes ambientes comerciais e industriais.
</p>
<p>
  Com potência de <strong>750W</strong> e 3 velocidades, o SX200 Trend entrega climatização eficaz e econômica. Ideal para galpões, pavilhões, lojas e salões que precisam de refrigeração de grande escala.
</p>
<h2>Principais Benefícios</h2>
<ul>
  <li>Reservatório de 175 litros para uso intensivo contínuo</li>
  <li>Vazão de 20.000 m³/h cobre até 200 m²</li>
  <li>Potência de 750W com controle de 3 velocidades</li>
  <li>Controle remoto incluso</li>
  <li>Filtro ANTI-PÓ com colmeias de 4 cm</li>
  <li>Oscilação vertical automática e horizontal manual</li>
  <li>90% mais econômico que ar-condicionado convencional</li>
  <li>Estrutura robusta com rodízios reforçados</li>
  <li>Design moderno em Preto e Branco</li>
  <li>Operação silenciosa abaixo de 60 dB</li>
</ul>
<h2>Características Técnicas</h2>
<ul>
  <li><strong>Cor:</strong> Preto e Branco</li>
  <li><strong>Vazão de Ar:</strong> 20.000 m³/h</li>
  <li><strong>Potência:</strong> 750 W</li>
  <li><strong>Capacidade do Tanque:</strong> 175 L</li>
  <li><strong>Área do Ambiente:</strong> Até 200 m²</li>
  <li><strong>Nível de Ruído:</strong> &lt;60 dB</li>
  <li><strong>Velocidades:</strong> 3</li>
  <li><strong>Consumo de Água:</strong> 4 a 6 L/h</li>
</ul>
<div class="garantia-block">
  <h3>Garantia Sixxis</h3>
  <p>O <strong>Climatizador SX200 Trend</strong> possui <strong>12 meses de garantia</strong>. Sixxis — mais de 30 anos de experiência em climatização.</p>
</div>`

const DESC_ASPIRADOR = `<div class="produto-hero">
  <h2>Aspirador Sixxis Bravo S2</h2>
  <p>O mais potente aspirador sem fio da Sixxis. Limpeza impecável para casa, apartamento e veículo.</p>
</div>
<h2>Sobre o Produto</h2>
<p>
  Experimente a conveniência e a potência do <strong>Aspirador de Pó Sem Fio Bravo S2 Sixxis</strong>, projetado para uma limpeza impecável e sem esforço ou fios. O mais potente entre os aspiradores de pó sem fio!
</p>
<p>
  Com <strong>poder de sucção de 14.000 KPa</strong>, bateria de lítio de longa duração e <strong>filtro HEPA lavável</strong>, o Bravo S2 elimina até a sujeira mais resistente de pisos, carpetes, estofados e veículos.
</p>
<h2>Principais Benefícios</h2>
<ul>
  <li>Poder de sucção de 14.000 KPa — o mais potente da categoria</li>
  <li>Sem fio — liberdade total de movimento</li>
  <li>Bateria de lítio 14.8V com até 40 minutos de autonomia</li>
  <li>Filtro HEPA lavável para ambiente mais saudável</li>
  <li>Capacidade do reservatório: 400 ml</li>
  <li>Inclui 3 bocais para diferentes tipos de limpeza</li>
  <li>Base de carga inclusa</li>
  <li>Design ergonômico e compacto</li>
  <li>Coletor sem saco — fácil de esvaziar e limpar</li>
  <li>Eficiência energética classe A</li>
</ul>
<h2>Características Técnicas</h2>
<ul>
  <li><strong>Modelo:</strong> Bravo S2</li>
  <li><strong>Poder de Sucção:</strong> 14.000 KPa</li>
  <li><strong>Capacidade:</strong> 400 ml</li>
  <li><strong>Voltagem da Bateria:</strong> 14,8V (bateria de lítio)</li>
  <li><strong>Duração da Bateria:</strong> 40 minutos</li>
  <li><strong>Tempo de Carga:</strong> 4 horas</li>
  <li><strong>Nível de Ruído:</strong> 70 dBa</li>
  <li><strong>Peso:</strong> 2 kg</li>
  <li><strong>Dimensões:</strong> 107 × 26,3 × 15 cm</li>
</ul>
<h2>Itens Inclusos</h2>
<ul>
  <li>1 Aspirador de Pó 2 em 1</li>
  <li>1 Bateria de Lítio</li>
  <li>1 Base de Carga</li>
  <li>3 Bocais para diferentes limpezas</li>
  <li>1 Manual de Instruções</li>
</ul>
<div class="garantia-block">
  <h3>Garantia Sixxis</h3>
  <p>O <strong>Aspirador Bravo S2</strong> possui <strong>12 meses de garantia</strong> contra defeitos de fabricação. Sixxis — mais de 30 anos de experiência em produtos para conforto e bem-estar.</p>
</div>`

const DESC_BIKE = `<div class="produto-hero">
  <h2>Spinning Sixxis Life</h2>
  <p>Performance e inovação para o seu treino. A bicicleta spinning semi-profissional exclusiva no Brasil.</p>
</div>
<h2>Sobre o Produto</h2>
<p>
  Descubra a <strong>Spinning Sixxis Life</strong>: a bicicleta de spinning semi-profissional que redefine seu treino. Exclusiva no Brasil, combina funcionalidades avançadas e design moderno para entusiastas do fitness que buscam qualidade superior.
</p>
<p>
  Com <strong>volante de inércia de 16 kg</strong>, sistema de resistência magnética e painel LED completo, a Sixxis Life oferece uma experiência de treino próxima ao ciclismo profissional.
</p>
<h2>Principais Benefícios</h2>
<ul>
  <li><strong>Painel LED:</strong> Acesso imediato a velocidade, distância, batimento cardíaco e calorias</li>
  <li><strong>3 Aplicativos Exclusivos:</strong> Personalize treinos, explore trilhas virtuais e participe de competições online</li>
  <li><strong>Construção em Aço de Alta Qualidade:</strong> Durabilidade e resistência para desafiar seus limites</li>
  <li><strong>Guidão Ajustável:</strong> Adapte a posição para máximo conforto durante o treino</li>
  <li><strong>Assento Ergonômico:</strong> Design para suporte durante longas sessões de treino</li>
  <li><strong>Pedais com Tiras de Fixação:</strong> Segurança nos pés durante treino intenso</li>
  <li><strong>Resistência Magnética:</strong> Pedalada suave, silenciosa e com ajuste preciso</li>
  <li><strong>Monitoramento Cardíaco:</strong> Sensores integrados para frequência cardíaca</li>
  <li>Suporta até 120 kg</li>
  <li>Altura máxima do usuário: 190 cm</li>
</ul>
<h2>Características Técnicas</h2>
<ul>
  <li><strong>Tipo:</strong> Spinning Semi-Profissional</li>
  <li><strong>Peso Máximo Suportado:</strong> 120 kg</li>
  <li><strong>Peso do Volante de Inércia:</strong> 16 kg</li>
  <li><strong>Tipo de Resistência:</strong> Magnética e Mecânica</li>
  <li><strong>Peso do Equipamento:</strong> 24,5 kg</li>
  <li><strong>Dimensões:</strong> 74 × 134 × 47 cm (C × A × L)</li>
  <li><strong>Altura Máxima do Usuário:</strong> 190 cm</li>
</ul>
<div class="garantia-block">
  <h3>Garantia Sixxis</h3>
  <p>A <strong>Spinning Sixxis Life</strong> possui <strong>12 meses de garantia</strong>. Sixxis — mais de 30 anos de experiência em fitness e bem-estar.</p>
</div>`

// ─── SPECS ────────────────────────────────────────────────────────────────────

const SPECS_M45 = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Modelo', valor: 'M45 Trend' },
  { label: 'Capacidade do Tanque', valor: '45 L' },
  { label: 'Vazão de Ar', valor: '5.500 m³/h' },
  { label: 'Potência', valor: '180 W' },
  { label: 'Cobertura', valor: 'Até 45 m²' },
  { label: 'Velocidades', valor: '3' },
  { label: 'Consumo de Água', valor: '4 a 6 L/h' },
  { label: 'Nível de Ruído', valor: '<60 dB' },
  { label: 'Tipo de Ventilação', valor: 'Hélice' },
  { label: 'Oscilação Vertical', valor: 'Automática' },
  { label: 'Oscilação Horizontal', valor: 'Manual' },
  { label: 'Filtro', valor: 'ANTI-PÓ com Colmeias 4 cm' },
  { label: 'Eficiência Energética', valor: 'A' },
  { label: 'Peso', valor: '15 kg' },
  { label: 'Dimensões', valor: '42 × 105 × 52 cm' },
  { label: 'Cor', valor: 'Preto e Branco' },
  { label: 'Garantia', valor: '12 meses' },
]

const SPECS_SX060 = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Modelo', valor: 'SX060 Prime' },
  { label: 'Capacidade do Tanque', valor: '60 L' },
  { label: 'Vazão de Ar', valor: '6.000 m³/h' },
  { label: 'Potência', valor: '125 W + Inversor & CA' },
  { label: 'Cobertura', valor: 'Até 60 m²' },
  { label: 'Velocidades', valor: '9' },
  { label: 'Consumo de Água', valor: '4 a 6 L/h' },
  { label: 'Nível de Ruído', valor: '<60 dB' },
  { label: 'Tipo de Ventilação', valor: 'Hélice' },
  { label: 'Oscilação Vertical', valor: 'Automática' },
  { label: 'Oscilação Horizontal', valor: 'Manual' },
  { label: 'Filtro', valor: 'ANTI-PÓ com Colmeias 4 cm' },
  { label: 'Controle Remoto', valor: 'Incluso' },
  { label: 'Eficiência Energética', valor: 'A' },
  { label: 'Peso', valor: '22 kg' },
  { label: 'Dimensões', valor: '39 × 100 × 59 cm' },
  { label: 'Cor', valor: 'Preto e Branco' },
  { label: 'Garantia', valor: '12 meses' },
]

const SPECS_SX070 = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Modelo', valor: 'SX070 Trend' },
  { label: 'Capacidade do Tanque', valor: '70 L' },
  { label: 'Vazão de Ar', valor: '8.000 m³/h' },
  { label: 'Potência', valor: '280 W' },
  { label: 'Cobertura', valor: 'Até 70 m²' },
  { label: 'Velocidades', valor: '3' },
  { label: 'Consumo de Água', valor: '4 a 6 L/h' },
  { label: 'Nível de Ruído', valor: '<60 dB' },
  { label: 'Tipo de Ventilação', valor: 'Hélice' },
  { label: 'Oscilação Vertical', valor: 'Automática' },
  { label: 'Oscilação Horizontal', valor: 'Manual' },
  { label: 'Filtro', valor: 'ANTI-PÓ com Colmeias 4 cm' },
  { label: 'Controle Remoto', valor: 'Incluso' },
  { label: 'Eficiência Energética', valor: 'A' },
  { label: 'Peso', valor: '18 kg' },
  { label: 'Dimensões', valor: '60 × 115 × 41 cm' },
  { label: 'Cor', valor: 'Preto e Branco' },
  { label: 'Garantia', valor: '12 meses' },
]

const SPECS_SX100 = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Modelo', valor: 'SX100 Trend' },
  { label: 'Capacidade do Tanque', valor: '100 L' },
  { label: 'Vazão de Ar', valor: '12.000 m³/h' },
  { label: 'Potência', valor: '400 W' },
  { label: 'Cobertura', valor: 'Até 120 m²' },
  { label: 'Velocidades', valor: '3' },
  { label: 'Consumo de Água', valor: '4 a 6 L/h' },
  { label: 'Nível de Ruído', valor: '<60 dB' },
  { label: 'Tipo de Ventilação', valor: 'Hélice' },
  { label: 'Oscilação Vertical', valor: 'Automática' },
  { label: 'Oscilação Horizontal', valor: 'Manual' },
  { label: 'Filtro', valor: 'ANTI-PÓ com Colmeias 4 cm' },
  { label: 'Controle Remoto', valor: 'Incluso' },
  { label: 'Eficiência Energética', valor: 'A' },
  { label: 'Peso', valor: '24,5 kg' },
  { label: 'Dimensões', valor: '47 × 134 × 74 cm' },
  { label: 'Cor', valor: 'Preto e Branco' },
  { label: 'Garantia', valor: '12 meses' },
]

const SPECS_SX120 = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Modelo', valor: 'SX120 Prime' },
  { label: 'Capacidade do Tanque', valor: '120 L' },
  { label: 'Vazão de Ar', valor: '14.000 m³/h' },
  { label: 'Potência', valor: '450 W' },
  { label: 'Cobertura', valor: 'Até 140 m²' },
  { label: 'Velocidades', valor: '9' },
  { label: 'Consumo de Água', valor: '4 a 6 L/h' },
  { label: 'Nível de Ruído', valor: '<60 dB' },
  { label: 'Tipo de Ventilação', valor: 'Hélice' },
  { label: 'Oscilação Vertical', valor: 'Automática' },
  { label: 'Oscilação Horizontal', valor: 'Manual' },
  { label: 'Filtro', valor: 'ANTI-PÓ com Colmeias 4 cm' },
  { label: 'Controle Remoto', valor: 'Incluso' },
  { label: 'Eficiência Energética', valor: 'A' },
  { label: 'Peso', valor: '42 kg' },
  { label: 'Dimensões', valor: '49 × 127 × 92 cm' },
  { label: 'Cor', valor: 'Preto e Branco' },
  { label: 'Garantia', valor: '12 meses' },
]

const SPECS_SX200_PRIME = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Modelo', valor: 'SX200 Prime' },
  { label: 'Capacidade do Tanque', valor: '200 L' },
  { label: 'Vazão de Ar', valor: '25.000 m³/h' },
  { label: 'Potência', valor: '1100W + Inversor & CA' },
  { label: 'Cobertura', valor: 'Até 250 m²' },
  { label: 'Velocidades', valor: '50' },
  { label: 'Consumo de Água', valor: '4 a 6 L/h' },
  { label: 'Nível de Ruído', valor: '<60 dB' },
  { label: 'Tipo de Ventilação', valor: 'Hélice' },
  { label: 'Oscilação Vertical', valor: 'Automática' },
  { label: 'Oscilação Horizontal', valor: 'Manual' },
  { label: 'Filtro', valor: 'ANTI-PÓ com Colmeias 4 cm' },
  { label: 'Controle Remoto', valor: 'Incluso' },
  { label: 'Eficiência Energética', valor: 'A' },
  { label: 'Peso', valor: '65 kg' },
  { label: 'Dimensões', valor: '70 × 150 × 90 cm' },
  { label: 'Cores Disponíveis', valor: 'Branco, Preto' },
  { label: 'Garantia', valor: '12 meses' },
]

const SPECS_SX200_TREND = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Modelo', valor: 'SX200 Trend' },
  { label: 'Capacidade do Tanque', valor: '175 L' },
  { label: 'Vazão de Ar', valor: '20.000 m³/h' },
  { label: 'Potência', valor: '750 W' },
  { label: 'Cobertura', valor: 'Até 200 m²' },
  { label: 'Velocidades', valor: '3' },
  { label: 'Consumo de Água', valor: '4 a 6 L/h' },
  { label: 'Nível de Ruído', valor: '<60 dB' },
  { label: 'Tipo de Ventilação', valor: 'Hélice' },
  { label: 'Oscilação Vertical', valor: 'Automática' },
  { label: 'Oscilação Horizontal', valor: 'Manual' },
  { label: 'Filtro', valor: 'ANTI-PÓ com Colmeias 4 cm' },
  { label: 'Controle Remoto', valor: 'Incluso' },
  { label: 'Eficiência Energética', valor: 'A' },
  { label: 'Peso', valor: '45 kg' },
  { label: 'Dimensões', valor: '54 × 138 × 85 cm' },
  { label: 'Cor', valor: 'Preto e Branco' },
  { label: 'Garantia', valor: '12 meses' },
]

const SPECS_ASPIRADOR = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Modelo', valor: 'Bravo S2' },
  { label: 'Tipo', valor: 'Vertical de Mão Sem Fio' },
  { label: 'Poder de Sucção', valor: '14.000 KPa' },
  { label: 'Capacidade do Reservatório', valor: '400 ml' },
  { label: 'Voltagem da Bateria', valor: '14,8V' },
  { label: 'Tipo de Bateria', valor: 'Lítio' },
  { label: 'Duração da Bateria', valor: '40 minutos' },
  { label: 'Tempo de Carga', valor: '4 horas' },
  { label: 'Filtro', valor: 'HEPA Lavável' },
  { label: 'Tipo de Coletor', valor: 'Sem Saco' },
  { label: 'Bocais Inclusos', valor: '3 bocais' },
  { label: 'Nível de Ruído', valor: '70 dBa' },
  { label: 'Eficiência Energética', valor: 'A' },
  { label: 'Peso', valor: '2 kg' },
  { label: 'Dimensões', valor: '107 × 26,3 × 15 cm' },
  { label: 'Cor', valor: 'Preto' },
  { label: 'Garantia', valor: '12 meses' },
]

const SPECS_BIKE = [
  { label: 'Marca', valor: 'Sixxis' },
  { label: 'Modelo', valor: 'Spinning Sixxis Life' },
  { label: 'Tipo', valor: 'Spinning Semi-Profissional' },
  { label: 'Peso Máximo Suportado', valor: '120 kg' },
  { label: 'Peso do Volante de Inércia', valor: '16 kg' },
  { label: 'Tipo de Resistência', valor: 'Magnética e Mecânica' },
  { label: 'Painel', valor: 'LED — Velocidade, Distância, FC, Calorias' },
  { label: 'Aplicativos', valor: '3 aplicativos exclusivos' },
  { label: 'Guidão', valor: 'Ajustável' },
  { label: 'Assento', valor: 'Ergonômico ajustável' },
  { label: 'Pedais', valor: 'Com tiras de fixação' },
  { label: 'Sensor Cardíaco', valor: 'Integrado' },
  { label: 'Altura Máxima do Usuário', valor: '190 cm' },
  { label: 'Peso do Equipamento', valor: '24,5 kg' },
  { label: 'Dimensões', valor: '74 × 134 × 47 cm' },
  { label: 'Cor', valor: 'Preta' },
  { label: 'Material', valor: 'Aço de alta qualidade' },
  { label: 'Garantia', valor: '12 meses' },
]

// ─── AVALIACOES HELPERS ───────────────────────────────────────────────────────

function makeAvaliacoes(params: {
  produto: string
  media: number
  count: number
}) {
  const { produto, media, count } = params

  // Template reviews pools by rating
  const reviews5 = [
    { nome: 'Marcos Antônio S.', titulo: 'Melhor compra que fiz esse ano!', comentario: `Comprei o ${produto} para o meu escritório e a diferença foi imediata. Chegou bem embalado, em 3 dias úteis. Instalei sozinho sem dificuldade. O nível de ruído é realmente baixo. Recomendo demais!` },
    { nome: 'Fernanda C.', titulo: 'Superou minhas expectativas', comentario: `O ${produto} é incrível! Minha sala estava insuportável no verão. Que diferença! Entrega foi rápida e o produto chegou perfeito. Atendimento da Sixxis muito bom também.` },
    { nome: 'Ricardo P.', titulo: 'Produto de qualidade', comentario: `Já é o segundo que compro da Sixxis. Qualidade consistente e entrega rápida. O ${produto} encaixou perfeitamente no meu espaço. Vale cada centavo.` },
    { nome: 'Ana Paula M.', titulo: 'Amei demais!', comentario: `Recebi em 2 dias, achei que ia demorar mais. Montar foi fácil. Altamente recomendo o ${produto} pra quem mora em cidade quente.` },
    { nome: 'José Carlos B.', titulo: 'Vale muito o investimento', comentario: `Coloquei no meu negócio. Clientes adoraram, disseram que o ambiente ficou muito mais agradável. Ótimo produto e entrega rápida.` },
    { nome: 'Priscila R.', titulo: 'Chegou antes do prazo!', comentario: `Fiz o pedido na sexta e chegou na segunda. O ${produto} é exatamente como descrito. Muito satisfeita com a compra.` },
    { nome: 'Thiago L.', titulo: 'Produto incrível', comentario: `Comprei depois de pesquisar muito e não me arrependi. Recomendo para quem quer economizar na conta de luz e ter conforto de verdade.` },
    { nome: 'Camila F.', titulo: 'Muito bom mesmo', comentario: `O design é bonito e combinou com a decoração. Chegou em perfeito estado, embalagem muito boa. 5 estrelas com certeza.` },
    { nome: 'Roberto A.', titulo: 'Refresca de verdade', comentario: `Já tinha comprado de outra marca e não ficava satisfeito. O ${produto} é outro nível. Silencioso, econômico e eficiente.` },
    { nome: 'Larissa O.', titulo: 'Adorei a compra', comentario: `Minha primeira compra na Sixxis e já virei cliente fiel. Produto chegou bem protegido, sem nenhuma avaria. Nota 10!` },
    { nome: 'Douglas M.', titulo: 'Excelente custo-benefício', comentario: `Pra quem não quer gastar uma fortuna, esse produto é a solução. Economizo muito e o ambiente fica muito confortável.` },
    { nome: 'Beatriz S.', titulo: 'Top demais', comentario: `Comprei pra minha mãe que tava sofrendo com o calor. Ela amou! Fácil de usar e entrega foi rápida e bem cuidada.` },
    { nome: 'Alessandro P.', titulo: 'Produto conforme anunciado', comentario: `Recebi exatamente o que estava descrito. Bem embalado, com nota fiscal e manual em português. Funcionou de primeira.` },
    { nome: 'Renata C.', titulo: 'Perfeito!', comentario: `Aqui na minha cidade o calor é terrível e esse produto salvou a minha vida. Muito satisfeita com a compra e com o atendimento da Sixxis.` },
    { nome: 'Fábio N.', titulo: 'Chegou intacto', comentario: `Embalagem reforçada, produto sem nenhum problema. Já tô usando há 2 meses sem nenhuma queixa. Ótima compra.` },
    { nome: 'Viviane K.', titulo: 'Muito melhor que esperava', comentario: `O suporte da Sixxis foi excelente, me explicaram tudo antes da compra. O produto chegou rápido e funciona perfeitamente.` },
    { nome: 'Paulo H.', titulo: 'Recomendo sem hesitar', comentario: `Terceira vez que compro produto Sixxis. Qualidade consistente, entrega rápida e suporte sempre disponível.` },
    { nome: 'Mariana T.', titulo: 'Show de bola', comentario: `Fiz o pedido num domingo e chegou na quarta. Já instalei e tô adorando. Nota 10 pra Sixxis.` },
    { nome: 'Cláudio E.', titulo: 'Produto de primeira linha', comentario: `Qualidade excelente. Acabamento impecável, sem nenhuma rebarba ou defeito estético. Entrega foi dentro do prazo.` },
    { nome: 'Simone V.', titulo: 'Satisfeita demais', comentario: `Meu marido ficou super satisfeito. O produto é lindo, moderno e funciona muito bem. Com certeza comprarei mais produtos Sixxis.` },
    { nome: 'Gabriel M.', titulo: 'Superou expectativas', comentario: `Nunca tinha comprado produto Sixxis antes. Fiquei impressionado com a qualidade e o atendimento. Com certeza voltarei a comprar.` },
    { nome: 'Natália B.', titulo: 'Melhor investimento', comentario: `Perfeito para o meu espaço. Chegou rápido, bem embalado. Produto de qualidade superior. Recomendo a todos!` },
  ]

  const reviews4 = [
    { nome: 'Guilherme A.', titulo: 'Bom produto, entrega demorou um pouco', comentario: `O ${produto} é muito bom, cumpre o que promete. Tirei uma estrela porque a entrega demorou mais que o esperado. Mas o produto em si é excelente.` },
    { nome: 'Sandra L.', titulo: 'Produto ótimo, manual poderia ser melhor', comentario: `Funciona muito bem. A minha única observação é que o manual de instruções poderia ser mais detalhado. No geral é ótimo.` },
    { nome: 'Wellington R.', titulo: 'Boa compra', comentario: `Produto funciona bem, cumpre o que promete. Estou satisfeito no geral. Entrega foi rápida.` },
  ]

  const reviews3 = [
    { nome: 'Leandro F.', titulo: 'Bom mas esperava um pouco mais', comentario: `O produto funciona bem para o uso que indico. A qualidade de construção é boa e o atendimento foi ótimo.` },
  ]

  // Build list based on desired media
  const result = []
  let dateBase = new Date('2025-06-01')

  // For media ~5.0: mostly 5 stars
  // For media ~4.8: mostly 5, few 4
  // For media ~4.6-4.7: mix of 5 and 4, one 3

  let num5, num4, num3
  if (media >= 5.0) {
    num5 = count; num4 = 0; num3 = 0
  } else if (media >= 4.8) {
    num3 = 0; num4 = Math.ceil(count * 0.1); num5 = count - num4
  } else if (media >= 4.7) {
    num3 = 0; num4 = Math.ceil(count * 0.15); num5 = count - num4
  } else {
    num3 = 1; num4 = Math.ceil(count * 0.16); num5 = count - num4 - num3
  }

  for (let i = 0; i < num5; i++) {
    const r = reviews5[i % reviews5.length]
    dateBase = new Date(dateBase.getTime() + 7 * 24 * 60 * 60 * 1000)
    result.push({ nomeAutor: r.nome, nota: 5, titulo: r.titulo, comentario: r.comentario, aprovada: true, destaque: i < 3, createdAt: new Date(dateBase) })
  }
  for (let i = 0; i < num4; i++) {
    const r = reviews4[i % reviews4.length]
    dateBase = new Date(dateBase.getTime() + 5 * 24 * 60 * 60 * 1000)
    result.push({ nomeAutor: r.nome, nota: 4, titulo: r.titulo, comentario: r.comentario, aprovada: true, destaque: false, createdAt: new Date(dateBase) })
  }
  for (let i = 0; i < num3; i++) {
    const r = reviews3[i % reviews3.length]
    dateBase = new Date(dateBase.getTime() + 3 * 24 * 60 * 60 * 1000)
    result.push({ nomeAutor: r.nome, nota: 3, titulo: r.titulo, comentario: r.comentario, aprovada: true, destaque: false, createdAt: new Date(dateBase) })
  }

  return result
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function upsertProduto(data: {
  erpProdutoId: string
  nome: string
  slug: string
  descricao: string
  preco: number
  categoria: string
  modelo: string
  sku: string
  imagens: string[]
  temVariacoes: boolean
  variacoes: { nome: string; preco?: number }[]
  especificacoes: { label: string; valor: string }[]
  mediaAvaliacoes: number
  destaque?: boolean
  imagensPorVariacao?: Record<string, string[]>
}) {
  console.log(`\n📦 Upserting: ${data.nome}`)

  // Check if exists
  let produto = await prisma.produto.findFirst({
    where: {
      OR: [
        { slug: data.slug },
        { erpProdutoId: data.erpProdutoId },
      ],
    },
  })

  const produtoData = {
    erpProdutoId: data.erpProdutoId,
    nome: data.nome,
    slug: data.slug,
    descricao: data.descricao,
    preco: data.preco,
    categoria: data.categoria,
    modelo: data.modelo,
    sku: data.sku,
    imagens: data.imagens,
    temVariacoes: data.temVariacoes,
    especificacoes: data.especificacoes,
    mediaAvaliacoes: data.mediaAvaliacoes,
    totalAvaliacoes: 25,
    estoque: data.temVariacoes ? 0 : 10,
    ativo: true,
    imagensPorVariacao: data.imagensPorVariacao ?? null,
  }

  if (produto) {
    await prisma.produto.update({ where: { id: produto.id }, data: produtoData })
    console.log(`  ✅ Atualizado (id: ${produto.id})`)
  } else {
    produto = await prisma.produto.create({ data: produtoData })
    console.log(`  ✅ Criado (id: ${produto.id})`)
  }

  // Upsert variacoes
  if (data.variacoes.length > 0) {
    for (const v of data.variacoes) {
      const varSku = `${data.sku}-${v.nome.replace(/\s+/g, '-')}`
      const existing = await prisma.variacaoProduto.findFirst({
        where: { produtoId: produto.id, nome: v.nome },
      })
      if (existing) {
        await prisma.variacaoProduto.update({
          where: { id: existing.id },
          data: { sku: varSku, estoque: 10, ativo: true, preco: v.preco ?? null },
        })
      } else {
        await prisma.variacaoProduto.create({
          data: { produtoId: produto.id, nome: v.nome, sku: varSku, estoque: 10, ativo: true, preco: v.preco ?? null },
        })
      }
    }
    console.log(`  ✅ ${data.variacoes.length} variações atualizadas`)
  }

  // Add destaque
  if (data.destaque) {
    const existeDestaque = await prisma.produtoDestaque.findFirst({
      where: { produtoId: produto.id, secao: 'mais-vendidos' },
    })
    if (!existeDestaque) {
      await prisma.produtoDestaque.create({
        data: { produtoId: produto.id, secao: 'mais-vendidos', ordem: 0 },
      })
      console.log(`  ✅ Adicionado aos destaques`)
    }
  }

  // Add avaliacoes
  const avaliacoesExist = await prisma.avaliacao.count({ where: { produtoId: produto.id } })
  if (avaliacoesExist === 0) {
    const avs = makeAvaliacoes({ produto: data.nome, media: data.mediaAvaliacoes, count: 25 })
    for (const av of avs) {
      await prisma.avaliacao.create({ data: { produtoId: produto.id, ...av } })
    }
    console.log(`  ✅ 25 avaliações criadas`)
  } else {
    console.log(`  ⏩ Avaliações já existem (${avaliacoesExist})`)
  }

  return produto
}

async function updateSX040Images() {
  const produto = await prisma.produto.findFirst({
    where: {
      OR: [
        { slug: 'sx040' },
        { slug: { contains: 'sx040' } },
        { nome: { contains: 'SX040' } },
      ],
    },
  })
  if (!produto) { console.log('  ⚠️  SX040 não encontrado no banco'); return }

  const imgs = getUrls('SX040')
  if (imgs.length > 0) {
    await prisma.produto.update({ where: { id: produto.id }, data: { imagens: imgs } })
    console.log(`  ✅ SX040 imagens atualizadas (${imgs.length})`)
  } else {
    console.log(`  ⚠️  SX040: sem imagens R2 disponíveis — imagens não atualizadas`)
  }
}

async function main() {
  console.log('🚀 Iniciando seed de produtos novos...\n')

  // M45
  await upsertProduto({
    erpProdutoId: 'erp-m45-trend-001',
    nome: 'Climatizador M45 Trend',
    slug: 'm45-trend',
    descricao: DESC_M45,
    preco: 1000,
    categoria: 'climatizadores',
    modelo: 'M45 Trend',
    sku: 'CLIM-M45-TREND',
    imagens: getUrls('M45'),
    temVariacoes: true,
    variacoes: [{ nome: '110V' }, { nome: '220V' }],
    especificacoes: SPECS_M45,
    mediaAvaliacoes: 4.6,
    destaque: false,
  })

  // SX060
  await upsertProduto({
    erpProdutoId: 'erp-sx060-prime-001',
    nome: 'Climatizador SX060 Prime',
    slug: 'sx060-prime',
    descricao: DESC_SX060,
    preco: 2750,
    categoria: 'climatizadores',
    modelo: 'SX060 Prime',
    sku: 'CLIM-SX060-PRIME',
    imagens: getUrls('sx060'),
    temVariacoes: true,
    variacoes: [{ nome: '110V' }, { nome: '220V' }],
    especificacoes: SPECS_SX060,
    mediaAvaliacoes: 5.0,
    destaque: true,
  })

  // SX070
  await upsertProduto({
    erpProdutoId: 'erp-sx070-trend-001',
    nome: 'Climatizador SX070 Trend',
    slug: 'sx070-trend',
    descricao: DESC_SX070,
    preco: 1900,
    categoria: 'climatizadores',
    modelo: 'SX070 Trend',
    sku: 'CLIM-SX070-TREND',
    imagens: getUrls('SX70'),
    temVariacoes: true,
    variacoes: [{ nome: '110V' }, { nome: '220V' }],
    especificacoes: SPECS_SX070,
    mediaAvaliacoes: 4.7,
    destaque: false,
  })

  // SX100
  await upsertProduto({
    erpProdutoId: 'erp-sx100-trend-001',
    nome: 'Climatizador SX100 Trend',
    slug: 'sx100-trend',
    descricao: DESC_SX100,
    preco: 2900,
    categoria: 'climatizadores',
    modelo: 'SX100 Trend',
    sku: 'CLIM-SX100-TREND',
    imagens: getUrls('SX100'),
    temVariacoes: true,
    variacoes: [{ nome: '110V' }, { nome: '220V' }],
    especificacoes: SPECS_SX100,
    mediaAvaliacoes: 4.8,
    destaque: false,
  })

  // SX120
  await upsertProduto({
    erpProdutoId: 'erp-sx120-prime-001',
    nome: 'Climatizador SX120 Prime',
    slug: 'sx120-prime',
    descricao: DESC_SX120,
    preco: 4750,
    categoria: 'climatizadores',
    modelo: 'SX120 Prime',
    sku: 'CLIM-SX120-PRIME',
    imagens: getUrls('SX120'),
    temVariacoes: true,
    variacoes: [{ nome: '220V' }],
    especificacoes: SPECS_SX120,
    mediaAvaliacoes: 5.0,
    destaque: true,
  })

  // SX200 PRIME — with imagensPorVariacao (Branco/Preto)
  const imgsBranco = getUrls('SX200 PRIME')
  const imgsPreto = getUrls('SX200 Prime - Preto')
  const todasImgsSX200Prime = [...imgsBranco, ...imgsPreto]
  const imagensPorVariacaoSX200 = imgsBranco.length > 0 || imgsPreto.length > 0
    ? { Branco: imgsBranco, Preto: imgsPreto }
    : undefined

  await upsertProduto({
    erpProdutoId: 'erp-sx200-prime-001',
    nome: 'Climatizador SX200 Prime',
    slug: 'sx200-prime',
    descricao: DESC_SX200_PRIME,
    preco: 8500,
    categoria: 'climatizadores',
    modelo: 'SX200 Prime',
    sku: 'CLIM-SX200-PRIME',
    imagens: todasImgsSX200Prime.length > 0 ? todasImgsSX200Prime : imgsBranco,
    temVariacoes: true,
    variacoes: [{ nome: 'Branco', preco: 8500 }, { nome: 'Preto', preco: 9250 }],
    especificacoes: SPECS_SX200_PRIME,
    mediaAvaliacoes: 5.0,
    destaque: true,
    imagensPorVariacao: imagensPorVariacaoSX200,
  })

  // SX200 Trend
  await upsertProduto({
    erpProdutoId: 'erp-sx200-trend-001',
    nome: 'Climatizador SX200 Trend',
    slug: 'sx200-trend',
    descricao: DESC_SX200_TREND,
    preco: 5750,
    categoria: 'climatizadores',
    modelo: 'SX200 Trend',
    sku: 'CLIM-SX200-TREND',
    imagens: getUrls('SX200 Trend'),
    temVariacoes: true,
    variacoes: [{ nome: '110V' }, { nome: '220V' }],
    especificacoes: SPECS_SX200_TREND,
    mediaAvaliacoes: 4.7,
    destaque: false,
  })

  // ASPIRADOR
  await upsertProduto({
    erpProdutoId: 'erp-asp-bravo-001',
    nome: 'Aspirador Bravo',
    slug: 'asp-bravo',
    descricao: DESC_ASPIRADOR,
    preco: 500,
    categoria: 'outros',
    modelo: 'Bravo S2',
    sku: 'ASPIRA-BRAVO',
    imagens: getUrls('ASPIRADOR'),
    temVariacoes: false,
    variacoes: [],
    especificacoes: SPECS_ASPIRADOR,
    mediaAvaliacoes: 4.7,
    destaque: false,
  })

  // BIKE LIFE
  await upsertProduto({
    erpProdutoId: 'erp-spinning-life-001',
    nome: 'Spinning Sixxis Life',
    slug: 'spinning-sixxis-life',
    descricao: DESC_BIKE,
    preco: 2950,
    categoria: 'outros',
    modelo: 'Spinning Life',
    sku: 'BIKE-SIXXIS-LIFE',
    imagens: getUrls('BIKE LIFE'),
    temVariacoes: false,
    variacoes: [],
    especificacoes: SPECS_BIKE,
    mediaAvaliacoes: 4.8,
    destaque: false,
  })

  // SX040: update images only
  console.log('\n🔄 Atualizando imagens do SX040...')
  await updateSX040Images()

  console.log('\n🎉 Seed concluído com sucesso!')
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
