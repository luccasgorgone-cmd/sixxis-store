import { z } from 'zod'

// Letras (com acentuação), hífen e apóstrofo — sem dígitos nem símbolos.
const PALAVRA_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ'-]+$/

export function nomeCompletoValido(nome: string): boolean {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return partes.length >= 2 && partes.every((p) => PALAVRA_NOME.test(p))
}

export const nomeCompletoSchema = z
  .string()
  .trim()
  .min(2)
  .refine(nomeCompletoValido, { message: 'Informe nome e sobrenome, sem números' })
