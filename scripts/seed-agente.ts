import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

const configsAgente = [
  { chave: 'agente_ativo',            valor: 'true' },
  { chave: 'agente_nome',             valor: 'Luna' },
  { chave: 'agente_saudacao',         valor: 'Olá! Sou a Luna, assistente da Sixxis 👋 Como posso te ajudar hoje?' },
  { chave: 'agente_cor_primaria',     valor: '#3cbfb3' },
  { chave: 'agente_cor_secundaria',   valor: '#0f2e2b' },
  { chave: 'agente_modelo',           valor: 'claude-haiku-4-5-20251001' },
  { chave: 'agente_max_tokens',       valor: '400' },
  { chave: 'agente_temperatura',      valor: '0.7' },
  { chave: 'agente_whatsapp_vendas',  valor: '5518997474701' },
  { chave: 'agente_whatsapp_suporte', valor: '5511934102621' },
  { chave: 'agente_system_prompt',    valor: '' },
]

async function main() {
  for (const cfg of configsAgente) {
    await prisma.configuracao.upsert({
      where:  { chave: cfg.chave },
      update: { valor: cfg.valor },
      create: { chave: cfg.chave, valor: cfg.valor },
    })
    console.log(`✓ ${cfg.chave}`)
  }
  console.log('\nConfigs do agente inseridas com sucesso!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
