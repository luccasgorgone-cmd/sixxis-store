import { z } from 'zod'

export function nomeCompletoValido(nome: string): boolean {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return partes.length >= 2
}

export const nomeCompletoSchema = z
  .string()
  .trim()
  .min(2)
  .refine(nomeCompletoValido, { message: 'Informe nome e sobrenome' })
