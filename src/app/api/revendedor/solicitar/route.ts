import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function labelMap(k: string): string {
  const labels: Record<string, string> = {
    tipo: 'Tipo de Pessoa', nome: 'Nome / Responsável', email: 'E-mail',
    telefone: 'Telefone / WhatsApp', cpf: 'CPF', cnpj: 'CNPJ',
    razaoSocial: 'Razão Social', nomeFantasia: 'Nome Fantasia',
    cidade: 'Cidade', estado: 'Estado', cep: 'CEP',
    endereco: 'Endereço', segmento: 'Segmento', mensagem: 'Mensagem',
  }
  return labels[k] ?? k
}

export async function POST(req: Request) {
  let dados: Record<string, string>
  try {
    dados = await req.json()
  } catch {
    return Response.json({ erro: 'Corpo inválido' }, { status: 400 })
  }

  const { nome, email, telefone } = dados
  const faltando = (['nome', 'email', 'telefone'] as const).filter((k) => !dados[k]?.trim())
  if (faltando.length) {
    // Loga o motivo exato do 400 (qual campo faltou + payload recebido) para
    // diagnosticar desalinhamentos entre o form e o schema desta rota.
    console.error('[REVENDEDOR API] 400 — campos obrigatórios faltando:', faltando, '| payload:', dados)
    return Response.json(
      { erro: `Campos obrigatórios faltando: ${faltando.join(', ')}` },
      { status: 400 },
    )
  }

  // Persiste a solicitação (lead). Best-effort: se o banco falhar, ainda
  // enviamos o e-mail de notificação abaixo para não perder o lead.
  const s = (v: unknown) => {
    const str = v == null ? '' : String(v).trim()
    return str === '' ? null : str
  }
  let persistido = false
  try {
    await prisma.solicitacaoParceiro.create({
      data: {
        tipo:         s(dados.tipo) ?? 'pj',
        nome:         nome.trim(),
        email:        email.trim(),
        telefone:     telefone.trim(),
        cpf:          s(dados.cpf),
        cnpj:         s(dados.cnpj),
        razaoSocial:  s(dados.razaoSocial),
        nomeFantasia: s(dados.nomeFantasia),
        cidade:       s(dados.cidade),
        estado:       s(dados.estado)?.slice(0, 2).toUpperCase() ?? null,
        cep:          s(dados.cep),
        endereco:     s(dados.endereco),
        segmento:     s(dados.segmento),
        mensagem:     s(dados.mensagem),
      },
    })
    persistido = true
  } catch (e) {
    console.error('[REVENDEDOR API] falha ao persistir solicitação:', e)
  }

  const linhasTabela = Object.entries(dados)
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;font-weight:bold;color:#4b5563;width:40%;background:#f9fafb;">${labelMap(k)}</td>
        <td style="padding:10px 12px;color:#1f2937;">${String(v)}</td>
      </tr>
    `)
    .join('')

  // Notificação por e-mail (best-effort). NÃO derruba a requisição: o lead já
  // pode ter sido persistido acima, então a falha de e-mail não pode virar erro
  // para o usuário (senão ele reenviaria e duplicaria o registro).
  let emailEnviado = false
  try {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY ausente')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@sixxis.com.br',
      to: process.env.EMAIL_CONTATO ?? 'sac@sixxis.com.br',
      replyTo: 'sac@sixxis.com.br',
      subject: `Nova Solicitação de Revendedor — ${nome}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:#1a4f4a;padding:28px 32px;text-align:center;">
            <h1 style="color:#3cbfb3;margin:0;font-size:22px;">Nova Solicitação de Parceria</h1>
            <p style="color:rgba(255,255,255,.7);margin:6px 0 0;font-size:13px;">Sixxis — Painel Administrativo</p>
          </div>
          <div style="padding:24px 32px;background:#fff;">
            <h2 style="color:#1f2937;font-size:16px;margin:0 0 16px;">Dados do Solicitante</h2>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              ${linhasTabela}
            </table>
          </div>
          <div style="padding:16px 32px;background:#f3faf9;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#1a4f4a;margin:0;font-size:12px;font-weight:bold;">Sixxis — CNPJ: 54.978.947/0001-09</p>
          </div>
        </div>
      `,
    })

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@sixxis.com.br',
      to: email,
      subject: 'Sixxis — Recebemos sua solicitação de parceria! 🎉',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0f2e2b,#1a4f4a);padding:36px 32px;text-align:center;">
            <h1 style="color:#3cbfb3;font-size:26px;margin:0;">Sixxis</h1>
            <p style="color:rgba(255,255,255,.75);margin:6px 0 0;">Qualidade e Inovação</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#1f2937;margin:0 0 12px;">Olá, ${nome}!</h2>
            <p style="color:#4b5563;line-height:1.7;">
              Agradecemos o seu interesse em se tornar um parceiro Sixxis! 🎉
            </p>
            <p style="color:#4b5563;line-height:1.7;">
              Recebemos sua solicitação de parceria e nossa equipe comercial já está analisando as informações enviadas.
            </p>
            <div style="background:#e8f8f7;border-left:4px solid #3cbfb3;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
              <p style="color:#1a4f4a;font-weight:bold;margin:0 0 6px;">📋 Próximos passos:</p>
              <p style="color:#374151;margin:0;line-height:1.6;">
                Mediante aprovação do cadastro, entraremos em contato em até
                <strong>3 dias úteis</strong> pelo e-mail ou telefone informados.
              </p>
            </div>
            <p style="color:#4b5563;line-height:1.7;">
              Em caso de dúvidas, entre em contato pelo WhatsApp:
              <a href="https://wa.me/5518997474701" style="color:#3cbfb3;font-weight:600;">(18) 99747-4701</a>
            </p>
          </div>
          <div style="background:#111827;padding:16px 32px;text-align:center;">
            <p style="color:#6b7280;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sixxis — CNPJ: 54.978.947/0001-09</p>
          </div>
        </div>
      `,
    })

    emailEnviado = true
  } catch (error) {
    console.error('[REVENDEDOR API] falha ao enviar e-mail de notificação:', error)
  }

  // Sucesso desde que o lead tenha sido capturado por ALGUM canal (banco ou
  // e-mail). Só é erro real se ambos falharem — aí o lead se perderia.
  if (!persistido && !emailEnviado) {
    return Response.json(
      { erro: 'Não foi possível registrar sua solicitação no momento. Tente novamente ou fale pelo WhatsApp.' },
      { status: 500 },
    )
  }

  return Response.json({ ok: true })
}
