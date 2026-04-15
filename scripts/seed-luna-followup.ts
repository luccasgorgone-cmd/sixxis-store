import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

async function main() {
  const defaults = [
    { chave: 'agente_followup_ativo', valor: 'true' },
    { chave: 'agente_followup_delay_1', valor: '30' },
    { chave: 'agente_followup_mensagem_1', valor: 'Ficou alguma dúvida sobre o produto que indiquei? Posso também calcular o frete até você — é só me informar o CEP. 😊' },
    { chave: 'agente_followup_delay_2', valor: '30' },
    { chave: 'agente_followup_mensagem_2', valor: 'Se preferir falar com nossa equipe diretamente, estamos disponíveis pelo WhatsApp: (18) 99747-4701. Foi um prazer atender você!' },
    { chave: 'agente_encerramento_auto', valor: 'true' },
    { chave: 'agente_mensagem_encerramento', valor: '👋 Encerrando o atendimento por inatividade. Se precisar de ajuda, é só abrir o chat novamente.' },
  ]
  for (const d of defaults) {
    await prisma.configuracao.upsert({
      where: { chave: d.chave },
      update: {},
      create: { chave: d.chave, valor: d.valor },
    })
    console.log(`✅ ${d.chave}: ${d.valor}`)
  }
  await prisma.$disconnect()
}
main()
