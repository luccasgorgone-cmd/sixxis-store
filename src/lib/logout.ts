import { signOut } from 'next-auth/react'

/**
 * Logout único e reutilizável da loja. Encapsula o signOut do next-auth com o
 * callbackUrl padrão (volta pra home) pra não duplicar a configuração em cada
 * ponto de saída (header desktop, menu mobile, sidebar da conta).
 */
export function logout() {
  return signOut({ callbackUrl: '/' })
}
