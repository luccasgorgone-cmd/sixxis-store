// ─── SIXXIS · Formatadores de exibição (CPF / CNPJ / Telefone) ───────────────
// Fonte única de verdade para EXIBIR documentos e telefones formatados no site
// (admin, área do cliente, e-mails, PDF de NF). Os dígitos CRUS continuam no
// banco — estes helpers formatam SÓ na camada de apresentação.
//
// Todos são tolerantes: recebem string/número/null/undefined, limpam não-dígitos
// e, se o total de dígitos não bate com o formato esperado, devolvem um fallback
// seguro (os dígitos crus ou string vazia) — nunca quebram a renderização.

function soDigitos(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  return String(v).replace(/\D/g, '')
}

/**
 * Telefone BR.
 *  - 11 dígitos → (DD)XXXXX-XXXX  (celular)
 *  - 10 dígitos → (DD)XXXX-XXXX   (fixo)
 * Fallback: valor original (trim) se não bater nenhum formato.
 */
export function formatarTelefone(tel: string | number | null | undefined): string {
  const d = soDigitos(tel)
  if (d.length === 11) return `(${d.slice(0, 2)})${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)})${d.slice(2, 6)}-${d.slice(6)}`
  return tel == null ? '' : String(tel).trim()
}

/**
 * CPF: 11 dígitos → XXX.XXX.XXX-XX.
 * Fallback: dígitos crus (ou valor original) se não tiver 11 dígitos.
 */
export function formatarCpf(cpf: string | number | null | undefined): string {
  const d = soDigitos(cpf)
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  return cpf == null ? '' : String(cpf).trim()
}

/**
 * CNPJ: 14 dígitos → XX.XXX.XXX/XXXX-XX.
 * Fallback: dígitos crus (ou valor original) se não tiver 14 dígitos.
 */
export function formatarCnpj(cnpj: string | number | null | undefined): string {
  const d = soDigitos(cnpj)
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  }
  return cnpj == null ? '' : String(cnpj).trim()
}

/**
 * Documento genérico: decide CPF (11) ou CNPJ (14) pelo nº de dígitos.
 * Útil quando o campo pode conter qualquer um dos dois.
 */
export function formatarDocumento(doc: string | number | null | undefined): string {
  const d = soDigitos(doc)
  if (d.length === 14) return formatarCnpj(d)
  if (d.length === 11) return formatarCpf(d)
  return doc == null ? '' : String(doc).trim()
}
