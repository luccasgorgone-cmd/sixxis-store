// ─── SIXXIS · PDF "Espelho do Pedido / Solicitação de Faturamento" ───────────
// Documento INTERNO (não fiscal) que o financeiro usa para faturar. A NF-e
// fiscal (Focus) é emitida depois. Gerado sob demanda pela rota
// /adm-a7f9c2b4/pedidos/[id]/nf com pdf-lib (zero dependência nativa).
//
// Reusa os formatadores de src/lib/format.ts (telefone/CPF/CNPJ).

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { formatarTelefone, formatarDocumento } from '@/lib/format'

// ─── Marca ───────────────────────────────────────────────────────────────────
const TIFFANY = rgb(0x3c / 255, 0xbf / 255, 0xb3 / 255) // #3cbfb3
const ESCURO = rgb(0x0f / 255, 0x2e / 255, 0x2b / 255) // #0f2e2b
const TIFFANY_TINT = rgb(0xe8 / 255, 0xf8 / 255, 0xf7 / 255) // #e8f8f7
const CINZA = rgb(0.42, 0.45, 0.5)
const CINZA_CLARO = rgb(0.6, 0.63, 0.68)
const LINHA = rgb(0.9, 0.91, 0.93)
const PRETO = rgb(0.1, 0.1, 0.11)
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
const FOOTER_Y = 54

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
  let out = String(s)
    .replace(/[–—]/g, '-') // en/em dash
    .replace(/[‘’‛]/g, "'") // aspas simples curvas
    .replace(/[“”]/g, '"') // aspas duplas curvas
    .replace(/…/g, '...') // reticências
    .replace(/[   ]/g, ' ') // espaços especiais -> espaço
    .replace(/[•∙]/g, '-') // bullets
  // Remove controles (0x00-0x1F, 0x7F) e tudo acima de Latin-1 (> 0xFF).
  let clean = ''
  for (const ch of out) {
    const c = ch.codePointAt(0) ?? 0
    if (c < 0x20 || c === 0x7f || c > 0xff) continue
    clean += ch
  }
  out = clean
  return out
}

export interface NfItem {
  nome: string
  sku: string
  quantidade: number
  precoUnitario: number
}

export interface NfData {
  pedidoCodigo: string
  emitidoEm: Date
  pedidoCriadoEm: Date
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
  pagamento: {
    metodo: string
    mpPaymentId: string | null
    status: string
    aprovadoEm: Date | null
  }
  logistica: {
    transportadora: string | null
    codigoRastreio: string | null
    prazo: string | null
    // Valor do frete (dado do modal). Sempre aparece na seção Logística.
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

  // Helpers de desenho ---------------------------------------------------------
  const text = (
    s: string, x: number, yy: number,
    opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {},
  ) => {
    page.drawText(san(s), {
      x, y: yy, size: opts.size ?? 9, font: opts.font ?? font, color: opts.color ?? PRETO,
    })
  }
  const textRight = (
    s: string, xRight: number, yy: number,
    opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {},
  ) => {
    const f = opts.font ?? font
    const sz = opts.size ?? 9
    const clean = san(s)
    const w = f.widthOfTextAtSize(clean, sz)
    page.drawText(clean, { x: xRight - w, y: yy, size: sz, font: f, color: opts.color ?? PRETO })
  }
  // Trunca com reticências p/ caber em maxW.
  const trunc = (s: string, f: PDFFont, sz: number, maxW: number): string => {
    let clean = san(s)
    if (f.widthOfTextAtSize(clean, sz) <= maxW) return clean
    while (clean.length > 1 && f.widthOfTextAtSize(clean + '...', sz) > maxW) {
      clean = clean.slice(0, -1)
    }
    return clean + '...'
  }
  const novaPagina = () => {
    page = doc.addPage([A4_W, A4_H])
    y = A4_H - MARGEM
  }
  const garantirEspaco = (h: number) => {
    if (y - h < FOOTER_Y + 10) novaPagina()
  }

  const LARG = A4_W - MARGEM * 2 // largura útil

  // ── Cabeçalho: logo + empresa ───────────────────────────────────────────────
  const headTop = y
  if (data.logoBytes) {
    try {
      const png = await doc.embedPng(data.logoBytes)
      const h = 30
      const w = (png.width / png.height) * h
      page.drawImage(png, { x: MARGEM, y: headTop - h + 2, width: w, height: h })
    } catch {
      text(EMPRESA.nome, MARGEM, headTop - 18, { size: 20, font: bold, color: ESCURO })
    }
  } else {
    text(EMPRESA.nome, MARGEM, headTop - 18, { size: 20, font: bold, color: ESCURO })
  }

  // Bloco da empresa alinhado à direita
  textRight(EMPRESA.nome, A4_W - MARGEM, headTop - 4, { size: 11, font: bold, color: ESCURO })
  textRight(`CNPJ ${EMPRESA.cnpj}`, A4_W - MARGEM, headTop - 17, { size: 8, color: CINZA })
  textRight(EMPRESA.endereco, A4_W - MARGEM, headTop - 28, { size: 8, color: CINZA })
  textRight(EMPRESA.contato, A4_W - MARGEM, headTop - 39, { size: 8, color: CINZA })

  y = headTop - 52

  // Faixa tiffany (accent)
  page.drawRectangle({ x: MARGEM, y: y, width: LARG, height: 4, color: TIFFANY })
  y -= 22

  // ── Título + nº + data ──────────────────────────────────────────────────────
  const tituloBoxH = 46
  page.drawRectangle({ x: MARGEM, y: y - tituloBoxH, width: LARG, height: tituloBoxH, color: ESCURO })
  text('Espelho do Pedido / Solicitação de Faturamento', MARGEM + 14, y - 19, {
    size: 12.5, font: bold, color: BRANCO,
  })
  text('Documento interno para faturamento - não é documento fiscal', MARGEM + 14, y - 34, {
    size: 8, color: rgb(0.7, 0.82, 0.8),
  })
  textRight(data.pedidoCodigo, A4_W - MARGEM - 14, y - 20, { size: 14, font: bold, color: TIFFANY })
  textRight(`Emitido em ${dataHora(data.emitidoEm)}`, A4_W - MARGEM - 14, y - 35, {
    size: 7.5, color: rgb(0.7, 0.82, 0.8),
  })
  y -= tituloBoxH + 6
  text(`Pedido realizado em ${dataHora(data.pedidoCriadoEm)}`, MARGEM, y, { size: 8, color: CINZA_CLARO })
  y -= 20

  // ── Cliente + Entrega (duas colunas) ────────────────────────────────────────
  const colW = (LARG - 16) / 2
  const colLx = MARGEM
  const colRx = MARGEM + colW + 16
  const secTop = y

  const sectionTitle = (label: string, x: number, yy: number) => {
    text(label.toUpperCase(), x, yy, { size: 8, font: bold, color: TIFFANY })
    page.drawLine({
      start: { x, y: yy - 4 }, end: { x: x + colW, y: yy - 4 },
      thickness: 0.5, color: LINHA,
    })
  }
  const linha = (label: string, valor: string, x: number, yy: number) => {
    text(label, x, yy, { size: 7.5, color: CINZA_CLARO })
    text(valor || '-', x, yy - 10, { size: 9, color: PRETO })
  }

  sectionTitle('Dados do cliente', colLx, secTop)
  let yl = secTop - 18
  linha('Nome', data.cliente.nome, colLx, yl); yl -= 24
  const docDigitos = (data.cliente.documento || '').replace(/\D/g, '')
  const docFmt = docDigitos ? formatarDocumento(docDigitos) : '-'
  const docLabel = docDigitos.length === 14 ? 'CNPJ' : 'CPF'
  linha(docLabel, docFmt, colLx, yl); yl -= 24
  linha('Telefone', data.cliente.telefone ? formatarTelefone(data.cliente.telefone) : '-', colLx, yl); yl -= 24
  linha('E-mail', data.cliente.email || '-', colLx, yl); yl -= 24

  sectionTitle('Endereço de entrega', colRx, secTop)
  let yr = secTop - 18
  const e = data.entrega
  const l1 = `${e.logradouro}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ''}`
  text(trunc(l1, font, 9, colW), colRx, yr, { size: 9 }); yr -= 14
  text(trunc(e.bairro, font, 9, colW), colRx, yr, { size: 9 }); yr -= 14
  text(trunc(`${e.cidade}/${e.estado}`, font, 9, colW), colRx, yr, { size: 9 }); yr -= 14
  text(`CEP ${e.cep}`, colRx, yr, { size: 9 }); yr -= 14

  y = Math.min(yl, yr) - 8

  // ── Itens ───────────────────────────────────────────────────────────────────
  text('ITENS', MARGEM, y, { size: 8, font: bold, color: TIFFANY })
  y -= 14

  // Colunas da tabela
  const cSku = A4_W - MARGEM - 230
  const cQtd = A4_W - MARGEM - 150
  const cUnit = A4_W - MARGEM - 80
  const cSub = A4_W - MARGEM

  const headerH = 18
  page.drawRectangle({ x: MARGEM, y: y - headerH + 4, width: LARG, height: headerH, color: TIFFANY_TINT })
  text('Produto', MARGEM + 6, y - 8, { size: 7.5, font: bold, color: ESCURO })
  text('SKU', cSku, y - 8, { size: 7.5, font: bold, color: ESCURO })
  textRight('Qtd', cQtd, y - 8, { size: 7.5, font: bold, color: ESCURO })
  textRight('Vl. Unit.', cUnit, y - 8, { size: 7.5, font: bold, color: ESCURO })
  textRight('Subtotal', cSub, y - 8, { size: 7.5, font: bold, color: ESCURO })
  y -= headerH + 4

  for (const it of data.itens) {
    garantirEspaco(20)
    const nome = trunc(it.nome, font, 8.5, cSku - MARGEM - 12)
    text(nome, MARGEM + 6, y, { size: 8.5, color: PRETO })
    text(trunc(it.sku, font, 8, cQtd - cSku - 24), cSku, y, { size: 8, color: CINZA })
    textRight(String(it.quantidade), cQtd, y, { size: 8.5, color: PRETO })
    textRight(moeda(it.precoUnitario), cUnit, y, { size: 8.5, color: PRETO })
    textRight(moeda(it.precoUnitario * it.quantidade), cSub, y, { size: 8.5, font: bold, color: PRETO })
    y -= 8
    page.drawLine({ start: { x: MARGEM, y: y }, end: { x: A4_W - MARGEM, y: y }, thickness: 0.4, color: LINHA })
    y -= 12
  }

  // ── Totais (bloco à direita) ────────────────────────────────────────────────
  garantirEspaco(80)
  y -= 4
  const totX = A4_W - MARGEM
  const totLabelX = A4_W - MARGEM - 170
  const totLinha = (label: string, valor: string, opts: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}) => {
    text(label, totLabelX, y, { size: 9, color: opts.bold ? PRETO : CINZA, font: opts.bold ? bold : font })
    textRight(valor, totX, y, { size: 9, font: opts.bold ? bold : font, color: opts.color ?? PRETO })
    y -= 15
  }
  totLinha('Subtotal', moeda(data.subtotal))
  if (data.desconto > 0) {
    totLinha(`Desconto${data.cupomCodigo ? ` (${data.cupomCodigo})` : ''}`, `- ${moeda(data.desconto)}`, { color: rgb(0.1, 0.6, 0.3) })
  }
  if (data.frete != null) {
    totLinha('Frete', data.frete === 0 ? 'Grátis' : moeda(data.frete))
  }
  page.drawLine({ start: { x: totLabelX, y: y + 6 }, end: { x: totX, y: y + 6 }, thickness: 0.6, color: LINHA })
  y -= 2
  text('Total', totLabelX, y, { size: 11, font: bold, color: ESCURO })
  textRight(moeda(data.total), totX, y, { size: 12, font: bold, color: TIFFANY })
  y -= 26

  // ── Pagamento + Logística (duas colunas) ────────────────────────────────────
  garantirEspaco(90)
  const boxTop = y
  const boxH = 78
  // Pagamento
  page.drawRectangle({ x: colLx, y: boxTop - boxH, width: colW, height: boxH, color: rgb(0.98, 0.985, 0.99), borderColor: LINHA, borderWidth: 0.5 })
  text('PAGAMENTO', colLx + 12, boxTop - 16, { size: 8, font: bold, color: TIFFANY })
  let yp = boxTop - 30
  const pgLinha = (label: string, valor: string) => {
    text(label, colLx + 12, yp, { size: 7.5, color: CINZA_CLARO })
    text(trunc(valor || '-', font, 8.5, colW - 90), colLx + 78, yp, { size: 8.5, color: PRETO })
    yp -= 14
  }
  pgLinha('Método', data.pagamento.metodo)
  pgLinha('ID Mercado Pago', data.pagamento.mpPaymentId || '-')
  pgLinha('Status', data.pagamento.status)
  pgLinha('Aprovado em', dataHora(data.pagamento.aprovadoEm))

  // Logística
  page.drawRectangle({ x: colRx, y: boxTop - boxH, width: colW, height: boxH, color: rgb(0.98, 0.985, 0.99), borderColor: LINHA, borderWidth: 0.5 })
  text('LOGÍSTICA', colRx + 12, boxTop - 16, { size: 8, font: bold, color: TIFFANY })
  let yg = boxTop - 30
  const lgLinha = (label: string, valor: string) => {
    text(label, colRx + 12, yg, { size: 7.5, color: CINZA_CLARO })
    text(trunc(valor || '-', font, 8.5, colW - 90), colRx + 78, yg, { size: 8.5, color: PRETO })
    yg -= 14
  }
  lgLinha('Transportadora', data.logistica.transportadora || '-')
  const valorFreteFmt =
    data.logistica.valorFrete != null ? moeda(data.logistica.valorFrete) : null
  lgLinha(
    data.logistica.freteFaturado ? 'Valor do frete' : 'Custo interno',
    valorFreteFmt
      ? data.logistica.freteFaturado
        ? valorFreteFmt
        : `${valorFreteFmt} — não faturado`
      : '-',
  )
  lgLinha('Rastreio', data.logistica.codigoRastreio || '-')
  lgLinha('Prazo', data.logistica.prazo || '-')
  y = boxTop - boxH - 20

  // ── Rodapé (em todas as páginas) ────────────────────────────────────────────
  const totalPaginas = doc.getPageCount()
  const paginas = doc.getPages()
  paginas.forEach((p: PDFPage, i: number) => {
    p.drawLine({
      start: { x: MARGEM, y: FOOTER_Y + 12 }, end: { x: A4_W - MARGEM, y: FOOTER_Y + 12 },
      thickness: 0.5, color: LINHA,
    })
    const rod = 'Documento interno - não é documento fiscal. A NF-e será emitida posteriormente.'
    p.drawText(san(rod), { x: MARGEM, y: FOOTER_Y, size: 7.5, font, color: CINZA_CLARO })
    const pg = `${data.pedidoCodigo} - página ${i + 1}/${totalPaginas}`
    const w = font.widthOfTextAtSize(san(pg), 7.5)
    p.drawText(san(pg), { x: A4_W - MARGEM - w, y: FOOTER_Y, size: 7.5, font, color: CINZA_CLARO })
  })

  return doc.save()
}
