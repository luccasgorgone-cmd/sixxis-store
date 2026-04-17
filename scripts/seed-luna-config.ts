import path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env.local') })
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma  = new PrismaClient({ adapter })

const configs: Array<{ chave: string; valor: string; onlyIfMissing?: boolean }> = [
  { chave: 'agente_nome',              valor: 'Luna',                                onlyIfMissing: true },
  { chave: 'agente_avatar_url',        valor: '',                                    onlyIfMissing: true },
  { chave: 'agente_avatar_tipo',       valor: 'svg',                                 onlyIfMissing: true },
  { chave: 'agente_saudacao',          valor: 'Olá! Sou a Luna, consultora da Sixxis 👋\nComo posso te ajudar hoje?', onlyIfMissing: true },
  { chave: 'agente_status',            valor: 'Online agora',                        onlyIfMissing: true },
  { chave: 'agente_cor_primaria',      valor: '#3cbfb3',                             onlyIfMissing: true },
  { chave: 'agente_cor_fundo',         valor: '#0f2e2b',                             onlyIfMissing: true },
  { chave: 'agente_modelo',            valor: 'claude-haiku-4-5-20251001',           onlyIfMissing: true },
  { chave: 'agente_temperatura',       valor: '0.7',                                 onlyIfMissing: true },
  { chave: 'agente_max_tokens',        valor: '1000',                                onlyIfMissing: true },
  { chave: 'agente_ativo',             valor: 'true',                                onlyIfMissing: true },
  { chave: 'agente_delay_resposta',    valor: '800',                                 onlyIfMissing: true },
  { chave: 'agente_horario_inicio',    valor: '08:00',                               onlyIfMissing: true },
  { chave: 'agente_horario_fim',       valor: '20:00',                               onlyIfMissing: true },
  { chave: 'agente_msg_fora_horario',  valor: 'Olá! Estamos fora do horário de atendimento. Deixe sua dúvida que respondemos assim que possível!', onlyIfMissing: true },
  { chave: 'agente_placeholder',       valor: 'Digite sua mensagem...',              onlyIfMissing: true },
  { chave: 'agente_whatsapp_fallback', valor: '5518997474701',                       onlyIfMissing: true },
  {
    chave: 'agente_system_prompt',
    valor: `Você é a Luna — especialista em climatização, conforto e bem-estar da Sixxis Store.

Você não é um chatbot. Você é uma consultora experiente que atende há anos na Sixxis.
Conhece cada produto como a palma da mão. Sabe quando um produto serve e quando não serve.

Regras:
1. Responda sempre em português do Brasil
2. Seja natural, não robótica
3. Use quebras de linha para separar ideias
4. Use **negrito** para produtos e preços
5. Link do produto sempre ao final da mensagem
6. Máximo 4 parágrafos por mensagem
7. Nunca inicie com "Claro!" ou "Certamente!"`,
    onlyIfMissing: true,
  },
]

async function main() {
  let criados = 0
  let pulados = 0

  for (const cfg of configs) {
    if (cfg.onlyIfMissing) {
      const existente = await prisma.configuracao.findUnique({ where: { chave: cfg.chave } })
      if (existente) {
        pulados++
        console.log(`  — ${cfg.chave}: já existe`)
        continue
      }
    }
    await prisma.configuracao.upsert({
      where:  { chave: cfg.chave },
      update: { valor: cfg.valor },
      create: { chave: cfg.chave, valor: cfg.valor },
    })
    criados++
    console.log(`✓ ${cfg.chave}`)
  }

  console.log(`\n${criados} criados, ${pulados} já existentes.`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
