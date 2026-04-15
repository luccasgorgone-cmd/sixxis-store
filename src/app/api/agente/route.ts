import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── CEP detector ──────────────────────────────────────────────────────────────
function extrairCEP(texto: string): string | null {
  const match = texto.match(/\b\d{5}[-\s]?\d{3}\b/)
  return match ? match[0].replace(/\D/g, '') : null
}

// ── Base URL resolution ───────────────────────────────────────────────────────
function getBaseUrl(): string {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN
    return domain.startsWith('http') ? domain : `https://${domain}`
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return 'https://sixxis-store-production.up.railway.app'
}

export async function POST(req: NextRequest) {
  try {
    const { mensagens, sessionId } = await req.json()

    if (!mensagens || !Array.isArray(mensagens)) {
      return Response.json({ erro: 'Mensagens inválidas' }, { status: 400 })
    }

    // Buscar configs do banco
    const configs = await prisma.configuracao.findMany({
      where: {
        chave: {
          in: [
            'agente_ativo', 'agente_nome', 'agente_modelo',
            'agente_max_tokens', 'agente_temperatura',
            'agente_system_prompt', 'agente_whatsapp_vendas',
            'agente_whatsapp_suporte', 'anthropic_api_key',
          ],
        },
      },
    })
    const cfg = Object.fromEntries(configs.map((c) => [c.chave, c.valor]))

    if (cfg.agente_ativo !== 'true') {
      return Response.json({ erro: 'Agente desativado' }, { status: 403 })
    }

    // ── Buscar produtos diretamente do Prisma (mais eficiente que HTTP self-call) ──
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

    // ── Separar e formatar ofertas ativas ──────────────────────────────────────
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
          const pixPreco = (promoNum * 0.97).toFixed(2).replace('.', ',')
          return (
            `• ${p.nome}: DE R$ ${precoNum.toLocaleString('pt-BR')} ` +
            `POR R$ ${promoNum.toLocaleString('pt-BR')} (${desconto}% OFF) ` +
            `| PIX: R$ ${pixPreco} | /produtos/${p.slug}`
          )
        })
        .join('\n')
    }

    // ── Catálogo formatado por categoria ──────────────────────────────────────
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

    // ── Data/hora atual de Brasília ───────────────────────────────────────────
    const agora = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'full',
      timeStyle: 'short',
    })

    // ── Contexto dinâmico a ser injetado no prompt ────────────────────────────
    const contextoLive = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DINÂMICOS EM TEMPO REAL — ${agora}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ OFERTAS RELÂMPAGO ATIVAS AGORA (${ofertasAtivas.length} ativa(s)):
${resumoOfertas}

📦 CATÁLOGO ATUALIZADO:
${catalogoTexto}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // ── Detectar CEP na última mensagem e consultar frete ─────────────────────
    const ultimaMensagem =
      String(mensagens[mensagens.length - 1]?.content || '')
    const cepEncontrado = extrairCEP(ultimaMensagem)

    let contextoFrete = ''
    if (cepEncontrado) {
      try {
        const baseUrl = getBaseUrl()
        const freteRes = await fetch(`${baseUrl}/api/luna/frete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cep: cepEncontrado, valorPedido: 0 }),
        })
        if (freteRes.ok) {
          const frete = await freteRes.json()
          contextoFrete =
            `\n\n[CEP ${cepEncontrado} DETECTADO NA MENSAGEM]\n` +
            `${frete.mensagem}\n` +
            (frete.observacao ? `${frete.observacao}\n` : '')
        }
      } catch {
        // falha silenciosa — Luna continua sem dados de frete
      }
    }

    const vendas   = cfg.agente_whatsapp_vendas  || '5518997474701'
    const suporte  = cfg.agente_whatsapp_suporte || '5511934102621'
    const nomeLuna = cfg.agente_nome             || 'Luna'

    // ── System prompt base (do admin ou padrão) ───────────────────────────────
    const systemPromptBase =
      cfg.agente_system_prompt ||
      `Você é a ${nomeLuna}, assistente virtual da Sixxis — empresa brasileira de Araçatuba/SP que vende climatizadores, aspiradores e bikes spinning de alto padrão.

PERSONALIDADE:
- Simpática, prestativa, objetiva e profissional
- Fala em português brasileiro informal mas educado
- Usa emojis com moderação para dar leveza
- Nunca inventa informações — se não sabe, encaminha para o WhatsApp
- Responde de forma concisa (máximo 3 parágrafos por resposta)

LINKS ÚTEIS DO SITE:
- Home: /
- Todos os produtos: /produtos
- Climatizadores: /produtos?categoria=climatizadores
- Aspiradores: /produtos?categoria=aspiradores
- Spinning: /produtos?categoria=spinning
- Ofertas: /ofertas
- Sobre nós: /sobre
- Contato: /contato
- FAQ: /faq
- Garantia: /garantia
- Política de troca: /politica-de-troca

WHATSAPP DA SIXXIS:
- Vendas: https://wa.me/${vendas}
- Suporte/Assistência: https://wa.me/${suporte}

REGRAS:
1. Quando o cliente perguntar sobre um produto específico, compartilhe o link da página
2. Quando o cliente quiser comprar, ofereça o link do produto E o WhatsApp de vendas
3. Quando tiver dúvida técnica complexa, encaminhe para o WhatsApp de suporte
4. Quando perguntar sobre frete/prazo, informe que frete é grátis acima de R$500 e peça o CEP para cálculo exato
5. Quando perguntar sobre garantia, informe 12 meses Sixxis
6. Quando perguntar sobre pagamento: até 6x sem juros no cartão, PIX com 3% de desconto
7. NÃO discuta assuntos fora do escopo da Sixxis
8. SEMPRE seja honesta — se o estoque estiver zerado, informe e sugira o WhatsApp para verificar previsão

FORMATO DE RESPOSTA:
- Use markdown leve (negrito com **, listas com -)
- Para links internos use: [texto do link](/caminho)
- Para WhatsApp use: [Falar com Vendas](https://wa.me/${vendas})
- Mantenha respostas curtas e diretas`

    // ── System prompt final = base + contexto live + frete (se houver) ────────
    const systemPromptFinal = systemPromptBase + contextoLive + contextoFrete

    // ── Chamar Claude API ─────────────────────────────────────────────────────
    const apiKey = cfg.anthropic_api_key || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({
        resposta: `Olá! No momento estou com dificuldades técnicas. Por favor, fale conosco pelo WhatsApp: [Vendas](https://wa.me/${vendas}) ou [Suporte](https://wa.me/${suporte}) 😊`,
      })
    }

    const anthropic = new Anthropic({ apiKey })

    const historico = mensagens
      .slice(-10)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
      .filter((m) => m.content.trim() !== '')

    const response = await anthropic.messages.create({
      model:       cfg.agente_modelo    || 'claude-haiku-4-5-20251001',
      max_tokens:  Number(cfg.agente_max_tokens) || 400,
      temperature: Number(cfg.agente_temperatura) || 0.7,
      system:      systemPromptFinal,
      messages:    historico,
    })

    const resposta =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Desculpe, não consegui processar sua mensagem.'

    // Suprimir aviso de sessionId não usado
    void sessionId

    return Response.json({ resposta })
  } catch (error) {
    console.error('[AGENTE]', error)
    return Response.json({
      resposta:
        'Tive um problema técnico 😅 Fale com nossa equipe pelo WhatsApp: [Vendas](https://wa.me/5518997474701)',
    })
  }
}
