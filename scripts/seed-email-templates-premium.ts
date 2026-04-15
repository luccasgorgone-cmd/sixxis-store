// Atualiza os assuntos dos email templates para o padrão profissional premium
// Executar: npx tsx scripts/seed-email-templates-premium.ts

import { prisma } from '../src/lib/prisma'

const ASSUNTOS_PREMIUM = [
  {
    tipo: 'boas_vindas',
    assunto: 'Bem-vindo(a) à Sixxis, {{nome}}! Seu cupom de boas-vindas está aqui',
  },
  {
    tipo: 'confirmacao_pedido',
    assunto: 'Pedido #{{pedido_id}} confirmado — Obrigado, {{nome}}!',
  },
  {
    tipo: 'pedido_enviado',
    assunto: 'Seu pedido #{{pedido_id}} está a caminho!',
  },
  {
    tipo: 'abandono_carrinho',
    assunto: '{{nome}}, seu carrinho ainda está esperando',
  },
  {
    tipo: 'followup_entrega',
    assunto: 'Como foi a entrega do seu pedido, {{nome}}?',
  },
  {
    tipo: 'cupom_especial',
    assunto: 'Um cupom exclusivo para você, {{nome}}',
  },
  {
    tipo: 'volta_estoque',
    assunto: '{{produto_nome}} está disponível novamente!',
  },
  {
    tipo: 'solicitacao_avaliacao',
    assunto: 'Avalie seu pedido {{pedido_id}} e ajude outros clientes',
  },
]

async function main() {
  console.log('🔄 Atualizando assuntos dos email templates...\n')

  for (const t of ASSUNTOS_PREMIUM) {
    const result = await prisma.emailTemplate.updateMany({
      where: { tipo: t.tipo },
      data: { assunto: t.assunto },
    })
    if (result.count > 0) {
      console.log(`✅ ${t.tipo}: assunto atualizado`)
    } else {
      console.log(`⚠️  ${t.tipo}: template não encontrado no banco (será aplicado ao criar)`)
    }
  }

  console.log('\n✨ Concluído!')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
