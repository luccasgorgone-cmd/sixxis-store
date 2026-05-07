// Helpers para identificar configurações sensíveis (secrets) que NUNCA devem
// ser expostas via API admin nem persistidas no banco. Esses valores devem
// viver exclusivamente em variáveis de ambiente (Railway).

export const SECRET_KEY_REGEX =
  /(api[_-]?key|secret|token|password|hash|webhook[_-]?secret|jwt|access[_-]?key)/i

// Lista explícita por nome — pega chaves que não casam com o regex
export const SECRET_KEYS_DENYLIST = new Set<string>([
  'anthropic_api_key',
  'mp_access_token',
  'mp_public_key',
  'mp_webhook_secret',
  'melhorenvio_token',
  'melhorenvio_sandbox_token',
  'melhorenvio_prod_token',
  'focusnfe_token',
  'jadlog_token',
  'totalexpress_token',
  'r2_access_key',
  'r2_secret_key',
  'r2_account_id',
  'evolution_api_key',
  'evolution_token',
  'admin_password_hash',
  'admin_password',
  'database_url',
  'jwt_secret',
])

export function isSecretKey(chave: string): boolean {
  if (!chave) return false
  // Allowlist tem precedência: chaves explicitamente públicas (ex.: agente_max_tokens,
  // que casa com o regex /token/ mas é só limite de tokens da Anthropic) nunca
  // são tratadas como secret. A allowlist é declarada abaixo (PUBLIC_CONFIG_KEYS).
  if (PUBLIC_CONFIG_KEYS.has(chave)) return false
  if (SECRET_KEYS_DENYLIST.has(chave)) return true
  return SECRET_KEY_REGEX.test(chave)
}

// Allowlist de chaves "públicas" — apenas configurações de display/UI seguras
// para serem editadas via admin/configuracoes-loja. Tudo fora desta lista é
// filtrado para evitar vazamento e edição acidental de configurações
// sensíveis ou estruturais.
export const PUBLIC_CONFIG_KEYS = new Set<string>([
  // Identidade da loja
  'loja_nome', 'loja_descricao', 'loja_email', 'loja_telefone',
  'loja_endereco', 'loja_cnpj', 'loja_horario',
  'logo_url', 'logo_rodape_url', 'favicon_url',
  // Cores e aparência
  'cor_principal', 'cor_principal_dark', 'cor_destaque',
  'cor_header', 'cor_header_texto', 'cor_textos', 'cor_textos_sec',
  'cor_fundo', 'cor_fundo_alt', 'cor_botoes', 'cor_botoes_texto', 'cor_botoes_hover',
  'cor_titulos', 'cor_titulos_secao', 'cor_descricao',
  'cor_precos', 'cor_precos_promo', 'cor_links', 'cor_links_hover',
  'cor_card_fundo', 'cor_card_borda', 'cor_card_hover',
  'cor_trustbar_fundo', 'cor_trustbar_icones',
  'cor_badge_oferta', 'cor_badge_novo', 'cor_badge_esgotado',
  'cor_anuncio_fundo', 'cor_anuncio_texto',
  'cor_stats_fundo', 'cor_wa_fundo', 'cor_footer_fundo',
  'aparencia_cor_primaria', 'aparencia_cor_secundaria',
  'bg_header_cor', 'bg_header_nav_cor',
  'bg_anuncio_cor', 'bg_anuncio_texto',
  'bg_footer_cor', 'bg_footer_texto', 'bg_footer_titulo', 'bg_footer_hover',
  // Hero/banner
  'hero_titulo', 'hero_subtitulo', 'hero_cta_texto', 'hero_cta_link', 'hero_imagem_url',
  // Por que Sixxis
  'pq_sixxis_1_titulo', 'pq_sixxis_1_texto', 'pq_sixxis_1_icone',
  'pq_sixxis_2_titulo', 'pq_sixxis_2_texto', 'pq_sixxis_2_icone',
  'pq_sixxis_3_titulo', 'pq_sixxis_3_texto', 'pq_sixxis_3_icone',
  'pq_sixxis_4_titulo', 'pq_sixxis_4_texto', 'pq_sixxis_4_icone',
  // Trust bar / stats
  'trust_1_titulo', 'trust_1_sub',
  'trust_2_titulo', 'trust_2_sub',
  'trust_3_titulo', 'trust_3_sub',
  'trust_4_titulo', 'trust_4_sub',
  'stat_1_num', 'stat_1_label',
  'stat_2_num', 'stat_2_label',
  'stat_3_num', 'stat_3_label',
  'stat_4_num', 'stat_4_label',
  // Anúncios
  'anuncio_1', 'anuncio_2', 'anuncio_3',
  // Newsletter / WhatsApp banner
  'newsletter_ativo', 'newsletter_titulo', 'newsletter_subtitulo',
  'whatsapp_banner_titulo', 'whatsapp_banner_subtitulo',
  // Textos do site
  'txt_cta_principal', 'txt_wa_botao', 'txt_frete_gratis',
  'txt_parcelamento', 'txt_atendimento',
  'txt_carrinho_vazio', 'txt_sem_produtos', 'txt_confirmar_pedido',
  // Tipografia
  'fonte_principal',
  'font_titulo_tamanho', 'font_titulo_peso', 'font_titulo_tracking',
  'font_preco_tamanho',
  // Background global
  'bg_body_url', 'bg_body_ativo', 'bg_body_size', 'bg_body_attachment',
  'bg_body_repeat', 'bg_body_position', 'bg_body_overlay',
  // Social (links públicos)
  'social_whatsapp', 'social_whatsapp_suporte',
  'social_instagram', 'social_facebook',
  // Frete e regras (parâmetros, não credenciais)
  'frete_minimo_gratis', 'frete_cep_origem', 'frete_gratis_estados',
  'pacote_altura', 'pacote_largura', 'pacote_comprimento', 'pacote_peso',
  'prazo_adicional', 'peso_divisor',
  // Pagamento (regras, não tokens)
  'pagamento_pix', 'pagamento_boleto', 'pagamento_cartao',
  'pagamento_parcelas', 'pagamento_desconto_pix',
  'juros_cartao_taxa_mensal',
  // Toggles transportadoras (booleans, não tokens)
  'correios_ativo', 'correios_pac', 'correios_sedex', 'correios_sedex10',
  'jadlog_ativo', 'totalexpress_ativo',
  'melhorenvio_ambiente', 'melhorenvio_cep_origem',
  'correios_contrato', 'jadlog_contrato',
  'focusnfe_env',
  // SEO públicos (não inclui pixel ID nem GA — esses são identificadores,
  // mas tratamos como público pois não autenticam nada)
  'seo_title', 'seo_description', 'seo_ga_id', 'seo_pixel_id',
  // Rodapé
  'rodape_tagline',
  // Agente Luna (configurações de UI/persona, NÃO credenciais)
  'agente_ativo', 'agente_nome', 'agente_avatar_url', 'agente_avatar_tipo',
  'agente_saudacao', 'agente_status', 'agente_cor_primaria', 'agente_cor_secundaria',
  'agente_cor_fundo', 'agente_modelo', 'agente_temperatura', 'agente_max_tokens',
  'agente_delay_resposta', 'agente_system_prompt',
  'agente_horario_inicio', 'agente_horario_fim', 'agente_msg_fora_horario',
  'agente_placeholder', 'agente_whatsapp_fallback',
  'agente_whatsapp_vendas', 'agente_whatsapp_suporte',
  'agente_followup_ativo',
  'agente_followup_delay_1', 'agente_followup_mensagem_1',
  'agente_followup_delay_2', 'agente_followup_mensagem_2',
  'agente_encerramento_auto', 'agente_mensagem_encerramento',
  // Pop-up / cashback (regras públicas)
  'cashback_min_pct', 'cashback_max_pct',
  'popup_inicial_ativo', 'popup_inicial_titulo', 'popup_inicial_subtitulo',
  'popup_inicial_imagem', 'popup_inicial_cta_texto', 'popup_inicial_cta_link',
  'popup_inicial_frequencia',
])

export function isPublicKey(chave: string): boolean {
  return PUBLIC_CONFIG_KEYS.has(chave)
}
