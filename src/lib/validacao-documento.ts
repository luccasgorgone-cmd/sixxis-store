function soDigitos(v: string): string {
  return v.replace(/\D/g, '')
}

// CPF com validação dos 2 dígitos verificadores (rejeita 000... e repetidos).
export function cpfValido(cpf: string): boolean {
  const d = soDigitos(cpf)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += Number(d[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== Number(d[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += Number(d[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  return resto === Number(d[10])
}

// CNPJ com validação dos 2 dígitos verificadores (rejeita repetidos), módulo 11
// com os pesos padrão da Receita.
export function cnpjValido(cnpj: string): boolean {
  const d = soDigitos(cnpj)
  if (d.length !== 14) return false
  if (/^(\d)\1{13}$/.test(d)) return false
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma = 0
  for (let i = 0; i < 12; i++) soma += Number(d[i]) * pesos1[i]
  let resto = soma % 11
  const dv1 = resto < 2 ? 0 : 11 - resto
  if (dv1 !== Number(d[12])) return false
  soma = 0
  for (let i = 0; i < 13; i++) soma += Number(d[i]) * pesos2[i]
  resto = soma % 11
  const dv2 = resto < 2 ? 0 : 11 - resto
  return dv2 === Number(d[13])
}

// Roteia por nº de dígitos: 11 → CPF, 14 → CNPJ, qualquer outro → inválido.
export function documentoValido(valor: string): boolean {
  const d = soDigitos(valor)
  if (d.length === 11) return cpfValido(d)
  if (d.length === 14) return cnpjValido(d)
  return false
}
