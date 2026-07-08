// ─── SIXXIS · PDF "Espelho do Pedido / Solicitação de Faturamento" ───────────
// Documento INTERNO (não fiscal) que o financeiro usa para faturar. A NF-e
// fiscal (Focus) é emitida depois. Gerado sob demanda pela rota
// /adm-a7f9c2b4/pedidos/[id]/nf com pdf-lib (zero dependência nativa).
//
// Layout por CURSOR vertical: cada seção desce o cursor por (altura + gap), sem
// coordenadas soltas — evita sobreposição por construção. A última seção
// (Observações) estica até o rodapé, deixando a folha sempre cheia.
//
// Reusa os formatadores de src/lib/format.ts (telefone/CPF/CNPJ).

import {
  PDFDocument, StandardFonts, rgb,
  type PDFFont, type PDFPage, type PDFImage,
} from 'pdf-lib'
import { formatarTelefone, formatarDocumento } from '@/lib/format'

// ─── Marca ───────────────────────────────────────────────────────────────────
const TIFFANY = rgb(0x3c / 255, 0xbf / 255, 0xb3 / 255) // #3cbfb3
const ESCURO = rgb(0x0f / 255, 0x2e / 255, 0x2b / 255) // #0f2e2b
const TIFFANY_TINT = rgb(0xe8 / 255, 0xf8 / 255, 0xf7 / 255) // #e8f8f7
const ZEBRA = rgb(0.968, 0.976, 0.978)
const BOX_BG = rgb(0.992, 0.995, 0.997)
const CINZA = rgb(0.42, 0.45, 0.5)
const CINZA_CLARO = rgb(0.58, 0.61, 0.66)
const LINHA = rgb(0.88, 0.9, 0.92)
const PRETO = rgb(0.1, 0.1, 0.11)
const VERDE = rgb(0.1, 0.6, 0.3)
const BRANCO = rgb(1, 1, 1)

const EMPRESA = {
  nome: 'Sixxis',
  cnpj: '54.978.947/0001-09',
  endereco: 'R. Anhanguera, 1711 - Icaray, Araçatuba/SP - CEP 16020-355',
  contato: 'sac@sixxis.com.br - www.sixxis.com.br',
}

// A4 em pontos
const A4_W = 595.28
const A4_H = 841.89
const MARGEM = 42
const X_DIR = A4_W - MARGEM // 553.28 — borda direita da área útil
const LARG = A4_W - MARGEM * 2 // 511.28 — largura útil
const FOOTER_Y = 54
const GAP = 16 // gap entre seções
const LH = 14 // altura de linha
const OBS_BOTTOM = FOOTER_Y + 12 // 66 — base da moldura (junto ao rodapé)

function moeda(v: number): string {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dataHora(d: Date | null | undefined): string {
  if (!d) return '-'
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// Sanitiza p/ WinAnsi (Helvetica padrão): normaliza tipografia comum e remove
// qualquer caractere fora de Latin-1 (codepoint > 255) ou de controle, evitando
// que pdf-lib estoure em glifos não suportados (emojis, setas em nomes etc.).
function san(s: string | null | undefined): string {
  if (s == null) return ''
  const out = String(s)
    .replace(/[–—]/g, '-') // en/em dash
    .replace(/[‘’‛]/g, "'") // aspas simples curvas
    .replace(/[“”]/g, '"') // aspas duplas curvas
    .replace(/…/g, '...') // reticências
    .replace(/[   ]/g, ' ') // espaços especiais -> espaço
    .replace(/[•∙]/g, '-') // bullets
  let clean = ''
  for (const ch of out) {
    const c = ch.codePointAt(0) ?? 0
    if (c < 0x20 || c === 0x7f || c > 0xff) continue // controles + fora de Latin-1
    clean += ch
  }
  return clean
}

// Embute PNG ou JPG conforme a assinatura dos bytes. Retorna null se não der.
async function embedImageSmart(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage | null> {
  try {
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await doc.embedPng(bytes) // PNG
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes) // JPEG
    try { return await doc.embedPng(bytes) } catch { return await doc.embedJpg(bytes) }
  } catch {
    return null
  }
}

// ─── Tipos de dados ──────────────────────────────────────────────────────────
export interface NfItem {
  nome: string
  sku: string
  quantidade: number
  precoUnitario: number
}

export interface NfTentativa {
  data: Date
  metodo: string
  valor: number
  status: string
}

export interface NfPagamento {
  metodo: string
  bandeira: string | null
  ultimosDigitos: string | null
  parcelas: number | null
  valor: number | null // em reais
  status: string
  statusDetalhe: string | null
  aprovadoEm: Date | null
  mpPaymentId: string | null
  mpPreferenceId: string | null
  payerNome: string | null
  payerEmail: string | null
  payerCpf: string | null // dígitos crus — formatado aqui
}

export interface NfData {
  pedidoCodigo: string
  pedidoStatus: string
  emitidoEm: Date
  pedidoCriadoEm: Date
  pagoEm: Date | null
  cliente: {
    nome: string
    email: string | null
    telefone: string | null
    documento: string | null // dígitos crus (CPF ou CNPJ) — formatado aqui
  }
  entrega: {
    logradouro: string
    numero: string
    complemento: string | null
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
  itens: NfItem[]
  subtotal: number
  desconto: number
  // Frete nos TOTAIS: null = não faturado (não renderiza a linha nem soma ao
  // Total). Número (inclui 0 = "Grátis") = frete por conta do cliente.
  frete: number | null
  total: number
  cupomCodigo: string | null
  pagamento: NfPagamento
  tentativas: NfTentativa[]
  logistica: {
    transportadora: string | null
    codigoRastreio: string | null
    prazo: string | null
    valorFrete: number | null
    // true = frete por conta do cliente (faturado, entra nos totais);
    // false = custo interno não faturado (só logística).
    freteFaturado: boolean
  }
  logoBytes: Uint8Array | null
}

export async function gerarNfPdf(data: NfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Espelho do Pedido ${data.pedidoCodigo}`)
  doc.setAuthor('Sixxis')
  doc.setSubject('Solicitação de Faturamento (documento interno, não fiscal)')

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([A4_W, A4_H])
  let y = A4_H - MARGEM

  // ── Helpers de desenho ──────────────────────────────────────────────────────
  type Opt = { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> }
  const text = (s: string, x: number, yy: number, opts: Opt = {}) => {
    page.drawText(san(s), {
      x, y: yy, size: opts.size ?? 9, font: opts.font ?? font, color: opts.color ?? PRETO,
    })
  }
  const textRight = (s: string, xRight: number, yy: number, opts: Opt = {}) => {
    const f = opts.font ?? font
    const sz = opts.size ?? 9
    const clean = san(s)
    const w = f.widthOfTextAtSize(clean, sz)
    page.drawText(clean, { x: xRight - w, y: yy, size: sz, font: f, color: opts.color ?? PRETO })
  }
  const trunc = (s: string, sz: number, maxW: number, f: PDFFont = font): string => {
    let clean = san(s)
    if (f.widthOfTextAtSize(clean, sz) <= maxW) return clean
    while (clean.length > 1 && f.widthOfTextAtSize(clean + '...', sz) > maxW) {
      clean = clean.slice(0, -1)
    }
    return clean + '...'
  }
  const hline = (yy: number, x1 = MARGEM, x2 = X_DIR, color = LINHA, t = 0.5) => {
    page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: t, color })
  }
  const novaPagina = () => {
    page = doc.addPage([A4_W, A4_H])
    y = A4_H - MARGEM
  }
  const garantir = (h: number) => {
    if (y - h < FOOTER_Y + 16) novaPagina()
  }
  // Título de seção full-width: barra tiffany + rótulo escuro + separador.
  const secTitle = (title: string) => {
    y -= GAP
    page.drawRectangle({ x: MARGEM, y: y - 1, width: 3, height: 11, color: TIFFANY })
    text(title.toUpperCase(), MARGEM + 9, y, { size: 9, font: bold, color: ESCURO })
    y -= 6
    hline(y, MARGEM, X_DIR, LINHA, 0.6)
    y -= 12
  }

  // ── Cabeçalho: logo + empresa ───────────────────────────────────────────────
  const headTop = y
  const img = data.logoBytes ? await embedImageSmart(doc, data.logoBytes) : null
  if (img) {
    const h = 30
    const w = (img.width / img.height) * h
    page.drawImage(img, { x: MARGEM, y: headTop - h + 2, width: w, height: h })
  } else {
    text(EMPRESA.nome, MARGEM, headTop - 18, { size: 20, font: bold, color: ESCURO })
  }
  textRight(EMPRESA.nome, X_DIR, headTop - 4, { size: 11, font: bold, color: ESCURO })
  textRight(`CNPJ ${EMPRESA.cnpj}`, X_DIR, headTop - 17, { size: 8, color: CINZA })
  textRight(EMPRESA.endereco, X_DIR, headTop - 28, { size: 8, color: CINZA })
  textRight(EMPRESA.contato, X_DIR, headTop - 39, { size: 8, color: CINZA })
  y = headTop - 50
  page.drawRectangle({ x: MARGEM, y: y, width: LARG, height: 4, color: TIFFANY })
  y -= 20

  // ── Título + nº + data ──────────────────────────────────────────────────────
  const tbH = 46
  page.drawRectangle({ x: MARGEM, y: y - tbH, width: LARG, height: tbH, color: ESCURO })
  text('Espelho do Pedido / Solicitação de Faturamento', MARGEM + 14, y - 19, { size: 12.5, font: bold, color: BRANCO })
  text('Documento interno para faturamento - não é documento fiscal', MARGEM + 14, y - 34, { size: 8, color: rgb(0.7, 0.82, 0.8) })
  textRight(data.pedidoCodigo, X_DIR - 14, y - 20, { size: 14, font: bold, color: TIFFANY })
  textRight(`Emitido em ${dataHora(data.emitidoEm)}`, X_DIR - 14, y - 35, { size: 7.5, color: rgb(0.7, 0.82, 0.8) })
  y -= tbH

  // ── Cliente + Entrega (duas colunas) ────────────────────────────────────────
  const colW = (LARG - 16) / 2
  const colLx = MARGEM
  const colRx = MARGEM + colW + 16

  const subTitle = (label: string, x: number, yy: number) => {
    text(label.toUpperCase(), x, yy, { size: 8, font: bold, color: TIFFANY })
    hline(yy - 4, x, x + colW)
  }
  const kvStack = (label: string, valor: string, x: number, yy: number, maxW: number) => {
    text(label, x, yy, { size: 7.5, color: CINZA_CLARO })
    text(trunc(valor || '-', 9, maxW), x, yy - 10, { size: 9, color: PRETO })
  }

  y -= GAP
  const secTop = y
  subTitle('Dados do cliente', colLx, secTop)
  let yl = secTop - 18
  kvStack('Nome', data.cliente.nome, colLx, yl, colW); yl -= 24
  const docDig = (data.cliente.documento || '').replace(/\D/g, '')
  kvStack(docDig.length === 14 ? 'CNPJ' : 'CPF', docDig ? formatarDocumento(docDig) : '-', colLx, yl, colW); yl -= 24
  kvStack('Telefone', data.cliente.telefone ? formatarTelefone(data.cliente.telefone) : '-', colLx, yl, colW); yl -= 24
  kvStack('E-mail', data.cliente.email || '-', colLx, yl, colW); yl -= 24

  subTitle('Endereço de entrega', colRx, secTop)
  let yr = secTop - 18
  const e = data.entrega
  const l1 = `${e.logradouro}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ''}`
  text(trunc(l1, 9, colW), colRx, yr, { size: 9 }); yr -= 13
  text(trunc(e.bairro, 9, colW), colRx, yr, { size: 9 }); yr -= 13
  text(trunc(`${e.cidade}/${e.estado}`, 9, colW), colRx, yr, { size: 9 }); yr -= 13
  text(`CEP ${e.cep}`, colRx, yr, { size: 9 }); yr -= 13
  y = Math.min(yl, yr) + 2

  // ── Itens (tabela zebra) ────────────────────────────────────────────────────
  secTitle('Itens do pedido')
  const cSku = X_DIR - 220
  const cQtd = X_DIR - 150
  const cUnit = X_DIR - 78
  const cSub = X_DIR
  const hH = 16
  page.drawRectangle({ x: MARGEM, y: y - hH + 4, width: LARG, height: hH, color: TIFFANY_TINT })
  text('Produto', MARGEM + 6, y - 7, { size: 7.5, font: bold, color: ESCURO })
  text('SKU', cSku, y - 7, { size: 7.5, font: bold, color: ESCURO })
  textRight('Qtd', cQtd, y - 7, { size: 7.5, font: bold, color: ESCURO })
  textRight('Vl. Unit.', cUnit, y - 7, { size: 7.5, font: bold, color: ESCURO })
  textRight('Subtotal', cSub, y - 7, { size: 7.5, font: bold, color: ESCURO })
  y -= hH + 5
  data.itens.forEach((it, i) => {
    garantir(18)
    if (i % 2 === 1) page.drawRectangle({ x: MARGEM, y: y - 4, width: LARG, height: 14, color: ZEBRA })
    text(trunc(it.nome, 8.5, cSku - MARGEM - 12), MARGEM + 6, y, { size: 8.5, color: PRETO })
    text(trunc(it.sku, 8, cQtd - cSku - 26), cSku, y, { size: 8, color: CINZA })
    textRight(String(it.quantidade), cQtd, y, { size: 8.5, color: PRETO })
    textRight(moeda(it.precoUnitario), cUnit, y, { size: 8.5, color: PRETO })
    textRight(moeda(it.precoUnitario * it.quantidade), cSub, y, { size: 8.5, font: bold, color: PRETO })
    y -= LH
  })

  // ── Totais (bloco à direita) ────────────────────────────────────────────────
  garantir(70)
  y -= 4
  const totLabelX = X_DIR - 190
  const totLinha = (label: string, valor: string, o: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}) => {
    text(label, totLabelX, y, { size: 9, color: o.bold ? PRETO : CINZA, font: o.bold ? bold : font })
    textRight(valor, X_DIR, y, { size: 9, font: o.bold ? bold : font, color: o.color ?? PRETO })
    y -= 15
  }
  totLinha('Subtotal dos produtos', moeda(data.subtotal))
  if (data.desconto > 0) {
    totLinha(`Desconto${data.cupomCodigo ? ` (${data.cupomCodigo})` : ''}`, `- ${moeda(data.desconto)}`, { color: VERDE })
  }
  if (data.frete != null) totLinha('Frete', data.frete === 0 ? 'Grátis' : moeda(data.frete))
  hline(y + 6, totLabelX, X_DIR, LINHA, 0.7)
  y -= 2
  text('Total', totLabelX, y, { size: 11, font: bold, color: ESCURO })
  textRight(moeda(data.total), X_DIR, y, { size: 12, font: bold, color: TIFFANY })
  y -= 8

  // ── Pagamento (2 sub-colunas rótulo→valor, largas) ──────────────────────────
  garantir(120)
  secTitle('Pagamento')
  const p = data.pagamento
  const bandeiraFinal = p.bandeira
    ? `${p.bandeira}${p.ultimosDigitos ? ` (final ${p.ultimosDigitos})` : ''}`
    : p.ultimosDigitos ? `final ${p.ultimosDigitos}` : '-'
  const parcelasTxt = p.parcelas != null ? (p.parcelas > 1 ? `${p.parcelas}x` : 'À vista') : '-'
  const statusTxt = `${p.status}${p.statusDetalhe ? ` (${p.statusDetalhe})` : ''}`
  const pgFields: [string, string][] = [
    ['Forma', p.metodo || '-'],
    ['Bandeira / final', bandeiraFinal],
    ['Parcelas', parcelasTxt],
    ['Valor pago', p.valor != null ? moeda(p.valor) : '-'],
    ['Status', statusTxt],
    ['Aprovado em', dataHora(p.aprovadoEm)],
    ['ID pagamento', p.mpPaymentId || '-'],
    ['ID preferência', p.mpPreferenceId || '-'],
    ['Pagador', p.payerNome || '-'],
    ['E-mail do pagador', p.payerEmail || '-'],
    ['CPF/CNPJ do pagador', p.payerCpf ? formatarDocumento(p.payerCpf) : '-'],
  ]
  const L_LBL = MARGEM // 42
  const L_VAL = MARGEM + 108 // 150
  const R_LBL = MARGEM + 258 // 300
  const R_VAL = MARGEM + 378 // 420
  const L_MAXW = R_LBL - L_VAL - 8 // 142
  const R_MAXW = X_DIR - R_VAL // 133
  for (let i = 0; i < pgFields.length; i += 2) {
    text(pgFields[i][0], L_LBL, y, { size: 7.5, color: CINZA_CLARO })
    text(trunc(pgFields[i][1], 9, L_MAXW), L_VAL, y, { size: 9, color: PRETO })
    const pair = pgFields[i + 1]
    if (pair) {
      text(pair[0], R_LBL, y, { size: 7.5, color: CINZA_CLARO })
      text(trunc(pair[1], 9, R_MAXW), R_VAL, y, { size: 9, color: PRETO })
    }
    y -= LH
  }

  // ── Tentativas de pagamento (só se houver mais de uma) ──────────────────────
  if (data.tentativas.length > 1) {
    garantir(40 + data.tentativas.length * LH)
    secTitle('Tentativas de pagamento')
    const tData = MARGEM + 6
    const tMet = MARGEM + 160
    const tVal = MARGEM + 320 // right-align
    const tStat = MARGEM + 340
    page.drawRectangle({ x: MARGEM, y: y - 12, width: LARG, height: 15, color: TIFFANY_TINT })
    text('Data', tData, y - 8, { size: 7.5, font: bold, color: ESCURO })
    text('Método', tMet, y - 8, { size: 7.5, font: bold, color: ESCURO })
    textRight('Valor', tVal, y - 8, { size: 7.5, font: bold, color: ESCURO })
    text('Status', tStat, y - 8, { size: 7.5, font: bold, color: ESCURO })
    y -= 16
    data.tentativas.forEach((t, i) => {
      garantir(16)
      if (i % 2 === 1) page.drawRectangle({ x: MARGEM, y: y - 4, width: LARG, height: 13, color: ZEBRA })
      text(dataHora(t.data), tData, y, { size: 8, color: PRETO })
      text(trunc(t.metodo, 8, tVal - 40 - tMet), tMet, y, { size: 8, color: PRETO })
      textRight(moeda(t.valor), tVal, y, { size: 8, color: PRETO })
      text(trunc(t.status, 8, X_DIR - tStat), tStat, y, { size: 8, color: PRETO })
      y -= LH
    })
  }

  // ── Resumo do pedido + Logística (2 sub-colunas) ────────────────────────────
  garantir(90)
  secTitle('Resumo do pedido')
  const resFields: [string, string][] = [
    ['Status do pedido', data.pedidoStatus || '-'],
    ['Data do pedido', dataHora(data.pedidoCriadoEm)],
    ['Data do pagamento', dataHora(data.pagoEm)],
    ['Cupom', data.cupomCodigo || '-'],
    ['Desconto', data.desconto > 0 ? `- ${moeda(data.desconto)}` : moeda(0)],
    ['Transportadora', data.logistica.transportadora || '-'],
    ['Código de rastreio', data.logistica.codigoRastreio || '-'],
    ['Prazo', data.logistica.prazo || '-'],
  ]
  // Frete logístico com rótulo conforme faturamento.
  const valorFreteFmt = data.logistica.valorFrete != null ? moeda(data.logistica.valorFrete) : '-'
  resFields.push(
    data.logistica.freteFaturado
      ? ['Valor do frete', valorFreteFmt]
      : ['Custo interno do frete', data.logistica.valorFrete != null ? `${valorFreteFmt} — não faturado` : '-'],
  )
  for (let i = 0; i < resFields.length; i += 2) {
    text(resFields[i][0], L_LBL, y, { size: 7.5, color: CINZA_CLARO })
    text(trunc(resFields[i][1], 9, L_MAXW), L_VAL, y, { size: 9, color: PRETO })
    const pair = resFields[i + 1]
    if (pair) {
      text(pair[0], R_LBL, y, { size: 7.5, color: CINZA_CLARO })
      text(trunc(pair[1], 9, R_MAXW), R_VAL, y, { size: 9, color: PRETO })
    }
    y -= LH
  }

  // ── Observações — preenche o resto da PÁGINA ATUAL (cursor → margem inferior).
  //    "Espaço restante" = y - OBS_BOTTOM. Só quebra pra nova página se sobrar
  //    menos que o mínimo (evita página 2 quase vazia); caso contrário estica a
  //    moldura até o rodapé aqui mesmo.
  const MIN_OBS = 40
  if (y - OBS_BOTTOM < MIN_OBS) novaPagina()
  secTitle('Observações')
  const obsTop = y
  const obsH = obsTop - OBS_BOTTOM
  page.drawRectangle({
    x: MARGEM, y: OBS_BOTTOM, width: LARG, height: obsH,
    color: BOX_BG, borderColor: LINHA, borderWidth: 0.7,
  })
  // Legenda só quando a moldura tem altura suficiente (evita texto fora da caixa).
  if (obsH >= 20) {
    text('Uso interno do financeiro — anotações de faturamento / conferência.', MARGEM + 10, obsTop - 14, { size: 8, color: CINZA_CLARO })
  }
  y = OBS_BOTTOM

  // ── Rodapé (em todas as páginas) ────────────────────────────────────────────
  const totalPaginas = doc.getPageCount()
  doc.getPages().forEach((pg: PDFPage, i: number) => {
    pg.drawLine({ start: { x: MARGEM, y: FOOTER_Y + 12 }, end: { x: X_DIR, y: FOOTER_Y + 12 }, thickness: 0.5, color: LINHA })
    const rod = 'Documento interno - não é documento fiscal. A NF-e será emitida posteriormente.'
    pg.drawText(san(rod), { x: MARGEM, y: FOOTER_Y, size: 7.5, font, color: CINZA_CLARO })
    const num = `${data.pedidoCodigo} - página ${i + 1}/${totalPaginas}`
    const w = font.widthOfTextAtSize(san(num), 7.5)
    pg.drawText(san(num), { x: X_DIR - w, y: FOOTER_Y, size: 7.5, font, color: CINZA_CLARO })
  })

  return doc.save()
}
