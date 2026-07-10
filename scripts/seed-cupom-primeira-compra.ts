// Garante o cupom de PRIMEIRA COMPRA no banco, espelhando a fonte única de
// texto (src/lib/cupom-primeira-compra.ts). Idempotente: pode rodar N vezes.
//
//   npx tsx scripts/seed-cupom-primeira-compra.ts
//
// Também MIGRA o cupom legado SIXXIS10 (10%) — renomeia o registro existente
// "por cima", preservando o id (e portanto o histórico de CupomUso, que aponta
// por FK cupomId). Depois disso o código "SIXXIS10" deixa de existir e a
// validação (avaliarCupom) passa a responder "Cupom inválido ou inativo".
//
// NÃO usa DELETE: só update/upsert.

import { prisma } from './_db'
import {
  CUPOM_PC_CODIGO,
  CUPOM_PC_PERCENTUAL,
  CUPOM_PC_DESCRICAO_DB,
} from '../src/lib/cupom-primeira-compra'

const CODIGO_LEGADO = 'SIXXIS10'

// O prompt da Luna (Configuracao.agente_system_prompt) é texto VIVO: a IA cita o
// cupom no chat. Ele foi editado no admin e DIVERGE de scripts/seed-luna-prompt.ts,
// então NÃO rodamos aquele seed aqui (sobrescreveria conteúdo não relacionado).
// Substituição cirúrgica: só as menções ao cupom. Idempotente.
async function sincronizarPromptLuna() {
  const cfg = await prisma.configuracao.findUnique({ where: { chave: 'agente_system_prompt' } })
  if (!cfg) return console.log('ℹ️  agente_system_prompt ausente — nada a sincronizar.')

  const novo = cfg.valor
    .replaceAll(CODIGO_LEGADO, CUPOM_PC_CODIGO)
    // Só o "10% OFF" do CUPOM. Outros percentuais (ex.: "25% OFF" de promoção
    // de produto, "5% OFF" do PIX) ficam intactos.
    .replace(/ganhar 10% OFF/g, `ganhar ${CUPOM_PC_PERCENTUAL}% OFF`)
    .replace(/: 10% OFF na primeira compra/g, `: ${CUPOM_PC_PERCENTUAL}% OFF na primeira compra`)

  if (novo === cfg.valor) return console.log('ℹ️  prompt da Luna já sincronizado.')

  await prisma.configuracao.update({ where: { chave: 'agente_system_prompt' }, data: { valor: novo } })
  console.log('✅ prompt da Luna sincronizado (menções ao cupom).')
}

async function main() {
  const legado = await prisma.cupom.findUnique({ where: { codigo: CODIGO_LEGADO } })
  const atual = await prisma.cupom.findUnique({ where: { codigo: CUPOM_PC_CODIGO } })

  const dados = {
    tipo:           'PERCENTUAL',
    valor:          CUPOM_PC_PERCENTUAL,
    descricao:      CUPOM_PC_DESCRICAO_DB,
    primeiraCompra: true,
    ativo:          true,
  }

  if (legado && !atual) {
    // Renomeia "por cima", preservando id/totalUsos/histórico de uso.
    await prisma.cupom.update({
      where: { id: legado.id },
      data:  { codigo: CUPOM_PC_CODIGO, ...dados },
    })
    console.log(`✅ ${CODIGO_LEGADO} → ${CUPOM_PC_CODIGO} (${CUPOM_PC_PERCENTUAL}%), id preservado: ${legado.id}`)
  } else {
    await prisma.cupom.upsert({
      where:  { codigo: CUPOM_PC_CODIGO },
      update: dados,
      create: { codigo: CUPOM_PC_CODIGO, ...dados },
    })
    console.log(`✅ ${CUPOM_PC_CODIGO} garantido (${CUPOM_PC_PERCENTUAL}%, 1ª compra)`)

    if (legado) {
      // Ambos existem: desativa o legado (sem DELETE) para que 10% não volte.
      await prisma.cupom.update({ where: { id: legado.id }, data: { ativo: false } })
      console.log(`⚠️  ${CODIGO_LEGADO} coexistia — DESATIVADO (ativo=false).`)
    }
  }

  const conferencia = await prisma.cupom.findUnique({ where: { codigo: CODIGO_LEGADO } })
  console.log(
    conferencia
      ? `⚠️  ${CODIGO_LEGADO} ainda existe (ativo=${conferencia.ativo}) — deve estar inativo.`
      : `✅ ${CODIGO_LEGADO} não existe mais → digitar esse código retorna "cupom inválido".`,
  )

  await sincronizarPromptLuna()
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('❌', e)
  await prisma.$disconnect()
  process.exit(1)
})
