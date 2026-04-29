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
    const body = await req.json()
    const { mensagens } = body
    const sessaoId: string = body.sessaoId || body.sessionId || `luna_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const paginaOrigem: string | null = body.paginaOrigem || req.headers.get('referer') || null
    const userAgent = req.headers.get('user-agent')?.substring(0, 500) || null
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null

    // Rate limit: 30 req/min por IP
    const rlKey = `rl_${ip || 'anon'}`
    const now = Date.now()
    const g = global as unknown as { _rl?: Map<string, { n: number; t: number }> }
    if (!g._rl) g._rl = new Map()
    const entry = g._rl.get(rlKey) || { n: 0, t: now + 60000 }
    if (now > entry.t) { entry.n = 0; entry.t = now + 60000 }
    entry.n++
    g._rl.set(rlKey, entry)
    if (entry.n > 30) {
      return Response.json(
        { erro: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    if (!mensagens || !Array.isArray(mensagens)) {
      return Response.json({ erro: 'Mensagens inválidas' }, { status: 400 })
    }

    const startTime = Date.now()

    // Buscar configs do banco — apenas configurações públicas/persona.
    // A chave de API da Anthropic vive SOMENTE em process.env.ANTHROPIC_API_KEY
    // por segurança (Railway env var, nunca no banco).
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

    // ── System prompt base — SEMPRE do banco de dados ────────────────────────
    // Fallback mínimo apenas para garantir funcionamento caso o admin ainda
    // não tenha configurado o prompt no painel (situação de primeiro uso).
    const systemPromptBase =
      cfg.agente_system_prompt ||
      `Você é ${nomeLuna}, assistente virtual da Sixxis. Responda em português brasileiro de forma simpática e objetiva. WhatsApp de vendas: https://wa.me/${vendas} | Suporte: https://wa.me/${suporte}`

    // ── System prompt final = base + contexto live + frete (se houver) ────────
    const systemPromptFinal = systemPromptBase + contextoLive + contextoFrete

    // ── Chamar Claude API ─────────────────────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY
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

    const latenciaMs = Date.now() - startTime

    // ── Salvar conversa e mensagens (não bloqueia resposta em caso de erro) ───
    try {
      const mensagensUsuario = mensagens.filter((m: { role: string }) => m.role === 'user')
      const ultimaMsgUsuario = mensagensUsuario[mensagensUsuario.length - 1]
      const agora = new Date()

      const conversa = await prisma.lunaConversa.upsert({
        where: { sessaoId },
        create: {
          sessaoId,
          paginaOrigem,
          userAgent,
          ip,
          status: 'ativa',
          totalMensagens: mensagensUsuario.length + 1,
          primeiraMensagem: agora,
          ultimaMensagem: agora,
        },
        update: {
          totalMensagens: { increment: 2 },
          ultimaMensagem: agora,
        },
      })

      if (ultimaMsgUsuario?.content) {
        await prisma.lunaMensagem.create({
          data: {
            conversaId: conversa.id,
            role: 'user',
            conteudo: String(ultimaMsgUsuario.content),
          },
        })
      }

      await prisma.lunaMensagem.create({
        data: {
          conversaId: conversa.id,
          role: 'assistant',
          conteudo: resposta,
          latenciaMs,
        },
      })
    } catch (logErr) {
      console.error('[Luna] Erro ao salvar conversa:', logErr)
    }

    return Response.json({ resposta, sessaoId })
  } catch (error) {
    console.error('[AGENTE]', error)
    return Response.json({
      resposta:
        'Tive um problema técnico 😅 Fale com nossa equipe pelo WhatsApp: [Vendas](https://wa.me/5518997474701)',
    })
  }
}
