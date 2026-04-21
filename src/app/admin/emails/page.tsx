import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import EmailTemplateEditor from './EmailTemplateEditor'
import { EMAIL_TEMPLATES } from '@/lib/email-templates-seed'

export const metadata: Metadata = { title: 'E-mails' }

export const dynamic = 'force-dynamic'

const TIPO_LABELS: Record<string, string> = {
  boas_vindas: 'Boas-vindas',
  confirmacao_pedido: 'Confirmação de Pedido',
  pedido_enviado: 'Pedido Enviado',
  followup_entrega: 'Follow-up Pós-Entrega',
  abandono_carrinho: 'Abandono de Carrinho',
  volta_estoque: 'Volta ao Estoque',
  cupom_especial: 'Cupom Especial',
  solicitacao_avaliacao: 'Solicitação de Avaliação',
  upgrade_nivel: 'Upgrade de Nível (Fidelidade)',
}

const VARIAVEIS_POR_TIPO: Record<string, string[]> = {
  boas_vindas: ['{{nome}}', '{{site_url}}'],
  confirmacao_pedido: ['{{nome}}', '{{pedido_id}}', '{{total}}', '{{forma_pagamento}}', '{{status}}', '{{endereco}}', '{{site_url}}', '{{ITENS_PEDIDO}}'],
  pedido_enviado: ['{{nome}}', '{{pedido_id}}', '{{codigo_rastreio}}', '{{link_rastreio}}', '{{previsao_entrega}}', '{{site_url}}'],
  followup_entrega: ['{{nome}}', '{{pedido_id}}', '{{produto_slug}}', '{{site_url}}'],
  abandono_carrinho: ['{{nome}}', '{{site_url}}', '{{ITENS_CARRINHO}}'],
  volta_estoque: ['{{nome}}', '{{produto_nome}}', '{{produto_url}}', '{{site_url}}', '{{PRODUTO_CARD}}'],
  cupom_especial: ['{{nome}}', '{{cupom_codigo}}', '{{cupom_desconto}}', '{{cupom_validade}}', '{{site_url}}'],
  solicitacao_avaliacao: ['{{nome}}', '{{pedido_id}}', '{{site_url}}'],
  upgrade_nivel: ['{{nome}}', '{{nivel_anterior}}', '{{nivel_novo}}', '{{total_gasto}}', '{{site_url}}'],
}

export default async function EmailsAdminPage() {
  // Busca templates do banco; se não existir, usa seed como fallback visual
  const dbTemplates = await prisma.emailTemplate.findMany({ orderBy: { tipo: 'asc' } })

  const tipos = Object.keys(TIPO_LABELS)
  const templates = tipos.map((tipo) => {
    const db = dbTemplates.find((t) => t.tipo === tipo)
    const seed = EMAIL_TEMPLATES.find((t) => t.tipo === tipo)
    return {
      tipo,
      label: TIPO_LABELS[tipo],
      ativo: db?.ativo ?? seed?.ativo ?? true,
      assunto: db?.assunto ?? seed?.assunto ?? '',
      corpo: db?.corpo ?? seed?.corpo ?? '',
      prazo: db?.prazo ?? seed?.prazo ?? 0,
      unidadePrazo: db?.unidadePrazo ?? seed?.unidadePrazo ?? 'horas',
      variaveis: VARIAVEIS_POR_TIPO[tipo] ?? [],
      existeNoBanco: !!db,
    }
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-[#0a0a0a]">E-mails Transacionais</h1>
        <p className="text-gray-500 text-xs md:text-sm mt-1">
          Configure os templates de email enviados automaticamente pela loja.
          {dbTemplates.length === 0 && (
            <span className="ml-2 text-amber-600 font-medium">
              Nenhum template no banco ainda. Clique em &quot;Salvar&quot; para criar.
            </span>
          )}
        </p>
      </div>

      <EmailTemplateEditor templates={templates} />
    </div>
  )
}
