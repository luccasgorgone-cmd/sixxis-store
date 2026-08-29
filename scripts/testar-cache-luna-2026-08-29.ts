// Prova de que o prompt caching nativo da Anthropic está batendo de verdade
// no /api/agente (Luna), reproduzindo a mesma montagem de blocos da rota real.
// Read-only: só lê config/produtos do banco, não escreve nada. Duas chamadas
// em sequência — a 2ª deve mostrar cache_read_input_tokens > 0.
import { prisma } from '../src/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { precoPix } from '../src/lib/preco-pix'

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY ausente')
  const anthropic = new Anthropic({ apiKey })

  const configs = await prisma.configuracao.findMany({
    where: {
      chave: {
        in: [
          'agente_ativo', 'agente_nome', 'agente_modelo',
          'agente_max_tokens', 'agente_temperatura',
          'agente_system_prompt', 'agente_whatsapp_vendas',
          'agente_whatsapp_suporte',
        ],
      },
    },
  })
  const cfg: Record<string, string> = Object.fromEntries(configs.map((c) => [c.chave, c.valor]))

  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    select: {
      nome: true,
      slug: true,
      preco: true,
      precoPromocional: true,
      categoria: true,
      estoque: true,
      sku: true,
      mediaAvaliacoes: true,
      totalAvaliacoes: true,
      variacoes: {
        where: { ativo: true },
        select: { nome: true, preco: true },
      },
    },
    orderBy: { categoria: 'asc' },
    take: 50,
  })

  const ofertasAtivas = produtos.filter((p) => p.precoPromocional !== null)
  let resumoOfertas = ''
  if (ofertasAtivas.length === 0) {
    resumoOfertas = 'Nenhuma oferta relâmpago ativa no momento.'
  } else {
    resumoOfertas = ofertasAtivas
      .map((p) => {
        const precoNum = Number(p.preco)
        const promoNum = Number(p.precoPromocional)
        const desconto = Math.round(((precoNum - promoNum) / precoNum) * 100)
        const pixPreco = precoPix(promoNum).toFixed(2).replace('.', ',')
        return (
          `• ${p.nome}: DE R$ ${precoNum.toLocaleString('pt-BR')} ` +
          `POR R$ ${promoNum.toLocaleString('pt-BR')} (${desconto}% OFF) ` +
          `| PIX: R$ ${pixPreco} | /produtos/${p.slug}`
        )
      })
      .join('\n')
  }

  let catalogoTexto = ''
  const cats = ['climatizadores', 'aspiradores', 'spinning']
  for (const cat of cats) {
    const prodsCat = produtos.filter((p) => p.categoria === cat)
    if (!prodsCat.length) continue
    catalogoTexto += `\n[${cat.toUpperCase()}]\n`
    for (const p of prodsCat) {
      const precoNum = Number(p.preco)
      const promoNum = p.precoPromocional ? Number(p.precoPromocional) : null
      const precoFinal = promoNum ?? precoNum
      const desconto =
        promoNum && promoNum < precoNum
          ? ` (${Math.round(((precoNum - promoNum) / precoNum) * 100)}% OFF)`
          : ''
      const vars = p.variacoes.map((v) => v.nome).join(' ou ')
      const voltagem = vars ? ` | ${vars}` : ''
      const estoqueStatus = p.estoque > 0 ? 'disponível' : '⚠️ esgotado'
      catalogoTexto +=
        `• ${p.nome}: R$ ${precoFinal.toFixed(2)}${desconto}` +
        `${voltagem} | ${estoqueStatus}` +
        ` | Nota: ${p.mediaAvaliacoes}/5 (${p.totalAvaliacoes} avs)` +
        ` | /produtos/${p.slug}\n`
    }
  }

  const contextoCatalogo = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ OFERTAS RELÂMPAGO ATIVAS AGORA (${ofertasAtivas.length} ativa(s)):
${resumoOfertas}

📦 CATÁLOGO ATUALIZADO:
${catalogoTexto}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

  const vendas = cfg.agente_whatsapp_vendas || '5518997474701'
  const suporte = cfg.agente_whatsapp_suporte || '5511934102621'
  const nomeLuna = cfg.agente_nome || 'Luna'
  const systemPromptBase =
    cfg.agente_system_prompt ||
    `Você é ${nomeLuna}, assistente virtual da Sixxis. Responda em português brasileiro de forma simpática e objetiva. WhatsApp de vendas: https://wa.me/${vendas} | Suporte: https://wa.me/${suporte}`

  const systemBlocoCacheavel = systemPromptBase + contextoCatalogo

  console.log(`[teste-cache] tamanho do bloco cacheável: ${systemBlocoCacheavel.length} chars (~${Math.round(systemBlocoCacheavel.length / 4)} tokens estimados)`)
  console.log('[teste-cache] mínimo pra cache da Anthropic é 1024 tokens (Haiku) — abaixo disso a API ignora o cache_control silenciosamente.\n')

  for (let i = 1; i <= 2; i++) {
    // timestamp diferente a cada chamada, simulando requests reais minutos apart
    const agora = new Date(Date.now() + i * 60000).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'full',
      timeStyle: 'short',
    })
    const systemBlocoVariavel = `\n\nDATA/HORA ATUAL — ${agora}`

    const response = await anthropic.messages.create({
      model: cfg.agente_modelo || 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      temperature: 0.7,
      system: [
        { type: 'text', text: systemBlocoCacheavel, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: systemBlocoVariavel },
      ],
      messages: [{ role: 'user', content: 'oi, tudo bem?' }],
    })

    console.log(`[chamada ${i}] usage:`, JSON.stringify(response.usage))
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
