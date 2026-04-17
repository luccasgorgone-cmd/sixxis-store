import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await prisma.configuracao.findMany({
      where: {
        chave: {
          in: [
            'agente_ativo',
            'agente_nome',
            'agente_saudacao',
            'agente_cor_primaria',
            'agente_cor_secundaria',
            'agente_whatsapp_vendas',
            'agente_whatsapp_suporte',
            'agente_followup_ativo',
            'agente_followup_delay_1',
            'agente_followup_mensagem_1',
            'agente_followup_delay_2',
            'agente_followup_mensagem_2',
            'agente_encerramento_auto',
            'agente_mensagem_encerramento',
            'agente_system_prompt',
            'agente_avatar_url',
            'agente_avatar_tipo',
            'agente_status',
            'agente_cor_fundo',
            'agente_placeholder',
          ],
        },
      },
    })

    const cfg = Object.fromEntries(rows.map((r) => [r.chave, r.valor]))

    return Response.json({
      ativo:               cfg.agente_ativo              === 'true',
      nome:                cfg.agente_nome               || 'Luna',
      saudacao:            cfg.agente_saudacao           || 'Olá! Sou a Luna, assistente da Sixxis. Como posso te ajudar hoje?',
      corPrimaria:         cfg.agente_cor_primaria       || '#3cbfb3',
      corSecundaria:       cfg.agente_cor_secundaria     || cfg.agente_cor_fundo || '#0f2e2b',
      whatsappVendas:      cfg.agente_whatsapp_vendas    || '5518997474701',
      whatsappSuporte:     cfg.agente_whatsapp_suporte   || '5511934102621',
      followupAtivo:       cfg.agente_followup_ativo     !== 'false',
      followupDelay1:      Number(cfg.agente_followup_delay_1)   || 30,
      followupMensagem1:   cfg.agente_followup_mensagem_1 || 'Ficou alguma dúvida? Estou aqui para ajudar! 😊',
      followupDelay2:      Number(cfg.agente_followup_delay_2)   || 30,
      followupMensagem2:   cfg.agente_followup_mensagem_2 || 'Se preferir, fale com nossa equipe pelo WhatsApp. Foi um prazer!',
      encerramentoAuto:    cfg.agente_encerramento_auto  !== 'false',
      mensagemEncerramento: cfg.agente_mensagem_encerramento || 'Encerrando o atendimento por inatividade. Se precisar de ajuda, é só abrir o chat novamente.',
      system_prompt:       cfg.agente_system_prompt      || '',
      avatarUrl:           cfg.agente_avatar_url         || '',
      avatarTipo:          cfg.agente_avatar_tipo        || 'svg',
      status:              cfg.agente_status             || 'Online agora',
      placeholder:         cfg.agente_placeholder        || 'Digite sua mensagem...',
    })
  } catch (error) {
    console.error('[AGENTE CONFIG]', error)
    return Response.json({
      ativo: true,
      nome: 'Luna',
      saudacao: 'Olá! Sou a Luna, assistente da Sixxis. Como posso te ajudar hoje?',
      corPrimaria: '#3cbfb3',
      corSecundaria: '#0f2e2b',
      whatsappVendas: '5518997474701',
      whatsappSuporte: '5511934102621',
      followupAtivo: true,
      followupDelay1: 30,
      followupMensagem1: 'Ficou alguma dúvida? Estou aqui para ajudar! 😊',
      followupDelay2: 30,
      followupMensagem2: 'Se preferir, fale com nossa equipe pelo WhatsApp. Foi um prazer!',
      encerramentoAuto: true,
      mensagemEncerramento: 'Encerrando o atendimento por inatividade. Se precisar de ajuda, é só abrir o chat novamente.',
      avatarUrl: '',
      avatarTipo: 'svg',
      status: 'Online agora',
      placeholder: 'Digite sua mensagem...',
    })
  }
}
