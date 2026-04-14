import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request)
  if (unauthorized) return unauthorized

  // Upsert juros_cartao_taxa_mensal
  await prisma.configuracao.upsert({
    where:  { chave: 'juros_cartao_taxa_mensal' },
    create: { chave: 'juros_cartao_taxa_mensal', valor: '2.99' },
    update: {},
  })

  // Update SX040 if it exists
  const sx040 = await prisma.produto.findFirst({
    where: { OR: [{ slug: 'sx040' }, { modelo: 'SX040' }] },
  })

  if (!sx040) {
    return Response.json({ ok: true, message: 'juros_cartao_taxa_mensal criado. Produto SX040 não encontrado.' })
  }

  await prisma.produto.update({
    where: { id: sx040.id },
    data: {
      nome: 'Climatizador Sixxis SX040 — 45 Litros | Bivolt | 5.500 m³/h',
      descricao: `<h2>Climatizador Sixxis SX040 | Refresque seu Ambiente</h2><p>Com tecnologia de ponta e design moderno, o SX040 proporciona um ambiente fresco e revigorante enquanto você economiza até <strong>90% de energia</strong> em relação ao ar condicionado convencional.</p><h3>Principais Benefícios</h3><ul><li><strong>Conforto no lar:</strong> Refresca ambientes de até 45 m² com eficiência.</li><li><strong>Climatização Eficiente:</strong> Vazão de ar de 5.500 m³/h para resfriamento rápido.</li><li><strong>Economia de Energia:</strong> 180 W de potência — 90% mais econômico que o ar condicionado.</li><li><strong>Purificação do Ar:</strong> Filtro ANTI-PÓ nas colmeias remove impurezas e alérgenos.</li><li><strong>Umidificação Natural:</strong> Mantém a umidade ideal do ar, combatendo o ressecamento.</li><li><strong>Controle Total:</strong> Painel touch screen + controle remoto incluso.</li><li><strong>Ultra Silencioso:</strong> Menos de 60 dB — perfeito para dormir e trabalhar.</li><li><strong>Mobilidade:</strong> Rodízios reforçados para levar onde precisar.</li></ul><h3>Garantia de 12 Meses</h3><p>Aproveite agora o conforto que você merece com a segurança da <strong>garantia Sixxis de 12 meses</strong> e suporte técnico especializado em todo o Brasil.</p>`,
    },
  })

  return Response.json({ ok: true, message: 'SX040 atualizado com sucesso.' })
}
